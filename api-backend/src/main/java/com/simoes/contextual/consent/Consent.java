package com.simoes.contextual.consent;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * Represents a user's consent for sharing attributes with a client application. When embedded in a User
 * document, its ID is just a regular field.
 */
@Data
@With
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Consent {
  @Field("id")
  private String id;

  private String clientId;
  private List<String> sharedAttributes;
  private Date createdAt;
  private Date lastUpdatedAt;
  private List<Date> accessedAt = Collections.emptyList();
  private TokenValidity tokenValidity;
}
