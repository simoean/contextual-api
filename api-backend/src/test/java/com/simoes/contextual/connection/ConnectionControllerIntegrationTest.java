package com.simoes.contextual.connection;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.simoes.contextual.user.User;
import com.simoes.contextual.util.UserUtil;
import java.time.Instant;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for the ConnectionController. These tests simulate HTTP requests to the
 * controller's endpoints and verify their behavior, using Mockito to mock the service layer.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc
@DisplayName("ConnectionController Integration Tests")
class ConnectionControllerIntegrationTest {

  private final String TESTUSER = "testuser";
  private final String CONNECTION_ID = "conn-id-123";
  private final String MOCK_USER_ID = "test-user-id";
  private final String MOCK_CONTEXT_ID = "ctx-personal";
  private final String MOCK_PROVIDER_ID = "google";
  private final String MOCK_ACCESS_TOKEN = "mock-access-token";

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @MockBean private ConnectionService connectionService;
  @MockBean private UserUtil userUtil;

  private User testUser;
  private ConnectionController.ConnectionRequest connectionRequest;


  @BeforeEach
  void setUp() {
    testUser = new User();
    testUser.setId(MOCK_USER_ID);
    testUser.setUsername(TESTUSER);
    testUser.setConnections(Collections.emptyList());

    connectionRequest =
        new ConnectionController.ConnectionRequest(
            MOCK_PROVIDER_ID, MOCK_USER_ID, MOCK_CONTEXT_ID, MOCK_ACCESS_TOKEN);

    // Mock the UserUtil to return our test user
    when(userUtil.getAuthenticatedUserId()).thenReturn(MOCK_USER_ID);
    when(userUtil.getAuthenticatedUser()).thenReturn(testUser);
  }

  @Test
  @DisplayName("Should return a list of connections for the authenticated user")
  @WithMockUser(username = TESTUSER)
  void Given_AuthenticatedUser_When_GetConnections_Then_ReturnListOfConnections() throws Exception {
    // Arrange: Mock the service to return a list of connections
    when(userUtil.getAuthenticatedUser())
        .thenReturn(
            testUser.withConnections(
                Collections.singletonList(
                    new Connection(CONNECTION_ID, MOCK_PROVIDER_ID, MOCK_USER_ID, MOCK_CONTEXT_ID, MOCK_ACCESS_TOKEN, Instant.now()))));

    // When: A GET request is made to the connections endpoint
    mockMvc
        .perform(get("/api/v1/users/me/connections").contentType(MediaType.APPLICATION_JSON))
        // Then: Status should be OK (200) and the response should be an array
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].providerId").value(MOCK_PROVIDER_ID));
  }

  @Test
  @DisplayName("Should save a new connection and return 200 OK")
  @WithMockUser(username = TESTUSER)
  void Given_AuthenticatedUserAndValidRequest_When_SaveConnection_Then_ReturnOk() throws Exception {
    // When: A POST request is made to save a new connection
    mockMvc
        .perform(
            post("/api/v1/users/me/connections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(connectionRequest)))
        // Then: Status should be OK (200)
        .andExpect(status().isOk())
        .andExpect(content().string("Connection saved successfully."));

    // Verify that the service was called once with the correct parameters
    verify(connectionService, times(1))
        .saveConnectionForUser(
            TESTUSER,
            connectionRequest.getProviderId(),
            connectionRequest.getProviderUserId(),
            connectionRequest.getContextId(),
            connectionRequest.getProviderAccessToken());
  }

  @Test
  @DisplayName("Should delete a connection and return 200 OK")
  @WithMockUser(username = TESTUSER)
  void Given_AuthenticatedUserAndProviderId_When_DeleteConnection_Then_ReturnOk() throws Exception {
    // When: A DELETE request is made to the connections endpoint
    mockMvc
        .perform(delete("/api/v1/users/me/connections/{providerId}", MOCK_PROVIDER_ID))
        // Then: Status should be OK (200)
        .andExpect(status().isOk())
        .andExpect(content().string("Connection deleted successfully."));

    // Verify that the service was called once with the correct parameters
    verify(connectionService, times(1)).deleteConnectionForUser(TESTUSER, MOCK_PROVIDER_ID);
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED for unauthenticated user on GET request")
  void Given_UnauthenticatedUser_When_GetConnections_Then_ReturnsUnauthorized() throws Exception {
    // When: A GET request is made without authentication
    mockMvc
        .perform(get("/api/v1/users/me/connections"))
        // Then: Status should be UNAUTHORIZED (401)
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED for unauthenticated user on POST request")
  void Given_UnauthenticatedUser_When_SaveConnection_Then_ReturnsUnauthorized() throws Exception {
    // When: A POST request is made without authentication
    mockMvc
        .perform(
            post("/api/v1/users/me/connections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(connectionRequest)))
        // Then: Status should be UNAUTHORIZED (401)
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED for unauthenticated user on DELETE request")
  void Given_UnauthenticatedUser_When_DeleteConnection_Then_ReturnsUnauthorized() throws Exception {
    // When: A DELETE request is made without authentication
    mockMvc
        .perform(delete("/api/v1/users/me/connections/{providerId}", MOCK_PROVIDER_ID))
        // Then: Status should be UNAUTHORIZED (401)
        .andExpect(status().isUnauthorized());
  }
}
