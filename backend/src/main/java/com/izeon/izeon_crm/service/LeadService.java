
package com.izeon.izeon_crm.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.izeon.izeon_crm.entity.CrmUser;
import com.izeon.izeon_crm.entity.Lead;
import com.izeon.izeon_crm.repository.CrmUserRepository;
import com.izeon.izeon_crm.repository.LeadRepository;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final CrmUserRepository crmUserRepository;

    public LeadService(
            LeadRepository leadRepository,
            CrmUserRepository crmUserRepository) {
        this.leadRepository = leadRepository;
        this.crmUserRepository = crmUserRepository;
    }

    public Lead createLead(Lead lead) {
        return leadRepository.save(lead);
    }

    public List<Lead> getAllLeads() {
        return leadRepository.findAll();
    }

    public List<Lead> getLeadsByCreator(Long createdByUserId) {
        return leadRepository.findByCreatedByUserId(createdByUserId);
    }

    // Find leads created by users with a particular role.
    public List<Lead> getLeadsByCreatorRole(String role) {
        return leadRepository.findAll().stream()
                .filter(lead -> lead.getCreatedByUserId() != null)
                .filter(lead -> {
                    CrmUser creator = crmUserRepository
                            .findById(lead.getCreatedByUserId())
                            .orElse(null);

                    return creator != null
                            && creator.getRole() != null
                            && creator.getRole().trim()
                                    .equalsIgnoreCase(role);
                })
                .collect(Collectors.toList());
    }

    public Lead getLeadById(Long id) {
        return leadRepository.findById(id).orElse(null);
    }

    public Lead updateLead(Long id, Lead updatedLead) {
        Lead existingLead = getLeadById(id);

        if (existingLead == null) {
            return null;
        }

        existingLead.setName(updatedLead.getName());
        existingLead.setEmail(updatedLead.getEmail());
        existingLead.setPhone(updatedLead.getPhone());
        existingLead.setInterestedCourse(
                updatedLead.getInterestedCourse());
        existingLead.setStatus(updatedLead.getStatus());

        // Preserve marketing source tracking.
        existingLead.setSource(updatedLead.getSource());

        // Follow-up tracking fields.
        existingLead.setFollowUpDate(updatedLead.getFollowUpDate());
        existingLead.setFollowUpNotes(updatedLead.getFollowUpNotes());

        // Existing demo scheduling fields.
        existingLead.setDemoDate(updatedLead.getDemoDate());
        existingLead.setDemoTime(updatedLead.getDemoTime());
        existingLead.setDemoStatus(updatedLead.getDemoStatus());

        // New online/offline demo fields.
        existingLead.setDemoMode(updatedLead.getDemoMode());
        existingLead.setDemoLocation(updatedLead.getDemoLocation());
        existingLead.setDemoMeetingLink(
                updatedLead.getDemoMeetingLink());

        return leadRepository.save(existingLead);
    }

    public boolean deleteLead(Long id) {
        if (!leadRepository.existsById(id)) {
            return false;
        }

        leadRepository.deleteById(id);
        return true;
    }
}
