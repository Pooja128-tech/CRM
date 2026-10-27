package com.izeon.izeon_crm.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "crm_hr_lead_activities")
public class HrLeadActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long leadId;

    private Long hrUserId;

    private LocalDate followUpDate;

    private String followUpNotes;

    private LocalDate demoDate;

    private LocalTime demoTime;

    private String demoStatus;

    private String demoMode;

    // Retained for compatibility with existing records
    private String demoLocation;

    // New field for offline demo trainer name
    @Column(name = "trainer_name")
    private String trainerName;

    private String demoMeetingLink;

    public HrLeadActivity() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public Long getHrUserId() {
        return hrUserId;
    }

    public void setHrUserId(Long hrUserId) {
        this.hrUserId = hrUserId;
    }

    public LocalDate getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(LocalDate followUpDate) {
        this.followUpDate = followUpDate;
    }

    public String getFollowUpNotes() {
        return followUpNotes;
    }

    public void setFollowUpNotes(String followUpNotes) {
        this.followUpNotes = followUpNotes;
    }

    public LocalDate getDemoDate() {
        return demoDate;
    }

    public void setDemoDate(LocalDate demoDate) {
        this.demoDate = demoDate;
    }

    public LocalTime getDemoTime() {
        return demoTime;
    }

    public void setDemoTime(LocalTime demoTime) {
        this.demoTime = demoTime;
    }

    public String getDemoStatus() {
        return demoStatus;
    }

    public void setDemoStatus(String demoStatus) {
        this.demoStatus = demoStatus;
    }

    public String getDemoMode() {
        return demoMode;
    }

    public void setDemoMode(String demoMode) {
        this.demoMode = demoMode;
    }

    public String getDemoLocation() {
        return demoLocation;
    }

    public void setDemoLocation(String demoLocation) {
        this.demoLocation = demoLocation;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public void setTrainerName(String trainerName) {
        this.trainerName = trainerName;
    }

    public String getDemoMeetingLink() {
        return demoMeetingLink;
    }

    public void setDemoMeetingLink(String demoMeetingLink) {
        this.demoMeetingLink = demoMeetingLink;
    }
}