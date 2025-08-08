package com.simoes.contextual.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.simoes.contextual.consent.Consent;
import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import java.util.*;
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
@DisplayName("UserService Unit Tests")
class UserServiceTest {

  // Creates a mock instance of UserRepository
  @Mock private UserRepository userRepository;

  // Injects the mocks into UserService
  @InjectMocks private UserService userService;

  // Test data for user, contexts, and attributes
  private User testUser;
  private Context testContextPersonal;
  private IdentityAttribute testAttributeFirstName;
  private Consent testConsent;

  @BeforeEach
  void setUp() {
    // Common setup for test data
    testContextPersonal = new Context("ctx-1", "Personal", "Personal info");
    Context testContextProfessional = new Context("ctx-2", "Professional", "Professional info");

    testAttributeFirstName =
        new IdentityAttribute(
            "attr-1",
            "user123",
            "firstName",
            "John",
            true,
            Arrays.asList(testContextPersonal.getId(), testContextProfessional.getId()));
    IdentityAttribute testAttributeLastName =
        new IdentityAttribute(
            "attr-2",
            "user123",
            "lastName",
            "Doe",
            true,
            Collections.singletonList(testContextPersonal.getId()));

    testConsent =
        Consent.builder()
            .id("consent-123")
            .clientId("client-app-1")
            .sharedAttributes(Arrays.asList("attr-1", "attr-2"))
            .createdAt(new Date())
            .lastUpdatedAt(new Date())
            .accessedAt(new ArrayList<>(Collections.singletonList(new java.util.Date())))
            .build();

    testUser =
        new User(
            "user123",
            "john.doe",
            "password",
            "john@example.com",
            Collections.singletonList("ROLE_USER"),
            new ArrayList<>(Arrays.asList(testContextPersonal, testContextProfessional)),
            new ArrayList<>(Arrays.asList(testAttributeFirstName, testAttributeLastName)),
            new ArrayList<>(Collections.singletonList(testConsent)));
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
    // When userRepository.deleteById is called, it returns void, so no specific mock needed beyond
    // existsById

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

  @Nested
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

  @Nested
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

  @Nested
  @DisplayName("Provisioning Operations")
  class ProvisioningOperations {

    private User newUser;

    @BeforeEach
    void setupProvisioning() {
      // A new user without contexts or attributes, as it would be before provisioning
      newUser =
          new User(
              "newUser123",
              "new.user",
              "newpass",
              "new@example.com",
              Collections.singletonList("ROLE_USER"),
              Collections.emptyList(),
              Collections.emptyList(),
              Collections.emptyList());
    }

    @Test
    @DisplayName("Should provision default contexts and attributes for a new user")
    void Given_NewUser_When_ProvisionDefaultUserData_Then_ContextsAndAttributesAreSet() {
      // Given: The userRepository will save the user after provisioning
      when(userRepository.save(any(User.class))).thenReturn(newUser);

      // When: provisionDefaultUserData is called
      userService.provisionDefaultUserData(newUser);

      // Then:
      // 1. User's contexts should not be empty and contain the expected default contexts
      assertFalse(newUser.getContexts().isEmpty());
      assertEquals(3, newUser.getContexts().size());
      assertTrue(
          newUser.getContexts().stream()
              .anyMatch(ctx -> ctx.getName().equals("Personal") && ctx.getId().startsWith("ctx-")));
      assertTrue(
          newUser.getContexts().stream()
              .anyMatch(
                  ctx -> ctx.getName().equals("Professional") && ctx.getId().startsWith("ctx-")));
      assertTrue(
          newUser.getContexts().stream()
              .anyMatch(ctx -> ctx.getName().equals("Academic") && ctx.getId().startsWith("ctx-")));

      // 2. User's attributes should not be empty and contain the expected default attributes
      assertFalse(newUser.getAttributes().isEmpty());
      assertEquals(3, newUser.getAttributes().size());
      assertTrue(
          newUser.getAttributes().stream()
              .anyMatch(
                  attr ->
                      attr.getName().equals("First Name")
                          && attr.getId().startsWith("attr-")
                          && attr.getUserId().equals(newUser.getId())));
      assertTrue(
          newUser.getAttributes().stream()
              .anyMatch(
                  attr ->
                      attr.getName().equals("Last Name")
                          && attr.getId().startsWith("attr-")
                          && attr.getUserId().equals(newUser.getId())));
      assertTrue(
          newUser.getAttributes().stream()
              .anyMatch(
                  attr ->
                      attr.getName().equals("Email")
                          && attr.getId().startsWith("attr-")
                          && attr.getUserId().equals(newUser.getId())));

      // 3. Attributes should be correctly associated with contexts
      IdentityAttribute firstNameAttr =
          newUser.getAttributes().stream()
              .filter(attr -> attr.getName().equals("First Name"))
              .findFirst()
              .orElseThrow();
      IdentityAttribute lastNameAttr =
          newUser.getAttributes().stream()
              .filter(attr -> attr.getName().equals("Last Name"))
              .findFirst()
              .orElseThrow();
      IdentityAttribute emailAttr =
          newUser.getAttributes().stream()
              .filter(attr -> attr.getName().equals("Email"))
              .findFirst()
              .orElseThrow();

      // Find the generated context IDs
      String personalCtxId =
          newUser.getContexts().stream()
              .filter(ctx -> ctx.getName().equals("Personal"))
              .findFirst()
              .orElseThrow()
              .getId();
      String professionalCtxId =
          newUser.getContexts().stream()
              .filter(ctx -> ctx.getName().equals("Professional"))
              .findFirst()
              .orElseThrow()
              .getId();
      String academicCtxId =
          newUser.getContexts().stream()
              .filter(ctx -> ctx.getName().equals("Academic"))
              .findFirst()
              .orElseThrow()
              .getId();

      assertTrue(firstNameAttr.getContextIds().contains(personalCtxId));
      assertTrue(firstNameAttr.getContextIds().contains(professionalCtxId));
      assertTrue(firstNameAttr.getContextIds().contains(academicCtxId));
      assertEquals(3, firstNameAttr.getContextIds().size());

      assertTrue(lastNameAttr.getContextIds().contains(personalCtxId));
      assertTrue(lastNameAttr.getContextIds().contains(professionalCtxId));
      assertTrue(lastNameAttr.getContextIds().contains(academicCtxId));
      assertEquals(3, lastNameAttr.getContextIds().size());

      assertTrue(emailAttr.getContextIds().contains(personalCtxId));
      assertFalse(emailAttr.getContextIds().contains(professionalCtxId));
      assertFalse(emailAttr.getContextIds().contains(academicCtxId));
      assertEquals(1, emailAttr.getContextIds().size());

      // 4. userRepository.save should be called exactly once with the modified user object
      verify(userRepository, times(1)).save(newUser);
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException if user ID is null during provisioning")
    void
        Given_NewUserWithNullId_When_ProvisionDefaultUserData_Then_ThrowsIllegalArgumentException() {
      // Given: A new user with a null ID
      User userWithNullId =
          new User(
              null,
              "invalid.user",
              "pass",
              "invalid@example.com",
              Collections.singletonList("ROLE_USER"),
              Collections.emptyList(),
              Collections.emptyList(),
              Collections.emptyList());

      // When/Then: Calling provisionDefaultUserData should throw IllegalArgumentException
      assertThrows(
          IllegalArgumentException.class,
          () -> userService.provisionDefaultUserData(userWithNullId),
          "User ID cannot be null for provisioning default data.");

      // Verify that userRepository.save was NOT called
      verify(userRepository, never()).save(any(User.class));
    }
  }

  // New Nested class for Consent operations
  @Nested
  @DisplayName("Consent Operations")
  class ConsentOperations {

    private Consent newConsent;
    private Consent existingConsent;

    @BeforeEach
    void setupConsentTests() {
      newConsent =
          Consent.builder()
              .clientId("client-app-2")
              .sharedAttributes(Arrays.asList("attr-3", "attr-4"))
              .build();
      existingConsent =
          Consent.builder()
              .clientId(testConsent.getClientId())
              .sharedAttributes(List.of("attr-1"))
              .build();
    }

    @Test
    @DisplayName("Should record a new consent successfully")
    void Given_UserAndNewClient_When_RecordConsent_Then_NewConsentIsCreated() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // When: recordConsent is called with a new client
      Optional<User> result = userService.recordConsent(testUser.getId(), newConsent);

      // Then: The user is returned, and a new consent is added
      assertTrue(result.isPresent());
      assertTrue(
          result.get().getConsents().stream()
              .anyMatch(c -> c.getClientId().equals(newConsent.getClientId())));

      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should update an existing consent successfully")
    void Given_UserAndExistingClient_When_RecordConsent_Then_ConsentIsUpdated() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // Store the last updated at for the existing consent
      Date lastUpdatedAt = testConsent.getLastUpdatedAt();

      // When: recordConsent is called with an existing client
      Optional<User> result = userService.recordConsent(testUser.getId(), existingConsent);

      // Then: The user is returned, and the existing consent is updated
      assertTrue(result.isPresent());
      Consent updatedConsent =
          result.get().getConsents().stream()
              .filter(c -> c.getClientId().equals(existingConsent.getClientId()))
              .findFirst()
              .orElseThrow();

      assertEquals(existingConsent.getSharedAttributes(), updatedConsent.getSharedAttributes());
      assertNotEquals(lastUpdatedAt, updatedConsent.getLastUpdatedAt());

      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should return empty optional when recording consent for non-existent user")
    void Given_NonExistentUser_When_RecordConsent_Then_ReturnsEmptyOptional() {
      // Given: UserRepository does not find the user
      when(userRepository.findById(anyString())).thenReturn(Optional.empty());

      // When: recordConsent is called
      Optional<User> result = userService.recordConsent("non-existent-user", newConsent);

      // Then: The optional should be empty
      assertFalse(result.isPresent());

      // Verify that save was NOT called
      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should delete an existing consent successfully")
    void Given_UserAndExistingConsent_When_DeleteConsent_Then_ReturnsTrueAndConsentIsDeleted() {
      // Given: UserRepository finds the user and saves it
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // When: deleteConsent is called
      boolean deleted = userService.revokeConsent(testUser.getId(), testConsent.getId());

      // Then: Returns true and the consent is no longer in the user's list
      assertTrue(deleted);
      assertFalse(testUser.getConsents().contains(testConsent));

      // Verify that save was called once
      verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should return false when deleting non-existent consent")
    void Given_UserAndNonExistentConsent_When_DeleteConsent_Then_ReturnsFalse() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

      // When: deleteConsent is called for a non-existent consent
      boolean deleted = userService.revokeConsent(testUser.getId(), "non-existent-id");

      // Then: Returns false
      assertFalse(deleted);

      // Verify that save was NOT called
      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should return false when deleting consent for non-existent user")
    void Given_NonExistentUser_When_DeleteConsent_Then_ReturnsFalse() {
      // Given: UserRepository does not find the user
      when(userRepository.findById(anyString())).thenReturn(Optional.empty());

      // When: deleteConsent is called
      boolean deleted = userService.revokeConsent("non-existent-user", testConsent.getId());

      // Then: Returns false
      assertFalse(deleted);

      // Verify that save was NOT called
      verify(userRepository, never()).save(any(User.class));
    }
  }

  @Nested
  @DisplayName("Consent-based Attribute Retrieval Operations")
  class ConsentAttributeRetrieval {

    private User testUserWithConsent;
    private Consent testConsent;

    @BeforeEach
    void setupConsentedAttributeTests() {
      // Setup a user with specific attributes and a single consent
      Context testContextPersonal = new Context("ctx-1", "Personal", "Personal info");
      IdentityAttribute testAttributeFirstName =
          new IdentityAttribute(
              "attr-1",
              "user123",
              "firstName",
              "John",
              true,
              Collections.singletonList(testContextPersonal.getId()));
      IdentityAttribute testAttributeLastName =
          new IdentityAttribute(
              "attr-2",
              "user123",
              "lastName",
              "Doe",
              true,
              Collections.singletonList(testContextPersonal.getId()));
      IdentityAttribute testAttributeEmail =
          new IdentityAttribute(
              "attr-3",
              "user123",
              "email",
              "john.doe@test.com",
              true,
              Collections.singletonList(testContextPersonal.getId()));

      // This consent only approves 'firstName' and 'email'
      testConsent =
          Consent.builder()
              .id("consent-123")
              .clientId("client-app-1")
              .sharedAttributes(new ArrayList<>(Arrays.asList("attr-1", "attr-3")))
              .createdAt(new Date())
              .lastUpdatedAt(new Date())
              .accessedAt(Collections.emptyList())
              .build();

      testUserWithConsent =
          new User(
              "user123",
              "john.doe",
              "password",
              "john@example.com",
              Collections.emptyList(),
              Collections.emptyList(),
              new ArrayList<>(
                  Arrays.asList(testAttributeFirstName, testAttributeLastName, testAttributeEmail)),
              Collections.singletonList(testConsent));
    }

    @Test
    @DisplayName("Should return consented attributes for a valid client")
    void Given_UserAndValidClientId_When_GetConsentedAttributes_Then_ReturnsFilteredAttributes() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUserWithConsent.getId()))
          .thenReturn(Optional.of(testUserWithConsent));

      // When: getConsentedAttributes is called
      Optional<List<IdentityAttribute>> result =
          userService.getConsentedAttributes(testUserWithConsent.getId(), "client-app-1");

      // Then: The optional should contain a list of 2 attributes ('firstName' and 'email')
      assertTrue(result.isPresent());
      assertEquals(2, result.get().size());
      assertTrue(result.get().stream().anyMatch(attr -> attr.getName().equals("firstName")));
      assertTrue(result.get().stream().anyMatch(attr -> attr.getName().equals("email")));
      assertFalse(result.get().stream().anyMatch(attr -> attr.getName().equals("lastName")));
    }

    @Test
    @DisplayName("Should return empty optional when no consent exists for the client")
    void Given_UserAndInvalidClientId_When_GetConsentedAttributes_Then_ReturnsEmptyOptional() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUserWithConsent.getId()))
          .thenReturn(Optional.of(testUserWithConsent));

      // When: getConsentedAttributes is called with a non-consented client ID
      Optional<List<IdentityAttribute>> result =
          userService.getConsentedAttributes(testUserWithConsent.getId(), "non-existent-client");

      // Then: The optional should be empty
      assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should return empty optional when user does not exist")
    void Given_NonExistentUser_When_GetConsentedAttributes_Then_ReturnsEmptyOptional() {
      // Given: UserRepository does not find the user
      when(userRepository.findById(anyString())).thenReturn(Optional.empty());

      // When: getConsentedAttributes is called
      Optional<List<IdentityAttribute>> result =
          userService.getConsentedAttributes("non-existent-id", "client-app-1");

      // Then: The optional should be empty
      assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should remove an attribute from an existing consent successfully")
    void
        Given_UserAndExistingConsentAndAttribute_When_RemoveConsentedAttribute_Then_ReturnsTrueAndUpdatesUser() {
      // Given: UserRepository finds the user and saves the updated user
      when(userRepository.findById(testUserWithConsent.getId()))
          .thenReturn(Optional.of(testUserWithConsent));
      when(userRepository.save(any(User.class))).thenReturn(testUserWithConsent);

      // When: removeConsentedAttribute is called
      boolean removed =
          userService.removeConsentedAttribute(
              testUserWithConsent.getId(), testConsent.getId(), "attr-1");

      // Then: Method should return true
      assertTrue(removed);

      // Verify that the attribute was removed from the consent
      assertFalse(testConsent.getSharedAttributes().contains("attr-1"));
      assertEquals(1, testConsent.getSharedAttributes().size());

      // Verify that userRepository.save was called exactly once
      verify(userRepository, times(1)).save(testUserWithConsent);
    }

    @Test
    @DisplayName("Should return false when removing a non-existent attribute")
    void Given_UserAndConsent_When_RemoveNonExistentAttribute_Then_ReturnsFalseAndDoesNotSave() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUserWithConsent.getId()))
          .thenReturn(Optional.of(testUserWithConsent));

      // When: removeConsentedAttribute is called for a non-existent attribute
      boolean removed =
          userService.removeConsentedAttribute(
              testUserWithConsent.getId(), testConsent.getId(), "attr-non-existent");

      // Then: Method should return false
      assertFalse(removed);

      // Verify that the user was NOT saved
      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should return false when removing attribute from non-existent consent")
    void Given_UserAndNonExistentConsent_When_RemoveConsentedAttribute_Then_ReturnsFalse() {
      // Given: UserRepository finds the user
      when(userRepository.findById(testUserWithConsent.getId()))
          .thenReturn(Optional.of(testUserWithConsent));

      // When: removeConsentedAttribute is called with a non-existent consent ID
      boolean removed =
          userService.removeConsentedAttribute(
              testUserWithConsent.getId(), "non-existent-consent-id", "attr-1");

      // Then: Method should return false
      assertFalse(removed);

      // Verify that the user was NOT saved
      verify(userRepository, never()).save(any(User.class));
    }
  }
}
