package com.simoes.contextual.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Unit tests for the AuthController. These tests focus on the business logic within the controller,
 * mocking its external dependencies like AuthenticationManager and UserService.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

  // Creates a mock instance of AuthenticationManager
  @Mock private AuthenticationManager authenticationManager;

  // Creates a mock instance of UserService
  @Mock private UserService userService;

  // Injects the mocks into AuthController
  @InjectMocks private AuthController authController;

  // Mock for SecurityContextHolder
  @Mock private SecurityContext securityContext;

  private LoginRequest testLoginRequest;
  private User testUser;
  private Authentication authenticatedAuth;

  @BeforeEach
  void setUp() {
    // Reset SecurityContextHolder before each test to prevent side effects
    SecurityContextHolder.clearContext();

    // Common setup for test data
    testLoginRequest = new LoginRequest("testuser", "testpassword");
    testUser =
        new User(
            "user123",
            "testuser",
            "testpassword",
            "test@example.com",
            Collections.singletonList("ROLE_USER"),
            Collections.emptyList(),
            Collections.emptyList());

    // Mock a successful authentication object
    authenticatedAuth =
        new UsernamePasswordAuthenticationToken(
            testLoginRequest.getUsername(), null, Collections.emptyList());

    // Set up SecurityContextHolder mock
    SecurityContextHolder.setContext(securityContext);
  }

  @Test
  @DisplayName("Should return 200 OK and AuthResponse on successful login")
  void Given_UserExistsPasswordCorrect_When_AuthRequest_Then_ReturnsLoginSuccessful() {
    // Given: AuthenticationManager successfully authenticates
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authenticatedAuth);

    // Given: UserService successfully finds the user after authentication
    when(userService.findUserByUsername(testLoginRequest.getUsername()))
        .thenReturn(Optional.of(testUser));

    // When: The login endpoint is called
    ResponseEntity<AuthResponse> response = authController.authenticateUser(testLoginRequest);

    // Then:
    assertNotNull(response);
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals(testUser.getId(), response.getBody().getUserId());
    assertEquals(testUser.getUsername(), response.getBody().getUsername());
    assertEquals("Login successful", response.getBody().getMessage());

    // Verify that authenticationManager.authenticate was called once with the correct token
    verify(authenticationManager, times(1))
        .authenticate(
            argThat(
                token ->
                    token.getPrincipal().equals(testLoginRequest.getUsername())
                        && token.getCredentials().equals(testLoginRequest.getPassword())));
    // Verify that SecurityContextHolder's context was set
    verify(securityContext, times(1)).setAuthentication(authenticatedAuth);
    // Verify that userService.findUserByUsername was called once
    verify(userService, times(1)).findUserByUsername(testLoginRequest.getUsername());
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED on bad credentials")
  void Given_BadCredentials_When_AuthRequest_Then_ReturnsUnauthorized() { // Renamed
    // Given: AuthenticationManager throws BadCredentialsException
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenThrow(new BadCredentialsException("Invalid credentials"));

    // When: The login endpoint is called
    ResponseEntity<AuthResponse> response = authController.authenticateUser(testLoginRequest);

    // Then:
    assertNotNull(response);
    assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals(
        "Authentication failed. Please check your username and password, or register if you don't have an account.",
        response.getBody().getMessage());
    assertEquals(null, response.getBody().getUserId()); // Ensure user ID is null on failure

    // Verify that userService was NOT called
    verify(userService, never()).findUserByUsername(anyString());
    // Verify that SecurityContextHolder's context was NOT set
    verify(securityContext, never()).setAuthentication(any(Authentication.class));
  }

  @Test
  @DisplayName(
      "Should return 500 INTERNAL_SERVER_ERROR if authenticated user not found in service (edge case)")
  void
      Given_UserAuthenticatedButNotFoundInService_When_AuthRequest_Then_ReturnsInternalServerError() { // Renamed
    // Given: AuthenticationManager successfully authenticates
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authenticatedAuth);

    // Given: UserService returns empty Optional, meaning user not found
    when(userService.findUserByUsername(testLoginRequest.getUsername()))
        .thenReturn(Optional.empty());

    // When: The login endpoint is called
    ResponseEntity<AuthResponse> response = authController.authenticateUser(testLoginRequest);

    // Then:
    assertNotNull(response);
    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals(
        "An internal server error occurred. Please try again later.",
        response.getBody().getMessage());

    // Verify calls
    verify(authenticationManager, times(1))
        .authenticate(any(UsernamePasswordAuthenticationToken.class));
    verify(userService, times(1)).findUserByUsername(testLoginRequest.getUsername());
    verify(securityContext, times(1)).setAuthentication(authenticatedAuth);
  }
}
