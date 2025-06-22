package com.simoes.contextual.auth;

import com.simoes.contextual.model.User;
import com.simoes.contextual.user.UserService;
import lombok.RequiredArgsConstructor;
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
 * Controller for handling authentication requests.
 * This controller provides an endpoint for user login, authenticating the user
 * and another endpoint for user registration.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final UserService userService;

  /**
   * Endpoint for user login.
   * This method authenticates the user based on the provided credentials.
   *
   * @param loginRequest The request containing username and password.
   * @return ResponseEntity containing authentication result.
   */
  @PostMapping("/login")
  public ResponseEntity<AuthResponse> authenticateUser(@RequestBody LoginRequest loginRequest) {
    try {
      // Authenticate the user using Spring Security's AuthenticationManager
      Authentication authentication = authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(
                      loginRequest.getUsername(),
                      loginRequest.getPassword()
              )
      );

      // Set the authenticated user in the SecurityContext
      SecurityContextHolder.getContext().setAuthentication(authentication);

      // Retrieve the full User object from user service
      User authenticatedUser = userService.findUserByUsername(loginRequest.getUsername())
              .orElseThrow(() -> new RuntimeException("Authenticated user not found in service after authentication."));

      // For prototype, return basic user info
      AuthResponse authResponse = new AuthResponse(
              authenticatedUser.getId(),
              authenticatedUser.getUsername(),
              "Login successful"
      );

      return ResponseEntity.ok(authResponse);
    } catch (BadCredentialsException e) {
      // Wrong credentials provided
      System.err.println("Authentication failed for user " + loginRequest.getUsername() + ": " + e.getMessage());
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
              .body(new AuthResponse(null, null, "Authentication failed. Please check your username and password, or register if you don't have an account."));
    } catch (RuntimeException e) {
      // Edge case: if the user is authenticated but failed to retrieve its data
      System.err.println("AuthController internal error: Authenticated user not found in service post-authentication: " + e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(new AuthResponse(null, null, "An internal server error occurred. Please try again later."));
    }
  }
}