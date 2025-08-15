package com.simoes.contextual.context_attributes;

import com.simoes.contextual.util.UserUtil;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for handling user context-related operations. Provides endpoints for managing contexts
 * associated with the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/users/me/contexts")
@RequiredArgsConstructor
public class ContextController {

  private final UserUtil userUtil;
  private final ContextService contextService;

  /**
   * Endpoint to get all contexts of the authenticated user.
   *
   * @return ResponseEntity containing a list of Context objects.
   */
  @GetMapping
  public ResponseEntity<List<Context>> getUserContexts() {
    return ResponseEntity.ok(userUtil.getAuthenticatedUser().getContexts());
  }

  /**
   * Endpoint to create a new context for the authenticated user.
   *
   * @param newContext The Context object to create.
   * @return ResponseEntity containing the created Context if successful, or BAD_REQUEST status.
   */
  @PostMapping
  public ResponseEntity<Context> createContext(@RequestBody Context newContext) {
    return contextService
        .createContext(userUtil.getAuthenticatedUserId(), newContext)
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
    return contextService
        .updateContext(userUtil.getAuthenticatedUserId(), contextId, updatedContext)
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
    boolean deleted = contextService.deleteContext(userUtil.getAuthenticatedUserId(), contextId);

    if (deleted) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }
}
