package com.insurai.backend.repository;

import com.insurai.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // OLD method (required everywhere in project)
    Optional<User> findByEmail(String email);

    // NEW method (for login fix - case insensitive)
    Optional<User> findByEmailIgnoreCase(String email);
    
    // Methods for counting users by role
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = :roleName")
    long countByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'ROLE_ADMIN'")
    long countAdminUsers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'ROLE_UNDERWRITER'")
    long countUnderwriters();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'ROLE_HR'")
    long countHrUsers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'ROLE_USER'")
    long countRegularUsers();
}
