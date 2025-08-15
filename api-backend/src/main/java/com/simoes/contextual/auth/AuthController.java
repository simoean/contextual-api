package com.simoes.contextual.auth;

import com.simoes.contextual.consent.Consent;
import com.simoes.contextual.consent.TokenValidity;
import com.simoes.contextual.security.jwt.JwtTokenProvider;
import com.simoes.contextual.user.User;
import com.simoes.contextual.user.UserService;
import jakarta.validation.Valid;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder; // <--- ADD THIS IMPORT
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

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
        TokenValidity validity =
            userService
                .findConsentById(authenticatedUser.getId(), loginRequest.getClientId())
                .map(Consent::getTokenValidity)
                .orElse(TokenValidity.ONE_DAY);
        jwt =
            jwtTokenProvider.generateConsentToken(
                authentication, loginRequest.getClientId(), validity);
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
   * Endpoint to validate a token for silent sign-in. This method expects a Bearer token in the
   * Authorization header. It validates the token's signature and expiration. If the token is valid,
   * it returns the user's information and a new token.
   *
   * @param authorizationHeader The Authorization header containing the token.
   * @return A ResponseEntity with user data and a new token on success, or an error on failure.
   */
  @GetMapping("/validate-token")
  public ResponseEntity<?> validateToken(
      @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
    if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
      return new ResponseEntity<>(
          "Authorization header is missing or malformed.", HttpStatus.UNAUTHORIZED);
    }

    // Extract the token from the "Bearer " prefix
    String token = authorizationHeader.substring(7);

    // Validate the token's signature and expiration
    if (jwtTokenProvider.validateToken(token)) {
      try {
        // Assuming the token contains the username
        String username = jwtTokenProvider.getUsernameFromJwt(token);
        String clientId = jwtTokenProvider.getClientIdFromJwt(token).orElse(null);
        Optional<User> optionalUser = userService.findUserByUsername(username);

        if (optionalUser.isPresent()) {
          User user = optionalUser.get();
          // To generate a new token, we need an Authentication object.
          Authentication authentication =
              new UsernamePasswordAuthenticationToken(
                  user, null, ((UserDetails) user).getAuthorities());

          TokenValidity tokenValidity =
              user.getConsents().stream()
                  .filter(consent -> consent.getClientId().equals(clientId))
                  .findFirst()
                  .map(Consent::getTokenValidity)
                  .orElse(TokenValidity.ONE_DAY);

          // Generate a new dashboard token for the user to extend the session
          String newToken =
              jwtTokenProvider.generateConsentToken(authentication, clientId, tokenValidity);

          Map<String, Object> response = new HashMap<>();
          response.put("token", newToken);
          response.put("userId", user.getId());
          response.put("username", user.getUsername());

          return new ResponseEntity<>(response, HttpStatus.OK);
        }
      } catch (Exception e) {
        // Catch any exceptions during token parsing or user retrieval
        log.error("Error during token validation: {}", e.getMessage());
        return new ResponseEntity<>("Invalid token or user not found.", HttpStatus.UNAUTHORIZED);
      }
    }

    // Token is invalid (expired, invalid signature, etc.)
    return new ResponseEntity<>("Token is expired or invalid.", HttpStatus.UNAUTHORIZED);
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
