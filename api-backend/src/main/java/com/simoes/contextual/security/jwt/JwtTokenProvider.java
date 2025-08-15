package com.simoes.contextual.security.jwt;

import com.simoes.contextual.consent.TokenValidity;
import com.simoes.contextual.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import java.security.Key;
import java.util.Date;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

/**
 * JwtTokenProvider is responsible for generating and validating JWT tokens. It uses the secret key
 * and expiration time defined in application properties.
 */
@Slf4j
@Component
public class JwtTokenProvider {

  @Value("${jwt.secret}")
  private String jwtSecret;

  /**
   * Generates a dashboard JWT token for the authenticated user, without a consentId.
   *
   * @param authentication The authentication object containing user details.
   * @return a signed JWT token as a String.
   */
  public String generateDashboardToken(Authentication authentication) {
    User user = (User) authentication.getPrincipal();

    String roles =
        user.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

    Date now = new Date();
    long expirationMillis = now.getTime() + TokenValidity.ONE_DAY.getExpirationInMilliseconds();

    return Jwts.builder()
        .claims()
        .id(user.getId())
        .subject(user.getUsername())
        .issuedAt(now)
        .expiration(new Date(expirationMillis))
        .add("roles", roles)
        .and()
        .signWith(key())
        .compact();
  }

  /**
   * Generates a JWT token for a specific consent, with a custom expiration based on the user's
   * selection.
   *
   * @param authentication The authentication object containing user details.
   * @param clientId The ID of the client app.
   * @param validity The token validity period chosen by the user.
   * @return a signed JWT token as a String.
   */
  public String generateConsentToken(
      Authentication authentication, String clientId, TokenValidity validity) {
    // User class implements UserDetails
    User user = (User) authentication.getPrincipal();

    // Get roles as a comma-separated string for the custom claim
    String roles =
        user.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

    // Set the issued at and expiration dates
    Date now = new Date();
    long expirationMillis = validity.getExpirationInMilliseconds();

    return Jwts.builder()
        .claims()
        .id(user.getId())
        .subject(user.getUsername())
        .issuedAt(now)
        .expiration(new Date(now.getTime() + expirationMillis))
        .add("clientId", clientId)
        .add("roles", roles)
        .and()
        .signWith(key())
        .compact();
  }

  private Key key() {
    return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
  }

  /**
   * Extracts the username from the JWT token.
   *
   * @param token the JWT token
   * @return the issuedAt extracted from the token
   */
  public Date getIssuedAtFromJwt(String token) {
    return Jwts.parser()
        .verifyWith((SecretKey) key())
        .build()
        .parseSignedClaims(token)
        .getPayload()
        .getIssuedAt();
  }

  /**
   * Extracts the issuedAt from the JWT token.
   *
   * @param token the JWT token
   * @return the username extracted from the token
   */
  public String getUsernameFromJwt(String token) {
    return Jwts.parser()
        .verifyWith((SecretKey) key())
        .build()
        .parseSignedClaims(token)
        .getPayload()
        .getSubject();
  }

  /**
   * Safely extracts the clientId from the JWT token.
   *
   * @param token The JWT token.
   * @return An Optional containing the clientId if present, otherwise empty.
   */
  public Optional<String> getClientIdFromJwt(String token) {
    try {
      Claims claims =
          Jwts.parser().verifyWith((SecretKey) key()).build().parseSignedClaims(token).getPayload();
      return Optional.ofNullable(claims.get("clientId", String.class));
    } catch (JwtException | IllegalArgumentException e) {
      log.debug("JWT does not contain a clientId claim.", e);
      return Optional.empty();
    }
  }

  /**
   * Validates the JWT token.
   *
   * @param authToken the JWT token to validate
   * @return true if the token is valid, false otherwise
   */
  public boolean validateToken(String authToken) {
    try {
      Jwts.parser().verifyWith((SecretKey) key()).build().parseSignedClaims(authToken);
      return true;
    } catch (MalformedJwtException ex) {
      log.error("Invalid JWT token: {}", ex.getMessage());
    } catch (ExpiredJwtException ex) {
      log.error("JWT token is expired: {}", ex.getMessage());
    } catch (UnsupportedJwtException ex) {
      log.error("JWT token is unsupported: {}", ex.getMessage());
    } catch (SignatureException ex) {
      log.error("Signature not valid: {}", ex.getMessage());
    } catch (IllegalArgumentException ex) {
      log.error("JWT claims string is empty: {}", ex.getMessage());
    }
    return false;
  }
}
