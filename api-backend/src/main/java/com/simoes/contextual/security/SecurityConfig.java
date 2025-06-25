package com.simoes.contextual.security;

import com.simoes.contextual.security.jwt.JwtAuthenticationEntryPoint;
import com.simoes.contextual.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * SecurityConfig configures Spring Security for JWT-based authentication. It sets up stateless
 * sessions, defines access rules, and integrates JWT filters.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final UserDetailsService userDetailsService;
  private final JwtAuthenticationEntryPoint unauthorizedHandler;
  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  /**
   * Configures the SecurityFilterChain to define security rules for HTTP requests.
   *
   * @param http HttpSecurity object to configure
   * @return a configured SecurityFilterChain
   * @throws Exception if an error occurs during configuration
   */
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http.csrf(csrf -> csrf.disable())
        .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(
            auth -> auth.requestMatchers("/api/auth/**").permitAll().anyRequest().authenticated())
        .build();
  }

  /**
   * Configures CORS settings for the application. This method allows specific origins, headers, and
   * methods for cross-origin requests.
   *
   * @return CorsConfigurationSource object with the configured CORS settings.
   */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowCredentials(true);
    config.setAllowedOriginPatterns(
        List.of("http://localhost:3000", "http://localhost:3100", "http://localhost:3200"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  /**
   * Provides an AuthenticationManager bean. This is crucial for authentication in controllers,
   * e.g., in your login endpoint.
   *
   * @param authConfig AuthenticationConfiguration
   * @return AuthenticationManager
   * @throws Exception if an error occurs
   */
  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig)
      throws Exception {
    return authConfig.getAuthenticationManager();
  }

  /**
   * Provides a DaoAuthenticationProvider bean, which is used by the AuthenticationManager to
   * authenticate users based on UserDetailsService and PasswordEncoder.
   *
   * @return DaoAuthenticationProvider
   */
  @Bean
  public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder());
    return authProvider;
  }

  /**
   * Provides a BCryptPasswordEncoder bean for password hashing.
   *
   * @return PasswordEncoder
   */
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
