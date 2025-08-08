package com.simoes.contextual.consent;

import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Service for managing user consents. This service provides methods to record and delete consent
 * records for a user, delegating the persistence logic to UserService.
 */
@Service
@RequiredArgsConstructor
public class ConsentService {

  private final UserService userService;

  /**
   * Retrieves a user's consent by its ID.
   *
   * @param userId The ID of the user.
   * @param consentId The ID of the consent record.
   * @return An Optional containing the Consent if found, or empty if not found.
   */
  public Optional<Consent> findConsentById(String userId, String consentId) {
    return userService.findConsentById(userId, consentId);
  }

  /**
   * Records or updates a user's consent for a specific client application.
   *
   * @param userId The ID of the user.
   * @param consent The DTO containing the client ID and shared attributes.
   * @return An Optional containing the updated User if successful, or empty if the user is not
   *     found.
   */
  Optional<User> recordConsent(String userId, Consent consent) {
    return userService.recordConsent(userId, consent);
  }

  /**
   * Revokes a consent by its ID for a user.
   *
   * @param userId The ID of the user whose consent is to be deleted.
   * @param consentId The ID of the consent to delete.
   * @return true if the consent was deleted, false if it was not found.
   */
  boolean revokeConsent(String userId, String consentId) {
    return userService.revokeConsent(userId, consentId);
  }

  /**
   * Removes a single attribute from an existing consent record for a user.
   *
   * @param userId The ID of the user.
   * @param consentId The ID of the consent record.
   * @param attributeId The ID of the attribute to remove.
   * @return true if the attribute was successfully removed, false if not found.
   */
  boolean revokeAttributeFromConsent(String userId, String consentId, String attributeId) {
    return userService.removeConsentedAttribute(userId, consentId, attributeId);
  }

  /**
   * Audits access to a user's consent.
   *
   * @param userId The ID of the user.
   * @param consentId The ID of the consent record.
   */
  public void auditAccess(String userId, String consentId) {
    userService.auditAccess(userId, consentId);
  }
}
