package com.simoes.contextual.user;

import com.simoes.contextual.consent.Consent;
import com.simoes.contextual.context_attributes.Context;
import com.simoes.contextual.context_attributes.IdentityAttribute;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Represents a user in the system. This class is mapped to a MongoDB document and contains user
 * details, including username, password, email, roles, contexts, and identity attributes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {
  @Id private String id;
  private String username;
  private String password;
  private String email;
  private List<String> roles;

  @Builder.Default
  private List<Context> contexts = Collections.emptyList();

  @Builder.Default
  private List<IdentityAttribute> attributes = Collections.emptyList();

  @Builder.Default
  private List<Consent> consents = Collections.emptyList();

  /**
   * Returns the authorities granted to the user.
   *
   * @return a collection of granted authorities, each represented as a SimpleGrantedAuthority
   */
  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return this.roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
  }

  /**
   * Returns whether the user's account is non-expired.
   *
   * @return true, indicating the account is not expired
   */
  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  /**
   * Returns whether the user's account is non-locked.
   *
   * @return true, indicating the account is not locked
   */
  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  /**
   * Returns whether the user's credentials (password) are non-expired.
   *
   * @return true, indicating the credentials are not expired
   */
  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  /**
   * Returns whether the user is enabled.
   *
   * @return true, indicating the user is enabled
   */
  @Override
  public boolean isEnabled() {
    return true;
  }
}
