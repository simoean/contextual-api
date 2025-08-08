package com.simoes.contextual.consent;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import java.util.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for the ConsentController. These tests load a full Spring context, including a
 * test MongoDB instance, and interact with the controller via MockMvc to verify API endpoint
 * behavior for user consents. It uses UserService for managing test data to respect architectural
 * boundaries.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc
@DisplayName("ConsentController Integration Tests")
class ConsentControllerIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private UserService userService;
  @Autowired private ObjectMapper objectMapper;

  private User testUser;
  private Consent testConsent;

  @BeforeEach
  void setUp() {
    // Clean up any existing user data to ensure test isolation
    userService
        .findUserByUsername("consent.user.int")
        .ifPresent(user -> userService.deleteUser(user.getId()));

    testConsent =
        Consent.builder()
            .id("consent-int-1")
            .clientId("client-app-int")
            .sharedAttributes(Arrays.asList("attr-1", "attr-2"))
            .createdAt(new Date())
            .accessedAt(new ArrayList<>(List.of(new Date())))
            .build();

    testUser =
        new User(
            "user123con",
            "consent.user.int", // Distinct username for this test class
            "password",
            "consent.user.int@example.com",
            Collections.singletonList("ROLE_USER"),
            Collections.emptyList(),
            Collections.emptyList(),
            new ArrayList<>(List.of(testConsent)));

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
  @DisplayName("Should return all consents for authenticated user")
  @WithMockUser(username = "consent.user.int")
  void Given_AuthenticatedUser_When_GetAllConsents_Then_ReturnListOfConsents() throws Exception {
    mockMvc
        .perform(get("/api/users/me/consents").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].clientId").value(testConsent.getClientId()));
  }

  @Test
  @DisplayName("Should create a new consent successfully for authenticated user")
  @WithMockUser(username = "consent.user.int")
  void Given_AuthenticatedUserAndNewConsent_When_CreateConsent_Then_ConsentIsCreatedAndReturned()
      throws Exception {
    Consent newConsent =
        Consent.builder().clientId("client-app-new").sharedAttributes(List.of("attr-3")).build();

    mockMvc
        .perform(
            post("/api/users/me/consents")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newConsent)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.consents").isArray())
        .andExpect(jsonPath("$.consents.length()").value(2))
        .andExpect(jsonPath("$.consents[1].clientId").value("client-app-new"))
        .andExpect(jsonPath("$.consents[1].sharedAttributes.length()").value(1));

    // Verify the consent is actually saved in the database for the user
    User updatedUser = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    List<Consent> consents = updatedUser.getConsents();
    assertTrue(consents.stream().anyMatch(c -> c.getClientId().equals("client-app-new")));
    assertEquals(2, consents.size());
  }

  @Test
  @DisplayName("Should update an existing consent when a new one is recorded for the same client")
  @WithMockUser(username = "consent.user.int")
  void Given_AuthenticatedUser_When_RecordExistingConsent_Then_ConsentIsUpdated() throws Exception {
    // Initial number of attributes and timestamps
    User initialUser = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    Date lastUpdatedAt = initialUser.getConsents().get(0).getLastUpdatedAt();

    // Create an "updated" consent for the same client ID
    Consent updatedConsent =
        Consent.builder()
            .clientId(testConsent.getClientId())
            .sharedAttributes(Arrays.asList("attr-1", "attr-4"))
            .build();

    mockMvc
        .perform(
            post("/api/users/me/consents")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedConsent)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.consents").isArray())
        .andExpect(jsonPath("$.consents.length()").value(1))
        .andExpect(jsonPath("$.consents[0].clientId").value(testConsent.getClientId()));

    // Verify the consent is updated in the database
    User userAfterUpdate = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    Consent savedConsent = userAfterUpdate.getConsents().get(0);
    assertEquals(2, savedConsent.getSharedAttributes().size());
    assertTrue(savedConsent.getSharedAttributes().contains("attr-4"));
    assertNotEquals(lastUpdatedAt, savedConsent.getLastUpdatedAt());
  }

  @Test
  @DisplayName("Should delete an existing consent successfully for authenticated user")
  @WithMockUser(username = "consent.user.int")
  void Given_AuthenticatedUserAndExistingConsent_When_DeleteConsent_Then_ConsentIsDeleted()
      throws Exception {
    mockMvc
        .perform(delete("/api/users/me/consents/{consentId}", testConsent.getId()))
        .andExpect(status().isNoContent());

    // Verify deletion in the database
    User userAfterDelete = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertTrue(userAfterDelete.getConsents().isEmpty());
  }

  @Test
  @DisplayName("Should return 404 NOT_FOUND when deleting a non-existent consent")
  @WithMockUser(username = "consent.user.int")
  void Given_AuthenticatedUserAndNonExistentConsent_When_DeleteConsent_Then_ReturnsNotFound()
      throws Exception {
    mockMvc
        .perform(delete("/api/users/me/consents/{consentId}", "non-existent-consent-id"))
        .andExpect(status().isNotFound());

    // Verify no changes to user's consents in the database
    User userAfterAttempt = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(1, userAfterAttempt.getConsents().size());
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED when unauthenticated user tries to access consents")
  void Given_UnauthenticatedUser_When_AccessingConsentEndpoints_Then_ReturnsUnauthorized()
      throws Exception {
    // Test GET endpoint
    mockMvc.perform(get("/api/users/me/consents")).andExpect(status().isUnauthorized());

    // Test POST endpoint
    mockMvc.perform(post("/api/users/me/consents")).andExpect(status().isUnauthorized());

    // Test DELETE endpoint
    mockMvc
        .perform(delete("/api/users/me/consents/{consentId}", "any-id"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Should remove an attribute from an existing consent and return NO_CONTENT")
  @WithMockUser(username = "consent.user.int")
  void
      Given_AuthenticatedUserAndExistingAttribute_When_RemoveAttributeFromConsent_Then_AttributeIsRemovedAndReturnsNoContent()
          throws Exception {
    // Add another attribute to the consent for this test
    User userForTest = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    userForTest.getConsents().get(0).getSharedAttributes().add("attr-3");
    userService.saveUser(userForTest);

    // Initial check: consent has two attributes
    User userBeforeDelete = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(3, userBeforeDelete.getConsents().get(0).getSharedAttributes().size());

    mockMvc
        .perform(
            delete(
                "/api/users/me/consents/{consentId}/attributes/{attributeId}",
                testConsent.getId(),
                "attr-2"))
        .andExpect(status().isNoContent());

    // Verify deletion in the database
    User userAfterDelete = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    List<String> remainingAttributes = userAfterDelete.getConsents().get(0).getSharedAttributes();
    assertEquals(2, remainingAttributes.size());
    assertFalse(remainingAttributes.contains("attr-2"));
    assertTrue(remainingAttributes.contains("attr-3"));
  }

  @Test
  @DisplayName("Should return 404 NOT_FOUND when removing a non-existent attribute")
  @WithMockUser(username = "consent.user.int")
  void
      Given_AuthenticatedUserAndNonExistentAttribute_When_RemoveAttributeFromConsent_Then_ReturnsNotFound()
          throws Exception {
    mockMvc
        .perform(
            delete(
                "/api/users/me/consents/{consentId}/attributes/{attributeId}",
                testConsent.getId(),
                "non-existent-attr"))
        .andExpect(status().isNotFound());

    // Verify no changes to user's consents in the database
    User userAfterAttempt = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(1, userAfterAttempt.getConsents().size());
    assertEquals(2, userAfterAttempt.getConsents().get(0).getSharedAttributes().size());
  }

  @Test
  @DisplayName("Should return 404 NOT_FOUND when removing attribute from non-existent consent")
  @WithMockUser(username = "consent.user.int")
  void
      Given_AuthenticatedUserAndNonExistentConsent_When_RemoveAttributeFromConsent_Then_ReturnsNotFound()
          throws Exception {
    mockMvc
        .perform(
            delete(
                "/api/users/me/consents/{consentId}/attributes/{attributeId}",
                "non-existent-id",
                "attr-1"))
        .andExpect(status().isNotFound());

    // Verify no changes to user's consents in the database
    User userAfterAttempt = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(1, userAfterAttempt.getConsents().size());
    assertEquals(2, userAfterAttempt.getConsents().get(0).getSharedAttributes().size());
  }
}
