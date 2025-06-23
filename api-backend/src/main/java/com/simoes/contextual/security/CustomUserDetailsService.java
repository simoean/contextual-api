package com.simoes.contextual.security;

import com.simoes.contextual.user.UserService;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * CustomUserDetailsService implements UserDetailsService to load user-specific data. It retrieves
 * user details from the UserService based on the username.
 */
@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final UserService userService;

  /**
   * Loads user details by username. This method is called by the authentication manager to retrieve
   * user information.
   *
   * @param username the username of the user to load
   * @return UserDetails object containing user information
   * @throws UsernameNotFoundException if the user is not found
   */
  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    return userService
        .findUserByUsername(username)
        .orElseThrow(
            () -> new UsernameNotFoundException("User not found with username: " + username));
  }
}
