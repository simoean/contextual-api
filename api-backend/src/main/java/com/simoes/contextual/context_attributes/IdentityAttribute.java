package com.simoes.contextual.context_attributes;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Represents a single identity attribute (e.g., firstName, email). When embedded in a User
 * document, its ID is just a regular field.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdentityAttribute {
  @Field("id")
  private String id;

  private String userId;
  private String name;
  private String value;
  private boolean visible;
  private List<String> contextIds;
}
