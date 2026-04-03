package com.insurai.backend.dto;

public class LoginRequest {

    private String email;
    private String password;

    // ✅ Getters
    public String getEmail() { return email; }
    public String getPassword() { return password; }

    // ✅ IMPORTANT: Setters (THIS FIXES 400 ERROR)
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
}