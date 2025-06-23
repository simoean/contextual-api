package com.simoes.contextual.context_attributes;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for the AttributeService. These tests focus on the business logic within the service,
 * mocking its external dependency, UserService.
 */
@ExtendWith(MockitoExtension.class)
class AttributeServiceTest {

  // Creates a mock instance of UserService
  @Mock private UserService userService;

  // Injects the mocks into AttributeService
  @InjectMocks private AttributeService attributeService;

  private User testUser;
  private IdentityAttribute testAttributeFirstName;
  private IdentityAttribute testAttributeLastName;

  @BeforeEach
  void setUp() {
    // Common setup for test data (only attributes relevant here, contexts are not directly used by
    // AttributeService logic)
    testAttributeFirstName =
        new IdentityAttribute(
            "attr-1",
            "user123",
            "firstName",
            "John",
            true,
            new ArrayList<>(Arrays.asList("ctx-1", "ctx-2")));
    testAttributeLastName =
        new IdentityAttribute(
            "attr-2",
            "user123",
            "lastName",
            "Doe",
            true,
            new ArrayList<>(Collections.singletonList("ctx-1")));

    testUser =
        new User(
            "user123",
            "john.doe",
            "password",
            "john@example.com",
            Collections.singletonList("ROLE_USER"),
            Collections.emptyList(),
            new ArrayList<>(Arrays.asList(testAttributeFirstName, testAttributeLastName)));
  }

  @Test
  @DisplayName("Should create a new attribute successfully via UserService")
  void Given_User_When_CreateAttribute_Then_AttributeIsCreated() {
    // Given: UserService's createAttribute method returns the created attribute
    IdentityAttribute newAttribute =
        new IdentityAttribute(null, null, "newAttr", "value", true, null);
    // Simulate ID and userId generation/setting by UserService
    when(userService.createAttribute(eq(testUser.getId()), any(IdentityAttribute.class)))
        .thenAnswer(
            invocation -> {
              IdentityAttribute attributeArg = invocation.getArgument(1);
              attributeArg.setId("attr-generated-id"); // Simulate generated ID
              attributeArg.setUserId(testUser.getId()); // Simulate userId set by UserService
              return Optional.of(attributeArg);
            });

    // When: AttributeService's createAttribute is called
    Optional<IdentityAttribute> result =
        attributeService.createAttribute(testUser.getId(), newAttribute);

    // Then: New attribute should be returned with a generated ID and correct userId
    assertTrue(result.isPresent());
    assertNotNull(result.get().getId());
    assertTrue(
        result
            .get()
            .getId()
            .startsWith("attr-")); // Still checking starts with attr- for convention
    assertEquals("newAttr", result.get().getName());
    assertEquals(testUser.getId(), result.get().getUserId()); // Assert userId is set

    // Verify that userService.createAttribute was called once
    verify(userService, times(1))
        .createAttribute(eq(testUser.getId()), any(IdentityAttribute.class));
  }

  @Test
  @DisplayName("Should update an existing attribute successfully via UserService")
  void Given_UserAndExistingAttribute_When_UpdateAttribute_Then_AttributeIsUpdated() {
    // Given: UserService's updateAttribute method returns the updated attribute
    IdentityAttribute updatedAttribute =
        new IdentityAttribute(
            testAttributeFirstName.getId(),
            testUser.getId(),
            "Updated Name",
            "Updated Value",
            false,
            Collections.emptyList());

    when(userService.updateAttribute(
            eq(testUser.getId()), eq(testAttributeFirstName.getId()), any(IdentityAttribute.class)))
        .thenReturn(Optional.of(updatedAttribute));

    // When: AttributeService's updateAttribute is called
    Optional<IdentityAttribute> result =
        attributeService.updateAttribute(
            testUser.getId(), testAttributeFirstName.getId(), updatedAttribute);

    // Then: Attribute should be updated and returned
    assertTrue(result.isPresent());
    assertEquals("Updated Name", result.get().getName());
    assertEquals("Updated Value", result.get().getValue());
    assertFalse(result.get().isVisible());

    // Verify that userService.updateAttribute was called once
    verify(userService, times(1))
        .updateAttribute(
            eq(testUser.getId()), eq(testAttributeFirstName.getId()), any(IdentityAttribute.class));
  }

  @Test
  @DisplayName("Should return empty Optional when updating non-existent attribute via UserService")
  void Given_UserAndNonExistentAttribute_When_UpdateAttribute_Then_ReturnsEmptyOptional() {
    // Given: user and non-existent attribute
    IdentityAttribute nonExistentAttribute =
        new IdentityAttribute(
            "attr-nonexistent", testUser.getId(), "nonexistent", "value", true, null);

    // When: AttributeService's updateAttribute is called
    Optional<IdentityAttribute> result =
        attributeService.updateAttribute(
            testUser.getId(), nonExistentAttribute.getId(), nonExistentAttribute);

    // Then: Optional should be empty
    assertFalse(result.isPresent());

    // Verify that findByIdAndUpdate was called once
    verify(userService, times(1))
        .updateAttribute(
            eq(testUser.getId()), eq(nonExistentAttribute.getId()), eq(nonExistentAttribute));
  }

  @Test
  @DisplayName("Should delete an existing attribute successfully via UserService")
  void Given_UserAndExistingAttribute_When_DeleteAttribute_Then_AttributeIsDeleted() {
    // Given: UserService's deleteAttribute returns true
    when(userService.deleteAttribute(testUser.getId(), testAttributeFirstName.getId()))
        .thenReturn(true);

    // When: AttributeService's deleteAttribute is called for testAttributeFirstName
    boolean deleted =
        attributeService.deleteAttribute(testUser.getId(), testAttributeFirstName.getId());

    // Then: Attribute should be deleted
    assertTrue(deleted);

    // Verify that deleteAttribute on UserService was called once
    verify(userService, times(1)).deleteAttribute(testUser.getId(), testAttributeFirstName.getId());
  }

  @Test
  @DisplayName("Should return false when deleting non-existent attribute via UserService")
  void Given_UserAndNonExistentAttribute_When_DeleteAttribute_Then_ReturnsFalse() {
    // Given: UserService's deleteAttribute returns false
    when(userService.deleteAttribute(testUser.getId(), "attr-nonexistent")).thenReturn(false);

    // When: AttributeService's deleteAttribute is called for a non-existent attribute
    boolean deleted = attributeService.deleteAttribute(testUser.getId(), "attr-nonexistent");

    // Then: Returns false
    assertFalse(deleted);

    // Verify that deleteAttribute on UserService was called once
    verify(userService, times(1)).deleteAttribute(testUser.getId(), "attr-nonexistent");
  }
}
