package com.insurai.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurai.backend.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {
}