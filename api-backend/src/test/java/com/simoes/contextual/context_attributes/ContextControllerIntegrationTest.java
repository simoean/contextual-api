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
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for the ContextController. These tests load a full Spring context, including a
 * test MongoDB instance, and interact with the controller via MockMvc to verify API endpoint
 * behavior for user contexts. It uses UserService for managing test data to respect architectural
 * boundaries.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DisplayName("ContextController Integration Tests")
class ContextControllerIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private UserService userService;
  @Autowired private ObjectMapper objectMapper;

  private User testUser;
  private Context testContextPersonal;
  private Context testContextProfessional;

  @BeforeEach
  void setUp() {
    // Ensure clean state: delete the user created in previous test, if any.
    userService
        .findUserByUsername("context.user.int")
        .ifPresent(user -> userService.deleteUser(user.getId()));

    testContextPersonal =
        new Context("ctx-int-personal", "Personal", "Personal context description");
    testContextProfessional =
        new Context("ctx-int-professional", "Professional", "Professional context description");

    IdentityAttribute testAttributeFirstName =
        new IdentityAttribute(
            "attr-int-1",
            "user123ctx",
            "firstName",
            "ContextTester",
            true,
            new ArrayList<>(
                Arrays.asList(testContextPersonal.getId(), testContextProfessional.getId())));

    testUser =
        new User(
            "user123ctx",
            "context.user.int", // Distinct username for this test class
            "password", // Matches NoOpPasswordEncoder
            "context.user.int@example.com",
            Collections.singletonList("ROLE_USER"),
            Arrays.asList(testContextPersonal, testContextProfessional),
            Collections.singletonList(testAttributeFirstName),
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
  @DisplayName("Should return all contexts for authenticated user")
  @WithMockUser(username = "context.user.int")
  void Given_AuthenticatedUser_When_GetAllContexts_Then_ReturnListOfContexts() throws Exception {
    mockMvc
        .perform(get("/api/users/me/contexts").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].id").value(testContextPersonal.getId()))
        .andExpect(jsonPath("$[0].name").value(testContextPersonal.getName()))
        .andExpect(jsonPath("$[1].id").value(testContextProfessional.getId()))
        .andExpect(jsonPath("$[1].name").value(testContextProfessional.getName()));
  }

  @Test
  @DisplayName("Should create a new context successfully for authenticated user")
  @WithMockUser(username = "context.user.int")
  void Given_AuthenticatedUserAndNewContext_When_CreateContext_Then_ContextIsCreatedAndReturned()
      throws Exception {
    Context newContext = new Context(null, "New Integration Context", "A newly created context");

    mockMvc
        .perform(
            post("/api/users/me/contexts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newContext)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.name").value("New Integration Context"))
        .andExpect(jsonPath("$.description").value("A newly created context"));

    // Verify the context is actually saved in the database for the user via UserService
    User updatedUser = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    List<Context> contexts = updatedUser.getContexts();
    assertTrue(contexts.stream().anyMatch(c -> c.getName().equals("New Integration Context")));
    assertEquals(3, contexts.size());
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED when unauthenticated user tries to get contexts")
  void Given_UnauthenticatedUser_When_GetAllContexts_Then_ReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/api/users/me/contexts").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Should update an existing context successfully for authenticated user")
  @WithMockUser(username = "context.user.int")
  void
      Given_AuthenticatedUserAndExistingContext_When_UpdateContext_Then_ContextIsUpdatedAndReturned()
          throws Exception {
    Context updatedContext =
        new Context(
            testContextPersonal.getId(), "Updated Personal Name", "Updated personal description");

    mockMvc
        .perform(
            put("/api/users/me/contexts/{contextId}", testContextPersonal.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedContext)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(testContextPersonal.getId()))
        .andExpect(jsonPath("$.name").value("Updated Personal Name"))
        .andExpect(jsonPath("$.description").value("Updated personal description"));

    // Verify update in the database
    User userAfterUpdate = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertTrue(
        userAfterUpdate.getContexts().stream()
            .anyMatch(
                c ->
                    c.getId().equals(testContextPersonal.getId())
                        && c.getName().equals("Updated Personal Name")
                        && c.getDescription().equals("Updated personal description")));
  }

  @Test
  @DisplayName("Should return 404 NOT_FOUND when updating a non-existent context")
  @WithMockUser(username = "context.user.int")
  void Given_AuthenticatedUserAndNonExistentContext_When_UpdateContext_Then_ReturnsNotFound()
      throws Exception {
    Context nonExistentContext = new Context("non-existent-ctx", "Non Existent", "N/A");

    mockMvc
        .perform(
            put("/api/users/me/contexts/{contextId}", nonExistentContext.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nonExistentContext)))
        .andExpect(status().isNotFound());

    // Verify no changes to user's contexts in the database via UserService
    User userAfterAttempt = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(2, userAfterAttempt.getContexts().size());
  }

  @Test
  @DisplayName("Should delete an existing context successfully for authenticated user")
  @WithMockUser(username = "context.user.int")
  void
      Given_AuthenticatedUserAndExistingContext_When_DeleteContext_Then_ContextIsDeletedAndReturnsNoContent()
          throws Exception {
    mockMvc
        .perform(delete("/api/users/me/contexts/{contextId}", testContextPersonal.getId()))
        .andExpect(status().isNoContent());

    // Verify deletion in the database
    User userAfterDelete = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(1, userAfterDelete.getContexts().size());
    assertFalse(
        userAfterDelete.getContexts().stream()
            .anyMatch(c -> c.getId().equals(testContextPersonal.getId())));

    // Verify that attributes associated with this context have their contextId removed
    assertTrue(
        userAfterDelete.getAttributes().stream()
            .noneMatch(
                attr ->
                    attr.getContextIds() != null
                        && attr.getContextIds().contains(testContextPersonal.getId())));
  }

  @Test
  @DisplayName("Should return 404 NOT_FOUND when deleting a non-existent context")
  @WithMockUser(username = "context.user.int")
  void Given_AuthenticatedUserAndNonExistentContext_When_DeleteContext_Then_ReturnsNotFound()
      throws Exception {
    mockMvc
        .perform(delete("/api/users/me/contexts/{contextId}", "non-existent-ctx-delete"))
        .andExpect(status().isNotFound());

    // Verify no changes to user's contexts in the database via UserService
    User userAfterAttempt = userService.findUserByUsername(testUser.getUsername()).orElseThrow();
    assertEquals(2, userAfterAttempt.getContexts().size());
  }
}
