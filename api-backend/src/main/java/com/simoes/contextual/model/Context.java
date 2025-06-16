package com.simoes.contextual.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Context {
  private String id;
  private String name;        // e.g., "Professional", "Personal", "Academic"
  private String description;
}