package com.simoes.contextual.user;

import com.simoes.contextual.model.Context;
import com.simoes.contextual.model.IdentityAttribute;
import com.simoes.contextual.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;

  public Optional<User> findUserByUsername(String username) {
    return userRepository.findByUsername(username);
  }

  public Optional<User> findUserById(String id) {
    return userRepository.findById(id);
  }

  public User saveUser(User user) {
    return userRepository.save(user);
  }

  // Context CRUD Operations
  public Optional<Context> updateContext(String userId, String contextId, Context updatedContext) {
    return userRepository
        .findById(userId)
        .flatMap(
            user -> {
              List<Context> userContexts = user.getContexts();
              boolean found = false;
              for (int i = 0; i < userContexts.size(); i++) {
                if (userContexts.get(i).getId().equals(contextId)) {
                  updatedContext.setId(contextId);
                  userContexts.set(i, updatedContext);
                  found = true;
                  break;
                }
              }
              if (found) {
                userRepository.save(user); // Save the updated user document
                return Optional.of(updatedContext);
              }
              return Optional.empty();
            });
  }

  public Optional<Context> createContext(String userId, Context newContext) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              String newContextId = "ctx-" + UUID.randomUUID().toString().substring(0, 8);
              newContext.setId(newContextId);
              newContext.setDescription(
                  newContext.getDescription() != null
                      ? newContext.getDescription()
                      : ""); // Ensure description is not null
              user.getContexts().add(newContext);
              userRepository.save(user); // Save the updated user document
              return Optional.of(newContext);
            })
        .orElse(Optional.empty());
  }

  public boolean deleteContext(String userId, String contextId) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              boolean removed =
                  user.getContexts().removeIf(context -> context.getId().equals(contextId));

              if (removed) {
                // Also, remove this contextId from any attributes that reference it
                for (IdentityAttribute attr : user.getAttributes()) {
                  if (attr.getContextIds() != null) {
                    attr.getContextIds().remove(contextId);
                  }
                }
                userRepository.save(user); // Save the updated user document
                return true;
              }
              return false;
            })
        .orElse(false);
  }

  // Attribute CRUD Operations
  public Optional<IdentityAttribute> createAttribute(
      String userId, IdentityAttribute newAttribute) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              String newAttributeId = "attr-" + UUID.randomUUID().toString().substring(0, 8);
              newAttribute.setId(newAttributeId);
              newAttribute.setUserId(userId);
              if (newAttribute.getContextIds() == null) {
                newAttribute.setContextIds(new java.util.ArrayList<>());
              }
              user.getAttributes().add(newAttribute);
              userRepository.save(user); // Save the updated user document
              return Optional.of(newAttribute);
            })
        .orElse(Optional.empty());
  }

  public Optional<IdentityAttribute> updateAttribute(
      String userId, String attributeId, IdentityAttribute updatedAttribute) {
    return userRepository
        .findById(userId)
        .flatMap(
            user -> {
              List<IdentityAttribute> userAttributes = user.getAttributes();
              boolean found = false;
              for (int i = 0; i < userAttributes.size(); i++) {
                if (userAttributes.get(i).getId().equals(attributeId)) {
                  updatedAttribute.setId(attributeId);
                  updatedAttribute.setUserId(userId);
                  if (updatedAttribute.getContextIds() == null) {
                    updatedAttribute.setContextIds(new java.util.ArrayList<>());
                  }
                  userAttributes.set(i, updatedAttribute);
                  found = true;
                  break;
                }
              }
              if (found) {
                userRepository.save(user);
                return Optional.of(updatedAttribute);
              }
              return Optional.empty();
            });
  }

  public boolean deleteAttribute(String userId, String attributeId) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              boolean removed =
                  user.getAttributes().removeIf(attribute -> attribute.getId().equals(attributeId));
              if (removed) {
                userRepository.save(user);
                return true;
              }
              return false;
            })
        .orElse(false);
  }
}
