
package com.izeon.izeon_crm.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.izeon.izeon_crm.entity.HrLeadActivity;
import com.izeon.izeon_crm.repository.HrLeadActivityRepository;

@Service
public class HrLeadActivityService {

    private final HrLeadActivityRepository activityRepository;

    public HrLeadActivityService(
            HrLeadActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    public List<HrLeadActivity> getAllActivities() {
        return activityRepository.findAll();
    }

    public List<HrLeadActivity> getActivitiesByHr(Long hrUserId) {
        return activityRepository.findByHrUserId(hrUserId);
    }

    public List<HrLeadActivity> getActivitiesByLead(Long leadId) {
        return activityRepository.findByLeadId(leadId);
    }

    public HrLeadActivity getActivityByLeadAndHr(
            Long leadId, Long hrUserId) {
        return activityRepository
                .findByLeadIdAndHrUserId(leadId, hrUserId)
                .orElse(null);
    }

    public HrLeadActivity saveActivity(HrLeadActivity activity) {
        return activityRepository.save(activity);
    }

    public void deleteActivity(Long id) {
        activityRepository.deleteById(id);
    }
}
