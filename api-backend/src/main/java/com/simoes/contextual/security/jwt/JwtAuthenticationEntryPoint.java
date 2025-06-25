package com.simoes.contextual.security.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * JwtAuthenticationEntryPoint handles unauthorized access attempts by returning a 401 Unauthorized
 * response. It logs the error and sends a JSON response with error details.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationEntryPoint.class);

  /**
   * This method is invoked when an authentication exception occurs. It sets the response status to
   * 401 Unauthorized and writes a JSON error response.
   *
   * @param request the HttpServletRequest
   * @param response the HttpServletResponse
   * @param authException the AuthenticationException that occurred
   * @throws IOException if an I/O error occurs while writing the response
   */
  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {
    logger.error("Unauthorized error: {}", authException.getMessage());

    response.setContentType("application/json");
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

    final Map<String, Object> body = new HashMap<>();
    body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
    body.put("error", "Unauthorized");
    body.put("message", authException.getMessage());
    body.put("path", request.getServletPath());

    final ObjectMapper mapper = new ObjectMapper();
    mapper.writeValue(response.getOutputStream(), body);
  }
}
