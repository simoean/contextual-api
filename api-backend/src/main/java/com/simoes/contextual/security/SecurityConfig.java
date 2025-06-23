package com.simoes.contextual.security;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Security configuration for the application. This class configures Spring Security to handle
 * authentication and authorization. It sets up CORS, disables CSRF protection, and defines security
 * rules for API endpoints.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final CustomUserDetailsService customUserDetailsService;

  /**
   * Configures the security filter chain for the application. This method sets up CORS, disables
   * CSRF protection, and defines authorization rules.
   *
   * @param http HttpSecurity object to configure security settings.
   * @return SecurityFilterChain object with the configured security settings.
   * @throws Exception if an error occurs during configuration.
   */
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable) // Disable CSRF for API development
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(
            authorize ->
                authorize
                    .requestMatchers("/api/auth/**")
                    .permitAll() // Allow unauthenticated access to auth endpoints
                    .anyRequest()
                    .authenticated() // All other requests require authentication
            )
        .sessionManagement(
            session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS) // Use stateless sessions for REST API
            )
        .httpBasic(httpBasic -> {});

    return http.build();
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
   * Provides the AuthenticationManager bean for the application. This bean is used to manage
   * authentication processes.
   *
   * @param authenticationConfiguration AuthenticationConfiguration object to retrieve the
   *     AuthenticationManager.
   * @return AuthenticationManager object.
   * @throws Exception if an error occurs while retrieving the AuthenticationManager.
   */
  @Bean
  public AuthenticationManager authenticationManager(
      AuthenticationConfiguration authenticationConfiguration) throws Exception {
    return authenticationConfiguration.getAuthenticationManager();
  }

  /**
   * Provides a PasswordEncoder bean for the application. This bean is used to encode passwords. For
   * prototype purposes, it uses NoOpPasswordEncoder which does not perform any encoding.
   *
   * @return PasswordEncoder object.
   */
  @Bean
  public PasswordEncoder passwordEncoder() {
    // FOR PROTOTYPE ONLY: Use NoOpPasswordEncoder for plain text passwords.
    // In production, always use a strong password encoder like BCryptPasswordEncoder.
    return NoOpPasswordEncoder.getInstance();
  }
}
