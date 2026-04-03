package com.insurai.backend.dto;

public class UnderwriterDecisionDTO {
    private String decision; // "APPROVED" or "REJECTED"
    private String notes;

    public UnderwriterDecisionDTO() {}

    public UnderwriterDecisionDTO(String decision, String notes) {
        this.decision = decision;
        this.notes = notes;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}