package com.insurai.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.insurai.backend.entity.Employee;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.EmployeeRepository;
import com.insurai.backend.repository.UserRepository;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public EmployeeService(EmployeeRepository employeeRepository, UserRepository userRepository) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    public List<Employee> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        if (employees != null && !employees.isEmpty()) {
            // Filter out duplicate employees based on email
            return employees.stream()
                .filter(e -> e.getEmail() != null && !e.getEmail().isEmpty())
                .collect(Collectors.toMap(
                    Employee::getEmail,
                    e -> e,
                    (existing, replacement) -> existing
                ))
                .values()
                .stream()
                .collect(Collectors.toList());
        }

        List<User> users = userRepository.findAll();
        // Filter out duplicate users based on email
        return users.stream()
            .filter(user -> user.getEmail() != null && !user.getEmail().isEmpty())
            .collect(Collectors.toMap(
                User::getEmail,
                user -> user,
                (existing, replacement) -> existing
            ))
            .values()
            .stream()
            .map(user -> {
                Employee employee = new Employee();
                employee.setId(user.getId());

                String firstName = user.getFirstName() != null ? user.getFirstName() : "";
                String lastName = user.getLastName() != null ? user.getLastName() : "";
                String name = (firstName + " " + lastName).trim();
                if (name.isEmpty()) {
                    name = user.getEmail() != null ? user.getEmail() : "Unknown";
                }
                employee.setName(name);
                employee.setEmail(user.getEmail());
                // Assign department based on role or default to Health
                String role = user.getRole() != null ? user.getRole().getName() : "USER";
                String department = getDepartmentForRole(role);
                employee.setDepartment(department);
                employee.setRole(role);
                employee.setStatus("Active");
                return employee;
            })
            .collect(Collectors.toList());
    }

    public Employee saveEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    /**
     * Maps user roles to insurance departments/types
     */
    private String getDepartmentForRole(String role) {
        if (role == null || role.isEmpty()) {
            return "Health"; // Default department
        }
        
        String roleLower = role.toLowerCase();
        
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
}
