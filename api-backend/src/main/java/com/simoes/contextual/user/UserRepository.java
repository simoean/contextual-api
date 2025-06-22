package com.simoes.contextual.user;

import com.simoes.contextual.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UserRepository interface for managing User entities in MongoDB.
 * It extends MongoRepository to provide basic CRUD operations.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
  Optional<User> findByUsername(String username);
}