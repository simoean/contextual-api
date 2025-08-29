package com.simoes.contextual.connection;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for the ConnectionService. These tests focus on the business logic within the service,
 * mocking its external dependency, UserService.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConnectionService Unit Tests")
class ConnectionServiceTest {

  // Creates a mock instance of UserService
  @Mock private UserService userService;

  // Injects the mocks into ConnectionService
  @InjectMocks private ConnectionService connectionService;

  private final String USER_ID = "user123";
  private final String PROVIDER_ID = "google";
  private final String PROVIDER_USER_ID = "prov-user-id-456";
  private final String CONTEXT_ID = "ctx-personal";
  private final String ACCESS_TOKEN = "mock-access-token";

  @BeforeEach
  void setUp() {
    User testUser = new User();
    testUser.setId(USER_ID);
    testUser.setUsername("testuser");

    Connection testConnection = Connection.builder()
            .providerId(PROVIDER_ID)
            .contextId(CONTEXT_ID)
            .providerAccessToken(ACCESS_TOKEN)
            .build();
  }

  @Test
  @DisplayName("Should save a new connection by delegating to UserService")
  void Given_ValidConnection_When_SaveConnectionForUser_Then_DelegatesToUserService() {
    // When: saveConnectionForUser is called
    connectionService.saveConnectionForUser(
            USER_ID, PROVIDER_ID, PROVIDER_USER_ID, CONTEXT_ID, ACCESS_TOKEN);

    // Then: The userService.saveConnection method should be called once with the correct parameters
    verify(userService, times(1)).saveConnection(eq(USER_ID), any(Connection.class));
  }

  @Test
  @DisplayName("Should delete a connection by delegating to UserService")
  void Given_ValidProviderId_When_DeleteConnectionForUser_Then_DelegatesToUserService() {
    // When: deleteConnectionForUser is called
    connectionService.deleteConnectionForUser(USER_ID, PROVIDER_ID);

    // Then: The userService.deleteConnection method should be called once with the correct parameters
    verify(userService, times(1)).deleteConnection(eq(USER_ID), eq(PROVIDER_ID));
  }
}
