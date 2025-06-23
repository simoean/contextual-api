package com.simoes.contextual;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for the Contextual Identity application. This class serves as the entry
 * point for the Spring Boot application. It is annotated with @SpringBootApplication, which enables
 * auto-configuration, component scanning, and configuration properties support.
 */
@SpringBootApplication
public class ContextualIdentityApplication {

  /**
   * The main method that starts the Spring Boot application. It uses SpringApplication.run to
   * launch the application.
   *
   * @param args command-line arguments passed to the application
   */
  public static void main(String[] args) {
    SpringApplication.run(ContextualIdentityApplication.class, args);
  }
}
