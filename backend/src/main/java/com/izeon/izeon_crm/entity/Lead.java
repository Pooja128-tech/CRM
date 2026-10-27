
package com.izeon.izeon_crm.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "crm_leads")
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private String interestedCourse;
    private String status;

    // Marketing source tracking
    private String source;

    // ID of the user who created this lead
    private Long createdByUserId;

    // Follow-up tracking fields
    private LocalDate followUpDate;
    private String followUpNotes;

    // Demo class tracking fields
    private LocalDate demoDate;
    private LocalTime demoTime;
    private String demoStatus;

    // Demo class mode and meeting details
    private String demoMode;
    private String demoLocation;
    private String demoMeetingLink;

    public Lead() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getInterestedCourse() {
        return interestedCourse;
    }

    public void setInterestedCourse(String interestedCourse) {
        this.interestedCourse = interestedCourse;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
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

    // Demo mode: ONLINE or OFFLINE
    public String getDemoMode() {
        return demoMode;
    }

    public void setDemoMode(String demoMode) {
        this.demoMode = demoMode;
    }

    // Offline demo location
    public String getDemoLocation() {
        return demoLocation;
    }

    public void setDemoLocation(String demoLocation) {
        this.demoLocation = demoLocation;
    }

    // Online demo Google Meet link
    public String getDemoMeetingLink() {
        return demoMeetingLink;
    }

    public void setDemoMeetingLink(String demoMeetingLink) {
        this.demoMeetingLink = demoMeetingLink;
    }
}
