package com.izeon.izeon_crm;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.izeon.izeon_crm.entity.CrmUser;
import com.izeon.izeon_crm.repository.CrmUserRepository;

@Configuration
public class HrInitializer {

    @Bean
    CommandLineRunner createDefaultHr(
            CrmUserRepository crmUserRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            String hrEmail = "hr@izeon.com";

            CrmUser hr = crmUserRepository
                    .findByEmail(hrEmail)
                    .orElse(null);

            if (hr == null) {
                hr = new CrmUser();
                hr.setName("IZEON HR");
                hr.setEmail(hrEmail);
                hr.setRole("HR");
            }

            hr.setPassword(
                    passwordEncoder.encode("Hr@123456"));

            crmUserRepository.save(hr);

            System.out.println(
                    "HR account password reset successfully.");
        };
    }
}
