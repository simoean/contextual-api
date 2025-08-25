package com.simoes.contextual.auth.social;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.function.BiFunction;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Facebook OAuth 2.0 Controller This controller handles the backend portion of the Facebook social
 * login flow. It receives the authorization code, exchanges it for an access token, fetches user
 * data, and redirects the user back to the frontend.
 */
@Component
public class FacebookCallbackHandler extends CallbackHandler
    implements BiFunction<String, String, RedirectView> {

  @Value("${oauth.facebook.client-id}")
  private String clientId;

  @Value("${oauth.facebook.client-secret}")
  private String clientSecret;

  @Value("${oauth.facebook.redirect-uri}")
  private String redirectUri;

  public FacebookCallbackHandler(RestTemplate restTemplate, ObjectMapper objectMapper) {
    super(restTemplate, objectMapper);
  }

  /**
   * Handles the callback from Facebook's OAuth authorization page.
   *
   * @param code The authorization code from Facebook.
   * @param frontendRedirectUrl The URL to redirect the user back to the frontend application.
   * @return A RedirectView to send the user back to the frontend application.
   */
  @Override
  public RedirectView apply(String code, String frontendRedirectUrl) {
    try {
      // 1. Exchange the authorization code for an access token
      String accessTokenUrl =
          "https://graph.facebook.com/v13.0/oauth/access_token?"
              + "client_id="
              + clientId
              + "&client_secret="
              + clientSecret
              + "&redirect_uri="
              + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
              + "&code="
              + code;

      ResponseEntity<String> tokenResponse =
          restTemplate.getForEntity(accessTokenUrl, String.class);
      JsonNode tokenData = objectMapper.readTree(tokenResponse.getBody());
      String accessToken = tokenData.get("access_token").asText();

      // 4. Redirect the user back to the frontend with the status and app token
      return new RedirectView(
          "http://localhost:3000/auth/callback"
              + "?status=success"
              + "&provider=facebook"
              + "&providerAccessToken="
              + accessToken);

    } catch (Exception e) {
      // Log the error and redirect the user back with an error status
      e.printStackTrace();
      String errorRedirectUrl =
          "http://localhost:3000/auth/callback?status=error&message=Authentication failed.";
      return new RedirectView(errorRedirectUrl);
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
    // 1. Correctly extract the token by removing the "Bearer " prefix.
    String accessToken = authorizationHeader.replace("Bearer ", "");

    // 2. Use the access token to get user information
    String userDataUrl =
        "https://graph.facebook.com/me?fields=id,name,email&access_token=" + accessToken;
    ResponseEntity<String> userResponse = restTemplate.getForEntity(userDataUrl, String.class);
    JsonNode userData = null;
    try {
      userData = objectMapper.readTree(userResponse.getBody());

      String userId = userData.get("id").asText();

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
      throw new RuntimeException(e);
    }
  }
}
