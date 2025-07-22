package com.simoes.contextual.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
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
 * Integration tests for the UserController. These tests load a full Spring context, including a
 * test MongoDB instance, and interact with the controller via MockMvc to verify API endpoint
 * behavior.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DisplayName("UserController Integration Tests")
class UserControllerIntegrationTest {

  // Injects MockMvc for making HTTP requests
  @Autowired private MockMvc mockMvc;

  // Injects UserRepository to setup and teardown test data in the embedded MongoDB
  @Autowired private UserRepository userRepository;

  // Test user instance used across tests
  private User testUser;

  @BeforeEach
  void setUp() {
    // Clear the database before each test to ensure a clean state
    userRepository.deleteAll();

    // Create test data
    Context testContextPersonal =
        new Context("ctx-int-1", "Personal Integration", "Personal info for integration test");
    Context testContextProfessional =
        new Context(
            "ctx-int-2", "Professional Integration", "Professional info for integration test");

    IdentityAttribute testAttributeFirstName =
        new IdentityAttribute(
            "attr-int-1",
            "user123",
            "firstName",
            "John",
            true,
            new ArrayList<>(
                Arrays.asList(testContextPersonal.getId(), testContextProfessional.getId())));
    IdentityAttribute testAttributeLastName =
        new IdentityAttribute(
            "attr-int-2",
            "user123",
            "lastName",
            "Doe",
            true,
            new ArrayList<>(Collections.singletonList(testContextPersonal.getId())));

    testUser =
        new User(
            "user123",
            "john.doe.int",
            "password",
            // (NoOpPasswordEncoder)
            "john.int@example.com",
            Collections.singletonList("ROLE_USER"),
            new ArrayList<>(Arrays.asList(testContextPersonal, testContextProfessional)),
            new ArrayList<>(Arrays.asList(testAttributeFirstName, testAttributeLastName)));

    // Save the test user into the embedded MongoDB
    userRepository.save(testUser);
  }

  @AfterEach
  void tearDown() {
    // Clean up the database after each test
    userRepository.deleteAll();
  }

  @Test
  @DisplayName("Should return authenticated user's profile successfully")
  @WithMockUser(username = "john.doe.int")
  void Given_AuthenticatedUser_When_GetMyProfile_Then_ReturnsUserDetails() throws Exception {
    // When: GET request to /api/users/me is performed
    mockMvc
        .perform(get("/api/users/me").contentType(MediaType.APPLICATION_JSON))
        // Then: Status should be OK (200)
        .andExpect(status().isOk())
        // And: JSON response should contain expected user details
        .andExpect(jsonPath("$.id").value(testUser.getId()))
        .andExpect(jsonPath("$.username").value(testUser.getUsername()))
        .andExpect(jsonPath("$.email").value(testUser.getEmail()))
        .andExpect(jsonPath("$.roles[0]").value(testUser.getRoles().get(0)))
        // Verify contexts and attributes are part of the user object (though not full verification
        // of sub-fields)
        .andExpect(jsonPath("$.contexts").isArray())
        .andExpect(jsonPath("$.attributes").isArray())
        .andExpect(jsonPath("$.contexts[0].name").value("Personal Integration"));
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED for unauthenticated user trying to get profile")
  void Given_UnauthenticatedUser_When_GetMyProfile_Then_ReturnsUnauthorized() throws Exception {
    // When: GET request to /api/users/me is performed without authentication
    mockMvc
        .perform(get("/api/users/me").contentType(MediaType.APPLICATION_JSON))
        // Then: Status should be UNAUTHORIZED (401)
        .andExpect(status().isUnauthorized());
  }
}
