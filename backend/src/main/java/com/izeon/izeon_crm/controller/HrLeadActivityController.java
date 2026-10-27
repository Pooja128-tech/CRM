
package com.izeon.izeon_crm.controller;

import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.izeon.izeon_crm.SessionAuth;
import com.izeon.izeon_crm.entity.HrLeadActivity;
import com.izeon.izeon_crm.entity.Lead;
import com.izeon.izeon_crm.service.DemoEmailService;
import com.izeon.izeon_crm.service.HrLeadActivityService;
import com.izeon.izeon_crm.service.LeadService;

@RestController
@RequestMapping("/api/hr-activities")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class HrLeadActivityController {

    private final HrLeadActivityService activityService;
    private final DemoEmailService demoEmailService;
    private final LeadService leadService;

    public HrLeadActivityController(
            HrLeadActivityService activityService,
            DemoEmailService demoEmailService,
            LeadService leadService) {
        this.activityService = activityService;
        this.demoEmailService = demoEmailService;
        this.leadService = leadService;
    }

    // Admin sees all activities; HR sees only its own activities.
    @GetMapping
    public ResponseEntity<?> getActivities(HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        String role = (String) session.getAttribute("crmUserRole");

        if ("ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.ok(
                    activityService.getAllActivities());
        }

        if ("HR".equalsIgnoreCase(role)) {
            Long userId = getSessionUserId(session);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid user session."));
            }

            return ResponseEntity.ok(
                    activityService.getActivitiesByHr(userId));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Access denied."));
    }

    // Save HR activity and send an email for a scheduled demo.
    @PostMapping
    public ResponseEntity<?> saveActivity(
            @RequestBody HrLeadActivity activity,
            HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        String role = (String) session.getAttribute("crmUserRole");

        if (!"HR".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "Only HR can create or update activities."));
        }

        Long userId = getSessionUserId(session);

        if (userId == null || activity.getLeadId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "A valid HR session and lead ID are required."));
        }

        // Retrieve the student lead.
        Lead lead = leadService.getLeadById(activity.getLeadId());

        if (lead == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Student lead not found."));
        }

        // Keep the activity associated with the logged-in HR account.
        HrLeadActivity existing = activityService.getActivityByLeadAndHr(
                activity.getLeadId(), userId);

        if (existing != null) {
            activity.setId(existing.getId());
        } else {
            activity.setId(null);
        }

        activity.setHrUserId(userId);

        boolean scheduledDemo =
                "SCHEDULED".equalsIgnoreCase(activity.getDemoStatus());

        if (scheduledDemo) {

            if (activity.getDemoDate() == null
                    || activity.getDemoTime() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Demo date and time are required."));
            }

            String mode = activity.getDemoMode();

            if (mode == null || mode.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Please select Online or Offline demo mode."));
            }

            if ("ONLINE".equalsIgnoreCase(mode)) {

                if (activity.getDemoMeetingLink() == null
                        || activity.getDemoMeetingLink().isBlank()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                    "message",
                                    "Google Meet link is required for an online demo."));
                }

            } else if ("OFFLINE".equalsIgnoreCase(mode)) {

                // Offline demos require a trainer name.
                if (activity.getTrainerName() == null
                        || activity.getTrainerName().isBlank()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                    "message",
                                    "Trainer name is required for an offline demo."));
                }

            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Demo mode must be ONLINE or OFFLINE."));
            }

            activity.setDemoMode(mode.trim().toUpperCase());
        }

        // Save activity before sending the email.
        HrLeadActivity saved = activityService.saveActivity(activity);

        if (scheduledDemo) {
            try {
                demoEmailService.sendDemoConfirmation(lead, saved);

            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", ex.getMessage()));

            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of(
                                "message",
                                "Demo was saved, but the confirmation email could not be sent. Please check the email configuration."));
            }
        }

        return ResponseEntity.ok(saved);
    }

    private Long getSessionUserId(HttpSession session) {
        Object userId = session.getAttribute("crmUserId");

        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }

        return null;
    }
}
