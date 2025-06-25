package com.simoes.contextual.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents the response returned after a successful authentication. This class encapsulates user
 * information and a message indicating the result of the authentication process.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class AuthResponse {
  private String userId;
  private String username;
  private String message;
  private String token;
}
