
package com.izeon.izeon_crm.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.izeon.izeon_crm.entity.HrLeadActivity;

public interface HrLeadActivityRepository
        extends JpaRepository<HrLeadActivity, Long> {

    List<HrLeadActivity> findByHrUserId(Long hrUserId);

    List<HrLeadActivity> findByLeadId(Long leadId);

    Optional<HrLeadActivity> findByLeadIdAndHrUserId(
            Long leadId,
            Long hrUserId);
}
