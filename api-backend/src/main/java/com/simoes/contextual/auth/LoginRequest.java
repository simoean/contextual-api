package com.simoes.contextual.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a login request containing user credentials. This class is used to encapsulate the
 * data sent by the client when attempting to log in.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class LoginRequest {
  private String username;
  private String password;
  private String clientId;
}
