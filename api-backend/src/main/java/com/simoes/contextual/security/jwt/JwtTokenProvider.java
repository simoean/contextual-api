package com.simoes.contextual.security.jwt;

import com.simoes.contextual.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import java.util.stream.Collectors;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

/**
 * JwtTokenProvider is responsible for generating and validating JWT tokens. It uses the secret key
 * and expiration time defined in application properties.
 */
@Component
public class JwtTokenProvider {

  private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

  @Value("${jwt.secret}")
  private String jwtSecret;

  @Value("${jwt.expirationMs}")
  private int jwtExpirationMs;

  /**
   * Generates a JWT token for the authenticated user.
   *
   * @param authentication the authentication object containing user details
   * @return a signed JWT token as a String
   */
  public String generateToken(Authentication authentication) {
    // User class implements UserDetails
    User userPrincipal = (User) authentication.getPrincipal();

    // Get roles as a comma-separated string for the custom claim
    String roles =
        userPrincipal.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

    return Jwts.builder()
        .claims()
        .subject(userPrincipal.getUsername())
        .issuedAt(new Date())
        .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
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
      logger.error("Invalid JWT token: {}", ex.getMessage());
    } catch (ExpiredJwtException ex) {
      logger.error("JWT token is expired: {}", ex.getMessage());
    } catch (UnsupportedJwtException ex) {
      logger.error("JWT token is unsupported: {}", ex.getMessage());
    } catch (IllegalArgumentException ex) {
      logger.error("JWT claims string is empty: {}", ex.getMessage());
    }
    return false;
  }
}
