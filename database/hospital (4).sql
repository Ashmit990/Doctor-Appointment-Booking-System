-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 26, 2026 at 03:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hospital`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` int(11) NOT NULL,
  `patient_id` varchar(20) NOT NULL,
  `doctor_id` varchar(20) NOT NULL,
  `app_date` date NOT NULL,
  `app_time` time NOT NULL,
  `room_num` varchar(10) DEFAULT 'Room A1',
  `reason_for_visit` text DEFAULT NULL,
  `doctor_comments` text DEFAULT NULL,
  `prescribed_medicines` text DEFAULT NULL,
  `status` enum('Upcoming','Completed','Missed','Cancelled') DEFAULT 'Upcoming',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `doctor_notes` text DEFAULT NULL,
  `prescriptions` text DEFAULT NULL,
  `next_followup_date` date DEFAULT NULL,
  `next_followup_time` time DEFAULT NULL,
  `next_followup_id` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `rating` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `patient_id`, `doctor_id`, `app_date`, `app_time`, `room_num`, `reason_for_visit`, `doctor_comments`, `prescribed_medicines`, `status`, `created_at`, `doctor_notes`, `prescriptions`, `next_followup_date`, `next_followup_time`, `next_followup_id`, `feedback`) VALUES
(7, 'PAT_USER', 'DOC_SARAH', '2026-04-05', '09:00:00', 'Room A1', 'Routine heart checkup', NULL, NULL, 'Completed', '2026-04-05 13:43:03', NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'PAT_002', 'DOC_EMILY', '2026-04-05', '11:30:00', 'Room B3', 'Child vaccination', 'Checking Done, Patient is now completely fine.', NULL, 'Completed', '2026-04-05 13:43:03', NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'PAT_003', 'DOC_MIKE', '2026-04-02', '10:00:00', 'Room C2', 'Recurring headaches', NULL, NULL, 'Completed', '2026-04-05 13:43:03', NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'PAT_002', 'DOC_ARJUN', '2026-04-12', '16:00:00', 'Room A1', 'Headache', NULL, NULL, 'Completed', '2026-04-12 05:24:43', '', '', NULL, NULL, NULL, ''),
(18, 'PAT_003', 'DOC_ARJUN', '2026-04-12', '12:00:00', 'Room A1', 'Cold', '', '', 'Completed', '2026-04-12 05:27:39', NULL, NULL, NULL, NULL, NULL, NULL),
(20, 'PAT_002', 'DOC_SARAH', '2026-04-20', '11:00:00', 'Room A1', 'fever', NULL, NULL, 'Upcoming', '2026-04-19 14:03:08', NULL, NULL, NULL, NULL, NULL, NULL),
(21, 'PAT_002', 'DOC_SARAH', '2026-04-24', '09:00:00', 'Room A1', 'High Fever and Chest Pain', NULL, NULL, 'Upcoming', '2026-04-23 11:27:50', NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `doctor_approvals`
--

CREATE TABLE `doctor_approvals` (
  `approval_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `consultation_fee` decimal(10,2) NOT NULL,
  `bio` text DEFAULT NULL,
  `status` enum('Pending','Accepted','Rejected') DEFAULT 'Pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_approvals`
--

INSERT INTO `doctor_approvals` (`approval_id`, `full_name`, `email`, `password_hash`, `specialization`, `consultation_fee`, `bio`, `status`, `submitted_at`, `reviewed_at`) VALUES
(1, 'Dr. Subodh Regmi', 'subodh@email.com', 'hash123', 'General', 500.00, 'Senior Dentist', 'Accepted', '2026-04-09 14:15:40', '2026-04-09 14:16:30'),
(2, 'Dr. Shiwen Mahaju', 'shiwen@email.com', 'hash123', 'General', 500.00, 'Senior Surgeon', 'Pending', '2026-04-10 05:56:46', NULL),
(3, 'Dr. Abhinash Dawadi', 'abhinash@email.com', 'hash123', 'General', 500.00, 'Cardiologist', 'Pending', '2026-04-10 06:00:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `doctor_availability`
--

CREATE TABLE `doctor_availability` (
  `avail_id` int(11) NOT NULL,
  `doctor_id` varchar(20) NOT NULL,
  `available_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('Available','Booked') DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_availability`
--

INSERT INTO `doctor_availability` (`avail_id`, `doctor_id`, `available_date`, `start_time`, `end_time`, `status`) VALUES
(7, 'DOC_SARAH', '2026-04-05', '10:00:00', '11:00:00', 'Booked'),
(9, 'DOC_MIKE', '2026-04-05', '09:00:00', '10:00:00', 'Available'),
(10, 'DOC_EMILY', '2026-04-05', '11:30:00', '12:30:00', 'Booked'),
(11, 'DOC_SARAH', '2026-03-30', '23:45:00', '12:45:00', 'Available'),
(12, 'DOC_SARAH', '2026-04-22', '22:49:00', '23:50:00', 'Booked'),
(13, 'DOC_SARAH', '2026-04-10', '09:50:00', '10:50:00', 'Booked'),
(14, 'DOC_SARAH', '2026-04-09', '11:00:00', '12:00:00', 'Available'),
(15, 'DOC_SARAH', '2026-04-12', '14:30:00', '15:30:00', 'Booked'),
(16, 'DOC_EA8D58', '2026-04-10', '21:01:00', '22:01:00', 'Booked'),
(18, 'DOC_ARJUN', '2026-04-10', '08:20:00', '21:21:00', 'Available'),
(19, 'DOC_SARAH', '2026-04-12', '09:10:00', '10:10:00', 'Booked'),
(20, 'DOC_ARJUN', '2026-04-12', '18:12:00', '19:13:00', 'Booked'),
(22, 'DOC_ARJUN', '2026-04-12', '09:00:00', '10:00:00', 'Available'),
(23, 'DOC_ARJUN', '2026-04-12', '16:00:00', '17:00:00', 'Booked'),
(24, 'DOC_ARJUN', '2026-04-12', '15:00:00', '16:00:00', 'Available'),
(25, 'DOC_ARJUN', '2026-04-12', '14:00:00', '15:00:00', 'Booked'),
(26, 'DOC_ARJUN', '2026-04-12', '12:00:00', '13:00:00', 'Booked'),
(27, 'DOC_ARJUN', '2026-04-12', '11:00:00', '12:00:00', 'Available'),
(28, 'DOC_ARJUN', '2026-04-12', '10:00:00', '11:00:00', 'Available'),
(34, 'DOC_EA8D58', '2026-04-13', '09:00:00', '10:00:00', 'Available'),
(35, 'DOC_EA8D58', '2026-04-13', '11:00:00', '12:00:00', 'Available'),
(36, 'DOC_EA8D58', '2026-04-13', '14:00:00', '15:00:00', 'Available'),
(37, 'DOC_EA8D58', '2026-04-13', '15:00:00', '16:00:00', 'Available'),
(42, 'DOC_SARAH', '2026-04-20', '09:00:00', '10:00:00', 'Available'),
(43, 'DOC_SARAH', '2026-04-20', '10:00:00', '11:00:00', 'Available'),
(44, 'DOC_SARAH', '2026-04-20', '11:00:00', '12:00:00', 'Booked'),
(45, 'DOC_SARAH', '2026-04-20', '12:00:00', '13:00:00', 'Available'),
(48, 'DOC_ARJUN', '2026-04-23', '16:00:00', '17:00:00', 'Available'),
(49, 'DOC_SARAH', '2026-04-24', '09:00:00', '10:00:00', 'Booked'),
(50, 'DOC_SARAH', '2026-04-24', '15:00:00', '16:00:00', 'Available'),
(51, 'DOC_SARAH', '2026-04-26', '09:00:00', '10:00:00', 'Available');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_profiles`
--

CREATE TABLE `doctor_profiles` (
  `user_id` varchar(20) NOT NULL,
  `medical_id` varchar(50) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `experience_years` int(2) DEFAULT NULL,
  `qualifications` varchar(255) DEFAULT NULL,
  `consultation_fee` decimal(10,2) DEFAULT 500.00,
  `bio` text DEFAULT NULL,
  `age` int(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_profiles`
--

INSERT INTO `doctor_profiles` (`user_id`, `medical_id`, `specialization`, `contact_number`, `experience_years`, `qualifications`, `consultation_fee`, `bio`, `age`) VALUES
('DOC_ARJUN', '', 'Cardiology', '9876098765', 5, 'Masters in Health Science', 800.00, 'Myself Amit Mehta. Iam Cardiologist. I can literally do anything and everything so please hire me ok. bye.', 37),
('DOC_EA8D58', '', 'General', '9876109876', 20, 'MD, FACC - Cardiology & Internal Medicine, Board Certified', 500.00, 'Senior Dentist. I can do anything and everything. I can even make dead people alive..so please hire me ok. bye', 54),
('DOC_EMILY', '', 'Pediatrician', '', NULL, NULL, 600.00, 'Caring for children from birth to young adulthood.', NULL),
('DOC_MIKE', '', 'Neurologist', '', NULL, NULL, 900.00, 'Specializes in brain and nervous system disorders.', NULL),
('DOC_SARAH', '', 'Cardiology', '+1 (555) 123-4567', 15, 'MD, Board Certified Cardiologist', 740.00, 'Experienced cardiologist with 15 years of clinical practice. Specializes in interventional cardiology and heart disease prevention. Published numerous research papers in cardiac medicine.', 45);

-- --------------------------------------------------------

--
-- Table structure for table `earnings`
--

CREATE TABLE `earnings` (
  `earning_id` int(11) NOT NULL,
  `doctor_id` varchar(20) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(1, 'PAT_USER', 'Health Notice', 'Keep your prescriptions and reports ready before the visit.', 0, '2026-04-05 13:43:03'),
(2, 'PAT_USER', 'Upcoming Visit', 'You have an appointment with Dr. Sarah Lee at 09:00 AM today.', 0, '2026-04-05 13:43:03'),
(3, 'PAT_002', 'Appointment Reminder', 'Reminder: You have an appointment with Dr. Dr. Sarah Lee tomorrow at 02:30 PM.', 1, '2026-04-11 13:13:05'),
(4, 'PAT_003', 'Appointment Reminder', 'You have an appointment with Dr. Dr. Arjun Mehta tomorrow at 06:12 PM.', 1, '2026-04-11 13:28:55'),
(5, 'DOC_SARAH', 'Appointment Reminder', 'You have an appointment with Stacy Mitchell tomorrow (Apr 12, 2026) at 02:30 PM. Appointment ref. #13.', 1, '2026-04-11 14:05:48'),
(6, 'PAT_003', 'Appointment Reminder', 'You have an appointment with Dr. Dr. Arjun Mehta tomorrow (Apr 12, 2026) at 06:12 PM. Appointment ref. #16.', 1, '2026-04-11 14:08:06'),
(7, 'DOC_ARJUN', 'Appointment Reminder', 'You have an appointment with James Wilson tomorrow (Apr 12, 2026) at 06:12 PM. Appointment ref. #16.', 1, '2026-04-11 14:08:33'),
(8, 'DOC_ARJUN', 'Account updated by admin', 'An administrator updated your account. Your display name is now: Dr. Amit Mehta. Your email is now: arjun123@spentra.com.', 1, '2026-04-11 14:15:16'),
(9, 'PAT_002', 'Appointment Reminder', 'You have an appointment with Dr. Dr. Sarah Lee tomorrow (Apr 12, 2026) at 02:30 PM. Appointment ref. #13.', 1, '2026-04-11 14:15:36'),
(10, 'DOC_ARJUN', 'New Appointment', 'James Wilson has booked an appointment with you for 2026-04-12 at 12:00.', 1, '2026-04-12 05:27:39'),
(11, 'DOC_ARJUN', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-04-12 at 14:00.', 1, '2026-04-12 06:12:30'),
(12, 'DOC_EA8D58', 'Account updated by admin', 'An administrator updated your account. Your display name is now: Dr. Subodh Pokharel. Your email is now: subodh@email.com.', 1, '2026-04-12 08:20:58'),
(13, 'PAT_002', 'Consultation Completed', 'Your appointment with Dr. Amit Mehta has been marked as Completed. Please provide feedback on your dashboard.', 1, '2026-04-17 11:36:24'),
(14, 'DOC_ARJUN', 'New Feedback', 'Patient Stacy Mitchell left a 4-star review.', 1, '2026-04-17 11:45:17'),
(15, 'DOC_SARAH', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-04-20 at 11:00.', 1, '2026-04-19 14:03:08'),
(16, 'DOC_SARAH', 'Appointment Reminder', 'You have an appointment with Stacy Mitchell tomorrow (Apr 20, 2026) at 11:00 AM. Appointment ref. #20.', 1, '2026-04-19 14:03:17'),
(17, 'PAT_002', 'Appointment Reminder', 'You have an appointment with Dr. Dr. Sarah Lee tomorrow (Apr 20, 2026) at 11:00 AM. Appointment ref. #20.', 1, '2026-04-19 15:00:55'),
(18, 'DOC_SARAH', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-04-24 at 09:00.', 1, '2026-04-23 11:27:50'),
(19, 'PAT_002', 'Appointment Reminder', 'You have an appointment with Dr. Dr. Sarah Lee tomorrow (Apr 24, 2026) at 09:00 AM. Appointment ref. #21.', 1, '2026-04-23 11:29:15'),
(20, 'DOC_SARAH', 'Appointment Reminder', 'You have an appointment with Stacy Mitchell tomorrow (Apr 24, 2026) at 09:00 AM. Appointment ref. #21.', 1, '2026-04-23 11:34:14');

-- --------------------------------------------------------

--
-- Table structure for table `patient_profiles`
--

CREATE TABLE `patient_profiles` (
  `user_id` varchar(20) NOT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(15) DEFAULT NULL,
  `age` int(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_profiles`
--

INSERT INTO `patient_profiles` (`user_id`, `blood_group`, `gender`, `contact_number`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `age`) VALUES
('PAT_002', 'O+', 'Male', '9801112223', 'Lalitpur, Nepal', 'Ashmit Dahal', '9876541098', 23),
('PAT_003', 'A-', 'Male', '9803334445', 'Bhaktapur, Nepal', 'James Willson', '9871609876', 36),
('PAT_004', 'B+', NULL, '9805556667', 'Pokhara, Nepal', NULL, NULL, NULL),
('PAT_9628', NULL, NULL, '9876109876', NULL, NULL, NULL, NULL),
('PAT_USER', 'O+', NULL, '9801112220', 'Kathmandu, Nepal', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Patient','Doctor') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `role`, `created_at`) VALUES
('ADM_001', 'System Administrator', 'admin@spentra.com', 'admin_hash_123', 'Admin', '2026-04-08 17:53:07'),
('DOC_ARJUN', 'Dr. Amit Mehta', 'arjun123@spentra.com', 'hash123', 'Doctor', '2026-04-05 13:43:02'),
('DOC_EA8D58', 'Dr. Subodh Pokharel', 'subodh@email.com', 'hash123', 'Doctor', '2026-04-09 14:16:30'),
('DOC_EMILY', 'Dr. Emily Blunt', 'emily@spentra.com', 'hash123', 'Doctor', '2026-04-05 13:43:02'),
('DOC_MIKE', 'Dr. Mike Ross', 'mike@spentra.com', 'hash123', 'Doctor', '2026-04-05 13:43:02'),
('DOC_SARAH', 'Dr. Sarah', 'sarah@spentra.com', 'hash123', 'Doctor', '2026-04-05 13:43:02'),
('PAT_002', 'Stacy Mitchell', 'stacy@email.com', 'hash123', 'Patient', '2026-04-05 13:43:02'),
('PAT_003', 'James Wilson', 'james@emal.com', 'hash123', 'Patient', '2026-04-05 13:43:02'),
('PAT_004', 'Elina Rodriguez', 'elina@email.com', 'hash123', 'Patient', '2026-04-05 13:43:02'),
('PAT_9628', 'Bijay Budhathoki', 'bijay@email.com', 'hash123', 'Patient', '2026-04-09 14:24:04'),
('PAT_USER', 'John Doe', 'john@email.com', 'hash123', 'Patient', '2026-04-05 13:43:02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `doctor_approvals`
--
ALTER TABLE `doctor_approvals`
  ADD PRIMARY KEY (`approval_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `doctor_availability`
--
ALTER TABLE `doctor_availability`
  ADD PRIMARY KEY (`avail_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `doctor_profiles`
--
ALTER TABLE `doctor_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `earnings`
--
ALTER TABLE `earnings`
  ADD PRIMARY KEY (`earning_id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `patient_profiles`
--
ALTER TABLE `patient_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `doctor_approvals`
--
ALTER TABLE `doctor_approvals`
  MODIFY `approval_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `doctor_availability`
--
ALTER TABLE `doctor_availability`
  MODIFY `avail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `earnings`
--
ALTER TABLE `earnings`
  MODIFY `earning_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `doctor_availability`
--
ALTER TABLE `doctor_availability`
  ADD CONSTRAINT `doctor_availability_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `doctor_profiles`
--
ALTER TABLE `doctor_profiles`
  ADD CONSTRAINT `doctor_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `earnings`
--
ALTER TABLE `earnings`
  ADD CONSTRAINT `earnings_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `earnings_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_profiles`
--
ALTER TABLE `patient_profiles`
  ADD CONSTRAINT `patient_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
