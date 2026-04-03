package com.insurai.backend.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    
    // Profile Information
    @Column(nullable = true)
    private String phoneNumber;
    
    @Column(nullable = true)
    private String address;
    
    @Column(nullable = true)
    private String city;
    
    @Column(nullable = true)
    private String state;
    
    @Column(nullable = true)
    private String zipCode;
    
    @Column(nullable = true)
    private String dateOfBirth;
    
    @Column(nullable = true)
    private String gender;
    
    @Column(nullable = true)
    private String profilePicture;
    
    // Preferences
    @Column(nullable = true)
    private String language = "en";
    
    @Column(nullable = true)
    private String currency = "USD";
    
    @Column(nullable = true)
    private String timezone = "UTC";
    
    @Column(nullable = true)
    private String theme = "light";
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
    
    @PrePersist
    protected void onCreate() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public Role getRole() { return role; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getZipCode() { return zipCode; }
    public String getDateOfBirth() { return dateOfBirth; }
    public String getGender() { return gender; }
    public String getProfilePicture() { return profilePicture; }
    public String getLanguage() { return language; }
    public String getCurrency() { return currency; }
    public String getTimezone() { return timezone; }
    public String getTheme() { return theme; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setLanguage(String language) { this.language = language; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public void setTheme(String theme) { this.theme = theme; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public void setRole(Role role) { this.role = role; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setAddress(String address) { this.address = address; }
    public void setCity(String city) { this.city = city; }
    public void setState(String state) { this.state = state; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public void setGender(String gender) { this.gender = gender; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    // Builder support
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String username;
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private LocalDateTime createdDate;
        private Role role;
        private String language = "en";
        private String currency = "USD";
        private String timezone = "UTC";
        private String theme = "light";

        public UserBuilder id(Long id) { this.id = id; return this; }
        public UserBuilder username(String username) { this.username = username; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public UserBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public UserBuilder createdDate(LocalDateTime createdDate) { this.createdDate = createdDate; return this; }
        public UserBuilder role(Role role) { this.role = role; return this; }
        public UserBuilder language(String language) { this.language = language; return this; }
        public UserBuilder currency(String currency) { this.currency = currency; return this; }
        public UserBuilder timezone(String timezone) { this.timezone = timezone; return this; }
        public UserBuilder theme(String theme) { this.theme = theme; return this; }

        public User build() {
            User user = new User();
            user.id = this.id;
            user.username = this.username;
            user.email = this.email;
            user.password = this.password;
            user.firstName = this.firstName;
            user.lastName = this.lastName;
            user.createdDate = this.createdDate;
            user.role = this.role;
            user.language = this.language;
            user.currency = this.currency;
            user.timezone = this.timezone;
            user.theme = this.theme;
            return user;
        }
    }
}