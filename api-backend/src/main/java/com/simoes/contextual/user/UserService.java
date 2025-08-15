package com.simoes.contextual.user;

import com.simoes.contextual.consent.Consent;
import com.simoes.contextual.consent.TokenValidity;
import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;

import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing core user operations. This service provides methods to find and save User
 * entities, and acts as the gatekeeper for modifications to embedded user data like contexts and
 * attributes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;

  /**
   * Finds a user by their username.
   *
   * @param username The username of the user to find.
   * @return An Optional containing the User if found, or empty if not found.
   */
  public Optional<User> findUserByUsername(String username) {
    return userRepository.findByUsername(username);
  }

  /**
   * Finds a user by their ID.
   *
   * @param id The ID of the user to find.
   * @return An Optional containing the User if found, or empty if not found.
   */
  public Optional<User> findUserById(String id) {
    return userRepository.findById(id);
  }

  /**
   * Saves a user to the repository.
   *
   * @param user The User object to save.
   * @return The saved User object.
   */
  public User saveUser(User user) {
    return userRepository.save(user);
  }

  /**
   * Deletes a user by their ID. This method is primarily for administrative or cleanup purposes.
   *
   * @param userId The ID of the user to delete.
   * @return true if the user was found and deleted, false otherwise.
   */
  public boolean deleteUser(String userId) {
    if (userRepository.existsById(userId)) {
      userRepository.deleteById(userId);
      return true;
    }
    return false;
  }

  /**
   * Provisions default contexts and attributes for a newly registered user. This method ensures
   * that every new user starts with a predefined set of identity management tools.
   *
   * @param user The newly created User object.
   */
  @Transactional
  public void provisionDefaultUserData(User user) {
    String userId = user.getId();
    if (userId == null) {
      log.error("Cannot provision default data: User ID is null for user {}", user.getUsername());
      throw new IllegalArgumentException("User ID cannot be null for provisioning default data.");
    }

    log.info("Provisioning default data for new user: {}", user.getUsername());

    // Create OOTB Contexts
    Context personalContext =
        Context.builder()
            .id("ctx-" + UUID.randomUUID().toString().substring(0, 8))
            .name("Personal")
            .description("Your personal identity details for everyday use.")
            .build();

    Context professionalContext =
        Context.builder()
            .id("ctx-" + UUID.randomUUID().toString().substring(0, 8))
            .name("Professional")
            .description("Identity details relevant to your professional life and career.")
            .build();

    Context academicContext =
        Context.builder()
            .id("ctx-" + UUID.randomUUID().toString().substring(0, 8))
            .name("Academic")
            .description("Identity details for educational institutions and academic pursuits.")
            .build();

    user.setContexts(Arrays.asList(personalContext, professionalContext, academicContext));

    // Create OOTB Attributes
    // Attributes will be private by default as they contain sensitive information
    IdentityAttribute firstNameAttr =
        IdentityAttribute.builder()
            .id("attr-" + UUID.randomUUID().toString().substring(0, 8))
            .userId(userId)
            .name("First Name")
            .value("")
            .visible(true)
            .contextIds(new ArrayList<>())
            .build();

    IdentityAttribute lastNameAttr =
        IdentityAttribute.builder()
            .id("attr-" + UUID.randomUUID().toString().substring(0, 8))
            .userId(userId)
            .name("Last Name")
            .value("")
            .visible(true)
            .contextIds(new ArrayList<>())
            .build();

    IdentityAttribute emailAttr =
        IdentityAttribute.builder()
            .id("attr-" + UUID.randomUUID().toString().substring(0, 8))
            .userId(userId)
            .name("Email")
            .value("")
            .visible(true)
            .contextIds(new ArrayList<>())
            .build();

    user.setAttributes(Arrays.asList(firstNameAttr, lastNameAttr, emailAttr));

    // Associate Attributes with Contexts
    // Personal Context: FN, LN, Email
    firstNameAttr.getContextIds().add(personalContext.getId());
    lastNameAttr.getContextIds().add(personalContext.getId());
    emailAttr.getContextIds().add(personalContext.getId());

    // Professional Context: FN, LN
    firstNameAttr.getContextIds().add(professionalContext.getId());
    lastNameAttr.getContextIds().add(professionalContext.getId());

    // Academic Context: FN, LN
    firstNameAttr.getContextIds().add(academicContext.getId());
    lastNameAttr.getContextIds().add(academicContext.getId());

    // Ensure no duplicate context IDs in attribute's contextIds list
    firstNameAttr.setContextIds(
        firstNameAttr.getContextIds().stream().distinct().collect(Collectors.toList()));
    lastNameAttr.setContextIds(
        lastNameAttr.getContextIds().stream().distinct().collect(Collectors.toList()));
    emailAttr.setContextIds(
        emailAttr.getContextIds().stream().distinct().collect(Collectors.toList()));

    // Save the user with populated contexts and attributes
    userRepository.save(user);
    log.info("Default contexts and attributes provisioned for user: {}", user.getUsername());
  }

  /**
   * Creates a new context for a user.
   *
   * @param userId The ID of the user for whom the context is to be created.
   * @param newContext The Context object to create.
   * @return An Optional containing the created Context if successful, or empty if the user does not
   *     exist.
   */
  public Optional<Context> createContext(String userId, Context newContext) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              String newContextId = "ctx-" + UUID.randomUUID().toString().substring(0, 8);
              newContext.setId(newContextId);
              user.getContexts().add(newContext);
              userRepository.save(user);
              return newContext;
            });
  }

  /**
   * Updates an existing context for a user.
   *
   * @param userId The ID of the user whose context is to be updated.
   * @param contextId The ID of the context to update.
   * @param updatedContext The Context object with updated values.
   * @return An Optional containing the updated Context if successful, or empty if the user or
   *     context was not found.
   */
  public Optional<Context> updateContext(String userId, String contextId, Context updatedContext) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              List<Context> updatedContexts =
                  user.getContexts().stream()
                      .map(
                          ctx ->
                              ctx.getId().equals(contextId)
                                  ? updatedContext.withId(contextId)
                                  : ctx)
                      .collect(Collectors.toList());

              boolean contextExists =
                  updatedContexts.stream().anyMatch(ctx -> ctx.getId().equals(contextId));

              if (!contextExists) return null;

              user.setContexts(updatedContexts);
              userRepository.save(user);
              return updatedContext.withId(contextId);
            });
  }

  /**
   * Deletes a context by its ID for a user.
   *
   * @param userId The ID of the user whose context is to be deleted.
   * @param contextId The ID of the context to delete.
   * @return true if the context was deleted, false if it was not found.
   */
  public boolean deleteContext(String userId, String contextId) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              boolean removed = user.getContexts().removeIf(ctx -> ctx.getId().equals(contextId));
              if (!removed) return false;

              user.getAttributes()
                  .forEach(
                      attr -> {
                        List<String> contextIds = attr.getContextIds();
                        if (contextIds != null && contextIds.contains(contextId)) {
                          contextIds = new ArrayList<>(contextIds);
                          contextIds.remove(contextId);
                          attr.setContextIds(contextIds);
                        }
                      });

              userRepository.save(user);
              return true;
            })
        .orElse(false);
  }

  /**
   * Creates a new identity attribute for a user.
   *
   * @param userId The ID of the user for whom the attribute is to be created.
   * @param newAttribute The IdentityAttribute object to create.
   * @return An Optional containing the created IdentityAttribute if successful, or empty if the
   *     user does not exist.
   */
  public Optional<IdentityAttribute> createAttribute(
      String userId, IdentityAttribute newAttribute) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              String newId = "attr-" + UUID.randomUUID().toString().substring(0, 8);
              newAttribute.setId(newId);
              newAttribute.setUserId(userId);

              if (newAttribute.getContextIds() == null) {
                newAttribute.setContextIds(new ArrayList<>());
              }

              user.getAttributes().add(newAttribute);
              userRepository.save(user);
              return newAttribute;
            });
  }

  /**
   * Updates an existing identity attribute for a user.
   *
   * @param userId The ID of the user whose attribute is to be updated.
   * @param attributeId The ID of the attribute to update.
   * @param updatedAttribute The IdentityAttribute object with updated values.
   * @return An Optional containing the updated IdentityAttribute if successful, or empty if the
   *     user or attribute was not found.
   */
  public Optional<IdentityAttribute> updateAttribute(
      String userId, String attributeId, IdentityAttribute updatedAttribute) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              List<IdentityAttribute> updatedAttributes =
                  user.getAttributes().stream()
                      .map(
                          attr ->
                              attr.getId().equals(attributeId)
                                  ? prepareUpdatedAttribute(updatedAttribute, userId, attributeId)
                                  : attr)
                      .collect(Collectors.toList());

              boolean exists =
                  updatedAttributes.stream().anyMatch(attr -> attr.getId().equals(attributeId));

              if (!exists) return null;

              user.setAttributes(updatedAttributes);
              userRepository.save(user);
              return updatedAttribute;
            });
  }

  /**
   * Prepares an updated IdentityAttribute by setting its ID and userId.
   *
   * @param attr The IdentityAttribute to prepare.
   * @param userId The ID of the user to whom the attribute belongs.
   * @param id The ID of the attribute.
   * @return The prepared IdentityAttribute with updated ID and userId.
   */
  private IdentityAttribute prepareUpdatedAttribute(
      IdentityAttribute attr, String userId, String id) {
    attr.setId(id);
    attr.setUserId(userId);
    attr.setContextIds(
        attr.getContextIds() == null ? new ArrayList<>() : new ArrayList<>(attr.getContextIds()));
    return attr;
  }

  /**
   * Deletes an identity attribute by its ID for a user.
   *
   * @param userId The ID of the user whose attribute is to be deleted.
   * @param attributeId The ID of the attribute to delete.
   * @return true if the attribute was deleted, false if it was not found.
   */
  public boolean deleteAttribute(String userId, String attributeId) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              boolean removed =
                  user.getAttributes().removeIf(attr -> attr.getId().equals(attributeId));
              if (!removed) return false;

              userRepository.save(user);
              return true;
            })
        .orElse(false);
  }

  /**
   * Finds a user's consent by its ID.
   *
   * @param userId The ID of the user.
   * @param clientId The ID of the consent record.
   * @return An Optional containing the Consent if found, or empty if not found.
   */
  public Optional<Consent> findConsentById(String userId, String clientId) {
    return userRepository
        .findById(userId)
        .flatMap(
            user ->
                user.getConsents().stream()
                    .filter(consent -> consent.getClientId().equals(clientId))
                    .findFirst());
  }

  /**
   * Records or updates a user's consent for a specific client application. If a consent record for
   * the client already exists, it updates the shared attributes and timestamps. If not, a new
   * consent record is created.
   *
   * @param userId The ID of the user.
   * @param newConsent The consent containing the client ID and shared attributes.
   * @return An Optional containing the updated User if successful, or empty if the user is not
   *     found.
   */
  public Optional<User> recordConsent(String userId, Consent newConsent) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              List<Consent> consents = user.getConsents();
              if (consents == null) {
                consents = Collections.emptyList();
                user.setConsents(consents);
              }

              Optional<Consent> existingConsent =
                  consents.stream()
                      .filter(c -> c.getClientId().equals(newConsent.getClientId()))
                      .findFirst();

              if (existingConsent.isPresent()) {
                Consent consent = existingConsent.get();
                consent.setSharedAttributes(newConsent.getSharedAttributes());
                consent.setTokenValidity(newConsent.getTokenValidity());
                consent.setLastUpdatedAt(new Date());
              } else {
                consents.add(
                    newConsent
                        .withId("cons-" + UUID.randomUUID().toString().substring(0, 8))
                        .withCreatedAt(new Date())
                        .withLastUpdatedAt(new Date())
                        .withTokenValidity(TokenValidity.ONE_HOUR));
              }
              return userRepository.save(user);
            });
  }

  /**
   * Deletes a consent by its ID for a user.
   *
   * @param userId The ID of the user whose consent is to be deleted.
   * @param consentId The ID of the consent to delete.
   * @return true if the consent was deleted, false if it was not found.
   */
  public boolean revokeConsent(String userId, String consentId) {
    return userRepository
        .findById(userId)
        .map(
            user -> {
              boolean removed =
                  user.getConsents().removeIf(consent -> consent.getId().equals(consentId));
              if (removed) {
                userRepository.save(user);
              }
              return removed;
            })
        .orElse(false);
  }

  /**
   * Removes a single attribute from an existing consent record.
   *
   * @param userId The ID of the user.
   * @param consentId The ID of the consent record to modify.
   * @param attributeId The ID of the attribute to remove from the consented list.
   * @return true if the attribute was successfully removed and the user saved, false otherwise.
   */
  public boolean removeConsentedAttribute(String userId, String consentId, String attributeId) {
    return userRepository
        .findById(userId)
        .flatMap(
            user -> {
              Optional<Consent> consentOpt =
                  user.getConsents().stream().filter(c -> c.getId().equals(consentId)).findFirst();

              if (consentOpt.isPresent()) {
                Consent consent = consentOpt.get();
                boolean attributeRemoved = consent.getSharedAttributes().remove(attributeId);
                // Save only if the attribute was actually present and removed.
                if (attributeRemoved) {
                  userRepository.save(user);
                  return Optional.of(true);
                }
              }
              return Optional.empty();
            })
        .orElse(false);
  }

  /**
   * Retrieves a list of attributes for a user that have been consented for a specific client.
   *
   * @param userId The ID of the user.
   * @param clientId The client identifier.
   * @return An Optional containing a list of consented IdentityAttributes, or empty if the user or
   *     consent is not found.
   */
  public Optional<List<IdentityAttribute>> getConsentedAttributes(String userId, String clientId) {
    return userRepository
        .findById(userId)
        .flatMap(
            user ->
                user.getConsents().stream()
                    .filter(consent -> consent.getClientId().equals(clientId))
                    .findFirst()
                    .map(
                        consent -> {
                          List<String> consentedAttrIds = consent.getSharedAttributes();
                          return user.getAttributes().stream()
                              .filter(attr -> consentedAttrIds.contains(attr.getId()))
                              .collect(Collectors.toList());
                        }));
  }

  /**
   * Audits access to a user's consent. This method can be used to log or track access to a user's
   * consent for compliance and monitoring purposes.
   *
   * @param userId The ID of the user.
   * @param consentId The ID of the consent record.
   */
  public void auditAccess(String userId, String consentId) {
    userRepository
        .findById(userId)
        .ifPresent(
            user -> {
              Optional<Consent> consentOpt =
                  user.getConsents().stream().filter(c -> c.getId().equals(consentId)).findFirst();

              if (consentOpt.isPresent()) {
                Consent consent = consentOpt.get();
                consent.getAccessedAt().add(new Date());
                userRepository.save(user);
              }
            });
  }
}
