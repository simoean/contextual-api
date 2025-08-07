package com.simoes.contextual.util;

import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserUtil {

  private final UserService userService;

  /**
   * Retrieves the currently authenticated user from the security context. This method assumes that
   * the user is authenticated and exists in the service.
   *
   * @return The authenticated User object.
   */
  public User getAuthenticatedUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = authentication.getName();
    return userService
            .findUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found in service."));
  }

  /**
   * Retrieves the ID of the currently authenticated user.
   *
   * @return The ID of the authenticated user.
   */
  public String getAuthenticatedUserId() {
    return getAuthenticatedUser().getId();
  }
}
