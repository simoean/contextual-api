package com.simoes.contextual.security.jwt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import com.simoes.contextual.consent.TokenValidity;
import com.simoes.contextual.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;

import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.concurrent.TimeUnit;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtTokenProvider Unit Tests")
class JwtTokenProviderTest {

  // Injects the mocks into JwtTokenProvider
  @InjectMocks private JwtTokenProvider jwtTokenProvider;

  // Mock the Authentication object
  @Mock private Authentication authentication;

  // Define a test secret key (must be sufficiently long for HS512)
  private final String testSecret =
      "movPHMSG8X8r9vu0dvItrJrco23jO6v09rjEdubpkz8ewm9UsHO7DDDYEQM+RHAOKihGT1tIJaRaTsDrY1+ivw==";

  private User testUser;

  /**
   * Helper method to generate a SecretKey from the test secret string. This is crucial for signing
   * and verifying tokens in tests.
   */
  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(Base64.getDecoder().decode(testSecret));
  }

  @BeforeEach
  void setUp() {
    // Common setup for a test User object that acts as UserDetails
    testUser =
        new User(
            "user123",
            "testuser",
            "$2a$10$6QNMDq1kYlRn16BdqEYIUudW3qJwNI.Fpqb9zpwnzyELvQJsNGomq",
            "test@example.com",
            Collections.singletonList("ROLE_USER"),
            Collections.emptyList(),
            Collections.emptyList(),
            Collections.emptyList());

    // Use ReflectionTestUtils to set the private @Value fields in JwtTokenProvider
    ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", testSecret);
  }

  @Test
  @DisplayName("Should generate a valid JWT token with correct claims")
  void Given_AuthenticationObject_When_GenerateToken_Then_ReturnsValidJwtWithCorrectClaims() {
    // Given: A mock Authentication object whose principal is our testUser
    when(authentication.getPrincipal()).thenReturn(testUser);

    // When: The generateToken method is called
    String token = jwtTokenProvider.generateToken(authentication, "test-consent", TokenValidity.ONE_DAY);

    // Then: The generated token should not be null or empty
    assertNotNull(token, "Generated token should not be null");
    assertFalse(token.isEmpty(), "Generated token should not be empty");

    // Then: The token should have 3 parts (header.payload.signature)
    String[] parts = token.split("\\.");
    assertEquals(3, parts.length, "Token should have 3 parts separated by dots");

    // Then: The token should be parsable and not throw any exception using the correct key
    assertDoesNotThrow(
        () -> Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token),
        "Generated token should be parsable with the correct signing key");

    // Then: Verify the extracted claims match the original user's data
    Claims claims =
        Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();

    assertEquals(
        testUser.getUsername(), claims.getSubject(), "Token subject should match username");
    assertEquals(
        testUser.getId(), claims.getId(), "Token 'userId' claim should match");
    assertTrue(
        claims.get("consentId", String.class).contains("test-consent"),
        "Token 'consentId' claim should contain test-consent");
    assertTrue(
        claims.get("roles", String.class).contains("ROLE_USER"),
        "Token 'roles' claim should contain ROLE_USER");
    assertNotNull(claims.getIssuedAt(), "Token should have an issuedAt claim");
    assertNotNull(claims.getExpiration(), "Token should have an expiration claim");
    assertTrue(
        claims.getExpiration().getTime() > System.currentTimeMillis(),
        "Token should not be expired immediately");
  }

  @Test
  @DisplayName("Should validate a correctly signed and non-expired token successfully")
  void Given_ValidJwtToken_When_ValidateToken_Then_ReturnsTrue() {
    // Given: A valid token generated for our test user
    when(authentication.getPrincipal()).thenReturn(testUser);
    String validToken = jwtTokenProvider.generateToken(authentication, null, TokenValidity.ONE_DAY);

    // When: The validateToken method is called with the valid token
    boolean isValid = jwtTokenProvider.validateToken(validToken);

    // Then: The token should be reported as valid
    assertTrue(isValid, "Valid token should return true");
  }

  @Test
  @DisplayName("Should return false for an expired JWT token")
  void Given_ExpiredJwtToken_When_ValidateToken_Then_ReturnsFalse() {
    // Given: A token that was issued and expired in the past
    String expiredToken =
        Jwts.builder()
            .claims()
            .subject("expiredUser")
            .add("userId", "expiredId")
            .issuedAt(
                new Date(
                    System.currentTimeMillis() - TimeUnit.HOURS.toMillis(2))) // Issued 2 hours ago
            .expiration(
                new Date(
                    System.currentTimeMillis() - TimeUnit.HOURS.toMillis(1))) // Expired 1 hour ago
            .and()
            .signWith(getSigningKey(), Jwts.SIG.HS512)
            .compact();

    // When: The validateToken method is called with the expired token
    boolean isValid = jwtTokenProvider.validateToken(expiredToken);

    // Then: The token should be reported as invalid (expired)
    assertFalse(isValid, "Expired token should return false");
  }

  @Test
  @DisplayName("Should return false for a JWT token with an invalid signature")
  void Given_JwtTokenWithInvalidSignature_When_ValidateToken_Then_ReturnsFalse() {
    // Given: A valid token (from our generator)
    when(authentication.getPrincipal()).thenReturn(testUser);
    String validToken = jwtTokenProvider.generateToken(authentication, null, TokenValidity.ONE_DAY);

    // Given: A tampered token created by altering the valid token's signature
    String invalidSignatureToken =
        validToken.substring(0, validToken.length() - 5) + "INVALID"; // Drastically alter signature

    // When: The validateToken method is called with the tampered token
    boolean isValid = jwtTokenProvider.validateToken(invalidSignatureToken);

    // Then: The token should be reported as invalid (signature mismatch)
    assertFalse(isValid, "Token with invalid signature should return false");
  }

  @Test
  @DisplayName("Should return false for a malformed JWT token (e.g., missing parts)")
  void Given_MalformedJwtToken_When_ValidateToken_Then_ReturnsFalse() {
    // Given: A token string that is syntactically malformed (e.g., only two parts)
    String malformedToken = "invalid.token"; // Missing signature part

    // When: The validateToken method is called with the malformed token
    boolean isValid = jwtTokenProvider.validateToken(malformedToken);

    // Then: The token should be reported as invalid
    assertFalse(isValid, "Malformed token should return false");
  }

  @Test
  @DisplayName("Should return false for a null token string")
  void Given_NullToken_When_ValidateToken_Then_ReturnsFalse() {
    // Given: A null token string
    String nullToken = null;

    // When: The validateToken method is called
    boolean isValid = jwtTokenProvider.validateToken(nullToken);

    // Then: The token should be reported as invalid
    assertFalse(isValid, "Null token should return false");
  }

  @Test
  @DisplayName("Should return false for an empty token string")
  void Given_EmptyToken_When_ValidateToken_Then_ReturnsFalse() {
    // Given: An empty token string
    String emptyToken = "";

    // When: The validateToken method is called
    boolean isValid = jwtTokenProvider.validateToken(emptyToken);

    // Then: The token should be reported as invalid
    assertFalse(isValid, "Empty token should return false");
  }

  @Test
  @DisplayName("Should extract the correct username from a valid JWT token")
  void Given_ValidJwtToken_When_GetUsernameFromJwt_Then_ReturnsCorrectUsername() {
    // Given: A valid token generated for our test user
    when(authentication.getPrincipal()).thenReturn(testUser);
    String token = jwtTokenProvider.generateToken(authentication, null, TokenValidity.ONE_DAY);

    // When: The getUsernameFromJwt method is called
    String extractedUsername = jwtTokenProvider.getUsernameFromJwt(token);

    // Then: The extracted username should match the original username
    assertEquals(
        testUser.getUsername(),
        extractedUsername,
        "Extracted username should match original username");
  }

  @Test
  @DisplayName("Should throw exception when extracting username from a malformed JWT token")
  void Given_MalformedJwtToken_When_GetUsernameFromJwt_Then_ThrowsException() {
    // Given: A token string that is syntactically malformed
    String malformedToken = "invalid.token.string";

    // When/Then: Calling getUsernameFromJwt should throw a MalformedJwtException
    assertThrows(
        MalformedJwtException.class,
        () -> jwtTokenProvider.getUsernameFromJwt(malformedToken),
        "Should throw MalformedJwtException for a malformed token");
  }

  @Test
  @DisplayName("Should throw exception when extracting username from an expired JWT token")
  void Given_ExpiredJwtToken_When_GetUsernameFromJwt_Then_ThrowsExpiredJwtException() {
    // Given: A token that was issued and expired in the past
    String expiredToken =
        Jwts.builder()
            .claims()
            .subject("expiredUser")
            .add("userId", "expiredId")
            .issuedAt(new Date(System.currentTimeMillis() - TimeUnit.HOURS.toMillis(2)))
            .expiration(new Date(System.currentTimeMillis() - TimeUnit.HOURS.toMillis(1)))
            .and()
            .signWith(getSigningKey(), Jwts.SIG.HS512)
            .compact();

    // When/Then: Calling getUsernameFromJwt should throw an ExpiredJwtException
    assertThrows(
        ExpiredJwtException.class,
        () -> jwtTokenProvider.getUsernameFromJwt(expiredToken),
        "Should throw ExpiredJwtException for an expired token");
  }

  @Test
  @DisplayName(
      "Should throw exception when extracting username from a token with invalid signature")
  void Given_InvalidSignatureJwtToken_When_GetUsernameFromJwt_Then_ThrowsSignatureException() {
    // Given: A valid token with a tampered signature
    when(authentication.getPrincipal()).thenReturn(testUser);
    String validToken = jwtTokenProvider.generateToken(authentication, null, TokenValidity.ONE_DAY);
    String invalidSignatureToken = validToken.substring(0, validToken.length() - 5) + "BADSIG";

    // When/Then: Calling getUsernameFromJwt should throw a SignatureException
    assertThrows(
        io.jsonwebtoken.security.SignatureException.class,
        () -> jwtTokenProvider.getUsernameFromJwt(invalidSignatureToken),
        "Should throw SignatureException for a token with invalid signature");
  }
}
