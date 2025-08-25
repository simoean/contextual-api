package com.simoes.contextual.auth;

import com.simoes.contextual.auth.social.CallbackHandler;
import com.simoes.contextual.auth.social.GoogleCallbackHandler;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.servlet.view.RedirectView;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

/**
 * Integration tests for the CallbackController. These tests use MockMvc to verify the
 * behavior of the controller's endpoints, simulating real HTTP requests and responses.
 * Dependencies like GoogleCallbackHandler and UserService are mocked to isolate the controller's
 * logic for testing.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc
@DisplayName("CallbackController Integration Tests")
class CallbackControllerIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private GoogleCallbackHandler googleCallbackHandler;

  @MockBean
  private UserService userService;

  private static final String FRONTEND_REDIRECT_URL = "http://localhost:3000/auth/callback";
  private static final String PROVIDER_TOKEN = "mock_provider_token";
  private static final String USERNAME = "john.doe.int";

  /**
   * Helper method to perform a GET request to the callback endpoint.
   *
   * @param provider The provider name.
   * @param code The authorization code.
   * @return ResultActions object to allow for further assertions.
   * @throws Exception if an error occurs during the request.
   */
  private ResultActions performCallbackRequest(String provider, String code) throws Exception {
    return mockMvc.perform(get("/api/v1/auth/callback")
            .param("provider", provider)
            .param("code", code));
  }

  // --- /api/v1/auth/callback Tests ---

  @Test
  @DisplayName("Should redirect successfully for a valid Google callback")
  void Given_ValidGoogleCallback_When_HandleCallback_Then_RedirectsWithSuccess() throws Exception {
    // Arrange: Mock the handler to return a successful redirect view
    String redirectUrl = FRONTEND_REDIRECT_URL + "?status=success";
    when(googleCallbackHandler.apply(anyString(), anyString())).thenReturn(new RedirectView(redirectUrl));

    // When: A GET request is made for a Google callback
    performCallbackRequest("google", "mock_code")
            // Then: The status should be a 3xx redirection and the URL should match the expected success URL
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl(redirectUrl));
  }

  @Test
  @DisplayName("Should redirect with error for an unsupported provider")
  void Given_UnsupportedProvider_When_HandleCallback_Then_RedirectsWithError() throws Exception {
    // Arrange: The handler is not mocked, so the default logic will be used.
    String expectedUrl = FRONTEND_REDIRECT_URL + "?status=error&message=" + URLEncoder.encode("No handler found for provider: unsupported", StandardCharsets.UTF_8);

    // When: A GET request is made for an unsupported provider
    performCallbackRequest("unsupported", "mock_code")
            // Then: The status should be a 3xx redirection and the URL should contain the error message
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl(expectedUrl));
  }

  @Test
  @DisplayName("Should redirect with error for a placeholder provider like Facebook")
  void Given_PlaceholderProvider_When_HandleCallback_Then_RedirectsWithError() throws Exception {
    // Arrange: The handler for "facebook" is the placeholder handler.
    String expectedUrl = FRONTEND_REDIRECT_URL + "?status=error&message=" + URLEncoder.encode("This provider is not yet implemented.", StandardCharsets.UTF_8);

    // When: A GET request is made for the "facebook" provider
    performCallbackRequest("facebook", "mock_code")
            // Then: The status should be a 3xx redirection and the URL should contain the placeholder error message
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl(expectedUrl));
  }

  @Test
  @DisplayName("Should redirect with error when HttpClientErrorException occurs")
  void Given_HttpClientErrorException_When_HandleCallback_Then_RedirectsWithError() throws Exception {
    // Arrange: Mock the handler to throw a HttpClientErrorException
    when(googleCallbackHandler.apply(anyString(), anyString())).thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Bad Request"));
    String expectedUrl = FRONTEND_REDIRECT_URL + "?status=error&message=" + URLEncoder.encode("Authentication failed: Bad Request", StandardCharsets.UTF_8);

    // When: A GET request is made
    performCallbackRequest("google", "mock_code")
            // Then: The status should be a 3xx redirection and the URL should contain the authentication failure message
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl(expectedUrl));
  }

  @Test
  @DisplayName("Should redirect with error for a general exception")
  void Given_GeneralException_When_HandleCallback_Then_RedirectsWithError() throws Exception {
    // Arrange: Mock the handler to throw a general Exception
    when(googleCallbackHandler.apply(anyString(), anyString())).thenThrow(new RuntimeException("Test exception"));
    String expectedUrl = FRONTEND_REDIRECT_URL + "?status=error&message=" + URLEncoder.encode("An unexpected error occurred during login.", StandardCharsets.UTF_8);

    // When: A GET request is made
    performCallbackRequest("google", "mock_code")
            // Then: The status should be a 3xx redirection and the URL should contain the unexpected error message
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl(expectedUrl));
  }

  // --- /api/v1/auth/attributes Tests ---

  @Test
  @DisplayName("Should return user attributes successfully for a valid provider")
  @WithMockUser(username = USERNAME)
  void Given_ValidUserAndProvider_When_FetchAttributes_Then_ReturnsAttributes() throws Exception {
    // Arrange: Create mock user and attributes
    User mockUser = new User();
    List<IdentityAttribute> mockAttributes = Collections.singletonList(
            new IdentityAttribute("attr-1", mockUser.getId(), "test_attr", "test_value", true, Collections.emptyList())
    );

    // Arrange: Mock the UserService and GoogleCallbackHandler
    when(userService.findUserByUsername(USERNAME)).thenReturn(Optional.of(mockUser));
    when(googleCallbackHandler.getUserAttributes(anyString(), any())).thenReturn(mockAttributes);

    // When: A GET request is made to fetch attributes
    mockMvc.perform(get("/api/v1/auth/attributes")
                    .param("provider", "google")
                    .header("X-Provider-Token", PROVIDER_TOKEN)
                    .contentType(MediaType.APPLICATION_JSON))
            // Then: The status should be OK and the JSON response should match the mock data
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].name").value("test_attr"))
            .andExpect(jsonPath("$[0].value").value("test_value"));
  }

  @Test
  @DisplayName("Should return 404 NOT FOUND when the user does not exist")
  @WithMockUser(username = "nonexistent.user")
  void Given_NonexistentUser_When_FetchAttributes_Then_ReturnsNotFound() throws Exception {
    // Arrange: Mock the UserService to return an empty optional
    when(userService.findUserByUsername("nonexistent.user")).thenReturn(Optional.empty());

    // When: A GET request is made for a non-existent user
    mockMvc.perform(get("/api/v1/auth/attributes")
                    .param("provider", "google")
                    .header("X-Provider-Token", PROVIDER_TOKEN)
                    .contentType(MediaType.APPLICATION_JSON))
            // Then: The status should be NOT FOUND
            .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("Should return an empty list for an unsupported provider")
  @WithMockUser(username = USERNAME)
  void Given_UnsupportedProvider_When_FetchAttributes_Then_ReturnsEmptyList() throws Exception {
    // Arrange: Mock the UserService to return a valid user
    when(userService.findUserByUsername(USERNAME)).thenReturn(Optional.of(new User()));
    // The handler is not mocked, so it will be null, and the controller returns an empty list.

    // When: A GET request is made for an unsupported provider
    mockMvc.perform(get("/api/v1/auth/attributes")
                    .param("provider", "unsupported")
                    .header("X-Provider-Token", PROVIDER_TOKEN)
                    .contentType(MediaType.APPLICATION_JSON))
            // Then: The status should be OK and the body should be an empty JSON array
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  @DisplayName("Should return 401 UNAUTHORIZED for unauthenticated user")
  void Given_UnauthenticatedUser_When_FetchAttributes_Then_ReturnsUnauthorized() throws Exception {
    // When: A GET request is made without authentication
    mockMvc.perform(get("/api/v1/auth/attributes")
                    .param("provider", "google")
                    .header("X-Provider-Token", PROVIDER_TOKEN)
                    .contentType(MediaType.APPLICATION_JSON))
            // Then: The status should be UNAUTHORIZED
            .andExpect(status().isUnauthorized());
  }
}
