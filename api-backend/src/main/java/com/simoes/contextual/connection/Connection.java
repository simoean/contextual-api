package com.simoes.contextual.connection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Represents a single OAuth provider connection for a user.
 * This class stores information about a linked external account.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Connection {
  private String providerId;
  private String contextId;
  private String providerAccessToken;
  private Instant connectedAt;
}
