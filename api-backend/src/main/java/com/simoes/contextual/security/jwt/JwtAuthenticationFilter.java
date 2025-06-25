package com.simoes.contextual.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      String jwt = getJwtFromRequest(request);

      if (StringUtils.hasText(jwt)
          && jwtTokenProvider.validateToken(jwt)
          && SecurityContextHolder.getContext().getAuthentication() == null) {
        String username = jwtTokenProvider.getUsernameFromJwt(jwt);

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    } catch (Exception ex) {
      logger.error("Cannot set user authentication: {}", ex.getMessage());
    }

    filterChain.doFilter(request, response);
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
