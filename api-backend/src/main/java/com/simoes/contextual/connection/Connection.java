package com.simoes.contextual.connection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;

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
  @Id
  private String id;
  private String providerId;
  private String providerUserId;
  private String contextId;
  private String providerAccessToken;
  private Instant connectedAt;
}
