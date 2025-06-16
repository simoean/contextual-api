package com.simoes.contextual.controller;

import com.simoes.contextual.model.AuthResponse;
import com.simoes.contextual.model.LoginRequest;
import com.simoes.contextual.model.User;
import com.simoes.contextual.service.MockDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final MockDataService mockDataService; 

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> authenticateUser(@RequestBody LoginRequest loginRequest) {
    try {
      // Authenticate the user using Spring Security's AuthenticationManager
      Authentication authentication = authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(
                      loginRequest.getUsername(),
                      loginRequest.getPassword()
              )
      );

      // Set the authenticated user in the SecurityContext
      SecurityContextHolder.getContext().setAuthentication(authentication);

      // Retrieve the full User object from mock data service
      User authenticatedUser = mockDataService.findUserByUsername(loginRequest.getUsername())
              .orElseThrow(() -> new RuntimeException("Authenticated user not found in mock data."));

      // For prototype, return basic user info
      AuthResponse authResponse = new AuthResponse(
              authenticatedUser.getId(),
              authenticatedUser.getUsername(),
              "Login successful"
      );

      return ResponseEntity.ok(authResponse);
    } catch (Exception e) {
      // Handle authentication failures (e.g., bad credentials)
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
              .body(new AuthResponse(null, null, "Invalid username or password"));
    }
  }
}