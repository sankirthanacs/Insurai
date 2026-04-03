package com.insurai.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurai.backend.entity.Document;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByUserIdOrderByUploadedAtDesc(Long userId);

    List<Document> findAllByOrderByUploadedAtDesc();
}
