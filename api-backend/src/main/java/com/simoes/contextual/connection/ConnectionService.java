package com.simoes.contextual.connection;

import com.simoes.contextual.user.UserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service class for managing user connections to external providers. This service provides the core
 * business logic and delegates persistence to the UserService.
 */
@Service
@AllArgsConstructor
@Slf4j
public class ConnectionService {
  private final UserService userService;

  /**
   * Saves a new or updates an existing connection for a specific user.
   *
   * @param username The ID of the user.
   * @param providerId The ID of the external provider (e.g., "google").
   * @param contextId The context ID for the connection (not used in this implementation).
   * @param providerAccessToken The access token for the external provider.
   */
  public void saveConnectionForUser(
      String username, String providerId, String contextId, String providerAccessToken) {
    log.info("Saving connection for user {} with provider {}", username, providerId);

    // Create the connection object
    Connection newConnection =
        Connection.builder()
            .providerId(providerId)
            .contextId(contextId)
            .providerAccessToken(providerAccessToken)
            .connectedAt(Instant.now())
            .build();

    // Delegate the persistence logic to the UserService
    userService.saveConnection(username, newConnection);
  }

  /**
   * Deletes a connection for a specific user by provider ID.
   *
   * @param userId The ID of the user.
   * @param providerId The ID of the provider to delete.
   */
  public void deleteConnectionForUser(String userId, String providerId) {
    log.info("Deleting connection for user {} with provider {}", userId, providerId);
    userService.deleteConnection(userId, providerId);
  }
}
