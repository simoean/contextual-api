package com.simoes.contextual.consent;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for the ConsentService. These tests focus on the business logic within the service,
 * mocking its external dependency, UserService.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsentService Unit Tests")
class ConsentServiceTest {

  // Creates a mock instance of UserService
  @Mock private UserService userService;

  // Injects the mocks into ConsentService
  @InjectMocks private ConsentService consentService;

  private User testUser;
  private Consent testConsent;
  private Consent testNewConsent;

  @BeforeEach
  void setUp() {
    // Common setup for test data
    testConsent =
        Consent.builder()
            .id("consent-123")
            .clientId("client-app-1")
            .sharedAttributes(List.of("attr-1", "attr-2"))
            .timestamps(Collections.emptyList())
            .build();

    testNewConsent =
        Consent.builder()
            .clientId("client-app-1")
            .sharedAttributes(List.of("attr-1", "attr-2"))
            .build();

    testUser =
        new User(
            "user123",
            "john.doe",
            "password",
            "john@example.com",
            Collections.emptyList(),
            Collections.emptyList(),
            Collections.emptyList(),
            List.of(testConsent));
  }

  @Test
  @DisplayName("Should record a new consent successfully by delegating to UserService")
  void Given_ConsentDto_When_RecordConsent_Then_DelegatesAndReturnsUpdatedUser() {
    // Given: UserService's recordConsent method returns an Optional containing the updated user
    when(userService.recordConsent(eq(testUser.getId()), any(Consent.class)))
        .thenReturn(Optional.of(testUser));

    // When: ConsentService's recordConsent is called
    Optional<User> result = consentService.recordConsent(testUser.getId(), testNewConsent);

    // Then: The updated user should be returned
    assertTrue(result.isPresent());

    // Verify that userService.recordConsent was called once with the correct arguments
    verify(userService, times(1)).recordConsent(eq(testUser.getId()), eq(testNewConsent));
  }

  @Test
  @DisplayName("Should return empty Optional when recording consent for non-existent user")
  void Given_NonExistentUser_When_RecordConsent_Then_ReturnsEmptyOptional() {
    // Given: UserService's recordConsent method returns an empty Optional
    when(userService.recordConsent(eq("non-existent-id"), any(Consent.class)))
        .thenReturn(Optional.empty());

    // When: ConsentService's recordConsent is called with a non-existent user ID
    Optional<User> result = consentService.recordConsent("non-existent-id", testNewConsent);

    // Then: An empty Optional should be returned
    assertFalse(result.isPresent());

    // Verify that userService.recordConsent was called once
    verify(userService, times(1)).recordConsent(eq("non-existent-id"), eq(testNewConsent));
  }

  @Test
  @DisplayName("Should revoke an existing consent successfully by delegating to UserService")
  void Given_ExistingConsent_When_RevokeConsent_Then_DelegatesAndReturnsTrue() {
    // Given: UserService's revokeConsent method returns true
    when(userService.revokeConsent(testUser.getId(), testConsent.getId())).thenReturn(true);

    // When: ConsentService's revokeConsent is called
    boolean result = consentService.revokeConsent(testUser.getId(), testConsent.getId());

    // Then: The method should return true
    assertTrue(result);

    // Verify that userService.revokeConsent was called once with the correct arguments
    verify(userService, times(1)).revokeConsent(eq(testUser.getId()), eq(testConsent.getId()));
  }

  @Test
  @DisplayName("Should return false when revoking non-existent consent")
  void Given_NonExistentConsent_When_RevokeConsent_Then_ReturnsFalse() {
    // Given: UserService's revokeConsent method returns false
    when(userService.revokeConsent(testUser.getId(), "non-existent-id")).thenReturn(false);

    // When: ConsentService's revokeConsent is called with a non-existent consent ID
    boolean result = consentService.revokeConsent(testUser.getId(), "non-existent-id");

    // Then: The method should return false
    assertFalse(result);

    // Verify that userService.revokeConsent was called once
    verify(userService, times(1)).revokeConsent(eq(testUser.getId()), eq("non-existent-id"));
  }

  @Test
  @DisplayName("Should return false when revoking consent for non-existent user")
  void Given_NonExistentUser_When_RevokeConsent_Then_ReturnsFalse() {
    // Given: UserService's revokeConsent method returns false (because the user isn't found)
    when(userService.revokeConsent("non-existent-id", testConsent.getId())).thenReturn(false);

    // When: ConsentService's revokeConsent is called with a non-existent user ID
    boolean result = consentService.revokeConsent("non-existent-id", testConsent.getId());

    // Then: The method should return false
    assertFalse(result);

    // Verify that userService.revokeConsent was called once
    verify(userService, times(1)).revokeConsent(eq("non-existent-id"), eq(testConsent.getId()));
  }

  @Test
  @DisplayName("Should revoke an individual attribute from an existing consent")
  void
      Given_UserAndExistingConsentAndAttribute_When_RevokeAttributeFromConsent_Then_DelegatesAndReturnsTrue() {
    // Given: UserService's removeConsentedAttribute method returns true
    when(userService.removeConsentedAttribute(testUser.getId(), testConsent.getId(), "attr-1"))
        .thenReturn(true);

    // When: revokeAttributeFromConsent is called
    boolean result =
        consentService.revokeAttributeFromConsent(testUser.getId(), testConsent.getId(), "attr-1");

    // Then: The method should return true
    assertTrue(result);

    // Verify that userService.removeConsentedAttribute was called once with the correct arguments
    verify(userService, times(1))
        .removeConsentedAttribute(eq(testUser.getId()), eq(testConsent.getId()), eq("attr-1"));
  }

  @Test
  @DisplayName("Should return false when revoking a non-existent attribute")
  void Given_UserAndConsent_When_RevokeNonExistentAttribute_Then_ReturnsFalse() {
    // Given: UserService's removeConsentedAttribute method returns false
    when(userService.removeConsentedAttribute(
            testUser.getId(), testConsent.getId(), "non-existent-attr"))
        .thenReturn(false);

    // When: revokeAttributeFromConsent is called
    boolean result =
        consentService.revokeAttributeFromConsent(
            testUser.getId(), testConsent.getId(), "non-existent-attr");

    // Then: The method should return false
    assertFalse(result);
  }
}
