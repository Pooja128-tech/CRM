
package com.izeon.izeon_crm.controller;

import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.izeon.izeon_crm.SessionAuth;
import com.izeon.izeon_crm.entity.Lead;
import com.izeon.izeon_crm.service.LeadService;

@RestController
@RequestMapping("/api/leads")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    // ADMIN, HR, and MARKETING can create leads.
    @PostMapping
    public ResponseEntity<?> createLead(
            @RequestBody Lead lead,
            HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        boolean isAdmin = SessionAuth.hasRole(session, "ADMIN");
        boolean isHr = SessionAuth.hasRole(session, "HR");
        boolean isMarketing = SessionAuth.hasRole(session, "MARKETING");

        if (!isAdmin && !isHr && !isMarketing) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You do not have permission to create leads."
                    ));
        }

        // Always take the creator ID from the authenticated session.
        Long userId = (Long) session.getAttribute("crmUserId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User session is invalid."));
        }

        lead.setCreatedByUserId(userId);

        if (lead.getStatus() == null || lead.getStatus().isBlank()) {
            lead.setStatus("NEW");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(leadService.createLead(lead));
    }

    // ADMIN sees all leads.
    // HR sees only its own leads.
    // MARKETING sees only its own leads.
    @GetMapping
    public ResponseEntity<?> getAllLeads(HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        if (SessionAuth.hasRole(session, "ADMIN")) {
            return ResponseEntity.ok(leadService.getAllLeads());
        }

        if (SessionAuth.hasRole(session, "HR")
                || SessionAuth.hasRole(session, "MARKETING")) {

            Long userId = (Long) session.getAttribute("crmUserId");

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User session is invalid."));
            }

            return ResponseEntity.ok(
                    leadService.getLeadsByCreator(userId)
            );
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                        "message",
                        "You do not have permission to view leads."
                ));
    }

    // ADMIN sees all HR-created enquiries.
    // HR sees enquiries created by its own account.
    @GetMapping("/hr-enquiries")
    public ResponseEntity<?> getHrEnquiries(HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        if (SessionAuth.hasRole(session, "ADMIN")) {
            return ResponseEntity.ok(
                    leadService.getLeadsByCreatorRole("HR")
            );
        }

        if (SessionAuth.hasRole(session, "HR")) {
            Long userId = (Long) session.getAttribute("crmUserId");

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User session is invalid."));
            }

            return ResponseEntity.ok(
                    leadService.getLeadsByCreator(userId)
            );
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Access denied."));
    }

    // Preserve the existing Marketing leads view for HR and Admin.
    @GetMapping("/marketing-leads")
    public ResponseEntity<?> getMarketingLeads(HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        if (!SessionAuth.hasRole(session, "ADMIN")
                && !SessionAuth.hasRole(session, "HR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied."));
        }

        return ResponseEntity.ok(
                leadService.getLeadsByCreatorRole("MARKETING")
        );
    }

    // ADMIN and HR can view any lead.
    // MARKETING can view only its own leads.
    @GetMapping("/{id}")
    public ResponseEntity<?> getLeadById(
            @PathVariable Long id,
            HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        Lead lead = leadService.getLeadById(id);

        if (lead == null) {
            return ResponseEntity.notFound().build();
        }

        if (SessionAuth.hasRole(session, "ADMIN")
                || SessionAuth.hasRole(session, "HR")) {
            return ResponseEntity.ok(lead);
        }

        if (SessionAuth.hasRole(session, "MARKETING")) {
            Long userId = (Long) session.getAttribute("crmUserId");

            if (userId != null
                    && userId.equals(lead.getCreatedByUserId())) {
                return ResponseEntity.ok(lead);
            }

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You can view only enquiries you created."
                    ));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Access denied."));
    }

    // ADMIN and HR can update any lead.
    // MARKETING can update only leads it created.
    @PutMapping("/{id}")
    public ResponseEntity<?> updateLead(
            @PathVariable Long id,
            @RequestBody Lead updatedLead,
            HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        boolean isAdmin = SessionAuth.hasRole(session, "ADMIN");
        boolean isHr = SessionAuth.hasRole(session, "HR");
        boolean isMarketing = SessionAuth.hasRole(session, "MARKETING");

        if (!isAdmin && !isHr && !isMarketing) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied."));
        }

        Lead existingLead = leadService.getLeadById(id);

        if (existingLead == null) {
            return ResponseEntity.notFound().build();
        }

        if (isMarketing) {
            Long userId = (Long) session.getAttribute("crmUserId");

            if (userId == null
                    || !userId.equals(existingLead.getCreatedByUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "message",
                                "You can update only enquiries you created."
                        ));
            }
        }

        // Do not allow request data to change the original creator.
        updatedLead.setCreatedByUserId(existingLead.getCreatedByUserId());

        Lead lead = leadService.updateLead(id, updatedLead);

        if (lead == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(lead);
    }

    // Only ADMIN can delete leads.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLead(
            @PathVariable Long id,
            HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        if (!SessionAuth.hasRole(session, "ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "Only Admin can delete leads."
                    ));
        }

        boolean deleted = leadService.deleteLead(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}
