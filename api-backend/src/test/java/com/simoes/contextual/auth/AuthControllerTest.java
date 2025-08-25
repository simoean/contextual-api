package com.simoes.contextual.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.simoes.contextual.security.jwt.JwtTokenProvider;
import com.simoes.contextual.consent.Consent;
import com.simoes.contextual.consent.TokenValidity;
import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;

import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Unit tests for the AuthController. These tests focus on the business logic within the controller,
 * mocking its external dependencies like AuthenticationManager and UserService.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest {

  // Mocks for dependencies of AuthController
  @Mock private AuthenticationManager authenticationManager;
  @Mock private JwtTokenProvider jwtTokenProvider;
  @Mock private UserService userService;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private SecurityContext securityContext;

  // Injects the mocks into AuthController
  @InjectMocks private AuthController authController;

  // Test data and objects used across multiple tests
  private LoginRequest testLoginRequest;
  private User testUser;
  private Authentication authenticatedAuth;

  @BeforeEach
  void setUp() {
    // Reset SecurityContextHolder before each test to prevent side effects
    SecurityContextHolder.clearContext();

    // Common setup for test data
    testLoginRequest =
        new LoginRequest(
            "testuser",
            "$2a$10$6QNMDq1kYlRn16BdqEYIUudW3qJwNI.Fpqb9zpwnzyELvQJsNGomq",
            "test-client");
    testUser =
        new User(
            "user123",
            "testuser",
            "$2a$10$6QNMDq1kYlRn16BdqEYIUudW3qJwNI.Fpqb9zpwnzyELvQJsNGomq",
            "test@example.com",
            Collections.singletonList("ROLE_USER"),
            Collections.emptyList(),
            Collections.emptyList(),
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
  void Given_BadCredentials_When_AuthRequest_Then_ReturnsUnauthorized() {
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
    assertNull(response.getBody().getUserId());

    // Verify that userService was NOT called
    verify(userService, never()).findUserByUsername(anyString());
    // Verify that SecurityContextHolder's context was NOT set
    verify(securityContext, never()).setAuthentication(any(Authentication.class));
  }

  @Test
  @DisplayName(
      "Should return 500 INTERNAL_SERVER_ERROR if authenticated user not found in service (edge case)")
  void
      Given_UserAuthenticatedButNotFoundInService_When_AuthRequest_Then_ReturnsInternalServerError() {
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

  @Nested
  @DisplayName("User Registration Tests")
  class UserRegistrationTests {

    private RegisterRequest registerRequest;
    private User registeredUser;
    private Authentication newAuthenticatedAuth;

    @BeforeEach
    void setupRegistrationTests() {
      registerRequest = new RegisterRequest("newuser", "newpassword");
      registeredUser =
          new User(
              "newUserId",
              "newuser",
              "encodedPassword",
              "newuser@example.com",
              Collections.singletonList("ROLE_USER"),
              Collections.emptyList(),
              Collections.emptyList(),
              Collections.emptyList(),
              Collections.emptyList());

      newAuthenticatedAuth =
          new UsernamePasswordAuthenticationToken(
              registerRequest.getUsername(), null, Collections.emptyList());
    }

    @Test
    @DisplayName("Should return 201 CREATED and AuthResponse on successful registration and login")
    void Given_NewUser_When_RegisterUser_Then_ReturnsCreatedAndLogsIn() {
      // Given: Username does not exist
      when(userService.findUserByUsername(registerRequest.getUsername()))
          .thenReturn(Optional.empty());

      // Given: PasswordEncoder encodes the password
      when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");

      // Given: UserService saves the new user
      when(userService.saveUser(any(User.class)))
          .thenAnswer(
              invocation -> {
                User user = invocation.getArgument(0);
                // Simulate ID generation by the repository
                user.setId("newUserId");
                return user;
              });

      // Given: AuthenticationManager successfully authenticates the newly registered user
      when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
          .thenReturn(newAuthenticatedAuth);

      // Given: JwtTokenProvider generates a token
      when(jwtTokenProvider.generateDashboardToken(any(Authentication.class)))
          .thenReturn("new-mocked-jwt");

      // When: The register endpoint is called
      ResponseEntity<AuthResponse> response = authController.registerUser(registerRequest);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.CREATED, response.getStatusCode());
      assertNotNull(response.getBody());
      assertEquals(registeredUser.getId(), response.getBody().getUserId());
      assertEquals(registeredUser.getUsername(), response.getBody().getUsername());
      assertEquals("Registration successful and user logged in.", response.getBody().getMessage());
      assertEquals("new-mocked-jwt", response.getBody().getToken());

      // Verify interactions
      verify(userService, times(1)).findUserByUsername(registerRequest.getUsername());
      verify(passwordEncoder, times(1)).encode(registerRequest.getPassword());
      // Capture the user passed to saveUser to verify its contents
      verify(userService, times(1)).saveUser(any(User.class));
      verify(userService, times(1)).provisionDefaultUserData(any(User.class));
      verify(authenticationManager, times(1))
          .authenticate(
              argThat(
                  token ->
                      token.getPrincipal().equals(registerRequest.getUsername())
                          && token.getCredentials().equals(registerRequest.getPassword())));
      verify(securityContext, times(1)).setAuthentication(newAuthenticatedAuth);
      verify(jwtTokenProvider, times(1)).generateDashboardToken(newAuthenticatedAuth);
    }

    @Test
    @DisplayName("Should return 409 CONFLICT if username already exists")
    void Given_ExistingUsername_When_RegisterUser_Then_ReturnsConflict() {
      // Given: Username already exists
      when(userService.findUserByUsername(registerRequest.getUsername()))
          .thenReturn(Optional.of(testUser)); // Return an existing user

      // When: The register endpoint is called
      ResponseEntity<AuthResponse> response = authController.registerUser(registerRequest);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
      assertNotNull(response.getBody());
      assertEquals(
          "Username already exists. Please choose a different username.",
          response.getBody().getMessage());

      // Verify that no further calls are made (e.g., to save user, encode password, authenticate)
      verify(userService, times(1)).findUserByUsername(registerRequest.getUsername());
      verify(passwordEncoder, never()).encode(anyString());
      verify(userService, never()).saveUser(any(User.class));
      verify(userService, never()).provisionDefaultUserData(any(User.class));
      verify(authenticationManager, never())
          .authenticate(any(UsernamePasswordAuthenticationToken.class));
      verify(securityContext, never()).setAuthentication(any(Authentication.class));
      verify(jwtTokenProvider, never()).generateDashboardToken(any(Authentication.class));
    }

    @Test
    @DisplayName(
        "Should return 401 UNAUTHORIZED if authentication fails after registration (edge case)")
    void Given_UserRegisteredButAuthFails_When_RegisterUser_Then_ReturnsUnauthorized() {
      // Given: Username does not exist
      when(userService.findUserByUsername(registerRequest.getUsername()))
          .thenReturn(Optional.empty());

      // Given: PasswordEncoder encodes the password
      when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");

      // Given: UserService saves the new user
      when(userService.saveUser(any(User.class)))
          .thenAnswer(
              invocation -> {
                User user = invocation.getArgument(0);
                user.setId("newUserId");
                return user;
              });

      // Given: AuthenticationManager throws BadCredentialsException (simulating auth failure after
      // reg)
      when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
          .thenThrow(new BadCredentialsException("Authentication failed after registration"));

      // When: The register endpoint is called
      ResponseEntity<AuthResponse> response = authController.registerUser(registerRequest);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
      assertNotNull(response.getBody());
      assertEquals(
          "Authentication failed. Please check your username and password, or register if you don't have an account.",
          response.getBody().getMessage());

      // Verify interactions up to the point of failure
      verify(userService, times(1)).findUserByUsername(registerRequest.getUsername());
      verify(passwordEncoder, times(1)).encode(registerRequest.getPassword());
      verify(userService, times(1)).saveUser(any(User.class));
      verify(userService, times(1)).provisionDefaultUserData(any(User.class));
      verify(authenticationManager, times(1))
          .authenticate(any(UsernamePasswordAuthenticationToken.class));
      verify(securityContext, never()).setAuthentication(any(Authentication.class));
      verify(jwtTokenProvider, never()).generateDashboardToken(any(Authentication.class));
    }

    @Test
    @DisplayName(
        "Should return 500 INTERNAL_SERVER_ERROR if an unexpected error occurs during registration")
    void Given_UnexpectedError_When_RegisterUser_Then_ReturnsInternalServerError() {
      // Given: Username does not exist
      when(userService.findUserByUsername(registerRequest.getUsername()))
          .thenReturn(Optional.empty());

      // Given: PasswordEncoder encodes the password (this part might succeed)
      when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");

      // Given: UserService.saveUser throws a RuntimeException (simulating a DB error, for example)
      doThrow(new RuntimeException("Database connection failed"))
          .when(userService)
          .saveUser(any(User.class));

      // When: The register endpoint is called
      ResponseEntity<AuthResponse> response = authController.registerUser(registerRequest);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
      assertNotNull(response.getBody());
      assertEquals(
          "An internal server error occurred. Please try again later.",
          response.getBody().getMessage());

      // Verify interactions up to the point of failure
      verify(userService, times(1)).findUserByUsername(registerRequest.getUsername());
      verify(passwordEncoder, times(1)).encode(registerRequest.getPassword());
      verify(userService, times(1)).saveUser(any(User.class));
      verify(userService, never()).provisionDefaultUserData(any(User.class));
      verify(authenticationManager, never())
          .authenticate(any(UsernamePasswordAuthenticationToken.class));
      verify(securityContext, never()).setAuthentication(any(Authentication.class));
      verify(jwtTokenProvider, never()).generateDashboardToken(any(Authentication.class));
    }
  }

  // --- New Tests for /validate-token endpoint ---
  @Nested
  @DisplayName("Token Validation Tests")
  class TokenValidationTests {

    private final String VALID_TOKEN = "valid.jwt.token";
    private final String INVALID_TOKEN = "invalid.jwt.token";
    private final String VALID_BEARER_TOKEN = "Bearer " + VALID_TOKEN;
    private final String CLIENT_ID = "test-client-id";

    @Test
    @DisplayName("Should return 200 OK and new token for a valid token and user")
    void Given_ValidTokenAndUser_When_ValidateToken_Then_ReturnsOkAndNewToken() {
      // Given: A valid token that passes validation
      // Mock common behavior for the happy path
      when(jwtTokenProvider.getUsernameFromJwt(VALID_TOKEN))
              .thenReturn(testLoginRequest.getUsername());
      when(jwtTokenProvider.getClientIdFromJwt(VALID_TOKEN)).thenReturn(Optional.of(CLIENT_ID));

      when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
      when(userService.findUserByUsername(testLoginRequest.getUsername()))
          .thenReturn(Optional.of(testUser));
      // Given: The user has a consent for the client ID
      testUser.setConsents(
          List.of(
              new Consent(
                  "consent-id-1",
                  CLIENT_ID,
                  "contextId",
                  Collections.singletonList("attributeId"),
                  new Date(),
                  new Date(),
                  Collections.emptyList(),
                  TokenValidity.ONE_YEAR)));
      when(jwtTokenProvider.generateConsentToken(
              any(Authentication.class), anyString(), any(TokenValidity.class)))
          .thenReturn("new.generated.token");

      // When: The validateToken endpoint is called with a valid Bearer token
      ResponseEntity<?> response = authController.validateToken(VALID_BEARER_TOKEN);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue(response.getBody() instanceof Map);
      Map<String, Object> body = (Map<String, Object>) response.getBody();
      assertEquals("new.generated.token", body.get("token"));
      assertEquals(testUser.getId(), body.get("userId"));
      assertEquals(testUser.getUsername(), body.get("username"));

      // Verify interactions
      verify(jwtTokenProvider, times(1)).validateToken(VALID_TOKEN);
      verify(jwtTokenProvider, times(1)).getUsernameFromJwt(VALID_TOKEN);
      verify(userService, times(1)).findUserByUsername(testLoginRequest.getUsername());
      verify(jwtTokenProvider, times(1))
          .generateConsentToken(
              any(Authentication.class), eq(CLIENT_ID), eq(TokenValidity.ONE_YEAR));
    }

    @Test
    @DisplayName("Should return 401 UNAUTHORIZED if Authorization header is null")
    void Given_NullAuthorizationHeader_When_ValidateToken_Then_ReturnsUnauthorized() {
      // When: The validateToken endpoint is called with a null header
      ResponseEntity<?> response = authController.validateToken(null);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
      assertEquals("Authorization header is missing or malformed.", response.getBody());
      verify(jwtTokenProvider, never()).validateToken(anyString());
    }

    @Test
    @DisplayName("Should return 401 UNAUTHORIZED if Authorization header is malformed")
    void Given_MalformedAuthorizationHeader_When_ValidateToken_Then_ReturnsUnauthorized() {
      // When: The validateToken endpoint is called with a header not starting with "Bearer "
      ResponseEntity<?> response = authController.validateToken("InvalidToken");

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
      assertEquals("Authorization header is missing or malformed.", response.getBody());
      verify(jwtTokenProvider, never()).validateToken(anyString());
    }

    @Test
    @DisplayName("Should return 401 UNAUTHORIZED if token is expired or invalid")
    void Given_InvalidToken_When_ValidateToken_Then_ReturnsUnauthorized() {
      // Given: A token that fails validation
      when(jwtTokenProvider.validateToken(INVALID_TOKEN)).thenReturn(false);

      // When: The validateToken endpoint is called with an invalid token
      ResponseEntity<?> response = authController.validateToken("Bearer " + INVALID_TOKEN);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
      assertEquals("Token is expired or invalid.", response.getBody());
      verify(jwtTokenProvider, times(1)).validateToken(INVALID_TOKEN);
      verify(jwtTokenProvider, never()).getUsernameFromJwt(anyString());
      verify(userService, never()).findUserByUsername(anyString());
    }

    @Test
    @DisplayName("Should return 401 UNAUTHORIZED if user is not found")
    void Given_ValidTokenButUserNotFound_When_ValidateToken_Then_ReturnsUnauthorized() {
      // Given: A valid token but the user is not found in the database
      // Mock common behavior for the happy path
      when(jwtTokenProvider.getUsernameFromJwt(VALID_TOKEN))
              .thenReturn("non-existing-user");
      when(jwtTokenProvider.getClientIdFromJwt(VALID_TOKEN)).thenReturn(Optional.of(CLIENT_ID));

      when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
      when(userService.findUserByUsername("non-existing-user"))
          .thenThrow(RuntimeException.class);

      // When: The validateToken endpoint is called
      ResponseEntity<?> response = authController.validateToken(VALID_BEARER_TOKEN);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
      assertEquals("Invalid token or user not found.", response.getBody());
      verify(jwtTokenProvider, times(1)).validateToken(VALID_TOKEN);
      verify(jwtTokenProvider, times(1)).getUsernameFromJwt(VALID_TOKEN);
      verify(userService, times(1)).findUserByUsername("non-existing-user");
      verify(jwtTokenProvider, never())
          .generateConsentToken(any(Authentication.class), anyString(), any(TokenValidity.class));
    }

    @Test
    @DisplayName("Should return 401 UNAUTHORIZED if an exception occurs during token parsing")
    void Given_ValidTokenButExceptionOnParsing_When_ValidateToken_Then_ReturnsUnauthorized() {
      // Given: A valid token that passes initial validation, but throws an exception during
      // username extraction
      when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
      when(jwtTokenProvider.getUsernameFromJwt(VALID_TOKEN))
          .thenThrow(new RuntimeException("Test parsing exception"));

      // When: The validateToken endpoint is called
      ResponseEntity<?> response = authController.validateToken(VALID_BEARER_TOKEN);

      // Then:
      assertNotNull(response);
      assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
      assertEquals("Invalid token or user not found.", response.getBody());
      verify(jwtTokenProvider, times(1)).validateToken(VALID_TOKEN);
      verify(jwtTokenProvider, times(1)).getUsernameFromJwt(VALID_TOKEN);
      verify(userService, never()).findUserByUsername(anyString());
    }

    @Test
    @DisplayName("Should use default TokenValidity if no matching consent is found")
    void Given_ValidTokenAndUser_When_ConsentNotFound_Then_UsesDefaultValidity() {
      // Given: A valid token, a valid user, but no matching consent for the client ID
      // Mock common behavior for the happy path
      when(jwtTokenProvider.getUsernameFromJwt(VALID_TOKEN))
              .thenReturn(testLoginRequest.getUsername());
      when(jwtTokenProvider.getClientIdFromJwt(VALID_TOKEN)).thenReturn(Optional.of(CLIENT_ID));

      when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
      when(userService.findUserByUsername(testLoginRequest.getUsername()))
          .thenReturn(Optional.of(testUser));
      when(jwtTokenProvider.generateConsentToken(
              any(Authentication.class), anyString(), any(TokenValidity.class)))
          .thenReturn("new.generated.token");

      // When: The validateToken endpoint is called
      ResponseEntity<?> response = authController.validateToken(VALID_BEARER_TOKEN);

      // Then: The correct default validity (ONE_DAY) should be used to generate the new token
      assertNotNull(response);
      assertEquals(HttpStatus.OK, response.getStatusCode());
      verify(jwtTokenProvider, times(1))
          .generateConsentToken(
              any(Authentication.class), eq(CLIENT_ID), eq(TokenValidity.ONE_DAY));
    }
  }
}
