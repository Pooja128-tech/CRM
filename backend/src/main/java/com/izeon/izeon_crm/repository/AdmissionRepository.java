
package com.izeon.izeon_crm.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.izeon.izeon_crm.entity.Admission;

public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    Optional<Admission> findByLeadId(Long leadId);

    boolean existsByLeadId(Long leadId);

    List<Admission> findByCreatedByUserId(Long createdByUserId);
}
