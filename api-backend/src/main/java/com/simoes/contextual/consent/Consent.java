package com.simoes.contextual.consent;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;
import java.util.Date;

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
  private List<Date> timestamps;
}
