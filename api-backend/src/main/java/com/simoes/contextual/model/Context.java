package com.simoes.contextual.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Represents a context (e.g., Professional, Personal, Academic) for identity attributes.
 * When embedded in a User document, its ID is just a regular field.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Context {
  @Field("id")
  private String id;
  private String name;
  private String description;
}