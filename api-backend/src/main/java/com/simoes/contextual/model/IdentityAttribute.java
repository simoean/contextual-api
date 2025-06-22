package com.simoes.contextual.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

/**
 * Represents a single identity attribute (e.g., firstName, email).
 * When embedded in a User document, its ID is just a regular field.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IdentityAttribute {
  @Field("id")
  private String id;
  private String userId; // Redundant when embedded in User, but useful for consistency or if pulled out later
  private String name;
  private String value;
  private boolean visible;
  private List<String> contextIds;
}