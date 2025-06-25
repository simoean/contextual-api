package com.simoes.contextual.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for the UserService. These tests focus on the business logic within the service,
 * mocking its external dependency, UserRepository.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  // Creates a mock instance of UserRepository
  @Mock private UserRepository userRepository;

  // Injects the mocks into UserService
  @InjectMocks private UserService userService;

  private User testUser;
  private Context testContextPersonal;
  private Context testContextProfessional;
  private IdentityAttribute testAttributeFirstName;
  private IdentityAttribute testAttributeLastName;

  @BeforeEach
  void setUp() {
    // Common setup for test data
    testContextPersonal = new Context("ctx-1", "Personal", "Personal info");
    testContextProfessional = new Context("ctx-2", "Professional", "Professional info");

    testAttributeFirstName =
        new IdentityAttribute(
            "attr-1",
            "user123",
            "firstName",
            "John",
            true,
            Arrays.asList(testContextPersonal.getId(), testContextProfessional.getId()));
    testAttributeLastName =
        new IdentityAttribute(
            "attr-2",
            "user123",
            "lastName",
            "Doe",
            true,
            Collections.singletonList(testContextPersonal.getId()));

    testUser =
        new User(
            "user123",
            "john.doe",
            "password",
            "john@example.com",
            Collections.singletonList("ROLE_USER"),
            new ArrayList<>(Arrays.asList(testContextPersonal, testContextProfessional)),
            new ArrayList<>(Arrays.asList(testAttributeFirstName, testAttributeLastName)));
  }

  @Test
  @DisplayName("Should find user by username successfully")
  void Given_UserExists_When_FindByUsername_Then_ReturnsUser() {
    // Given: UserRepository returns an Optional containing the user
    when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));

    // When: UserService's findUserByUsername is called
    Optional<User> foundUser = userService.findUserByUsername(testUser.getUsername());

    // Then: User should be found
    assertTrue(foundUser.isPresent());
    assertEquals(testUser.getUsername(), foundUser.get().getUsername());

    // Verify that findByUsername was called once
    verify(userRepository, times(1)).findByUsername(testUser.getUsername());
  }

  @Test
  @DisplayName("Should return empty Optional when user not found by username")
  void Given_UserDoesNotExist_When_FindByUsername_Then_ReturnsEmptyOptional() {
    // Given: UserRepository returns an empty Optional
    when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());

    // When: UserService's findUserByUsername is called
    Optional<User> foundUser = userService.findUserByUsername("nonexistent");

    // Then: Optional should be empty
    assertFalse(foundUser.isPresent());

    // Verify that findByUsername was called once
    verify(userRepository, times(1)).findByUsername(anyString());
  }

  @Test
  @DisplayName("Should find user by ID successfully")
  void Given_UserExists_When_FindById_Then_ReturnsUser() {
    // Given: UserRepository returns an Optional containing the user
    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

    // When: UserService's findUserById is called
    Optional<User> foundUser = userService.findUserById(testUser.getId());

    // Then: User should be found
    assertTrue(foundUser.isPresent());
    assertEquals(testUser.getId(), foundUser.get().getId());

    // Verify that findById was called once
    verify(userRepository, times(1)).findById(testUser.getId());
  }

  @Test
  @DisplayName("Should return empty Optional when user not found by ID")
  void Given_UserDoesNotExist_When_FindById_Then_ReturnsEmptyOptional() {
    // Given: UserRepository returns an empty Optional
    when(userRepository.findById(anyString())).thenReturn(Optional.empty());

    // When: UserService's findUserById is called
    Optional<User> foundUser = userService.findUserById("nonexistentId");

    // Then: Optional should be empty
    assertFalse(foundUser.isPresent());

    // Verify that findById was called once
    verify(userRepository, times(1)).findById(anyString());
  }

  @Test
  @DisplayName("Should save a user successfully")
  void Given_NewUser_When_SaveUser_Then_UserIsSaved() {
    // Given: UserRepository returns the saved user
    when(userRepository.save(any(User.class))).thenReturn(testUser);

    // When: UserService's saveUser is called
    User savedUser = userService.saveUser(testUser);

    // Then: User should be returned
    assertNotNull(savedUser);
    assertEquals(testUser.getUsername(), savedUser.getUsername());

    // Verify that save was called once
    verify(userRepository, times(1)).save(testUser);
  }

  @Test
  @DisplayName("Should delete a user successfully when user exists")
  void Given_UserExists_When_DeleteUser_Then_ReturnsTrueAndDeletesUser() {
    // Given: UserRepository indicates the user exists
    when(userRepository.existsById(testUser.getId())).thenReturn(true);
    // When userRepository.deleteById is called, it returns void, so no specific mock needed beyond existsById

    // When: UserService's deleteUser is called
    boolean deleted = userService.deleteUser(testUser.getId());

    // Then: Method should return true
    assertTrue(deleted);

    // Verify that existsById was called once
    verify(userRepository, times(1)).existsById(testUser.getId());
    // Verify that deleteById was called once
    verify(userRepository, times(1)).deleteById(testUser.getId());
  }

  @Test
  @DisplayName("Should return false when attempting to delete a non-existent user")
  void Given_UserDoesNotExist_When_DeleteUser_Then_ReturnsFalseAndDoesNotDelete() {
    // Given: UserRepository indicates the user does not exist
    when(userRepository.existsById(anyString())).thenReturn(false);

    // When: UserService's deleteUser is called
    boolean deleted = userService.deleteUser("nonExistentId");

    // Then: Method should return false
    assertFalse(deleted);

    // Verify that existsById was called once
    verify(userRepository, times(1)).existsById(anyString());
    // Verify that deleteById was NOT called
    verify(userRepository, never()).deleteById(anyString());
  }

  @Nested // NEW: Nested class for Context CRUD Operations
  @DisplayName("Context CRUD Operations")
  class ContextCrudOperations {

    @Test
    @DisplayName("Should update an existing context successfully")
    void Given_UserAndExistingContext_When_UpdateContext_Then_ContextIsUpdated() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      Context updatedContext =
          new Context(testContextPersonal.getId(), "Updated Personal", "New description");

      // When: UserService's updateContext is called
      Optional<Context> result =
          userService.updateContext(testUser.getId(), testContextPersonal.getId(), updatedContext);

      // Then: Context should be updated and returned
      assertTrue(result.isPresent());
      assertEquals("Updated Personal", result.get().getName());
      assertEquals("New description", result.get().getDescription());

      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should return empty Optional when updating non-existent context")
    void Given_UserAndNonExistentContext_When_UpdateContext_Then_ReturnsEmptyOptional() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

      Context nonExistentContext = new Context("ctx-nonexistent", "Non Existent", "");

      // When: UserService's updateContext is called
      Optional<Context> result =
          userService.updateContext(
              testUser.getId(), nonExistentContext.getId(), nonExistentContext);

      // Then: Optional should be empty
      assertFalse(result.isPresent());

      // Verify that save was NOT called
      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should create a new context successfully")
    void Given_User_When_CreateContext_Then_ContextIsCreated() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      Context newContext = new Context(null, "New Context", "Description of new context");

      // When: UserService's createContext is called
      Optional<Context> result = userService.createContext(testUser.getId(), newContext);

      // Then: New context should be returned with a generated ID
      assertTrue(result.isPresent());
      assertNotNull(result.get().getId());
      assertTrue(result.get().getId().startsWith("ctx-"));
      assertEquals("New Context", result.get().getName());

      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
      // Verify that the new context was added to the user's contexts
      assertTrue(testUser.getContexts().contains(result.get()));
    }

    @Test
    @DisplayName("Should delete an existing context successfully and update attributes")
    void
        Given_UserAndExistingContext_When_DeleteContext_Then_ContextIsDeletedAndAttributesUpdated() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // Attribute 1 is linked to testContextPersonal
      assertTrue(
          testUser.getAttributes().stream()
              .anyMatch(
                  attr ->
                      attr.getId().equals(testAttributeFirstName.getId())
                          && attr.getContextIds().contains(testContextPersonal.getId())));

      // When: UserService's deleteContext is called for testContextPersonal
      boolean deleted = userService.deleteContext(testUser.getId(), testContextPersonal.getId());

      // Then: Context should be deleted
      assertTrue(deleted);

      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
      // Verify context is removed from user's list
      assertFalse(testUser.getContexts().contains(testContextPersonal));
      // Verify attribute that was linked to the deleted context has its contextId removed
      assertFalse(
          testUser.getAttributes().stream()
              .anyMatch(
                  attr ->
                      attr.getId().equals(testAttributeFirstName.getId())
                          && attr.getContextIds().contains(testContextPersonal.getId())));
    }

    @Test
    @DisplayName("Should return false when deleting non-existent context")
    void Given_UserAndNonExistentContext_When_DeleteContext_Then_ReturnsFalse() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

      // When: UserService's deleteContext is called for a non-existent context
      boolean deleted = userService.deleteContext(testUser.getId(), "ctx-nonexistent");

      // Then: Returns false
      assertFalse(deleted);

      // Verify that save was NOT called
      verify(userRepository, never()).save(any(User.class));
    }
  }

  @Nested // NEW: Nested class for Attribute CRUD Operations
  @DisplayName("Attribute CRUD Operations")
  class AttributeCrudOperations {

    @Test
    @DisplayName("Should create a new attribute successfully")
    void Given_User_When_CreateAttribute_Then_AttributeIsCreated() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      IdentityAttribute newAttribute =
          new IdentityAttribute(null, null, "newAttr", "value", true, null);

      // When: UserService's createAttribute is called
      Optional<IdentityAttribute> result =
          userService.createAttribute(testUser.getId(), newAttribute);

      // Then: New attribute should be returned with a generated ID
      assertTrue(result.isPresent());
      assertNotNull(result.get().getId());
      assertTrue(result.get().getId().startsWith("attr-"));
      assertEquals("newAttr", result.get().getName());

      // Verify that userId is set correctly
      assertEquals(testUser.getId(), result.get().getUserId());
      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
      // Verify that the new attribute was added to the user's attributes
      assertTrue(testUser.getAttributes().contains(result.get()));
    }

    @Test
    @DisplayName("Should update an existing attribute successfully")
    void Given_UserAndExistingAttribute_When_UpdateAttribute_Then_AttributeIsUpdated() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      IdentityAttribute updatedAttribute =
          new IdentityAttribute(
              testAttributeFirstName.getId(),
              testUser.getId(),
              "Updated Name",
              "Updated Value",
              false,
              Collections.emptyList());

      // When: UserService's updateAttribute is called
      Optional<IdentityAttribute> result =
          userService.updateAttribute(
              testUser.getId(), testAttributeFirstName.getId(), updatedAttribute);

      // Then: Attribute should be updated and returned
      assertTrue(result.isPresent());
      assertEquals("Updated Name", result.get().getName());
      assertEquals("Updated Value", result.get().getValue());
      assertFalse(result.get().isVisible());

      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should return empty Optional when updating non-existent attribute")
    void Given_UserAndNonExistentAttribute_When_UpdateAttribute_Then_ReturnsEmptyOptional() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

      IdentityAttribute nonExistentAttribute =
          new IdentityAttribute(
              "attr-nonexistent", testUser.getId(), "nonexistent", "value", true, null);

      // When: UserService's updateAttribute is called
      Optional<IdentityAttribute> result =
          userService.updateAttribute(
              testUser.getId(), nonExistentAttribute.getId(), nonExistentAttribute);

      // Then: Optional should be empty
      assertFalse(result.isPresent());

      // Verify that save was NOT called
      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should delete an existing attribute successfully")
    void Given_UserAndExistingAttribute_When_DeleteAttribute_Then_AttributeIsDeleted() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // When: UserService's deleteAttribute is called for testAttributeFirstName
      boolean deleted =
          userService.deleteAttribute(testUser.getId(), testAttributeFirstName.getId());

      // Then: Attribute should be deleted
      assertTrue(deleted);

      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
      // Verify attribute is removed from user's list
      assertFalse(testUser.getAttributes().contains(testAttributeFirstName));
    }

    @Test
    @DisplayName("Should return false when deleting non-existent attribute")
    void Given_UserAndNonExistentAttribute_When_DeleteAttribute_Then_ReturnsFalse() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

      // When: UserService's deleteAttribute is called for a non-existent attribute
      boolean deleted = userService.deleteAttribute(testUser.getId(), "attr-nonexistent");

      // Then: Returns false
      assertFalse(deleted);

      // Verify that save was NOT called
      verify(userRepository, never()).save(any(User.class));
    }
  }
}
