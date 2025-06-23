package com.simoes.contextual.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for general user management operations (e.g., retrieving own profile). Note: Context
 * and Attribute management endpoints have been moved to dedicated controllers.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  /**
   * Retrieves the currently authenticated user from the security context. This method assumes that
   * the user is authenticated and exists in the service.
   *
   * @return The authenticated User object.
   */
  private User getAuthenticatedUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = authentication.getName();
    return userService
        .findUserByUsername(username)
        .orElseThrow(() -> new RuntimeException("Authenticated user not found in service."));
  }

  /**
   * Endpoint to get the authenticated user's own profile details. This method retrieves the user
   * information from the security context.
   *
   * @return ResponseEntity containing the authenticated User object.
   */
  @GetMapping("/me")
  public ResponseEntity<User> getMyProfile() {
    User currentUser = getAuthenticatedUser();
    // You might return a DTO here instead of the full User object to avoid exposing sensitive data
    return ResponseEntity.ok(currentUser);
  }
}
