package com.insurai.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.insurai.backend.entity.SupportTicket;
import com.insurai.backend.repository.SupportTicketRepository;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "*")
public class SupportController {

    private final SupportTicketRepository supportTicketRepository;

    public SupportController(SupportTicketRepository supportTicketRepository) {
        this.supportTicketRepository = supportTicketRepository;
    }

    @GetMapping("/tickets")
    public ResponseEntity<?> getTickets(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // For now, return an empty list since we don't have user authentication context
            // In a real implementation, you would extract the user ID from the JWT token
            List<SupportTicket> tickets = supportTicketRepository.findAll();
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch support tickets: " + e.getMessage()));
        }
    }

    @PostMapping("/tickets")
    public ResponseEntity<?> createTicket(@RequestBody Map<String, Object> ticketRequest, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            SupportTicket ticket = new SupportTicket();
            ticket.setSubject((String) ticketRequest.get("subject"));
            ticket.setDescription((String) ticketRequest.get("description"));
            ticket.setCategory((String) ticketRequest.get("category"));
            ticket.setStatus("OPEN");
            ticket.setCreatedAt(LocalDateTime.now());
            ticket.setUpdatedAt(LocalDateTime.now());
            
            // For now, set a default user ID since we don't have authentication context
            // In a real implementation, you would extract the user ID from the JWT token
            ticket.setUserId(1L);
            
            SupportTicket savedTicket = supportTicketRepository.save(ticket);
            return ResponseEntity.ok(savedTicket);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create support ticket: " + e.getMessage()));
        }
    }

    @PostMapping("/contact")
    public ResponseEntity<?> submitContactForm(@RequestBody Map<String, Object> contactRequest) {
        try {
            // Create a support ticket from the contact form
            SupportTicket ticket = new SupportTicket();
            ticket.setSubject((String) contactRequest.get("subject"));
            ticket.setDescription((String) contactRequest.get("message"));
            ticket.setCategory("CONTACT_FORM");
            ticket.setStatus("OPEN");
            ticket.setCreatedAt(LocalDateTime.now());
            ticket.setUpdatedAt(LocalDateTime.now());
            ticket.setUserId(1L); // Default user ID
            
            SupportTicket savedTicket = supportTicketRepository.save(ticket);
            return ResponseEntity.ok(Map.of("message", "Contact form submitted successfully", "ticketId", savedTicket.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to submit contact form: " + e.getMessage()));
        }
    }
}
