package com.simoes.contextual.context_attributes;

import com.simoes.contextual.user.UserService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Service for managing user contexts. This service provides methods to create, update, and delete
 * contexts for a user.
 */
@Service
@RequiredArgsConstructor
class ContextService {

  private final UserService userService; // CHANGED: Now depends on UserService

  /**
   * Creates a new context for a user.
   *
   * @param userId The ID of the user for whom the context is to be created.
   * @param newContext The Context object to create.
   * @return An Optional containing the created Context if successful, or empty if the user does not
   *     exist.
   */
  Optional<Context> createContext(String userId, Context newContext) {
    // Delegate to UserService's method
    return userService.createContext(userId, newContext);
  }

  /**
   * Updates an existing context for a user.
   *
   * @param userId The ID of the user whose context is to be updated.
   * @param contextId The ID of the context to update.
   * @param updatedContext The Context object with updated values.
   * @return An Optional containing the updated Context if successful, or empty if the user or
   *     context was not found.
   */
  Optional<Context> updateContext(String userId, String contextId, Context updatedContext) {
    // Delegate to UserService's method
    return userService.updateContext(userId, contextId, updatedContext);
  }

  /**
   * Deletes a context by its ID for a user.
   *
   * @param userId The ID of the user whose context is to be deleted.
   * @param contextId The ID of the context to delete.
   * @return true if the context was deleted, false if it was not found.
   */
  boolean deleteContext(String userId, String contextId) {
    // Delegate to UserService's method
    return userService.deleteContext(userId, contextId);
  }
}
