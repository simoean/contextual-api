package com.simoes.contextual.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the PasswordEncoder utility class.
 */
@DisplayName("PasswordEncoder Utility Class Tests")
class PasswordEncoderTest {

  /**
   * Test to ensure the encode method produces a valid BCrypt hash.
   * This test verifies two things:
   * 1. The output is a non-empty string.
   * 2. A raw password matches its encoded version, which is the core
   * functionality of BCrypt.
   */
  @Test
  @DisplayName("Should encode a password into a valid BCrypt hash")
  void Given_RawPassword_When_Encode_Then_ReturnsValidHash() {
    // Arrange
    String rawPassword = "mySecurePassword123";

    // Act
    String encodedPassword = PasswordEncoder.encode(rawPassword);

    // Assert
    // 1. Ensure the result is not null or empty
    assertNotNull(encodedPassword, "Encoded password should not be null.");
    assertFalse(encodedPassword.isEmpty(), "Encoded password should not be empty.");

    // 2. Verify that the raw password matches the encoded one using the same algorithm
    // This is the standard way to check a BCrypt hash.
    BCryptPasswordEncoder verifier = new BCryptPasswordEncoder();
    assertTrue(verifier.matches(rawPassword, encodedPassword), "Raw password should match the encoded password.");
  }

  /**
   * Test to ensure two different encodings of the same password are not identical.
   * This is a fundamental property of BCrypt due to its use of a random salt for each hash.
   */
  @Test
  @DisplayName("Should produce different hashes for the same password on subsequent calls")
  void Given_SameRawPassword_When_EncodeCalledTwice_Then_HashesAreDifferent() {
    // Arrange
    String rawPassword = "mySecurePassword123";

    // Act
    String encodedPassword1 = PasswordEncoder.encode(rawPassword);
    String encodedPassword2 = PasswordEncoder.encode(rawPassword);

    // Assert
    assertNotEquals(encodedPassword1, encodedPassword2, "Two hashes of the same password should not be identical.");
  }
}
