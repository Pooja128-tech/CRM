
package com.izeon.izeon_crm.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.izeon.izeon_crm.dto.LoginRequest;
import com.izeon.izeon_crm.dto.LoginResponse;
import com.izeon.izeon_crm.entity.CrmUser;
import com.izeon.izeon_crm.repository.CrmUserRepository;

@Service
public class AuthService {

    private final CrmUserRepository crmUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            CrmUserRepository crmUserRepository,
            PasswordEncoder passwordEncoder) {
        this.crmUserRepository = crmUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {

        if (request == null
                || request.getEmail() == null
                || request.getPassword() == null
                || request.getEmail().isBlank()
                || request.getPassword().isBlank()) {

            return new LoginResponse(
                    false,
                    "Email and password are required.",
                    null, null, null, null);
        }

        CrmUser user = crmUserRepository
                .findByEmail(request.getEmail().trim())
                .orElse(null);

        if (user == null
                || user.getPassword() == null
                || !passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword())) {

            return new LoginResponse(
                    false,
                    "Invalid email or password.",
                    null, null, null, null);
        }

        if (!"ADMIN".equalsIgnoreCase(user.getRole())
                && !"HR".equalsIgnoreCase(user.getRole())
                && !"MARKETING".equalsIgnoreCase(user.getRole())) {

            return new LoginResponse(
                    false,
                    "This account does not have a valid CRM role.",
                    null, null, null, null);
        }

        return new LoginResponse(
                true,
                "Login successful.",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().toUpperCase());
    }
}
