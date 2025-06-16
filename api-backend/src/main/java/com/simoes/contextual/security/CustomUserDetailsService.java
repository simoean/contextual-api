package com.simoes.contextual.security;

import com.simoes.contextual.service.MockDataService;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final MockDataService mockDataService;
  
  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    return mockDataService.findUserByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
  }
}