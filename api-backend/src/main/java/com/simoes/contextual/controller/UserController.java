package com.simoes.contextual.controller;

import com.simoes.contextual.model.Context;
import com.simoes.contextual.model.IdentityAttribute;
import com.simoes.contextual.model.User;
import com.simoes.contextual.service.MockDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final MockDataService mockDataService;

  private User getAuthenticatedUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = authentication.getName();
    return mockDataService.findUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found in mock data."));
  }

  // Context Endpoints
  @GetMapping("/me/contexts")
  public ResponseEntity<List<Context>> getUserContexts() {
    User currentUser = getAuthenticatedUser();
    return ResponseEntity.ok(currentUser.getContexts());
  }

  @PutMapping("/me/contexts/{contextId}")
  public ResponseEntity<Context> updateContext(
          @PathVariable String contextId,
          @RequestBody Context updatedContext) {
    User currentUser = getAuthenticatedUser();
    Optional<Context> result = mockDataService.updateContext(currentUser.getId(), contextId, updatedContext);

    return result.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PostMapping("/me/contexts")
  public ResponseEntity<Context> createContext(@RequestBody Context newContext) {
    User currentUser = getAuthenticatedUser();
    Optional<Context> result = mockDataService.createContext(currentUser.getId(), newContext);

    return result.map(ctx -> ResponseEntity.status(HttpStatus.CREATED).body(ctx))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
  }

  @DeleteMapping("/me/contexts/{contextId}")
  public ResponseEntity<Void> deleteContext(@PathVariable String contextId) {
    User currentUser = getAuthenticatedUser();
    boolean deleted = mockDataService.deleteContext(currentUser.getId(), contextId);

    if (deleted) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  // Attribute Endpoints
  @GetMapping("/me/attributes")
  public ResponseEntity<List<IdentityAttribute>> getAllUserAttributes() {
    User currentUser = getAuthenticatedUser();
    return ResponseEntity.ok(currentUser.getAttributes());
  }

  @GetMapping("/me/attributes/{contextId}")
  public ResponseEntity<List<IdentityAttribute>> getContextualAttributes(@PathVariable String contextId) {
    User currentUser = getAuthenticatedUser();

    List<IdentityAttribute> contextualAttributes = currentUser.getAttributes().stream()
            .filter(attribute -> attribute.getContextIds() != null && attribute.getContextIds().contains(contextId))
            .filter(IdentityAttribute::isPublic)
            .collect(Collectors.toList());

    return ResponseEntity.ok(contextualAttributes);
  }

  // NEW ENDPOINT: Create a new attribute
  @PostMapping("/me/attributes")
  public ResponseEntity<IdentityAttribute> createAttribute(@RequestBody IdentityAttribute newAttribute) {
    User currentUser = getAuthenticatedUser();
    Optional<IdentityAttribute> result = mockDataService.createAttribute(currentUser.getId(), newAttribute);

    return result.map(attr -> ResponseEntity.status(HttpStatus.CREATED).body(attr))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
  }

  // NEW ENDPOINT: Update an attribute
  @PutMapping("/me/attributes/{attributeId}")
  public ResponseEntity<IdentityAttribute> updateAttribute(
          @PathVariable String attributeId,
          @RequestBody IdentityAttribute updatedAttribute) {
    User currentUser = getAuthenticatedUser();
    Optional<IdentityAttribute> result = mockDataService.updateAttribute(currentUser.getId(), attributeId, updatedAttribute);

    return result.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  // NEW ENDPOINT: Delete an attribute
  @DeleteMapping("/me/attributes/{attributeId}")
  public ResponseEntity<Void> deleteAttribute(@PathVariable String attributeId) {
    User currentUser = getAuthenticatedUser();
    boolean deleted = mockDataService.deleteAttribute(currentUser.getId(), attributeId);

    if (deleted) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }
}