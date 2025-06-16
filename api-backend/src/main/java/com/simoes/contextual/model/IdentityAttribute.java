package com.simoes.contextual.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IdentityAttribute {
  private String id;
  private String userId; // Links attribute to a specific user
  private String name;   // e.g., "firstName", "email", "jobTitle", " "hobbies"
  private String value;  // The actual data, e.g., "John Doe", "john.doe@example.com"
  private List<String> contextIds; // IDs of contexts this attribute belongs to
  private boolean isPublic; // Indicates if this attribute can be shared by default (e.g., for 'public' context)
}