package com.insurai.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurai.backend.entity.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
}