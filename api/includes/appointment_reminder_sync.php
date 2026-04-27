<?php

/**
 * Insert one-day-ahead appointment reminders (idempotent per appointment per local day).
 */
function sync_patient_appointment_reminders(mysqli $conn, string $patient_id): void
{
    $sql = "
        INSERT INTO notifications (user_id, title, message, is_read, created_at)
        SELECT
            a.patient_id,
            'Appointment Reminder',
            CONCAT(
                'You have an appointment with Dr. ', u.full_name,
                ' tomorrow (', DATE_FORMAT(a.app_date, '%b %e, %Y'), ') at ',
                DATE_FORMAT(a.app_time, '%h:%i %p'),
                '. Appointment ref. #', a.appointment_id, '.'
            ),
            0,
            NOW()
        FROM appointments a
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.patient_id = ?
          AND a.status = 'Upcoming'
          AND DATEDIFF(a.app_date, CURDATE()) = 1
          AND NOT EXISTS (
              SELECT 1 FROM notifications n
              WHERE n.user_id = a.patient_id
                AND n.title = 'Appointment Reminder'
                AND DATE(n.created_at) = CURDATE()
                AND n.message LIKE CONCAT('%Appointment ref. #', a.appointment_id, '%')
          )
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $patient_id);
    $stmt->execute();
    $stmt->close();
}

function sync_doctor_appointment_reminders(mysqli $conn, string $doctor_id): void
{
    $sql = "
        INSERT INTO notifications (user_id, title, message, is_read, created_at)
        SELECT
            a.doctor_id,
            'Appointment Reminder',
            CONCAT(
                'You have an appointment with ',
                pu.full_name,
                ' tomorrow (', DATE_FORMAT(a.app_date, '%b %e, %Y'), ') at ',
                DATE_FORMAT(a.app_time, '%h:%i %p'),
                '. Appointment ref. #', a.appointment_id, '.'
            ),
            0,
            NOW()
        FROM appointments a
        JOIN users pu ON a.patient_id = pu.user_id
        WHERE a.doctor_id = ?
          AND a.status = 'Upcoming'
          AND DATEDIFF(a.app_date, CURDATE()) = 1
          AND NOT EXISTS (
              SELECT 1 FROM notifications n
              WHERE n.user_id = a.doctor_id
                AND n.title = 'Appointment Reminder'
                AND DATE(n.created_at) = CURDATE()
                AND n.message LIKE CONCAT('%Appointment ref. #', a.appointment_id, '%')
          )
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $doctor_id);
    $stmt->execute();
    $stmt->close();

    sync_doctor_post_appointment_reminders($conn, $doctor_id);
}

function sync_doctor_post_appointment_reminders(mysqli $conn, string $doctor_id): void
{
    $sql = "
        INSERT INTO notifications (user_id, title, message, is_read, created_at)
        SELECT
            a.doctor_id,
            'Action Required: Consultation Follow-up',
            CONCAT(
                'Your appointment with ', pu.full_name, ' on ', DATE_FORMAT(a.app_date, '%b %e, %Y'),
                ' at ', DATE_FORMAT(a.app_time, '%h:%i %p'), ' has ended. ',
                'Please write your comments and schedule the next follow-up date. Appointment ref. #', a.appointment_id, '.'
            ),
            0,
            NOW()
        FROM appointments a
        JOIN users pu ON a.patient_id = pu.user_id
        WHERE a.doctor_id = ?
          AND CONCAT(a.app_date, ' ', a.app_time) <= NOW()
          AND (a.status = 'Upcoming' OR (a.status = 'Completed' AND (a.doctor_comments IS NULL OR a.doctor_comments = '')))
          AND NOT EXISTS (
              SELECT 1 FROM notifications n
              WHERE n.user_id = a.doctor_id
                AND n.title = 'Action Required: Consultation Follow-up'
                AND n.message LIKE CONCAT('%Appointment ref. #', a.appointment_id, '.%')
          )
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $doctor_id);
    $stmt->execute();
    $stmt->close();
}
