package com.simoes.contextual.user;

import com.simoes.contextual.context_attributes.IdentityAttribute;
import com.simoes.contextual.util.UserUtil;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for general user management operations (e.g., retrieving own profile). Note: Context
 * and Attribute management endpoints have been moved to dedicated controllers.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserUtil userUtil;
  private final UserService userService;

  /**
   * Endpoint to get the authenticated user's own profile details. This method retrieves the user
   * information from the security context.
   *
   * @return ResponseEntity containing the authenticated User object.
   */
  @GetMapping("/me")
  public ResponseEntity<User> getMyProfile() {
    return ResponseEntity.ok(userUtil.getAuthenticatedUser());
  }

  /**
   * Retrieves attributes for the user that have been consented for a specific client.
   *
   * @param userId The ID of the user whose attributes are being requested.
   * @param clientId The ID of the client application requesting the data.
   * @return ResponseEntity containing a list of consented IdentityAttribute objects, or NOT_FOUND
   *     if no consent exists for the client.
   */
  @GetMapping("/{userId}/attributes")
  public ResponseEntity<List<IdentityAttribute>> getConsentedAttributes(
          @PathVariable String userId, @RequestParam("clientId") String clientId) {
    return userService
        .getConsentedAttributes(userId, clientId)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }
}
