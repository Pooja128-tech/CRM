package com.izeon.izeon_crm.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.izeon.izeon_crm.entity.CrmUser;

public interface CrmUserRepository extends JpaRepository<CrmUser, Long> {

    Optional<CrmUser> findByEmail(String email);

    boolean existsByEmail(String email);
}