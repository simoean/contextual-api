package com.simoes.contextual.consent;

import com.simoes.contextual.user.User;
import com.simoes.contextual.util.UserUtil;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for handling user consent-related operations. Provides endpoints for managing consents
 * associated with the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/users/me/consents")
@RequiredArgsConstructor
public class ConsentController {

  private final UserUtil userUtil;
  private final ConsentService consentService;

  /**
   * Endpoint to get all consents of the authenticated user.
   *
   * @return ResponseEntity containing a list of Consent objects.
   */
  @GetMapping
  public ResponseEntity<List<Consent>> getUserConsents() {
    return ResponseEntity.ok(userUtil.getAuthenticatedUser().getConsents());
  }

  /**
   * Endpoint to record a new consent from a user.
   *
   * @param consent The DTO with the consent details.
   * @return A ResponseEntity with the updated user or a 404 if the user is not found.
   */
  @PostMapping
  public ResponseEntity<User> recordConsent(@RequestBody Consent consent) {
    return consentService
        .recordConsent(userUtil.getAuthenticatedUserId(), consent)
        .map(user -> ResponseEntity.status(HttpStatus.CREATED).body(user))
        .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
  }

  /**
   * Endpoint to revoke a consent by its ID for the authenticated user.
   *
   * @param consentId The ID of the consent to delete.
   * @return ResponseEntity with NO_CONTENT status if deleted, or NOT_FOUND status if not found.
   */
  @DeleteMapping("/{consentId}")
  public ResponseEntity<Void> revokeConsent(@PathVariable String consentId) {
    boolean deleted = consentService.revokeConsent(userUtil.getAuthenticatedUserId(), consentId);

    if (deleted) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  /**
   * Endpoint to remove a single attribute from a consent record.
   *
   * @param consentId The ID of the consent record to modify.
   * @param attributeId The ID of the attribute to remove.
   * @return ResponseEntity with NO_CONTENT if successful, or NOT_FOUND if the consent or attribute
   *     was not found.
   */
  @DeleteMapping("/{consentId}/attributes/{attributeId}")
  public ResponseEntity<Void> removeAttributeFromConsent(
      @PathVariable String consentId, @PathVariable String attributeId) {
    boolean removed =
        consentService.revokeAttributeFromConsent(
            userUtil.getAuthenticatedUserId(), consentId, attributeId);

    if (removed) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }
}
