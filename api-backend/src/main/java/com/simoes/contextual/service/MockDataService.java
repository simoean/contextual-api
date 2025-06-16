package com.simoes.contextual.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.simoes.contextual.model.Context;
import com.simoes.contextual.model.IdentityAttribute;
import com.simoes.contextual.model.User;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class MockDataService {

  private final ConcurrentHashMap<String, User> usersById = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, User> usersByUsername = new ConcurrentHashMap<>();

  @PostConstruct
  public void init() {
    ObjectMapper mapper = new ObjectMapper();
    TypeReference<List<User>> typeReference = new TypeReference<>() {};
    InputStream inputStream = null;
    try {
      inputStream = new ClassPathResource("data/mock-users.json").getInputStream();
      List<User> users = mapper.readValue(inputStream, typeReference);
      for (User user : users) {
        usersById.put(user.getId(), user);
        usersByUsername.put(user.getUsername(), user);
      }
      System.out.println("Mock data loaded successfully for " + users.size() + " users.");
    } catch (IOException e) {
      System.err.println("Failed to load mock data: " + e.getMessage());
      throw new RuntimeException("Failed to load mock user data.", e);
    } finally {
      if (inputStream != null) {
        try {
          inputStream.close();
        } catch (IOException e) {
          System.err.println("Error closing input stream: " + e.getMessage());
        }
      }
    }
  }

  public Optional<User> findUserByUsername(String username) {
    return Optional.ofNullable(usersByUsername.get(username));
  }

  public Optional<User> findUserById(String id) {
    return Optional.ofNullable(usersById.get(id));
  }

  public List<User> findAllUsers() {
    return usersById.values().stream().collect(Collectors.toList());
  }

  public User saveUser(User user) {
    usersById.put(user.getId(), user);
    usersByUsername.put(user.getUsername(), user);
    return user;
  }

  // Context CRUD
  public Optional<Context> updateContext(String userId, String contextId, Context updatedContext) {
    User user = usersById.get(userId);
    if (user == null) return Optional.empty();

    List<Context> userContexts = user.getContexts();
    for (int i = 0; i < userContexts.size(); i++) {
      if (userContexts.get(i).getId().equals(contextId)) {
        updatedContext.setId(contextId);
        userContexts.set(i, updatedContext);
        usersById.put(userId, user);
        usersByUsername.put(user.getUsername(), user);
        return Optional.of(updatedContext);
      }
    }
    return Optional.empty();
  }

  public Optional<Context> createContext(String userId, Context newContext) {
    User user = usersById.get(userId);
    if (user == null) return Optional.empty();

    String newContextId = "ctx-" + UUID.randomUUID().toString().substring(0, 8);
    newContext.setId(newContextId);

    user.getContexts().add(newContext);
    usersById.put(userId, user);
    usersByUsername.put(user.getUsername(), user);
    return Optional.of(newContext);
  }

  public boolean deleteContext(String userId, String contextId) {
    User user = usersById.get(userId);
    if (user == null) return false;

    boolean removed = user.getContexts().removeIf(context -> context.getId().equals(contextId));

    if (removed) {
      // Remove this contextId from any attributes that reference it
      for (IdentityAttribute attr : user.getAttributes()) {
        if (attr.getContextIds() != null) {
          attr.getContextIds().remove(contextId);
        }
      }
      usersById.put(userId, user);
      usersByUsername.put(user.getUsername(), user);
      return true;
    }
    return false;
  }

  // NEW METHODS: Attribute CRUD

  public Optional<IdentityAttribute> createAttribute(String userId, IdentityAttribute newAttribute) {
    User user = usersById.get(userId);
    if (user == null) return Optional.empty();

    // Generate a unique ID for the new attribute
    String newAttributeId = "attr-" + UUID.randomUUID().toString().substring(0, 8);
    newAttribute.setId(newAttributeId);
    newAttribute.setUserId(userId); // Ensure it's linked to the correct user

    // Initialize contextIds list if null
    if (newAttribute.getContextIds() == null) {
      newAttribute.setContextIds(new java.util.ArrayList<>());
    }

    user.getAttributes().add(newAttribute);
    usersById.put(userId, user);
    usersByUsername.put(user.getUsername(), user);
    return Optional.of(newAttribute);
  }

  public Optional<IdentityAttribute> updateAttribute(String userId, String attributeId, IdentityAttribute updatedAttribute) {
    User user = usersById.get(userId);
    if (user == null) return Optional.empty();

    List<IdentityAttribute> userAttributes = user.getAttributes();
    for (int i = 0; i < userAttributes.size(); i++) {
      if (userAttributes.get(i).getId().equals(attributeId)) {
        updatedAttribute.setId(attributeId); // Ensure ID is consistent
        updatedAttribute.setUserId(userId); // Ensure userId is consistent

        // Handle contextIds: if null, initialize to empty list
        if (updatedAttribute.getContextIds() == null) {
          updatedAttribute.setContextIds(new java.util.ArrayList<>());
        }

        userAttributes.set(i, updatedAttribute);
        usersById.put(userId, user);
        usersByUsername.put(user.getUsername(), user);
        return Optional.of(updatedAttribute);
      }
    }
    return Optional.empty(); // Attribute not found for this user
  }

  public boolean deleteAttribute(String userId, String attributeId) {
    User user = usersById.get(userId);
    if (user == null) return false;

    boolean removed = user.getAttributes().removeIf(attribute -> attribute.getId().equals(attributeId));

    if (removed) {
      usersById.put(userId, user);
      usersByUsername.put(user.getUsername(), user);
      return true;
    }
    return false; // Attribute not found for this user
  }
}