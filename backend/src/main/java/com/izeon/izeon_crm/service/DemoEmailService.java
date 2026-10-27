
package com.izeon.izeon_crm.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.izeon.izeon_crm.entity.Lead;
import com.izeon.izeon_crm.entity.HrLeadActivity;

@Service
public class DemoEmailService {

    private final JavaMailSender mailSender;

    public DemoEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendDemoConfirmation(
            Lead lead,
            HrLeadActivity activity) {

        if (lead == null || activity == null) {
            throw new IllegalArgumentException(
                    "Student and demo details are required.");
        }

        if (lead.getEmail() == null || lead.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Student email address is required.");
        }

        LocalDate demoDate = activity.getDemoDate();
        LocalTime demoTime = activity.getDemoTime();

        if (demoDate == null || demoTime == null) {
            throw new IllegalArgumentException(
                    "Demo date and time are required.");
        }

        String mode = activity.getDemoMode();

        if (mode == null || mode.isBlank()) {
            throw new IllegalArgumentException(
                    "Please select Online or Offline demo mode.");
        }

        mode = mode.trim().toUpperCase();

        String date = demoDate.format(
                DateTimeFormatter.ofPattern("dd MMM yyyy"));

        String time = demoTime.format(
                DateTimeFormatter.ofPattern("hh:mm a"));

        StringBuilder body = new StringBuilder();

        body.append("Dear ")
            .append(lead.getName() == null
                    ? "Student" : lead.getName())
            .append(",\n\n");

        body.append("Your ")
            .append(lead.getInterestedCourse() == null
                    ? "course" : lead.getInterestedCourse())
            .append(" demo class has been scheduled.\n\n");

        body.append("Demo Mode: ").append(mode).append("\n");
        body.append("Date: ").append(date).append("\n");
        body.append("Time: ").append(time).append("\n");

        if ("ONLINE".equals(mode)) {

            String link = activity.getDemoMeetingLink();

            if (link == null || link.isBlank()) {
                throw new IllegalArgumentException(
                        "Google Meet link is required for an online demo.");
            }

            body.append("Google Meet Link: ")
                .append(link.trim())
                .append("\n");

        } else if ("OFFLINE".equals(mode)) {

            String trainerName = activity.getTrainerName();

            if (trainerName == null || trainerName.isBlank()) {
                throw new IllegalArgumentException(
                        "Trainer name is required for an offline demo.");
            }

            body.append("Trainer Name: ")
                .append(trainerName.trim())
                .append("\n");

        } else {

            throw new IllegalArgumentException(
                    "Demo mode must be ONLINE or OFFLINE.");
        }

        body.append("\nPlease be ready at the scheduled time.")
            .append("\n\nRegards,\nIZEON IT TRAINING");

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(lead.getEmail().trim());
        message.setSubject("IZEON CRM - Demo Class Confirmation");
        message.setText(body.toString());

        mailSender.send(message);
    }
}
