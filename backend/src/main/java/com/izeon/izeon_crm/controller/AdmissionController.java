
package com.izeon.izeon_crm.controller;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.izeon.izeon_crm.SessionAuth;
import com.izeon.izeon_crm.entity.Admission;
import com.izeon.izeon_crm.service.AdmissionService;

@RestController
@RequestMapping("/api/admissions")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class AdmissionController {

    private final AdmissionService admissionService;

    public AdmissionController(AdmissionService admissionService) {
        this.admissionService = admissionService;
    }

    // Admin sees all admissions; HR sees only their own admissions.
    @GetMapping
    public ResponseEntity<?> getAllAdmissions(HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        String role = (String) session.getAttribute("crmUserRole");

        if ("ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.ok(
                    admissionService.getAllAdmissions());
        }

        if ("HR".equalsIgnoreCase(role)) {
            Long userId = getSessionUserId(session);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid user session."));
            }

            return ResponseEntity.ok(
                    admissionService.getAdmissionsByUser(userId));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "message",
                    "You are not allowed to view admissions."
                ));
    }

    // Retrieve a single admission only when the user has permission.
    @GetMapping("/{id}")
    public ResponseEntity<?> getAdmissionById(
            @PathVariable Long id,
            HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        try {
            Admission admission = admissionService.getAdmissionById(id);

            String role = (String) session.getAttribute("crmUserRole");

            if ("ADMIN".equalsIgnoreCase(role)) {
                return ResponseEntity.ok(admission);
            }

            if ("HR".equalsIgnoreCase(role)) {
                Long userId = getSessionUserId(session);

                if (userId != null
                        && userId.equals(admission.getCreatedByUserId())) {
                    return ResponseEntity.ok(admission);
                }
            }

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                        "message",
                        "You are not allowed to view this admission."
                    ));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // The backend assigns ownership from the authenticated session.
    @PostMapping
    public ResponseEntity<?> createAdmission(
            @RequestBody Admission admission,
            HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        String role = (String) session.getAttribute("crmUserRole");

        if (!"ADMIN".equalsIgnoreCase(role)
                && !"HR".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                        "message",
                        "You are not allowed to create admissions."
                    ));
        }

        try {
            Long userId = getSessionUserId(session);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid user session."));
            }

            // Do not trust an owner ID supplied by the frontend.
            admission.setCreatedByUserId(userId);

            Admission savedAdmission =
                    admissionService.createAdmission(admission);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(savedAdmission);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // Only Admin can delete admissions.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdmission(
            @PathVariable Long id,
            HttpSession session) {

        if (!SessionAuth.isLoggedIn(session)
                || !SessionAuth.hasRole(session, "ADMIN")) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                        "message",
                        "Only Admin can delete admissions."
                    ));
        }

        try {
            admissionService.deleteAdmission(id);

            return ResponseEntity.ok(
                    "Admission deleted successfully");

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    private Long getSessionUserId(HttpSession session) {
        Object userId = session.getAttribute("crmUserId");

        if (userId instanceof Long) {
            return (Long) userId;
        }

        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        }

        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }

        return null;
    }
}
