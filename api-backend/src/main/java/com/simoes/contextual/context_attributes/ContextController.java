package com.simoes.contextual.context_attributes;

import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for handling user context-related operations. Provides endpoints for managing contexts
 * associated with the authenticated user.
 */
@RestController
@RequestMapping("/api/users/me/contexts")
@RequiredArgsConstructor
public class ContextController {

  private final UserService userService;
  private final ContextService contextService;

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
   * Endpoint to get all contexts of the authenticated user.
   *
   * @return ResponseEntity containing a list of Context objects.
   */
  @GetMapping
  public ResponseEntity<List<Context>> getUserContexts() {
    User currentUser = getAuthenticatedUser();
    return ResponseEntity.ok(currentUser.getContexts());
  }

  /**
   * Endpoint to create a new context for the authenticated user.
   *
   * @param newContext The Context object to create.
   * @return ResponseEntity containing the created Context if successful, or BAD_REQUEST status.
   */
  @PostMapping
  public ResponseEntity<Context> createContext(@RequestBody Context newContext) {
    User currentUser = getAuthenticatedUser();
    Optional<Context> result = contextService.createContext(currentUser.getId(), newContext);

    return result
        .map(ctx -> ResponseEntity.status(HttpStatus.CREATED).body(ctx))
        .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
  }

  /**
   * Endpoint to update an existing context for the authenticated user.
   *
   * @param contextId The ID of the context to update.
   * @param updatedContext The Context object with updated values.
   * @return ResponseEntity containing the updated Context if successful, or NOT_FOUND status.
   */
  @PutMapping("/{contextId}")
  public ResponseEntity<Context> updateContext(
      @PathVariable String contextId, @RequestBody Context updatedContext) {
    User currentUser = getAuthenticatedUser();
    Optional<Context> result =
        contextService.updateContext(currentUser.getId(), contextId, updatedContext);

    return result
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  /**
   * Endpoint to delete a context by its ID for the authenticated user.
   *
   * @param contextId The ID of the context to delete.
   * @return ResponseEntity with NO_CONTENT status if deleted, or NOT_FOUND status if not found.
   */
  @DeleteMapping("/{contextId}")
  public ResponseEntity<Void> deleteContext(@PathVariable String contextId) {
    User currentUser = getAuthenticatedUser();
    boolean deleted = contextService.deleteContext(currentUser.getId(), contextId);

    if (deleted) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }
}
