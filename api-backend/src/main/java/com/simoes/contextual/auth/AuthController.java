package com.simoes.contextual.auth;

import com.simoes.contextual.model.User;
import com.simoes.contextual.user.UserService; // Changed from MockDataService
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
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
  private final UserService userService; // Changed from MockDataService

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
      User authenticatedUser = userService.findUserByUsername(loginRequest.getUsername()) // Use userService
              .orElseThrow(() -> new RuntimeException("Authenticated user not found."));

      // For prototype, return basic user info
      AuthResponse authResponse = new AuthResponse(
              authenticatedUser.getId(),
              authenticatedUser.getUsername(),
              "Login successful"
      );

      return ResponseEntity.ok(authResponse);
    } catch (Exception e) {
      // Handle authentication failures (e.g., bad credentials)
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
              .body(new AuthResponse(null, null, "Invalid username or password"));
    }
  }
}