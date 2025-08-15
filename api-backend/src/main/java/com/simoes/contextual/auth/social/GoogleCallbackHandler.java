package com.simoes.contextual.auth.social;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import java.util.Collections;
import java.util.List;
import java.util.function.BiFunction;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.servlet.view.RedirectView;

/** Google OAuth 2.0 Handler This component handles the OAuth 2.0 callback from Google. */
@Component
public class GoogleCallbackHandler extends CallbackHandler
    implements BiFunction<String, String, RedirectView> {

  @Value("${oauth.google.client-id}")
  private String clientId;

  @Value("${oauth.google.client-secret}")
  private String clientSecret;

  @Value("${oauth.google.redirect-uri}")
  private String redirectUri;

  /**
   * Encapsulates the specific logic for handling a Google OAuth callback.
   *
   * @param code The authorization code.
   * @param frontendRedirectUrl The URL to redirect the user back to the frontend application.
   * @return The RedirectView for the frontend.
   */
  @Override
  public RedirectView apply(String code, String frontendRedirectUrl) {
    try {
      String accessToken = getAccessToken(code);

      // We are only sending the access token back to the frontend, which will then use
      // it to call your /api/v1/auth/attributes endpoint to fetch the attributes.
      return new RedirectView(
          frontendRedirectUrl
              + "?status=success"
              + "&provider=google"
              + "&providerAccessToken="
              + accessToken);
    } catch (Exception e) {
      throw new RuntimeException("Google authentication failed", e);
    }
  }

  /**
   * Fetches user data from Google using the provided access token. This method now also requires
   * the user's existing contexts to correctly map the attributes.
   *
   * @param authorizationHeader The 'Bearer' token obtained from Google.
   * @param userContexts The list of contexts previously provisioned for the user.
   * @return A list of IdentityAttribute objects representing the user's attributes.
   */
  public List<IdentityAttribute> getUserAttributes(
      String authorizationHeader, List<Context> userContexts) {
    // Correctly extract the token by removing the "Bearer " prefix.
    String accessToken = authorizationHeader.replace("Bearer ", "");
    String userDataUrl = "https://www.googleapis.com/oauth2/v3/userinfo";

    HttpHeaders userHeaders = new HttpHeaders();
    userHeaders.set("Authorization", "Bearer " + accessToken);
    HttpEntity<String> userEntity = new HttpEntity<>(userHeaders);

    ResponseEntity<String> userResponse =
        restTemplate.exchange(userDataUrl, HttpMethod.GET, userEntity, String.class);

    try {
      JsonNode userData = objectMapper.readTree(userResponse.getBody());

      // Get the userId from the "sub" field, which is Google's unique identifier.
      String userId = userData.has("sub") ? userData.get("sub").asText() : "unknown";

      // Find the ID of the 'Personal' context from the user's list of contexts.
      // We use the Stream API here for a functional approach.
      String personalContextId =
          userContexts.stream()
              .filter(context -> "Personal".equals(context.getName()))
              .map(Context::getId)
              .findFirst()
              .orElse(null); // Return null if the context isn't found.

      // If the personal context is not found, we can't properly map the attributes.
      if (personalContextId == null) {
        throw new IllegalStateException("Personal context not found for user.");
      }

      // Dynamically map all fields from the JSON response to a list of IdentityAttribute objects
      // and associate them with the 'Personal' context ID.
      return userData.properties().stream()
          .map(
              entry -> {
                String fieldName = entry.getKey();
                String fieldValue =
                    entry.getValue().isTextual()
                        ? entry.getValue().asText()
                        : entry.getValue().toString();

                return IdentityAttribute.builder()
                    .id("google_" + fieldName)
                    .userId(userId)
                    .name(formatFieldName(fieldName))
                    .value(fieldValue)
                    .visible(true)
                    .contextIds(Collections.singletonList(personalContextId))
                    .build();
              })
          .collect(Collectors.toList());
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to process JSON response from Google API", e);
    }
  }

  /**
   * Exchanges the authorization code for an access token.
   *
   * @param code The authorization code received from Google.
   * @return The access token as a String.
   * @throws JsonProcessingException if there is an error processing the JSON response.
   */
  private String getAccessToken(String code) throws JsonProcessingException {
    String tokenUrl = "https://oauth2.googleapis.com/token";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
    map.add("code", code);
    map.add("client_id", clientId);
    map.add("client_secret", clientSecret);
    map.add("redirect_uri", redirectUri);
    map.add("grant_type", "authorization_code");

    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

    ResponseEntity<String> tokenResponse =
        restTemplate.postForEntity(tokenUrl, request, String.class);
    JsonNode tokenData = objectMapper.readTree(tokenResponse.getBody());
    String accessToken = tokenData.get("access_token").asText();

    System.out.println("Access Token successfully received: " + accessToken);
    return accessToken;
  }
}
