package com.insurai.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurai.backend.entity.Employee;
import com.insurai.backend.repository.EmployeeRepository;

/**
 * Service to update existing employees with proper departments
 * This should be run once after the department mapping fix is deployed
 */
@Service
public class EmployeeDepartmentUpdater {

    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * Updates all existing employees with proper departments based on their roles
     */
    @Transactional
    public void updateExistingEmployeesWithDepartments() {
        List<Employee> employees = employeeRepository.findAll();
        
        for (Employee employee : employees) {
            String role = employee.getRole();
            String currentDepartment = employee.getDepartment();
            
            // Only update if department is null or empty
            if (currentDepartment == null || currentDepartment.trim().isEmpty()) {
                String newDepartment = getDepartmentForRole(role);
                employee.setDepartment(newDepartment);
                employeeRepository.save(employee);
                System.out.println("Updated employee " + employee.getId() + 
                                 " role: " + role + " -> department: " + newDepartment);
            }
        }
    }

    /**
     * Maps user roles to insurance departments
     */
    private String getDepartmentForRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return "Health"; // Default department
        }
        
        String roleLower = role.toLowerCase().trim();
        
        // Map roles to insurance departments
        if (roleLower.contains("admin") || roleLower.contains("manager")) {
            return "Health";
        } else if (roleLower.contains("user") || roleLower.contains("customer")) {
            return "Life";
        } else if (roleLower.contains("agent")) {
            return "Travel";
        } else if (roleLower.contains("underwriter")) {
            return "Property";
        } else if (roleLower.contains("hr")) {
            return "Vehicle";
        } else {
            // Default mapping based on common patterns
            return "Health";
        }
    }

    /**
     * Counts employees by department for verification
     */
    public void printDepartmentDistribution() {
        List<Employee> employees = employeeRepository.findAll();
        java.util.Map<String, Integer> distribution = new java.util.HashMap<>();
        
        for (Employee employee : employees) {
            String dept = employee.getDepartment();
            distribution.put(dept, distribution.getOrDefault(dept, 0) + 1);
        }
        
        System.out.println("Employee Department Distribution:");
        distribution.forEach((dept, count) -> 
            System.out.println(dept + ": " + count + " employees"));
    }
}