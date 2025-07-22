package com.simoes.contextual.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Represents a registration request containing user credentials. This class is used to encapsulate
 * the data sent by the client when attempting to register a new user.
 */
@Data
@AllArgsConstructor
public class RegisterRequest {
  @NotBlank(message = "Username cannot be empty")
  private String username;

  @NotBlank(message = "Password cannot be empty")
  @Size(min = 8, message = "Password must be at least 8 characters long") // Optional: enforce minimum length
  private String password;
}