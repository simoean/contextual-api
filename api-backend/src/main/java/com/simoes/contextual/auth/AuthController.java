package com.simoes.contextual.auth;

import com.simoes.contextual.consent.TokenValidity;
import com.simoes.contextual.security.jwt.JwtTokenProvider;
import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder; // <--- ADD THIS IMPORT
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

/**
 * Controller for handling authentication requests. This controller provides an endpoint for user
 * login, authenticating the user and another endpoint for user registration.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  public static final String WRONG_CREDENTIALS =
      "Authentication failed. Please check your username and password, or register if you don't have an account.";
  public static final String INTERNAL_ERROR =
      "An internal server error occurred. Please try again later.";
  public static final String USER_ALREADY_EXISTS =
      "Username already exists. Please choose a different username.";

  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;
  private final UserService userService;
  private final PasswordEncoder passwordEncoder;

  /**
   * Endpoint for user login. This method authenticates the user based on the provided credentials.
   *
   * @param loginRequest The request containing username and password.
   * @return ResponseEntity containing authentication result.
   */
  @PostMapping("/login")
  public ResponseEntity<AuthResponse> authenticateUser(@RequestBody LoginRequest loginRequest) {
    try {
      // Authenticate the user using Spring Security's AuthenticationManager
      Authentication authentication =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(
                  loginRequest.getUsername(), loginRequest.getPassword()));

      // Set the authenticated user in the SecurityContext
      SecurityContextHolder.getContext().setAuthentication(authentication);

      // Retrieve the full User object from user service
      User authenticatedUser =
          userService
              .findUserByUsername(loginRequest.getUsername())
              .orElseThrow(
                  () ->
                      new RuntimeException(
                          "Authenticated user not found in service after authentication."));

      String jwt;
      // Check if a clientId is provided; if so, generate a consent token
      if (StringUtils.hasText(loginRequest.getClientId())) {
        // Here, you might fetch the user's preferred validity from a consent management screen
        // For now, we'll use a default of ONE_DAY as per your previous code
        jwt = jwtTokenProvider.generateConsentToken(authentication, loginRequest.getClientId(), TokenValidity.ONE_DAY);
      } else {
        // If no clientId, generate a regular token
        jwt = jwtTokenProvider.generateDashboardToken(authentication);
      }

      // Create AuthResponse with the generated JWT token
      AuthResponse authResponse =
          AuthResponse.builder()
              .userId(authenticatedUser.getId())
              .username(authenticatedUser.getUsername())
              .message("Login successful")
              .token(jwt)
              .build();

      return ResponseEntity.ok(authResponse);
    } catch (BadCredentialsException ex) {
      // Wrong credentials provided
      log.error(
          "Authentication failed for user {}: {}", loginRequest.getUsername(), ex.getMessage(), ex);
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(AuthResponse.builder().message(WRONG_CREDENTIALS).build());
    } catch (RuntimeException ex) {
      // Edge case: if the user is authenticated but failed to retrieve its data.
      log.error("Authenticated user not found in service post-authentication: " + ex.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(AuthResponse.builder().message(INTERNAL_ERROR).build());
    }
  }

  /**
   * Endpoint for user registration. This method registers a new user, encrypts their password, and
   * then automatically logs them in.
   *
   * @param registerRequest The request containing username and password for registration.
   * @return ResponseEntity containing authentication result upon successful registration and login.
   */
  @PostMapping("/register")
  public ResponseEntity<AuthResponse> registerUser(
      @RequestBody @Valid RegisterRequest registerRequest) {
    try {
      // Check if username already exists
      if (userService.findUserByUsername(registerRequest.getUsername()).isPresent()) {
        log.warn("Registration attempt with existing username: {}", registerRequest.getUsername());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(AuthResponse.builder().message(USER_ALREADY_EXISTS).build());
      }

      // Create a new User entity
      User newUser =
          User.builder()
              .username(registerRequest.getUsername())
              .password(passwordEncoder.encode(registerRequest.getPassword()))
              .roles(Collections.singletonList("ROLE_USER"))
              .build();

      // Save the new user
      newUser = userService.saveUser(newUser);
      userService.provisionDefaultUserData(newUser);
      log.info("New user registered: {}", newUser.getUsername());

      // Automatically authenticate and log in the new user
      Authentication authentication =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(
                  registerRequest.getUsername(), registerRequest.getPassword()));

      SecurityContextHolder.getContext().setAuthentication(authentication);

      String jwt = jwtTokenProvider.generateDashboardToken(authentication);

      AuthResponse authResponse =
          AuthResponse.builder()
              .userId(newUser.getId())
              .username(newUser.getUsername())
              .message("Registration successful and user logged in.")
              .token(jwt)
              .build();

      return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    } catch (BadCredentialsException ex) {
      // This case should ideally not happen after successful registration,
      // but included for robustness if authentication fails immediately after creation.
      log.error(
          "Authentication failed immediately after registration for user {}: {}",
          registerRequest.getUsername(),
          ex.getMessage(),
          ex);
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(AuthResponse.builder().message(WRONG_CREDENTIALS).build());
    } catch (Exception ex) {
      log.error(
          "Error during user registration for {}: {}",
          registerRequest.getUsername(),
          ex.getMessage(),
          ex);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(AuthResponse.builder().message(INTERNAL_ERROR).build());
    }
  }
}
