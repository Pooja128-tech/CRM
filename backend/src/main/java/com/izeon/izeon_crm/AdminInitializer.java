
package com.izeon.izeon_crm;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.izeon.izeon_crm.entity.CrmUser;
import com.izeon.izeon_crm.repository.CrmUserRepository;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner createDefaultAdmin(
            CrmUserRepository crmUserRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            String adminEmail = "admin@izeon.com";

            CrmUser admin = crmUserRepository
                    .findByEmail(adminEmail)
                    .orElseGet(CrmUser::new);

            boolean isNew = admin.getId() == null;

            admin.setName("IZEON Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(
                    passwordEncoder.encode("Admin@123"));
            admin.setRole("ADMIN");

            crmUserRepository.save(admin);

            if (isNew) {
                System.out.println(
                        "Default Admin account created successfully.");
            } else {
                System.out.println(
                        "Admin account password reset successfully.");
            }
        };
    }
}
