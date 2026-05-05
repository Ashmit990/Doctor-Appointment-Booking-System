-- Test appointment for Sarah (DOC_SARAH) on today (2026-05-05) at 14:00:00 (2 PM)
-- This appointment has passed the scheduled time, so it should trigger the pending status popup

INSERT INTO appointments (
    patient_id, 
    doctor_id, 
    app_date, 
    app_time, 
    room_num, 
    reason_for_visit, 
    status, 
    created_at
) VALUES (
    'PAT_002',
    'DOC_SARAH',
    '2026-05-05',
    '14:00:00',
    'Room A1',
    'Routine checkup',
    'Upcoming',
    NOW()
);

-- Query to verify the appointment was created and should show in pending list
-- Run this after inserting the appointment
SELECT 
    a.appointment_id,
    a.patient_id,
    a.doctor_id,
    a.app_date,
    a.app_time,
    a.status,
    u.full_name as patient_name,
    CURDATE() as today,
    CURTIME() as current_time,
    CASE 
        WHEN a.app_date < CURDATE() THEN 'Date passed'
        WHEN a.app_date = CURDATE() AND a.app_time < CURTIME() THEN 'Time passed on today'
        ELSE 'Not yet'
    END as status_check
FROM appointments a
JOIN users u ON a.patient_id = u.user_id
WHERE a.doctor_id = 'DOC_SARAH' 
AND a.status = 'Upcoming'
AND a.app_date = '2026-05-05'
ORDER BY a.app_time DESC;
