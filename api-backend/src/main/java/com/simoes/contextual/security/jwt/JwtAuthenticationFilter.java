package com.simoes.contextual.security.jwt;

import com.simoes.contextual.consent.Consent;
import com.simoes.contextual.consent.ConsentService;
import com.simoes.contextual.user.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JwtAuthenticationFilter is responsible for intercepting incoming requests, extracting and
 * validating the JWT, and setting the user's authentication in the Spring Security context.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

  private final JwtTokenProvider jwtTokenProvider;
  private final UserDetailsService userDetailsService;
  private final ConsentService consentService;

  /**
   * This method is called for every request to check if a valid JWT is present. If valid, it sets
   * the authentication in the SecurityContext.
   *
   * @param request the HttpServletRequest
   * @param response the HttpServletResponse
   * @param filterChain the FilterChain to continue processing the request
   * @throws ServletException if an error occurs during filtering
   * @throws IOException if an I/O error occurs
   */
  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    try {
      String jwt = getJwtFromRequest(request);

      // Check if a JWT exists and its signature is valid, and if no authentication is currently
      // set.
      if (StringUtils.hasText(jwt)
          && jwtTokenProvider.validateToken(jwt)
          && SecurityContextHolder.getContext().getAuthentication() == null) {

        // Extract username and user details from the JWT
        String username = jwtTokenProvider.getUsernameFromJwt(jwt);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String userId = ((User) userDetails).getId();

        // Safely extract the consentId.
        Optional<String> clientIdFromJwt = jwtTokenProvider.getClientIdFromJwt(jwt);

        if (clientIdFromJwt.isPresent()) {
          // This token is for client access and requires custom consent validation.
          String clientId = clientIdFromJwt.get();
          Optional<Consent> optionalConsent = consentService.findConsentById(userId, clientId);

          if (optionalConsent.isPresent()) {
            Consent consent = optionalConsent.get();
            // Perform the custom token validity check
            Duration validityDuration =
                Duration.ofMillis(consent.getTokenValidity().getExpirationInMilliseconds());
            Instant tokenExpiration =
                jwtTokenProvider.getIssuedAtFromJwt(jwt).toInstant().plus(validityDuration);

            if (Instant.now().isBefore(tokenExpiration)) {
              // Token is still valid based on consent. Proceed with authentication.
              authenticateUser(request, userDetails);

              // Update the last accessed time on the consent record
              consentService.auditAccess(userId, consent.getId());
            } else {
              logger.warn(
                  "Token for client ID {} has expired based on custom validity.", clientId);
            }
          } else {
            // First time login from client, skip consent validation
            authenticateUser(request, userDetails);
          }
        } else {
          // This is a regular token without a consentId. Simply authenticate the user.
          // The expiration is already handled by the `jwtTokenProvider.validateToken` call.
          authenticateUser(request, userDetails);
        }
      }
    } catch (Exception ex) {
      logger.error("Cannot set user authentication: {}", ex.getMessage());
    }

    filterChain.doFilter(request, response);
  }

  /**
   * Authenticates the user by setting the authentication in the SecurityContext.
   *
   * @param request the HttpServletRequest
   * @param userDetails the UserDetails object containing user information
   */
  private static void authenticateUser(HttpServletRequest request, UserDetails userDetails) {
    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    SecurityContextHolder.getContext().setAuthentication(authentication);
  }

  private String getJwtFromRequest(HttpServletRequest request) {
    // Check if Authorization header is present and starts with "Bearer "
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }

    // Check if JWT is present in cookies
    if (request.getCookies() != null) {
      for (Cookie cookie : request.getCookies()) {
        if ("JWT".equals(cookie.getName())) {
          return cookie.getValue();
        }
      }
    }

    return null;
  }
}
