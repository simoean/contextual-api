package com.simoes.contextual.auth;

import com.simoes.contextual.auth.social.CallbackHandler;
import com.simoes.contextual.auth.social.GoogleCallbackHandler;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import jakarta.annotation.PostConstruct;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.BiFunction;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.servlet.view.RedirectView;

/**
 * ConnectCallbackController
 *
 * <p>This controller serves as a single, centralized endpoint for all OAuth 2.0 provider callbacks.
 * It uses a Map of lambda functions to delegate the handling of each provider's specific callback
 * logic, reducing boilerplate and providing a more functional approach.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class CallbackController {

  @Value("${oauth.internal.redirect-uri}")
  String frontendRedirectUrl = "http://localhost:3000/auth/callback";

  private final Map<String, BiFunction<String, String, RedirectView>> handlerMap = new HashMap<>();

  private final UserService userService;

  // Handlers
  private final GoogleCallbackHandler googleCallbackHandler;

  /**
   * Initializes the handler map with lambda functions for each social provider. This is done after
   * the bean has been constructed and all dependencies injected.
   */
  @PostConstruct
  public void init() {
    handlerMap.put("google", googleCallbackHandler);
    handlerMap.put("facebook", this::handlePlaceholderCallback);
    handlerMap.put("linkedin", this::handlePlaceholderCallback);
    handlerMap.put("github", this::handlePlaceholderCallback);
    handlerMap.put("apple", this::handlePlaceholderCallback);
    handlerMap.put("coursera", this::handlePlaceholderCallback);
  }

  /**
   * Main callback handler for all providers.
   *
   * @param provider The name of the social provider (e.g., "google").
   * @param code The authorization code from the provider.
   * @return A RedirectView to send the user back to the frontend.
   */
  @GetMapping("/callback")
  public RedirectView handleCallback(
      @RequestParam("provider") String provider, @RequestParam("code") String code) {

    BiFunction<String, String, RedirectView> handler = handlerMap.get(provider.toLowerCase());

    if (handler == null) {
      return new RedirectView(
          frontendRedirectUrl
              + "?status=error"
              + "&message="
              + URLEncoder.encode(
                  "No handler found for provider: " + provider, StandardCharsets.UTF_8));
    }

    try {
      return handler.apply(code, frontendRedirectUrl);
    } catch (HttpClientErrorException e) {
      // Error from a provider's API
      System.err.println("API call failed with HTTP error: " + e.getStatusCode());
      System.err.println("Response Body: " + e.getResponseBodyAsString());
      return new RedirectView(
          frontendRedirectUrl
              + "?status=error"
              + "&message="
              + URLEncoder.encode(
                  "Authentication failed: " + e.getStatusText(), StandardCharsets.UTF_8));
    } catch (Exception e) {
      // All other unexpected exceptions
      e.printStackTrace();
      return new RedirectView(
          frontendRedirectUrl
              + "?status=error"
              + "&message="
              + URLEncoder.encode(
                  "An unexpected error occurred during login.", StandardCharsets.UTF_8));
    }
  }

  /**
   * Encapsulates the logic for handling a placeholder OAuth callback.
   *
   * @param code The authorization code.
   * @return The RedirectView for the frontend.
   */
  private RedirectView handlePlaceholderCallback(String code, String frontendRedirectUrl) {
    return new RedirectView(
        frontendRedirectUrl
            + "?status=error"
            + "&message="
            + URLEncoder.encode("This provider is not yet implemented.", StandardCharsets.UTF_8));
  }

  /**
   * Fetches user attributes from the specified provider. This endpoint is used to retrieve user
   * attributes after the OAuth flow has completed.
   *
   * @param providerAccessToken - The access token from the provider, used to authenticate the request.
   * @param provider - The name of the social provider (e.g., "google").
   * @param authentication - The current authentication object containing user details.
   * @return ResponseEntity containing a list of IdentityAttribute objects.
   */
  @GetMapping("/attributes")
  public ResponseEntity<List<IdentityAttribute>> fetchAttributes(
      @RequestHeader("X-Provider-Token") String providerAccessToken,
      @RequestParam("provider") String provider,
      Authentication authentication) {

    // Step 1: Get the current user's ID from the security context
    String username = authentication.getName();

    // Step 2: Retrieve the user from the database
    Optional<User> userOptional = userService.findUserByUsername(username);
    if (userOptional.isEmpty()) {
      // Return an error if the user is not found
      return ResponseEntity.notFound().build();
    }
    User user = userOptional.get();

    // Step 3: Get the correct handler from the map
    BiFunction<String, String, RedirectView> handler = handlerMap.get(provider.toLowerCase());
    if (handler == null) {
      return ResponseEntity.ok(Collections.emptyList());
    }

    // Step 4: Get list of attributes from the handler
    List<IdentityAttribute> attributes =
        ((CallbackHandler) handler).getUserAttributes(providerAccessToken, user.getContexts());

    return ResponseEntity.ok(attributes);
  }
}
