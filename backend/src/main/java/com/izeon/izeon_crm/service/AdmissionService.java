
package com.izeon.izeon_crm.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.izeon.izeon_crm.entity.Admission;
import com.izeon.izeon_crm.repository.AdmissionRepository;

@Service
public class AdmissionService {

    private final AdmissionRepository admissionRepository;

    public AdmissionService(AdmissionRepository admissionRepository) {
        this.admissionRepository = admissionRepository;
    }

    // Admin: retrieve all admissions
    public List<Admission> getAllAdmissions() {
        return admissionRepository.findAll();
    }

    // HR: retrieve admissions created by a particular user
    public List<Admission> getAdmissionsByUser(Long createdByUserId) {
        return admissionRepository.findByCreatedByUserId(createdByUserId);
    }

    public Admission getAdmissionById(Long id) {
        return admissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admission not found"));
    }

    public Admission createAdmission(Admission admission) {

        if (admission.getLeadId() == null) {
            throw new RuntimeException("Lead ID is required");
        }

        if (admissionRepository.existsByLeadId(admission.getLeadId())) {
            throw new RuntimeException(
                    "This enquiry already has an admission record");
        }

        if (admission.getStudentName() == null
                || admission.getStudentName().isBlank()) {
            throw new RuntimeException("Student name is required");
        }

        if (admission.getCourseName() == null
                || admission.getCourseName().isBlank()) {
            throw new RuntimeException("Course name is required");
        }

        if (admission.getAdmissionDate() == null) {
            throw new RuntimeException("Admission date is required");
        }

        if (admission.getTotalFees() == null
                || admission.getTotalFees() < 0) {
            throw new RuntimeException("Enter valid total fees");
        }

        if (admission.getPaidFees() == null
                || admission.getPaidFees() < 0
                || admission.getPaidFees() > admission.getTotalFees()) {
            throw new RuntimeException("Enter valid paid fees");
        }

        if (admission.getPaidFees().equals(admission.getTotalFees())) {
            admission.setPaymentStatus("Paid");
        } else if (admission.getPaidFees() > 0) {
            admission.setPaymentStatus("Partial");
        } else {
            admission.setPaymentStatus("Pending");
        }

        return admissionRepository.save(admission);
    }

    public void deleteAdmission(Long id) {
        Admission admission = getAdmissionById(id);
        admissionRepository.delete(admission);
    }
}
