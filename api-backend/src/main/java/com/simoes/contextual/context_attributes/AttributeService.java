package com.simoes.contextual.context_attributes;

import com.simoes.contextual.user.UserService;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Service for managing user identity attributes. This service provides methods to create, update,
 * and delete attributes for a user.
 */
@Service
@RequiredArgsConstructor
class AttributeService {

  private final UserService userService;

  /**
   * Creates a new identity attribute for a user.
   *
   * @param userId The ID of the user for whom the attribute is to be created.
   * @param newAttribute The IdentityAttribute object to create.
   * @return An Optional containing the created IdentityAttribute if successful, or empty if the
   *     user does not exist.
   */
  Optional<IdentityAttribute> createAttribute(String userId, IdentityAttribute newAttribute) {
    // Delegate to UserService's method
    return userService.createAttribute(userId, newAttribute);
  }

  /**
   * Updates an existing identity attribute for a user.
   *
   * @param userId The ID of the user whose attribute is to be updated.
   * @param attributeId The ID of the attribute to update.
   * @param updatedAttribute The IdentityAttribute object with updated values.
   * @return An Optional containing the updated IdentityAttribute if successful, or empty if the
   *     user or attribute was not found.
   */
  Optional<IdentityAttribute> updateAttribute(
      String userId, String attributeId, IdentityAttribute updatedAttribute) {
    // Delegate to UserService's method
    return userService.updateAttribute(userId, attributeId, updatedAttribute);
  }

  /**
   * Deletes an identity attribute by its ID for a user.
   *
   * @param userId The ID of the user whose attribute is to be deleted.
   * @param attributeId The ID of the attribute to delete.
   * @return true if the attribute was deleted, false if it was not found.
   */
  boolean deleteAttribute(String userId, String attributeId) {
    // Delegate to UserService's method
    return userService.deleteAttribute(userId, attributeId);
  }

  /**
   * Saves a list of attributes for a given user using a bulk operation.
   * This method delegates the entire list to the UserService to ensure optimized persistence.
   *
   * @param userId The ID of the user.
   * @param attributes The list of attributes to save.
   * @return The list of saved attributes.
   */
  public List<IdentityAttribute> saveAttributes(String userId, List<IdentityAttribute> attributes) {
    return userService.saveAttributesBulk(userId, attributes);
  }
}
