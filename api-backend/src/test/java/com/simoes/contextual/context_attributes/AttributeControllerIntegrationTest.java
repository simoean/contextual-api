package com.simoes.contextual.context_attributes;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for the AttributeController. These tests load a full Spring context, including
 * a test MongoDB instance, and interact with the controller via MockMvc to verify API endpoint
 * behavior for user identity attributes. It uses UserService for managing test data to respect
 * architectural boundaries.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc
@DisplayName("AttributeController Integration Tests")
class AttributeControllerIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private UserService userService;
  @Autowired private ObjectMapper objectMapper;

  private User testUser;
  private Context testContextGeneral;
  private Context testContextSpecific;
  private IdentityAttribute attrEmailVisibleGeneral;
  private IdentityAttribute attrPhoneVisibleSpecific;
  private IdentityAttribute attrAddressHiddenGeneral;

  @BeforeEach
  void setUp() {
    // Ensure clean state: delete the user created in previous test, if any.
    userService
        .findUserByUsername("attribute.user.int")
        .ifPresent(user -> userService.deleteUser(user.getId()));

    testContextGeneral = new Context("ctx-general", "General", "General use context");
    testContextSpecific = new Context("ctx-specific", "Specific", "Specific use context");

    attrEmailVisibleGeneral =
        new IdentityAttribute(
            "attr-email",
            "user123attr",
            "email",
            "attr.tester@example.com",
            true,
            new ArrayList<>(Collections.singletonList(testContextGeneral.getId())));
    attrPhoneVisibleSpecific =
        new IdentityAttribute(
            "attr-phone",
            "user123attr",
            "phone",
            "123-456-7890",
            true,
            new ArrayList<>(Collections.singletonList(testContextSpecific.getId())));
    attrAddressHiddenGeneral =
        new IdentityAttribute(
            "attr-address",
            "user123attr",
            "address",
            "123 Test St",
            false, // Not visible
            new ArrayList<>(Collections.singletonList(testContextGeneral.getId())));

    testUser =
        new User(
            "user123attr",
            "attribute.user.int", // Distinct username
            "password", // Matches NoOpPasswordEncoder
            "attribute.user.int@example.com",
            Collections.singletonList("ROLE_USER"),
            Arrays.asList(testContextGeneral, testContextSpecific),
            Arrays.asList(
                    attrEmailVisibleGeneral, attrPhoneVisibleSpecific, attrAddressHiddenGeneral),
            Collections.emptyList(),
            Collections.emptyList());

    userService.saveUser(testUser);
  }

  @AfterEach
  void tearDown() {
    // Clean up state: delete the user created in this test.
    userService
        .findUserByUsername(testUser.getUsername())
        .ifPresent(user -> userService.deleteUser(user.getId()));
  }

  @Test
  @DisplayName("Should return all attributes for authenticated user")
  @WithMockUser(username = "attribute.user.int")
  void Given_AuthenticatedUser_When_GetAllAttributes_Then_ReturnListOfAttributes()
      throws Exception {
    mockMvc
        .perform(get("/api/users/me/attributes").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(3))
        .andExpect(
            jsonPath("$[?(@.name == 'email')].value").value(attrEmailVisibleGeneral.getValue()))
        .andExpect(
            jsonPath("$[?(@.name == 'phone')].value").value(attrPhoneVisibleSpecific.getValue()))
        .andExpect(
            jsonPath("$[?(@.name == 'address')].value").value(attrAddressHiddenGeneral.getValue()));
  }

  @Test
  @DisplayName("Should return visible attributes for a specific context")
  @WithMockUser(username = "attribute.user.int")
  void Given_AuthenticatedUser_When_GetContextualAttributes_Then_ReturnsFilteredVisibleAttributes()
      throws Exception {
    mockMvc
        .perform(
            get("/api/users/me/attributes/{contextId}", testContextGeneral.getId())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].name").value("email"))
        .andExpect(jsonPath("$[0].value").value(attrEmailVisibleGeneral.getValue()))
        .andExpect(jsonPath("$[0].visible").value(true));
  }

  @Test
  @DisplayName("Should return an empty list if no visible attributes for a specific context")
  @WithMockUser(username = "attribute.user.int")
  void
      Given_AuthenticatedUserAndNoVisibleAttributesForContext_When_GetContextualAttributes_Then_ReturnsEmptyList()
          throws Exception {
    // Using a context ID that exists but has no *visible* attributes, or no attributes
    Context emptyContext = new Context("ctx-empty", "Empty", "Context with no attributes");
    User currentUser = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    userService.createContext(currentUser.getId(), emptyContext);

    mockMvc
        .perform(
            get("/api/users/me/attributes/{contextId}", emptyContext.getId())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  @DisplayName("Should create a new attribute successfully for authenticated user")
  @WithMockUser(username = "attribute.user.int")
  void
      Given_AuthenticatedUserAndNewAttribute_When_CreateAttribute_Then_AttributeIsCreatedAndReturned()
          throws Exception {
    IdentityAttribute newAttribute =
        new IdentityAttribute(null, null, "newAttr", "newValue", true, Collections.emptyList());

    mockMvc
        .perform(
            post("/api/users/me/attributes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newAttribute)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.userId").value(testUser.getId()))
        .andExpect(jsonPath("$.name").value("newAttr"))
        .andExpect(jsonPath("$.value").value("newValue"))
        .andExpect(jsonPath("$.visible").value(true));

    // Verify the attribute is actually saved in the database for the user via UserService
    User updatedUser = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    List<IdentityAttribute> attributes = updatedUser.getAttributes();
    assertTrue(attributes.stream().anyMatch(a -> a.getName().equals("newAttr")));
    assertEquals(4, attributes.size()); // Original 3 + new 1
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED when unauthenticated user tries to get attributes")
  void Given_UnauthenticatedUser_When_GetAllAttributes_Then_ReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/api/users/me/attributes").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Should update an existing attribute successfully for authenticated user")
  @WithMockUser(username = "attribute.user.int")
  void
      Given_AuthenticatedUserAndExistingAttribute_When_UpdateAttribute_Then_AttributeIsUpdatedAndReturned()
          throws Exception {
    IdentityAttribute updatedAttribute =
        new IdentityAttribute(
            attrEmailVisibleGeneral.getId(),
            testUser.getId(),
            "updatedEmail",
            "updated@example.com",
            false,
            Collections.singletonList(testContextSpecific.getId()));

    mockMvc
        .perform(
            put("/api/users/me/attributes/{attributeId}", attrEmailVisibleGeneral.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedAttribute)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(attrEmailVisibleGeneral.getId()))
        .andExpect(jsonPath("$.name").value("updatedEmail"))
        .andExpect(jsonPath("$.value").value("updated@example.com"))
        .andExpect(jsonPath("$.visible").value(false))
        .andExpect(jsonPath("$.contextIds[0]").value(testContextSpecific.getId()));

    // Verify update in the database
    User userAfterUpdate = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertTrue(
        userAfterUpdate.getAttributes().stream()
            .anyMatch(
                a ->
                    a.getId().equals(attrEmailVisibleGeneral.getId())
                        && a.getName().equals("updatedEmail")
                        && a.getValue().equals("updated@example.com")
                        && !a.isVisible()
                        && a.getContextIds().contains(testContextSpecific.getId())));
  }

  @Test
  @DisplayName("Should return 404 NOT_FOUND when updating a non-existent attribute")
  @WithMockUser(username = "attribute.user.int")
  void Given_AuthenticatedUserAndNonExistentAttribute_When_UpdateAttribute_Then_ReturnsNotFound()
      throws Exception {
    IdentityAttribute nonExistentAttribute =
        new IdentityAttribute(
            "non-existent-attr", testUser.getId(), "nonExisting", "value", true, null);

    mockMvc
        .perform(
            put("/api/users/me/attributes/{attributeId}", nonExistentAttribute.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nonExistentAttribute)))
        .andExpect(status().isNotFound());

    // Verify no changes to user's attributes in the database
    User userAfterAttempt = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(3, userAfterAttempt.getAttributes().size());
  }

  @Test
  @DisplayName("Should delete an existing attribute successfully for authenticated user")
  @WithMockUser(username = "attribute.user.int")
  void
      Given_AuthenticatedUserAndExistingAttribute_When_DeleteAttribute_Then_AttributeIsDeletedAndReturnsNoContent()
          throws Exception {
    mockMvc
        .perform(delete("/api/users/me/attributes/{attributeId}", attrEmailVisibleGeneral.getId()))
        .andExpect(status().isNoContent());

    // Verify deletion in the database
    User userAfterDelete = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(
        2, userAfterDelete.getAttributes().size());
    assertFalse(
        userAfterDelete.getAttributes().stream()
            .anyMatch(a -> a.getId().equals(attrEmailVisibleGeneral.getId())));
  }

  @Test
  @DisplayName("Should return 404 NOT_FOUND when deleting a non-existent attribute")
  @WithMockUser(username = "attribute.user.int")
  void Given_AuthenticatedUserAndNonExistentAttribute_When_DeleteAttribute_Then_ReturnsNotFound()
      throws Exception {
    mockMvc
        .perform(delete("/api/users/me/attributes/{attributeId}", "non-existent-attr-delete"))
        .andExpect(status().isNotFound());

    // Verify no changes to user's attributes in the database
    User userAfterAttempt = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(3, userAfterAttempt.getAttributes().size());
  }
}
