package com.insurai.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.service.EmployeeDepartmentUpdater;

/**
 * Controller for updating existing employee departments
 * This is a temporary controller to run the department update after deployment
 */
@RestController
@RequestMapping("/api/admin")
public class DepartmentUpdateController {

    @Autowired
    private EmployeeDepartmentUpdater departmentUpdater;

    /**
     * Updates all existing employees with proper departments
     * This endpoint should be called once after the department mapping fix is deployed
     */
    @PostMapping("/update-employee-departments")
    public String updateEmployeeDepartments() {
        try {
            departmentUpdater.updateExistingEmployeesWithDepartments();
            departmentUpdater.printDepartmentDistribution();
            return "Employee departments updated successfully";
        } catch (Exception e) {
            return "Error updating employee departments: " + e.getMessage();
        }
    }
}