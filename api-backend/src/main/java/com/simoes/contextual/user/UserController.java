package com.simoes.contextual.user;

import com.simoes.contextual.model.Context;
import com.simoes.contextual.model.IdentityAttribute;
import com.simoes.contextual.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller for handling user-related operations.
 * This controller provides endpoints for managing user contexts and attributes.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  /**
   * Retrieves the currently authenticated user from the security context.
   * This method assumes that the user is authenticated and exists in the mock data.
   *
   * @return The authenticated User object.
   */
  private User getAuthenticatedUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = authentication.getName();
    return userService.findUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found in mock data."));
  }

  /**
   * Endpoint to get the authenticated user's details.
   * This method retrieves the user information from the security context.
   *
   * @return ResponseEntity containing the authenticated User object.
   */
  @GetMapping("/me/contexts")
  public ResponseEntity<List<Context>> getUserContexts() {
    User currentUser = getAuthenticatedUser();
    return ResponseEntity.ok(currentUser.getContexts());
  }

  /**
   * Endpoint to update an existing context for the authenticated user.
   * This method modifies an existing Context in the user's contexts.
   *
   * @param contextId The ID of the context to update.
   * @param updatedContext The updated Context object.
   * @return ResponseEntity containing the updated Context object or NOT_FOUND status if not found.
   */
  @PutMapping("/me/contexts/{contextId}")
  public ResponseEntity<Context> updateContext(
          @PathVariable String contextId,
          @RequestBody Context updatedContext) {
    User currentUser = getAuthenticatedUser();
    Optional<Context> result = userService.updateContext(currentUser.getId(), contextId, updatedContext);

    return result.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  /**
   * Endpoint to create a new context for the authenticated user.
   * This method adds a new context to the user's contexts.
   *
   * @param newContext The Context object to create.
   * @return ResponseEntity containing the created Context object or BAD_REQUEST status.
   */
  @PostMapping("/me/contexts")
  public ResponseEntity<Context> createContext(@RequestBody Context newContext) {
    User currentUser = getAuthenticatedUser();
    Optional<Context> result = userService.createContext(currentUser.getId(), newContext);

    return result.map(ctx -> ResponseEntity.status(HttpStatus.CREATED).body(ctx))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
  }

  /**
   * Endpoint to delete a context by its ID for the authenticated user.
   * This method removes the context from the user's contexts.
   *
   * @param contextId The ID of the context to delete.
   * @return ResponseEntity with NO_CONTENT status if deleted, or NOT_FOUND status if not found.
   */
  @DeleteMapping("/me/contexts/{contextId}")
  public ResponseEntity<Void> deleteContext(@PathVariable String contextId) {
    User currentUser = getAuthenticatedUser();
    boolean deleted = userService.deleteContext(currentUser.getId(), contextId);

    if (deleted) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  /**
   * Endpoint to get all attributes of the authenticated user.
   * This method retrieves the user's attributes from the security context.
   *
   * @return ResponseEntity containing a list of IdentityAttribute objects.
   */
  @GetMapping("/me/attributes")
  public ResponseEntity<List<IdentityAttribute>> getAllUserAttributes() {
    User currentUser = getAuthenticatedUser();
    return ResponseEntity.ok(currentUser.getAttributes());
  }

  /**
   * Endpoint to get attributes for a specific context ID for the authenticated user.
   * This method filters the user's attributes based on the provided context ID.
   *
   * @param contextId The ID of the context to filter attributes by.
   * @return ResponseEntity containing a list of IdentityAttribute objects for the specified context.
   */
  @GetMapping("/me/attributes/{contextId}")
  public ResponseEntity<List<IdentityAttribute>> getContextualAttributes(@PathVariable String contextId) {
    User currentUser = getAuthenticatedUser();

    List<IdentityAttribute> contextualAttributes = currentUser.getAttributes().stream()
            .filter(attribute -> attribute.getContextIds() != null && attribute.getContextIds().contains(contextId))
            .filter(IdentityAttribute::isVisible)
            .collect(Collectors.toList());

    return ResponseEntity.ok(contextualAttributes);
  }

  /**
   * Endpoint to create a new attribute for the authenticated user.
   * This method adds a new IdentityAttribute to the user's attributes.
   *
   * @param newAttribute The IdentityAttribute object to create.
   * @return ResponseEntity containing the created IdentityAttribute object or BAD_REQUEST status.
   */
  @PostMapping("/me/attributes")
  public ResponseEntity<IdentityAttribute> createAttribute(@RequestBody IdentityAttribute newAttribute) {
    User currentUser = getAuthenticatedUser();
    Optional<IdentityAttribute> result = userService.createAttribute(currentUser.getId(), newAttribute);

    return result.map(attr -> ResponseEntity.status(HttpStatus.CREATED).body(attr))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
  }

  /**
   * Endpoint to update an existing attribute for the authenticated user.
   * This method modifies an existing IdentityAttribute in the user's attributes.
   *
   * @param attributeId The ID of the attribute to update.
   * @param updatedAttribute The updated IdentityAttribute object.
   * @return ResponseEntity containing the updated IdentityAttribute object or NOT_FOUND status if not found.
   */
  @PutMapping("/me/attributes/{attributeId}")
  public ResponseEntity<IdentityAttribute> updateAttribute(
          @PathVariable String attributeId,
          @RequestBody IdentityAttribute updatedAttribute) {
    User currentUser = getAuthenticatedUser();
    Optional<IdentityAttribute> result = userService.updateAttribute(currentUser.getId(), attributeId, updatedAttribute);

    return result.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  /**
   * Endpoint to delete an attribute by its ID for the authenticated user.
   * This method removes the IdentityAttribute from the user's attributes.
   *
   * @param attributeId The ID of the attribute to delete.
   * @return ResponseEntity with NO_CONTENT status if deleted, or NOT_FOUND status if not found.
   */
  @DeleteMapping("/me/attributes/{attributeId}")
  public ResponseEntity<Void> deleteAttribute(@PathVariable String attributeId) {
    User currentUser = getAuthenticatedUser();
    boolean deleted = userService.deleteAttribute(currentUser.getId(), attributeId);

    if (deleted) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }
}
