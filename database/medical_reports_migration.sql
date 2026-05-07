-- Add medical_reports table to store patient medical reports
CREATE TABLE `medical_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` int(11) NOT NULL,
  `patient_id` varchar(20) NOT NULL,
  `doctor_id` varchar(20) NOT NULL,
  `symptoms` text NOT NULL,
  `diagnosis` text NOT NULL,
  `blood_pressure` varchar(20),
  `weight` decimal(5,2),
  `prescribed_medicines` json,
  `additional_notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`appointment_id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `appointment_report` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
