package com.simoes.contextual.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UserRepository interface for managing User entities in MongoDB. It extends MongoRepository to
 * provide basic CRUD operations.
 */
@Repository
interface UserRepository extends MongoRepository<User, String> {

  /**
   * Finds a User by their username.
   *
   * @param username The username of the User to find.
   * @return An Optional containing the User if found, or empty if not found.
   */
  Optional<User> findByUsername(String username);
}
