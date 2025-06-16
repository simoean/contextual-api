package com.simoes.contextual.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class Test {
  public static String encode(String password) {
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    return encoder.encode(password);
  }

  public static void main(String[] args) { // Add a main method to run it
    System.out.println(encode("password")); // Encodes the word "password"
  }
}