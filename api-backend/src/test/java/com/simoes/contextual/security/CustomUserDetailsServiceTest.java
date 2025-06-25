package com.simoes.contextual.security;

import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService Unit Tests")
class CustomUserDetailsServiceTest {

  @Mock
  private UserService userService;

  @InjectMocks
  private CustomUserDetailsService customUserDetailsService;

  private User testUser;

  @BeforeEach
  void setUp() {
    // Initialize a test user that implements UserDetails
    testUser = new User();
    testUser.setId("user1");
    testUser.setUsername("testuser");
    testUser.setPassword("encodedPassword");
    testUser.setRoles(Collections.singletonList("ROLE_USER"));
  }

  @Test
  @DisplayName("Should load user by username successfully when user exists")
  void Given_ExistingUsername_When_LoadUserByUsername_Then_ReturnUserDetails() {
    // Arrange
    when(userService.findUserByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));

    // Act
    UserDetails userDetails = customUserDetailsService.loadUserByUsername(testUser.getUsername());

    // Assert
    assertNotNull(userDetails, "UserDetails should not be null");
    assertEquals(testUser.getUsername(), userDetails.getUsername(), "Returned username should match");
    assertEquals(testUser.getPassword(), userDetails.getPassword(), "Returned password should match");
    assertEquals(testUser.getRoles().size(), userDetails.getAuthorities().size(), "Authorities count should match");
    assertTrue(userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")), "Should contain ROLE_USER authority");

    // Verify that the userService method was called
    verify(userService, times(1)).findUserByUsername(testUser.getUsername());
  }

  @Test
  @DisplayName("Should throw UsernameNotFoundException when user does not exist")
  void Given_NonExistingUsername_When_LoadUserByUsername_Then_ThrowUsernameNotFoundException() {
    // Arrange
    String nonExistentUsername = "nonexistentuser";
    when(userService.findUserByUsername(nonExistentUsername)).thenReturn(Optional.empty());

    // Act & Assert
    UsernameNotFoundException thrown = assertThrows(
            UsernameNotFoundException.class,
            () -> customUserDetailsService.loadUserByUsername(nonExistentUsername),
            "Should throw UsernameNotFoundException for non-existent user"
    );

    assertEquals("User not found with username: " + nonExistentUsername, thrown.getMessage());

    // Verify that the userService method was called
    verify(userService, times(1)).findUserByUsername(nonExistentUsername);
  }
}