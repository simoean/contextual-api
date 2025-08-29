package com.simoes.contextual.connection;

import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.util.UserUtil;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for handling user connections. This controller provides an endpoint to save and
 * delete connections.
 */
@RestController
@RequestMapping("/api/v1/users/me/connections")
@AllArgsConstructor
public class ConnectionController {

  private final UserUtil userUtil;
  private final ConnectionService connectionService;

  /** DTO to handle the incoming request body for saving a connection. */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  static class ConnectionRequest {
    private String providerId;
    private String providerUserId;
    private String contextId;
    private String providerAccessToken;
  }

  /**
   * Endpoint to get all connections of the authenticated user.
   *
   * @return ResponseEntity containing a list of Connection objects.
   */
  @GetMapping
  public ResponseEntity<List<Connection>> getUserConnections() {
    return ResponseEntity.ok(userUtil.getAuthenticatedUser().getConnections());
  }

  /**
   * Handles POST requests to save a new connection.
   *
   * @param request The request body containing the provider details.
   * @return A ResponseEntity indicating the result of the operation.
   */
  @PostMapping
  public ResponseEntity<String> saveConnection(@RequestBody ConnectionRequest request) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(401).body("User not authenticated.");
    }

    String userId = authentication.getName();
    connectionService.saveConnectionForUser(
        userId,
        request.getProviderId(),
        request.getProviderUserId(),
        request.getContextId(),
        request.getProviderAccessToken());

    return ResponseEntity.ok("Connection saved successfully.");
  }

  /**
   * Handles DELETE requests to remove an existing connection.
   *
   * @param providerId The ID of the provider to remove.
   * @return A ResponseEntity indicating the result of the operation.
   */
  @DeleteMapping("/{providerId}")
  public ResponseEntity<String> deleteConnection(@PathVariable String providerId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(401).body("User not authenticated.");
    }

    String userId = authentication.getName();
    connectionService.deleteConnectionForUser(userId, providerId);

    return ResponseEntity.ok("Connection deleted successfully.");
  }
}
