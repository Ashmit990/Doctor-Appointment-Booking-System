-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 28, 2026 at 06:12 PM
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
  `feedback` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `patient_id`, `doctor_id`, `app_date`, `app_time`, `room_num`, `reason_for_visit`, `doctor_comments`, `prescribed_medicines`, `status`, `created_at`, `doctor_notes`, `prescriptions`, `next_followup_date`, `next_followup_time`, `next_followup_id`, `feedback`) VALUES
(7, 'PAT_USER', 'DOC_SARAH', '2026-04-05', '09:00:00', 'Room A1', 'Routine heart checkup', NULL, NULL, 'Completed', '2026-04-05 13:43:03', NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'PAT_002', 'DOC_EMILY', '2026-04-05', '11:30:00', 'Room B3', 'Child vaccination', 'Checking Done, Patient is now completely fine.', NULL, 'Completed', '2026-04-05 13:43:03', NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'PAT_003', 'DOC_MIKE', '2026-04-02', '10:00:00', 'Room C2', 'Recurring headaches', NULL, NULL, 'Completed', '2026-04-05 13:43:03', NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'PAT_002', 'DOC_ARJUN', '2026-04-12', '16:00:00', 'Room A1', 'Headache', 'Patient doing well, needs rest', 'Paracetamol 500mg - 1x daily', 'Completed', '2026-04-12 05:24:43', '', '', '2026-05-03', '10:00:00', NULL, ''),
(18, 'PAT_003', 'DOC_ARJUN', '2026-04-12', '12:00:00', 'Room A1', 'Cold', '', '', 'Completed', '2026-04-12 05:27:39', NULL, NULL, NULL, NULL, NULL, NULL),
(26, 'PAT_002', 'DOC_SARAH', '2026-04-28', '09:00:00', 'Room A1', 'Chest Pain', 'The patient is good.', 'Appointment is completed', 'Completed', '2026-04-27 14:49:13', NULL, NULL, NULL, NULL, NULL, NULL),
(27, 'PAT_002', 'DOC_SARAH', '2026-04-30', '11:00:00', 'Room A1', 'Fever', NULL, NULL, 'Upcoming', '2026-04-28 15:32:46', NULL, NULL, NULL, NULL, NULL, NULL),
(28, 'PAT_003', 'DOC_AC98CD', '2026-04-29', '10:00:00', 'Room A1', 'Chest Pain', NULL, NULL, 'Upcoming', '2026-04-28 15:38:13', NULL, NULL, NULL, NULL, NULL, NULL);

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
(3, 'Dr. Abhinash Dawadi', 'abhinash@email.com', 'hash123', 'General', 500.00, 'Cardiologist', 'Accepted', '2026-04-10 06:00:04', '2026-04-28 09:38:50'),
(4, 'Dr Cristiano Ronaldo', 'goat@spentra.com', 'Goat@123', 'Dentist', 500.00, '{\"phone\":\"9876109876\",\"age\":41,\"medical_id\":\"1234\",\"specialization\":\"Dentist\",\"bio\":\"Iam the best. Iam the GOAT. No one is better than me. Iam better than messi ok. Bye\"}', 'Accepted', '2026-04-26 14:02:05', '2026-04-26 14:02:21'),
(5, 'Dr. John Smith', 'johny@email.com', 'Hash@123', 'Cardiology', 1500.00, 'Experienced Cardiologist with 10+ years of practice', 'Accepted', '2026-04-28 15:54:53', '2026-04-28 15:54:53');

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
  `status` enum('Available','Booked','Blocked','Closed') DEFAULT 'Available'
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
(51, 'DOC_SARAH', '2026-04-26', '09:00:00', '10:00:00', ''),
(52, 'DOC_SARAH', '2026-04-27', '10:00:00', '11:00:00', 'Booked'),
(53, 'DOC_SARAH', '2026-04-29', '12:00:00', '13:00:00', 'Booked'),
(54, 'DOC_SARAH', '2026-04-28', '09:00:00', '10:00:00', 'Booked'),
(55, 'DOC_SARAH', '2026-04-28', '16:00:00', '17:00:00', 'Closed'),
(56, 'DOC_SARAH', '2026-04-30', '09:00:00', '10:00:00', 'Available'),
(57, 'DOC_SARAH', '2026-04-30', '10:00:00', '11:00:00', 'Available'),
(58, 'DOC_SARAH', '2026-04-30', '11:00:00', '12:00:00', 'Booked'),
(59, 'DOC_SARAH', '2026-04-30', '12:00:00', '13:00:00', 'Available'),
(60, 'DOC_SARAH', '2026-04-30', '14:00:00', '15:00:00', 'Booked'),
(61, 'DOC_SARAH', '2026-04-30', '15:00:00', '16:00:00', 'Available'),
(62, 'DOC_SARAH', '2026-04-30', '16:00:00', '17:00:00', 'Booked'),
(63, 'DOC_SARAH', '2026-04-28', '10:00:00', '11:00:00', ''),
(64, 'DOC_SARAH', '2026-04-28', '11:00:00', '12:00:00', ''),
(65, 'DOC_SARAH', '2026-04-28', '14:00:00', '15:00:00', 'Closed'),
(66, 'DOC_SARAH', '2026-05-05', '09:00:00', '10:00:00', 'Available'),
(67, 'DOC_SARAH', '2026-05-05', '10:00:00', '11:00:00', 'Available'),
(68, 'DOC_SARAH', '2026-05-05', '14:00:00', '15:00:00', 'Available'),
(69, 'DOC_SARAH', '2026-05-06', '09:00:00', '10:00:00', 'Available'),
(70, 'DOC_SARAH', '2026-05-06', '10:00:00', '11:00:00', 'Available'),
(71, 'DOC_SARAH', '2026-05-06', '14:00:00', '15:00:00', 'Available'),
(72, 'DOC_SARAH', '2026-05-07', '09:00:00', '10:00:00', 'Available'),
(73, 'DOC_SARAH', '2026-05-07', '10:00:00', '11:00:00', 'Available'),
(74, 'DOC_SARAH', '2026-05-07', '14:00:00', '15:00:00', 'Available'),
(75, 'DOC_SARAH', '2026-04-28', '15:00:00', '16:00:00', 'Closed'),
(86, 'DOC_EA8D58', '2026-05-07', '09:00:00', '10:00:00', 'Available'),
(87, 'DOC_EA8D58', '2026-05-07', '10:00:00', '11:00:00', 'Available'),
(88, 'DOC_EA8D58', '2026-05-07', '14:00:00', '15:00:00', 'Available'),
(89, 'DOC_EA8D58', '2026-05-08', '09:00:00', '10:00:00', 'Available'),
(90, 'DOC_EA8D58', '2026-05-08', '10:00:00', '11:00:00', 'Available'),
(91, 'DOC_EA8D58', '2026-05-08', '14:00:00', '15:00:00', 'Available'),
(92, 'DOC_EA8D58', '2026-05-09', '09:00:00', '10:00:00', 'Available'),
(93, 'DOC_EA8D58', '2026-05-09', '10:00:00', '11:00:00', 'Available'),
(94, 'DOC_EA8D58', '2026-05-09', '14:00:00', '15:00:00', 'Available'),
(95, 'DOC_EA8D58', '2026-05-04', '09:00:00', '10:00:00', 'Available'),
(96, 'DOC_EA8D58', '2026-05-04', '10:00:00', '11:00:00', 'Available'),
(97, 'DOC_EA8D58', '2026-05-04', '14:00:00', '15:00:00', 'Available'),
(98, 'DOC_ARJUN', '2026-05-07', '09:00:00', '10:00:00', 'Available'),
(99, 'DOC_ARJUN', '2026-05-07', '10:00:00', '11:00:00', 'Available'),
(100, 'DOC_ARJUN', '2026-05-07', '14:00:00', '15:00:00', 'Available'),
(101, 'DOC_ARJUN', '2026-05-08', '09:00:00', '10:00:00', 'Available'),
(102, 'DOC_ARJUN', '2026-05-08', '10:00:00', '11:00:00', 'Available'),
(103, 'DOC_ARJUN', '2026-05-08', '14:00:00', '15:00:00', 'Available'),
(104, 'DOC_ARJUN', '2026-05-09', '09:00:00', '10:00:00', 'Available'),
(105, 'DOC_ARJUN', '2026-05-09', '10:00:00', '11:00:00', 'Available'),
(106, 'DOC_ARJUN', '2026-05-09', '14:00:00', '15:00:00', 'Available'),
(108, 'DOC_D0BF60', '2026-04-29', '10:00:00', '11:00:00', 'Available'),
(109, 'DOC_D0BF60', '2026-04-29', '14:00:00', '15:00:00', 'Available'),
(110, 'DOC_D0BF60', '2026-04-30', '09:00:00', '10:00:00', ''),
(111, 'DOC_D0BF60', '2026-04-30', '10:00:00', '11:00:00', 'Available'),
(112, 'DOC_D0BF60', '2026-04-30', '14:00:00', '15:00:00', 'Available'),
(113, 'DOC_D0BF60', '2026-05-01', '09:00:00', '10:00:00', 'Available'),
(114, 'DOC_D0BF60', '2026-05-01', '10:00:00', '11:00:00', 'Available'),
(115, 'DOC_D0BF60', '2026-05-01', '14:00:00', '15:00:00', 'Available'),
(116, 'DOC_D0BF60', '2026-04-26', '09:00:00', '10:00:00', 'Available'),
(117, 'DOC_D0BF60', '2026-04-26', '10:00:00', '11:00:00', 'Available'),
(118, 'DOC_D0BF60', '2026-04-26', '14:00:00', '15:00:00', 'Available'),
(119, 'DOC_AC98CD', '2026-04-29', '09:00:00', '10:00:00', 'Available'),
(120, 'DOC_AC98CD', '2026-04-29', '10:00:00', '11:00:00', 'Booked'),
(121, 'DOC_AC98CD', '2026-04-29', '14:00:00', '15:00:00', 'Available'),
(122, 'DOC_AC98CD', '2026-04-30', '09:00:00', '10:00:00', 'Available'),
(123, 'DOC_AC98CD', '2026-04-30', '10:00:00', '11:00:00', 'Available'),
(124, 'DOC_AC98CD', '2026-04-30', '14:00:00', '15:00:00', 'Available'),
(125, 'DOC_AC98CD', '2026-05-01', '09:00:00', '10:00:00', 'Available'),
(126, 'DOC_AC98CD', '2026-05-01', '10:00:00', '11:00:00', 'Available'),
(127, 'DOC_AC98CD', '2026-05-01', '14:00:00', '15:00:00', 'Available'),
(128, 'DOC_JOHN', '2026-04-27', '09:00:00', '09:30:00', 'Closed'),
(129, 'DOC_JOHN', '2026-04-27', '09:30:00', '10:00:00', 'Closed'),
(130, 'DOC_JOHN', '2026-04-27', '10:00:00', '10:30:00', 'Closed'),
(131, 'DOC_JOHN', '2026-04-27', '10:30:00', '11:00:00', 'Closed'),
(132, 'DOC_JOHN', '2026-04-27', '11:00:00', '11:30:00', 'Closed'),
(133, 'DOC_JOHN', '2026-04-27', '11:30:00', '12:00:00', 'Closed'),
(134, 'DOC_JOHN', '2026-04-27', '12:00:00', '12:30:00', 'Closed'),
(135, 'DOC_JOHN', '2026-04-27', '12:30:00', '13:00:00', 'Closed'),
(136, 'DOC_JOHN', '2026-04-27', '13:00:00', '13:30:00', 'Closed'),
(137, 'DOC_JOHN', '2026-04-27', '13:30:00', '14:00:00', 'Closed'),
(138, 'DOC_JOHN', '2026-04-27', '14:00:00', '14:30:00', 'Closed'),
(139, 'DOC_JOHN', '2026-04-27', '14:30:00', '15:00:00', 'Closed'),
(140, 'DOC_JOHN', '2026-04-27', '15:00:00', '15:30:00', 'Closed'),
(141, 'DOC_JOHN', '2026-04-27', '15:30:00', '16:00:00', 'Closed'),
(142, 'DOC_JOHN', '2026-04-27', '16:00:00', '16:30:00', 'Closed'),
(143, 'DOC_JOHN', '2026-04-27', '16:30:00', '17:00:00', 'Closed'),
(144, 'DOC_JOHN', '2026-04-28', '09:00:00', '09:30:00', 'Closed'),
(145, 'DOC_JOHN', '2026-04-28', '09:30:00', '10:00:00', 'Closed'),
(146, 'DOC_JOHN', '2026-04-28', '10:00:00', '10:30:00', 'Closed'),
(147, 'DOC_JOHN', '2026-04-29', '09:00:00', '09:30:00', 'Available'),
(148, 'DOC_JOHN', '2026-04-29', '09:30:00', '10:00:00', 'Available'),
(149, 'DOC_JOHN', '2026-04-29', '10:00:00', '10:30:00', 'Available'),
(150, 'DOC_JOHN', '2026-04-30', '09:00:00', '09:30:00', 'Available'),
(151, 'DOC_JOHN', '2026-04-30', '09:30:00', '10:00:00', 'Available'),
(152, 'DOC_JOHN', '2026-04-30', '10:00:00', '10:30:00', 'Available'),
(153, 'DOC_JOHN', '2026-05-01', '09:00:00', '09:30:00', 'Available'),
(154, 'DOC_JOHN', '2026-05-01', '09:30:00', '10:00:00', 'Available'),
(155, 'DOC_JOHN', '2026-05-01', '10:00:00', '10:30:00', 'Available');

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
('DOC_AC98CD', '', 'General', '', NULL, '', 500.00, 'Cardiologist', NULL),
('DOC_ARJUN', '', 'Cardiology', '9876098765', 5, 'Masters in Health Science', 800.00, 'Myself Amit Mehta. Iam Cardiologist. I can literally do anything and everything so please hire me ok. bye.', 37),
('DOC_D0BF60', '1234', 'Dentist', '9876109876', NULL, '', 500.00, 'Iam the best. Iam the GOAT. No one is better than me. Iam better than messi ok. Bye', 41),
('DOC_EA8D58', '', 'General', '9876109876', 20, 'MD, FACC - Cardiology & Internal Medicine, Board Certified', 500.00, 'Senior Dentist. I can do anything and everything. I can even make dead people alive..so please hire me ok. bye', 54),
('DOC_EMILY', '', 'Pediatrician', '', NULL, NULL, 600.00, 'Caring for children from birth to young adulthood.', NULL),
('DOC_MIKE', '', 'Neurologist', '', NULL, NULL, 900.00, 'Specializes in brain and nervous system disorders.', NULL),
('DOC_SARAH', '5678', 'Cardiology', '+1 (555) 123-4567', 15, 'MD, Board Certified Cardiologist', 740.00, 'Experienced cardiologist with 15 years of clinical practice. Specializes in interventional cardiology and heart disease prevention. Published numerous research papers in cardiac medicine.', 45);

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
(20, 'DOC_SARAH', 'Appointment Reminder', 'You have an appointment with Stacy Mitchell tomorrow (Apr 24, 2026) at 09:00 AM. Appointment ref. #21.', 1, '2026-04-23 11:34:14'),
(22, 'DOC_SARAH', 'Consultation Action Required', 'Appointment with Stacy Mitchell has finished. Please add doctor comments, medicines, and follow-up details if needed. Appointment ref. #20.', 1, '2026-04-26 14:08:51'),
(23, 'DOC_SARAH', 'Consultation Action Required', 'Appointment with Stacy Mitchell has finished. Please add doctor comments, medicines, and follow-up details if needed. Appointment ref. #21.', 1, '2026-04-26 14:08:51'),
(25, 'PAT_002', 'Consultation Completed', 'Your appointment with Dr. Sarah has been marked as Completed. Please provide feedback on your dashboard.', 1, '2026-04-26 14:40:13'),
(26, 'PAT_002', 'Consultation Completed', 'Your appointment with Dr. Sarah has been marked as Completed. Please provide feedback on your dashboard.', 1, '2026-04-26 14:40:26'),
(27, 'DOC_SARAH', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-04-27 at 10:00.', 1, '2026-04-26 14:43:31'),
(28, 'DOC_SARAH', 'Appointment Reminder', 'You have an appointment with Stacy Mitchell tomorrow (Apr 27, 2026) at 10:00 AM. Appointment ref. #22.', 1, '2026-04-26 14:43:38'),
(29, 'DOC_SARAH', 'Action Required: Consultation Follow-up', 'Your appointment with John Doe on Apr 5, 2026 at 09:00 AM has ended. Please write your comments and schedule the next follow-up date. Appointment ref. #7.', 1, '2026-04-27 12:20:43'),
(30, 'DOC_SARAH', 'Action Required: Consultation Follow-up', 'Your appointment with Stacy Mitchell on Apr 20, 2026 at 11:00 AM has ended. Please write your comments and schedule the next follow-up date. Appointment ref. #20.', 1, '2026-04-27 12:20:43'),
(31, 'DOC_SARAH', 'Action Required: Consultation Follow-up', 'Your appointment with Stacy Mitchell on Apr 27, 2026 at 10:00 AM has ended. Please write your comments and schedule the next follow-up date. Appointment ref. #22.', 1, '2026-04-27 12:20:43'),
(32, 'PAT_002', 'Consultation Completed', 'Your appointment with Dr. Sarah has been marked as Completed. Please provide feedback on your dashboard.', 1, '2026-04-27 12:22:29'),
(33, 'PAT_002', 'Follow-up Scheduled', 'Dr. Sarah has scheduled a follow-up appointment for you on Apr 28, 2026 at 02:00 PM.', 1, '2026-04-27 12:22:29'),
(34, 'PAT_002', 'Consultation Completed', 'Your appointment with Dr. Sarah has been marked as Completed. Please provide feedback on your dashboard.', 1, '2026-04-27 12:39:23'),
(35, 'PAT_002', 'Follow-up Scheduled', 'Dr. Sarah has scheduled a follow-up appointment for you on Apr 29, 2026 at 12:00 PM.', 1, '2026-04-27 12:39:23'),
(36, 'PAT_002', 'Consultation Completed', 'Your appointment with Dr. Sarah has been marked as Completed. Please provide feedback on your dashboard.', 1, '2026-04-27 12:48:07'),
(37, 'PAT_002', 'Follow-up Scheduled', 'Dr. Sarah has scheduled a follow-up appointment for you on Apr 30, 2026 at 04:00 PM.', 1, '2026-04-27 14:39:16'),
(38, 'PAT_002', 'Follow-up Appointment Updated', 'Your follow-up appointment with Dr. Sarah has been CHANGED from Apr 30, 2026 at 04:00 PM to Apr 28, 2026 at 09:00 AM.', 1, '2026-04-27 14:43:49'),
(39, 'PAT_002', 'Follow-up Appointment Updated', 'Your follow-up appointment with Dr. Sarah has been CHANGED from Apr 28, 2026 at 09:00 AM to Apr 30, 2026 at 02:00 PM.', 1, '2026-04-27 14:47:36'),
(40, 'DOC_SARAH', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-04-28 at 11:00.', 1, '2026-04-27 14:49:13'),
(41, 'PAT_002', 'Appointment Reminder', 'You have an appointment with Dr. Dr. Sarah tomorrow (Apr 28, 2026) at 11:00 AM. Appointment ref. #26.', 1, '2026-04-27 14:49:13'),
(42, 'DOC_SARAH', 'Appointment Reminder', 'You have an appointment with Stacy Mitchell tomorrow (Apr 28, 2026) at 11:00 AM. Appointment ref. #26.', 1, '2026-04-27 14:49:24'),
(43, 'PAT_002', 'Follow-up Reminder: Tomorrow', 'Reminder: You have a follow-up appointment with Dr. Sarah tomorrow at 11:00 AM. Please arrive 10 minutes early.', 1, '2026-04-27 14:50:48'),
(44, 'DOC_SARAH', 'Appointment Rescheduled', 'Stacy Mitchell has rescheduled their appointment to 2026-04-28 at 09:00.', 1, '2026-04-27 14:51:09'),
(45, 'DOC_SARAH', 'Action Required: Consultation Follow-up', 'Your appointment with Stacy Mitchell on Apr 28, 2026 at 09:00 AM has ended. Please write your comments and schedule the next follow-up date. Appointment ref. #26.', 1, '2026-04-28 08:55:53'),
(46, 'PAT_002', 'Consultation Completed', 'Your appointment with Dr. Sarah has been marked as Completed. Please provide feedback on your dashboard.', 1, '2026-04-28 09:36:17'),
(47, 'DOC_ARJUN', 'Action Required: Consultation Follow-up', 'Your appointment with James Wilson on Apr 12, 2026 at 12:00 PM has ended. Please write your comments and schedule the next follow-up date. Appointment ref. #18.', 0, '2026-04-28 09:58:48'),
(48, 'DOC_SARAH', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-04-30 at 11:00.', 1, '2026-04-28 15:32:46'),
(49, 'DOC_AC98CD', 'New Appointment', 'James Wilson has booked an appointment with you for 2026-04-29 at 10:00.', 1, '2026-04-28 15:38:13'),
(50, 'PAT_003', 'Appointment Reminder', 'You have an appointment with Dr. Dr. Abhinash Dawadi tomorrow (Apr 29, 2026) at 10:00 AM. Appointment ref. #28.', 0, '2026-04-28 15:38:13'),
(51, 'DOC_AC98CD', 'Appointment Reminder', 'You have an appointment with James Wilson tomorrow (Apr 29, 2026) at 10:00 AM. Appointment ref. #28.', 1, '2026-04-28 15:38:21');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `schedule_setup_completed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `role`, `created_at`, `schedule_setup_completed`) VALUES
('ADM_001', 'System Administrator', 'admin@spentra.com', 'admin_hash_123', 'Admin', '2026-04-08 17:53:07', 0),
('DOC_AC98CD', 'Dr. Abhinash Dawadi', 'abhinash@email.com', 'hash123', 'Doctor', '2026-04-28 09:38:50', 1),
('DOC_ARJUN', 'Dr. Amit Mehta', 'arjun123@spentra.com', 'hash123', 'Doctor', '2026-04-05 13:43:02', 1),
('DOC_D0BF60', 'Dr Cristiano Ronaldo', 'goat@spentra.com', 'Goat@123', 'Doctor', '2026-04-26 14:02:21', 1),
('DOC_EA8D58', 'Dr. Subodh Pokharel', 'subodh@email.com', 'hash123', 'Doctor', '2026-04-09 14:16:30', 1),
('DOC_EMILY', 'Dr. Emily Blunt', 'emily@spentra.com', 'hash123', 'Doctor', '2026-04-05 13:43:02', 1),
('DOC_JOHN', 'Dr. John Smith', 'johny@email.com', 'Hash@123', 'Doctor', '2026-04-28 15:58:02', 1),
('DOC_MIKE', 'Dr. Mike Ross', 'mike@spentra.com', 'hash123', 'Doctor', '2026-04-05 13:43:02', 1),
('DOC_SARAH', 'Dr. Sarah', 'sarah@spentra.com', 'hash123', 'Doctor', '2026-04-05 13:43:02', 1),
('PAT_002', 'Stacy Mitchell', 'stacy@email.com', 'hash123', 'Patient', '2026-04-05 13:43:02', 0),
('PAT_003', 'James Wilson', 'james@emal.com', 'hash123', 'Patient', '2026-04-05 13:43:02', 0),
('PAT_004', 'Elina Rodriguez', 'elina@email.com', 'hash123', 'Patient', '2026-04-05 13:43:02', 0),
('PAT_9628', 'Bijay Budhathoki', 'bijay@email.com', 'hash123', 'Patient', '2026-04-09 14:24:04', 0),
('PAT_USER', 'John Doe', 'john@email.com', 'hash123', 'Patient', '2026-04-05 13:43:02', 0);

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
  ADD UNIQUE KEY `unique_doctor_time_slot` (`doctor_id`,`available_date`,`start_time`,`end_time`),
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
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `doctor_approvals`
--
ALTER TABLE `doctor_approvals`
  MODIFY `approval_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `doctor_availability`
--
ALTER TABLE `doctor_availability`
  MODIFY `avail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=156;

--
-- AUTO_INCREMENT for table `earnings`
--
ALTER TABLE `earnings`
  MODIFY `earning_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

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
