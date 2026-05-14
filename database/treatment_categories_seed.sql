-- treatment_categories: aligns with pages/auth/signup.html profession modal + Physiotherapy
-- Use REPLACE if ids may already exist.

REPLACE INTO `treatment_categories` (`id`, `name`, `description`, `estimated_cost`) VALUES
(1, 'General Physician', 'Basic consultation with a general physician', 500.00),
(2, 'Cardiologist', 'Heart-related examination and diagnosis', 1500.00),
(3, 'Orthopedic', 'Bone and joint assessment and treatment', 1200.00),
(4, 'Dermatologist', 'Skin condition evaluation and treatment', 1200.00),
(5, 'Neurology', 'Brain and nervous system assessment', 2000.00),
(6, 'Pediatrics', 'Child health consultation and checkup', 1000.00),
(7, 'Gynecologist', 'Women''s health consultation', 1000.00),
(8, 'Ophthalmology', 'Eye examination and diagnosis', 1200.00),
(9, 'Physiotherapy', 'Physical rehabilitation and therapy session', 1100.00),
(10, 'Dentist', 'Dental checkup and treatment', 1500.00),
(11, 'Psychiatry', 'Mental health and psychiatric consultation', 1800.00),
(12, 'Radiologist', 'Medical imaging and diagnostic radiology', 1300.00),
(13, 'Anesthesiology', 'Anesthesia and perioperative care', 1400.00),
(14, 'Pathologist', 'Laboratory medicine and disease diagnosis', 1100.00),
(15, 'Emergency Medicine', 'Urgent and emergency medical care', 1600.00),
(16, 'Other', 'Custom or unspecified specialization (default pricing)', 500.00);
