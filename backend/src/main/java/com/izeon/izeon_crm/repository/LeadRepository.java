
package com.izeon.izeon_crm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.izeon.izeon_crm.entity.Lead;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    // Find leads created by a particular user
    List<Lead> findByCreatedByUserId(Long createdByUserId);

}
