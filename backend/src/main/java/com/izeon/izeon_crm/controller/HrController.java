package com.izeon.izeon_crm.controller;

import com.izeon.izeon_crm.SessionAuth;
import com.izeon.izeon_crm.entity.CrmUser;
import com.izeon.izeon_crm.repository.CrmUserRepository;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hr")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class HrController {

    private final CrmUserRepository crmUserRepository;
    private final PasswordEncoder passwordEncoder;

    public HrController(
            CrmUserRepository crmUserRepository,
            PasswordEncoder passwordEncoder) {

        this.crmUserRepository = crmUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ================= CREATE HR ACCOUNT =================
    @PostMapping("/create")
    public ResponseEntity<?> createHr(
            @RequestBody Map<String, String> request,
            HttpSession session) {

        // Only a logged-in Admin can create HR accounts.
        if (!SessionAuth.isLoggedIn(session)
                || !SessionAuth.hasRole(session, "ADMIN")) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                        "success", false,
                        "message", "Only Admin can create HR accounts."
                    ));
        }

        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");

        // Validate required fields.
        if (name == null || name.isBlank()
                || email == null || email.isBlank()
                || password == null || password.isBlank()) {

            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Name, email and password are required."
            ));
        }

        email = email.trim().toLowerCase();

        // Prevent duplicate email accounts.
        if (crmUserRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                        "success", false,
                        "message", "This email already exists."
                    ));
        }

        // Create the HR account.
        CrmUser hr = new CrmUser();
        hr.setName(name.trim());
        hr.setEmail(email);
        hr.setPassword(passwordEncoder.encode(password));
        hr.setRole("HR");

        crmUserRepository.save(hr);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "success", true,
            "message", "HR account created successfully."
        ));
    }

    // ================= CREATE MARKETING ACCOUNT =================
    @PostMapping("/create-marketing")
    public ResponseEntity<?> createMarketing(
            @RequestBody Map<String, String> request,
            HttpSession session) {

        // Only a logged-in Admin can create Marketing accounts.
        if (!SessionAuth.isLoggedIn(session)
                || !SessionAuth.hasRole(session, "ADMIN")) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                        "success", false,
                        "message",
                        "Only Admin can create Marketing accounts."
                    ));
        }

        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");

        // Validate required fields.
        if (name == null || name.isBlank()
                || email == null || email.isBlank()
                || password == null || password.isBlank()) {

            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Name, email and password are required."
            ));
        }

        email = email.trim().toLowerCase();

        // Prevent duplicate email accounts.
        if (crmUserRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                        "success", false,
                        "message", "This email already exists."
                    ));
        }

        // Create the Marketing account.
        CrmUser marketing = new CrmUser();
        marketing.setName(name.trim());
        marketing.setEmail(email);
        marketing.setPassword(passwordEncoder.encode(password));
        marketing.setRole("MARKETING");

        crmUserRepository.save(marketing);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "success", true,
            "message", "Marketing account created successfully."
        ));
    }
}
