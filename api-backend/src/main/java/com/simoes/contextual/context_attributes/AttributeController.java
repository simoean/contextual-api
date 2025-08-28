package com.simoes.contextual.context_attributes;

import com.simoes.contextual.util.UserUtil;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for handling user identity attribute-related operations. Provides endpoints for
 * managing attributes associated with the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/users/me/attributes")
@RequiredArgsConstructor
public class AttributeController {

  private final UserUtil userUtil;
  private final AttributeService attributeService;

  /**
   * Endpoint to get all attributes of the authenticated user.
   *
   * @return ResponseEntity containing a list of IdentityAttribute objects.
   */
  @GetMapping
  public ResponseEntity<List<IdentityAttribute>> getAllUserAttributes() {
    return ResponseEntity.ok(userUtil.getAuthenticatedUser().getAttributes());
  }

  /**
   * Endpoint to get attributes for a specific context ID for the authenticated user. Filters the
   * user's attributes based on the provided context ID and visibility.
   *
   * @param contextId The ID of the context to filter attributes by.
   * @return ResponseEntity containing a list of IdentityAttribute objects for the specified
   * context.
   */
  @GetMapping("/{contextId}") // Sub-path for contextual attributes
  public ResponseEntity<List<IdentityAttribute>> getContextualAttributes(
          @PathVariable String contextId) {
    List<IdentityAttribute> contextualAttributes =
            userUtil.getAuthenticatedUser().getAttributes().stream()
                    .filter(
                            attribute ->
                                    attribute.getContextIds() != null
                                            && attribute.getContextIds().contains(contextId))
                    .filter(IdentityAttribute::isVisible)
                    .collect(Collectors.toList());

    return ResponseEntity.ok(contextualAttributes);
  }

  /**
   * Endpoint to create a new attribute for the authenticated user.
   *
   * @param newAttribute The IdentityAttribute object to create.
   * @return ResponseEntity containing the created IdentityAttribute if successful, or BAD_REQUEST
   * status.
   */
  @PostMapping
  public ResponseEntity<IdentityAttribute> createAttribute(
          @RequestBody IdentityAttribute newAttribute) {
    return attributeService
            .createAttribute(userUtil.getAuthenticatedUserId(), newAttribute)
            .map(attr -> ResponseEntity.status(HttpStatus.CREATED).body(attr))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
  }

  /**
   * Endpoint to update an existing attribute for the authenticated user.
   *
   * @param attributeId The ID of the attribute to update.
   * @param updatedAttribute The updated IdentityAttribute object.
   * @return ResponseEntity containing the updated IdentityAttribute if successful, or NOT_FOUND
   * status if not found.
   */
  @PutMapping("/{attributeId}")
  public ResponseEntity<IdentityAttribute> updateAttribute(
          @PathVariable String attributeId, @RequestBody IdentityAttribute updatedAttribute) {
    return attributeService
            .updateAttribute(userUtil.getAuthenticatedUserId(), attributeId, updatedAttribute)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  /**
   * Endpoint to delete an attribute by its ID for the authenticated user.
   *
   * @param attributeId The ID of the attribute to delete.
   * @return ResponseEntity with NO_CONTENT status if deleted, or NOT_FOUND status if not found.
   */
  @DeleteMapping("/{attributeId}")
  public ResponseEntity<Void> deleteAttribute(@PathVariable String attributeId) {
    boolean deleted =
            attributeService.deleteAttribute(userUtil.getAuthenticatedUserId(), attributeId);

    if (deleted) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  /**
   * Endpoint to save a list of attributes for the authenticated user. This method will either
   * create a new attribute or update an existing one based on the attribute's ID.
   *
   * @param attributes The list of IdentityAttribute objects to save.
   * @return ResponseEntity with the list of saved IdentityAttribute objects.
   */
  @PostMapping("/bulk")
  public ResponseEntity<List<IdentityAttribute>> saveAttributes(
          @RequestBody List<IdentityAttribute> attributes) {
    List<IdentityAttribute> savedAttributes =
            attributeService.saveAttributes(userUtil.getAuthenticatedUserId(), attributes);
    return ResponseEntity.status(HttpStatus.OK).body(savedAttributes);
  }

  /**
   * Handles IllegalArgumentException, typically thrown when a duplicate attribute name is found.
   *
   * @param ex The exception that was thrown.
   * @return A ResponseEntity with a 409 Conflict status and the exception message.
   */
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
  }
}
