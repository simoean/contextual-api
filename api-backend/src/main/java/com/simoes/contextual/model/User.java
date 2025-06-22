package com.simoes.contextual.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;


/**
 * Represents a user in the system.
 * This class is mapped to a MongoDB document and contains user details,
 * including username, password, email, roles, contexts, and identity attributes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {
  @Id
  private String id;
  private String username;
  private String password;
  private String email;
  private List<String> roles;
  private List<Context> contexts;
  private List<IdentityAttribute> attributes;

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return this.roles.stream()
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