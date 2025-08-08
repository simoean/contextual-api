package com.simoes.contextual.consent;

/**
 * Enum representing the validity periods for tokens used in the application.
 * Each enum constant corresponds to a specific duration in milliseconds.
 */
public enum TokenValidity {
  ONE_HOUR(3600000L),
  ONE_DAY(86400000L),
  ONE_MONTH(2592000000L);

  private final long expirationInMilliseconds;

  TokenValidity(long expirationInMilliseconds) {
    this.expirationInMilliseconds = expirationInMilliseconds;
  }

  public long getExpirationInMilliseconds() {
    return expirationInMilliseconds;
  }
}
