INSERT INTO `doctor_approvals` (`full_name`, `email`, `password_hash`, `specialization`, `consultation_fee`, `bio`, `status`, `submitted_at`, `reviewed_at`) 
VALUES ('Dr. John Smith', 'john.smith@email.com', 'hashed_password_here', 'Cardiology', 1500.00, 'Experienced Cardiologist with 10+ years of practice', 'Accepted', NOW(), NOW());

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `role`, `created_at`) 
VALUES ('DOC_JOHN', 'Dr. John Smith', 'john.smith@email.com', 'hashed_password_here', 'Doctor', NOW());
