package com.simoes.contextual.auth.social;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Unit tests for the GoogleCallbackHandler class. These tests focus on the business logic of
 * handling Google OAuth callbacks and retrieving user attributes, mocking external dependencies
 * like RestTemplate and ObjectMapper.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GoogleCallbackHandler Unit Tests")
class GoogleCallbackHandlerTest {

  @Mock private RestTemplate restTemplate;

  @Mock private ObjectMapper objectMapper;

  @InjectMocks private GoogleCallbackHandler googleCallbackHandler;

  private final String frontendRedirectUrl = "http://localhost:3000/auth/callback";
  private final String authCode = "mock-auth-code";

  @BeforeEach
  void setUp() {
    // Use ReflectionTestUtils to inject the dummy values into the private fields
    ReflectionTestUtils.setField(googleCallbackHandler, "clientId", "mock-client-id");
    ReflectionTestUtils.setField(googleCallbackHandler, "clientSecret", "mock-client-secret");
    ReflectionTestUtils.setField(googleCallbackHandler, "redirectUri", "http://localhost:8080/api/v1/auth/callback/google");
  }

  /** Nested tests for the apply() method, which handles the Google OAuth callback. */
  @Nested
  @DisplayName("OAuth Callback Handler (apply) Tests")
  class ApplyMethodTests {

    @Test
    @DisplayName("Should return a success redirect view on successful token retrieval")
    void givenValidAuthCode_whenApply_thenReturnsSuccessRedirectView()
        throws JsonProcessingException {
      // Arrange
      String mockAccessTokenResponse = "{\"access_token\": \"mock-access-token\"}";
      ResponseEntity<String> mockResponseEntity =
          new ResponseEntity<>(mockAccessTokenResponse, HttpStatus.OK);
      JsonNode mockJsonNode = mock(JsonNode.class);
      when(mockJsonNode.get("access_token")).thenReturn(mock(JsonNode.class));
      when(mockJsonNode.get("access_token").asText()).thenReturn("mock-access-token");

      when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
          .thenReturn(mockResponseEntity);
      when(objectMapper.readTree(mockAccessTokenResponse)).thenReturn(mockJsonNode);

      // Act
      RedirectView redirectView = googleCallbackHandler.apply(authCode, frontendRedirectUrl);

      // Assert
      assertNotNull(redirectView);
      String expectedUrl =
          frontendRedirectUrl
              + "?status=success&provider=google&providerAccessToken=mock-access-token";
      assertEquals(expectedUrl, redirectView.getUrl());
      verify(restTemplate, times(1))
          .postForEntity(
              eq("https://oauth2.googleapis.com/token"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("Should throw RuntimeException if token retrieval fails")
    void givenInvalidAuthCode_whenApply_thenThrowsRuntimeException() {
      // Arrange
      // Mocking the RestTemplate to throw an exception
      when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
          .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST));

      // Act & Assert
      assertThrows(
          RuntimeException.class, () -> googleCallbackHandler.apply(authCode, frontendRedirectUrl));

      // Verify
      verify(restTemplate, times(1))
          .postForEntity(
              eq("https://oauth2.googleapis.com/token"), any(HttpEntity.class), eq(String.class));
    }
  }

  /** Nested tests for the getUserAttributes() method, which retrieves user data from Google. */
  @Nested
  @DisplayName("User Attributes Retrieval Tests")
  class GetUserAttributesTests {

    private final String mockAccessToken = "mock-access-token";
    private final String mockAuthorizationHeader = "Bearer " + mockAccessToken;
    private final String mockUserId = "123456789";
    private final String mockPersonalContextId = "personal-context-id";
    private final String mockUserEmail = "testuser@gmail.com";
    private final String mockUserName = "Test User";

    @Test
    @DisplayName("Should return a list of IdentityAttributes for a valid token and user contexts")
    void givenValidTokenAndContexts_whenGetUserAttributes_thenReturnsAttributes() throws JsonProcessingException {
      // Arrange
      String mockUserJson = String.format("{\"sub\": \"%s\", \"email\": \"%s\", \"name\": \"%s\"}", mockUserId, mockUserEmail, mockUserName);
      ResponseEntity<String> userResponse = new ResponseEntity<>(mockUserJson, HttpStatus.OK);

      JsonNode mockJsonNode = mock(JsonNode.class);

      // Mock the properties of the JsonNode to return a list of mocked Map.Entry objects
      Map.Entry<String, JsonNode> subEntry = mock(Map.Entry.class);
      when(subEntry.getKey()).thenReturn("sub");
      when(subEntry.getValue()).thenReturn(mock(JsonNode.class));
      when(subEntry.getValue().isTextual()).thenReturn(true);
      when(subEntry.getValue().asText()).thenReturn(mockUserId);

      Map.Entry<String, JsonNode> emailEntry = mock(Map.Entry.class);
      when(emailEntry.getKey()).thenReturn("email");
      when(emailEntry.getValue()).thenReturn(mock(JsonNode.class));
      when(emailEntry.getValue().isTextual()).thenReturn(true);
      when(emailEntry.getValue().asText()).thenReturn(mockUserEmail);

      Map.Entry<String, JsonNode> nameEntry = mock(Map.Entry.class);
      when(nameEntry.getKey()).thenReturn("name");
      when(nameEntry.getValue()).thenReturn(mock(JsonNode.class));
      when(nameEntry.getValue().isTextual()).thenReturn(true);
      when(nameEntry.getValue().asText()).thenReturn(mockUserName);

      when(mockJsonNode.properties()).thenReturn(Set.of(subEntry, emailEntry, nameEntry));


      // Mocking RestTemplate and ObjectMapper
      when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
              .thenReturn(userResponse);
      when(objectMapper.readTree(mockUserJson)).thenReturn(mockJsonNode);

      // Mocking a personal context
      Context personalContext = new Context(mockPersonalContextId, "Personal", "Desc");
      List<Context> userContexts = Collections.singletonList(personalContext);

      // Act
      List<IdentityAttribute> attributes = googleCallbackHandler.getUserAttributes(mockAuthorizationHeader, userContexts);

      // Assert
      assertNotNull(attributes);
      assertEquals(3, attributes.size()); // sub, email, name

      // Assert on the attributes
      IdentityAttribute emailAttribute = attributes.stream().filter(attr -> "Email".equals(attr.getName())).findFirst().orElseThrow();
      assertEquals("testuser@gmail.com", emailAttribute.getValue());
      assertEquals(mockPersonalContextId, emailAttribute.getContextIds().get(0));

      IdentityAttribute nameAttribute = attributes.stream().filter(attr -> "Name".equals(attr.getName())).findFirst().orElseThrow();
      assertEquals("Test User", nameAttribute.getValue());
      assertEquals(mockPersonalContextId, nameAttribute.getContextIds().get(0));

      // Verify that the correct API call was made
      verify(restTemplate, times(1)).exchange(eq("https://www.googleapis.com/oauth2/v3/userinfo"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("Should throw IllegalStateException if Personal context is not found")
    void givenNoPersonalContext_whenGetUserAttributes_thenThrowsIllegalStateException()
        throws JsonProcessingException {
      // Arrange
      String mockUserJson = "{\"sub\": \"123456789\"}";
      ResponseEntity<String> userResponse = new ResponseEntity<>(mockUserJson, HttpStatus.OK);
      JsonNode mockJsonNode = mock(JsonNode.class);
      when(mockJsonNode.has("sub")).thenReturn(true);
      when(mockJsonNode.get("sub")).thenReturn(mock(JsonNode.class));
      when(mockJsonNode.get("sub").asText()).thenReturn("123456789");

      when(restTemplate.exchange(
              anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
          .thenReturn(userResponse);
      when(objectMapper.readTree(mockUserJson)).thenReturn(mockJsonNode);

      // User contexts without "Personal"
      List<Context> userContexts =
          Collections.singletonList(new Context("other-id", "Work", "Work description"));

      // Act & Assert
      IllegalStateException exception =
          assertThrows(
              IllegalStateException.class,
              () -> googleCallbackHandler.getUserAttributes(mockAuthorizationHeader, userContexts));

      // Verify exception message
      assertEquals("Personal context not found for user.", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw RuntimeException if JSON processing fails")
    void givenInvalidJson_whenGetUserAttributes_thenThrowsRuntimeException() throws JsonProcessingException {
      // Arrange
      String invalidJson = "{invalid-json}";
      ResponseEntity<String> userResponse = new ResponseEntity<>(invalidJson, HttpStatus.OK);

      // Use Mockito.lenient() for stubs that may not be used, preventing UnnecessaryStubbingException
      lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
              .thenReturn(userResponse);
      lenient().when(objectMapper.readTree(invalidJson)).thenThrow(new JsonProcessingException("Mock JSON processing error") {});

      // Act & Assert
      assertThrows(RuntimeException.class,
              () -> googleCallbackHandler.getUserAttributes(mockAuthorizationHeader, Collections.emptyList()));
    }
  }
}
