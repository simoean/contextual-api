package com.simoes.contextual.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.ArrayList; // Added for default initialization
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

  private String id;
  private String username;
  private String password; // Stores hashed password
  private String email;
  private List<String> roles; // Used for Spring Security roles (e.g., "ROLE_USER")

  private List<Context> contexts = new ArrayList<>();
  private List<IdentityAttribute> attributes = new ArrayList<>();

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return roles.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }
}