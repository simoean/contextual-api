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
 * Unit tests for the ContextService. These tests focus on the business logic within the service,
 * mocking its external dependency, UserService.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ContextService Unit Tests")
class ContextServiceTest {

  // Creates a mock instance of UserService
  @Mock private UserService userService;

  // Injects the mocks into ContextService
  @InjectMocks private ContextService contextService;

  private User testUser;
  private Context testContextPersonal;

  @BeforeEach
  void setUp() {
    // Common setup for test data
    testContextPersonal = new Context("ctx-1", "Personal", "Personal info");
    Context testContextProfessional = new Context("ctx-2", "Professional", "Professional info");

    IdentityAttribute testAttributeFirstName =
        new IdentityAttribute(
            "attr-1",
            "user123",
            "firstName",
            "John",
            true,
            new ArrayList<>(
                Arrays.asList(testContextPersonal.getId(), testContextProfessional.getId())));

    testUser =
        new User(
            "user123",
            "john.doe",
            "password",
            "john@example.com",
            Collections.singletonList("ROLE_USER"),
            Arrays.asList(testContextPersonal, testContextProfessional),
            Collections.singletonList(testAttributeFirstName),
            Collections.emptyList());
  }

  @Test
  @DisplayName("Should update an existing context successfully via UserService")
  void Given_UserAndExistingContext_When_UpdateContext_Then_ContextIsUpdated() {
    // Given: UserService's updateContext method returns the updated context
    Context updatedContext =
        new Context(testContextPersonal.getId(), "Updated Personal", "New description");
    when(userService.updateContext(
            eq(testUser.getId()), eq(testContextPersonal.getId()), any(Context.class)))
        .thenReturn(Optional.of(updatedContext)); // Return the updated context from the mock

    // When: ContextService's updateContext is called
    Optional<Context> result =
        contextService.updateContext(testUser.getId(), testContextPersonal.getId(), updatedContext);

    // Then: Context should be updated and returned
    assertTrue(result.isPresent());
    assertEquals("Updated Personal", result.get().getName());
    assertEquals("New description", result.get().getDescription());

    // Verify that userService.updateContext was called once
    verify(userService, times(1))
        .updateContext(eq(testUser.getId()), eq(testContextPersonal.getId()), any(Context.class));
  }

  @Test
  @DisplayName("Should return empty Optional when updating non-existent context via UserService")
  void Given_UserAndNonExistentContext_When_UpdateContext_Then_ReturnsEmptyOptional() {
    // Given: UserService's updateContext returns empty Optional (simulating context not found)
    Context nonExistentContext = new Context("ctx-nonexistent", "Non Existent", "");
    when(userService.updateContext(
            eq(testUser.getId()), eq(nonExistentContext.getId()), any(Context.class)))
        .thenReturn(Optional.empty());

    // When: ContextService's updateContext is called
    Optional<Context> result =
        contextService.updateContext(
            testUser.getId(), nonExistentContext.getId(), nonExistentContext);

    // Then: Optional should be empty
    assertFalse(result.isPresent());

    // Verify that userService.updateContext was called once
    verify(userService, times(1))
        .updateContext(eq(testUser.getId()), eq(nonExistentContext.getId()), any(Context.class));
  }

  @Test
  @DisplayName("Should create a new context successfully via UserService")
  void Given_User_When_CreateContext_Then_ContextIsCreated() {
    // Given: UserService's createContext method returns the created context
    Context newContext = new Context(null, "New Context", "Description of new context");
    // Simulate ID generation and setting by UserService
    when(userService.createContext(eq(testUser.getId()), any(Context.class)))
        .thenAnswer(
            invocation -> {
              Context contextArg = invocation.getArgument(1);
              contextArg.setId("ctx-generated-id"); // Simulate generated ID
              return Optional.of(contextArg);
            });

    // When: ContextService's createContext is called
    Optional<Context> result = contextService.createContext(testUser.getId(), newContext);

    // Then: New context should be returned with a generated ID
    assertTrue(result.isPresent());
    assertNotNull(result.get().getId());
    assertTrue(
        result.get().getId().startsWith("ctx-")); // Still checking starts with ctx- for convention
    assertEquals("New Context", result.get().getName());

    // Verify that userService.createContext was called once
    verify(userService, times(1)).createContext(eq(testUser.getId()), any(Context.class));
  }

  @Test
  @DisplayName(
      "Should delete an existing context successfully and update attributes via UserService")
  void Given_UserAndExistingContext_When_DeleteContext_Then_ContextIsDeletedAndAttributesUpdated() {
    // Given: UserService's deleteContext returns true indicating successful deletion
    when(userService.deleteContext(testUser.getId(), testContextPersonal.getId())).thenReturn(true);

    // When: ContextService's deleteContext is called for testContextPersonal
    boolean deleted = contextService.deleteContext(testUser.getId(), testContextPersonal.getId());

    // Then: Context should be deleted
    assertTrue(deleted);

    // Verify that deleteContext on UserService was called once
    verify(userService, times(1)).deleteContext(testUser.getId(), testContextPersonal.getId());
  }

  @Test
  @DisplayName("Should return false when deleting non-existent context via UserService")
  void Given_UserAndNonExistentContext_When_DeleteContext_Then_ReturnsFalse() {
    // Given: UserService's deleteContext returns false
    when(userService.deleteContext(testUser.getId(), "ctx-nonexistent")).thenReturn(false);

    // When: ContextService's deleteContext is called for a non-existent context
    boolean deleted = contextService.deleteContext(testUser.getId(), "ctx-nonexistent");

    // Then: Returns false
    assertFalse(deleted);

    // Verify that deleteContext on UserService was called once
    verify(userService, times(1)).deleteContext(testUser.getId(), "ctx-nonexistent");
  }
}
