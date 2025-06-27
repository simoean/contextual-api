package com.simoes.contextual.auth;

import com.simoes.contextual.security.jwt.JwtTokenProvider;
import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for handling authentication requests. This controller provides an endpoint for user
 * login, authenticating the user and another endpoint for user registration.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  public static final String WRONG_CREDENTIALS =
      "Authentication failed. Please check your username and password, or register if you don't have an account.";
  public static final String INTERNAL_ERROR =
      "An internal server error occurred. Please try again later.";

  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;
  private final UserService userService;

  /**
   * Endpoint for user login. This method authenticates the user based on the provided credentials.
   *
   * @param loginRequest The request containing username and password.
   * @return ResponseEntity containing authentication result.
   */
  @PostMapping("/login")
  public ResponseEntity<AuthResponse> authenticateUser(@RequestBody LoginRequest loginRequest) {
    try {
      // Authenticate the user using Spring Security's AuthenticationManager
      Authentication authentication =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(
                  loginRequest.getUsername(), loginRequest.getPassword()));

      // Set the authenticated user in the SecurityContext
      SecurityContextHolder.getContext().setAuthentication(authentication);

      // Retrieve the full User object from user service
      User authenticatedUser =
          userService
              .findUserByUsername(loginRequest.getUsername())
              .orElseThrow(
                  () ->
                      new RuntimeException(
                          "Authenticated user not found in service after authentication."));

      // Generate the JWT token AFTER successful authentication
      String jwt = jwtTokenProvider.generateToken(authentication);

      // Create AuthResponse with the generated JWT token
      AuthResponse authResponse =
          AuthResponse.builder()
              .userId(authenticatedUser.getId())
              .username(authenticatedUser.getUsername())
              .message("Login successful")
              .token(jwt)
              .build();

      return ResponseEntity.ok(authResponse);
    } catch (BadCredentialsException ex) {
      // Wrong credentials provided
      log.error("Authentication failed for user {}: {}", loginRequest.getUsername(), ex.getMessage(), ex);
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(AuthResponse.builder().message(WRONG_CREDENTIALS).build());
    } catch (RuntimeException ex) {
      // Edge case: if the user is authenticated but failed to retrieve its data.
      log.error("Authenticated user not found in service post-authentication: " + ex.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(AuthResponse.builder().message(INTERNAL_ERROR).build());
    }
  }
}
