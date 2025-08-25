package com.simoes.contextual.auth.social;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import lombok.RequiredArgsConstructor;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RequiredArgsConstructor
public abstract class CallbackHandler {
  protected final RestTemplate restTemplate;
  protected final ObjectMapper objectMapper;

  public abstract List<IdentityAttribute> getUserAttributes(String accessToken, List<Context> userContexts);

  /**
   * Helper method to format a field name into a more readable string.
   */
  String formatFieldName(String name) {
    // Simple example: "family_name" -> "Family Name"
    String formatted = name.replace("_", " ");
    return Character.toUpperCase(formatted.charAt(0)) + formatted.substring(1);
  }
}
