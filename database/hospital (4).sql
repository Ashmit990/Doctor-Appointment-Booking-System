-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 30, 2026 at 06:44 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

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
(26, 'PAT_002', 'DOC_SARAH', '2026-04-28', '09:00:00', 'Room A1', 'Chest Pain', 'The patient is good.', 'Appointment is completed', 'Completed', '2026-04-27 14:49:13', NULL, NULL, NULL, NULL, NULL, 'jkhjhj'),
(27, 'PAT_002', 'DOC_SARAH', '2026-04-30', '11:00:00', 'Room A1', 'Fever', NULL, NULL, 'Upcoming', '2026-04-28 15:32:46', NULL, NULL, NULL, NULL, NULL, NULL),
(28, 'PAT_003', 'DOC_AC98CD', '2026-04-29', '10:00:00', 'Room A1', 'Chest Pain', NULL, NULL, 'Upcoming', '2026-04-28 15:38:13', NULL, NULL, NULL, NULL, NULL, NULL),
(29, 'PAT_002', 'DOC_D0BF60', '2026-04-29', '10:00:00', 'Room A1', 'hfggh', NULL, NULL, 'Upcoming', '2026-04-28 19:40:35', NULL, NULL, NULL, NULL, NULL, NULL),
(30, 'PAT_002', 'DOC_D0BF60', '2026-04-29', '14:00:00', 'Room A1', 'hgg', NULL, NULL, 'Upcoming', '2026-04-28 19:43:02', NULL, NULL, NULL, NULL, NULL, NULL),
(31, 'PAT_002', 'DOC_ARJUN', '2026-05-08', '10:00:00', 'Room A1', 'sad', NULL, NULL, 'Upcoming', '2026-04-28 19:45:37', NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'PAT_002', 'DOC_ARJUN', '2026-05-07', '09:00:00', 'Room A1', 'nbh', NULL, NULL, 'Upcoming', '2026-04-30 15:02:37', NULL, NULL, NULL, NULL, NULL, NULL),
(33, 'PAT_002', 'DOC_ARJUN', '2026-05-08', '14:00:00', 'Room A1', 'nbb', NULL, NULL, 'Upcoming', '2026-04-30 15:04:32', NULL, NULL, NULL, NULL, NULL, NULL),
(34, 'PAT_002', 'DOC_ARJUN', '2026-05-04', '09:00:00', 'Room A1', 'jhahjhgah', NULL, NULL, 'Upcoming', '2026-04-30 15:54:26', NULL, NULL, NULL, NULL, NULL, NULL),
(35, 'PAT_002', 'DOC_ARJUN', '2026-05-07', '10:00:00', 'Room A1', 'hgggfg', NULL, NULL, 'Upcoming', '2026-04-30 15:55:13', NULL, NULL, NULL, NULL, NULL, NULL),
(36, 'PAT_002', 'DOC_ARJUN', '2026-05-04', '09:30:00', 'Room A1', 'nnj', NULL, NULL, 'Upcoming', '2026-04-30 16:12:24', NULL, NULL, NULL, NULL, NULL, NULL),
(37, 'PAT_002', 'DOC_SARAH', '2026-05-11', '09:00:00', 'Room A1', 'nbnbnb', NULL, NULL, 'Upcoming', '2026-04-30 16:12:46', NULL, NULL, NULL, NULL, NULL, NULL);

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
  `bio` text DEFAULT NULL,
  `status` enum('Pending','Accepted','Rejected') DEFAULT 'Pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_approvals`
--

INSERT INTO `doctor_approvals` (`approval_id`, `full_name`, `email`, `password_hash`, `specialization`, `bio`, `status`, `submitted_at`, `reviewed_at`) VALUES
(1, 'Dr. Subodh Regmi', 'subodh@email.com', 'hash123', 'General', 'Senior Dentist', 'Accepted', '2026-04-09 14:15:40', '2026-04-09 14:16:30'),
(2, 'Dr. Shiwen Mahaju', 'shiwen@email.com', 'hash123', 'General', 'Senior Surgeon', 'Pending', '2026-04-10 05:56:46', NULL),
(3, 'Dr. Abhinash Dawadi', 'abhinash@email.com', 'hash123', 'General', 'Cardiologist', 'Accepted', '2026-04-10 06:00:04', '2026-04-28 09:38:50'),
(4, 'Dr Cristiano Ronaldo', 'goat@spentra.com', 'Goat@123', 'Dentist', '{\"phone\":\"9876109876\",\"age\":41,\"medical_id\":\"1234\",\"specialization\":\"Dentist\",\"bio\":\"Iam the best. Iam the GOAT. No one is better than me. Iam better than messi ok. Bye\"}', 'Accepted', '2026-04-26 14:02:05', '2026-04-26 14:02:21'),
(5, 'Dr. John Smith', 'johny@email.com', 'Hash@123', 'Cardiology', 'Experienced Cardiologist with 10+ years of practice', 'Accepted', '2026-04-28 15:54:53', '2026-04-28 15:54:53'),
(6, 'Cowlad', 'cowlad@gmail.com', 'Hash@123', 'Pediatrician', '{\"phone\":\"1234567890\",\"age\":18,\"medical_id\":\"124335\",\"specialization\":\"Pediatrician\",\"bio\":\"hhdawg ahs dhasgd has dhasgd hasg has hs hs ahgdas hsha hahsg haghd sha hah\"}', 'Pending', '2026-04-30 16:42:43', NULL);

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
(56, 'DOC_SARAH', '2026-04-30', '09:00:00', '10:00:00', 'Closed'),
(57, 'DOC_SARAH', '2026-04-30', '10:00:00', '11:00:00', 'Closed'),
(58, 'DOC_SARAH', '2026-04-30', '11:00:00', '12:00:00', 'Booked'),
(59, 'DOC_SARAH', '2026-04-30', '12:00:00', '13:00:00', 'Closed'),
(60, 'DOC_SARAH', '2026-04-30', '14:00:00', '15:00:00', 'Booked'),
(61, 'DOC_SARAH', '2026-04-30', '15:00:00', '16:00:00', 'Closed'),
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
(98, 'DOC_ARJUN', '2026-05-07', '09:00:00', '10:00:00', 'Booked'),
(99, 'DOC_ARJUN', '2026-05-07', '10:00:00', '11:00:00', 'Booked'),
(100, 'DOC_ARJUN', '2026-05-07', '14:00:00', '15:00:00', 'Available'),
(101, 'DOC_ARJUN', '2026-05-08', '09:00:00', '10:00:00', 'Available'),
(102, 'DOC_ARJUN', '2026-05-08', '10:00:00', '11:00:00', 'Booked'),
(103, 'DOC_ARJUN', '2026-05-08', '14:00:00', '15:00:00', 'Booked'),
(104, 'DOC_ARJUN', '2026-05-09', '09:00:00', '10:00:00', 'Available'),
(105, 'DOC_ARJUN', '2026-05-09', '10:00:00', '11:00:00', 'Available'),
(106, 'DOC_ARJUN', '2026-05-09', '14:00:00', '15:00:00', 'Available'),
(108, 'DOC_D0BF60', '2026-04-29', '10:00:00', '11:00:00', 'Booked'),
(109, 'DOC_D0BF60', '2026-04-29', '14:00:00', '15:00:00', 'Booked'),
(110, 'DOC_D0BF60', '2026-04-30', '09:00:00', '10:00:00', ''),
(111, 'DOC_D0BF60', '2026-04-30', '10:00:00', '11:00:00', 'Closed'),
(112, 'DOC_D0BF60', '2026-04-30', '14:00:00', '15:00:00', 'Closed'),
(113, 'DOC_D0BF60', '2026-05-01', '09:00:00', '10:00:00', 'Available'),
(114, 'DOC_D0BF60', '2026-05-01', '10:00:00', '11:00:00', 'Available'),
(115, 'DOC_D0BF60', '2026-05-01', '14:00:00', '15:00:00', 'Available'),
(116, 'DOC_D0BF60', '2026-04-26', '09:00:00', '10:00:00', 'Available'),
(117, 'DOC_D0BF60', '2026-04-26', '10:00:00', '11:00:00', 'Available'),
(118, 'DOC_D0BF60', '2026-04-26', '14:00:00', '15:00:00', 'Available'),
(119, 'DOC_AC98CD', '2026-04-29', '09:00:00', '10:00:00', 'Available'),
(120, 'DOC_AC98CD', '2026-04-29', '10:00:00', '11:00:00', 'Booked'),
(121, 'DOC_AC98CD', '2026-04-29', '14:00:00', '15:00:00', 'Available'),
(122, 'DOC_AC98CD', '2026-04-30', '09:00:00', '10:00:00', 'Closed'),
(123, 'DOC_AC98CD', '2026-04-30', '10:00:00', '11:00:00', 'Closed'),
(124, 'DOC_AC98CD', '2026-04-30', '14:00:00', '15:00:00', 'Closed'),
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
(150, 'DOC_JOHN', '2026-04-30', '09:00:00', '09:30:00', 'Closed'),
(151, 'DOC_JOHN', '2026-04-30', '09:30:00', '10:00:00', 'Closed'),
(152, 'DOC_JOHN', '2026-04-30', '10:00:00', '10:30:00', 'Closed'),
(153, 'DOC_JOHN', '2026-05-01', '09:00:00', '09:30:00', 'Available'),
(154, 'DOC_JOHN', '2026-05-01', '09:30:00', '10:00:00', 'Available'),
(155, 'DOC_JOHN', '2026-05-01', '10:00:00', '10:30:00', 'Available'),
(156, 'DOC_SARAH', '2026-04-27', '09:00:00', '09:30:00', 'Available'),
(157, 'DOC_SARAH', '2026-04-27', '09:30:00', '10:00:00', 'Available'),
(158, 'DOC_SARAH', '2026-04-27', '10:00:00', '10:30:00', 'Available'),
(159, 'DOC_SARAH', '2026-05-04', '09:00:00', '09:30:00', 'Available'),
(160, 'DOC_SARAH', '2026-05-04', '09:30:00', '10:00:00', 'Available'),
(161, 'DOC_SARAH', '2026-05-04', '10:00:00', '10:30:00', 'Available'),
(162, 'DOC_SARAH', '2026-05-11', '09:00:00', '09:30:00', 'Booked'),
(163, 'DOC_SARAH', '2026-05-11', '09:30:00', '10:00:00', 'Available'),
(164, 'DOC_SARAH', '2026-05-11', '10:00:00', '10:30:00', 'Available'),
(165, 'DOC_SARAH', '2026-05-18', '09:00:00', '09:30:00', 'Available'),
(166, 'DOC_SARAH', '2026-05-18', '09:30:00', '10:00:00', 'Available'),
(167, 'DOC_SARAH', '2026-05-18', '10:00:00', '10:30:00', 'Available'),
(168, 'DOC_SARAH', '2026-05-25', '09:00:00', '09:30:00', 'Available'),
(169, 'DOC_SARAH', '2026-05-25', '09:30:00', '10:00:00', 'Available'),
(170, 'DOC_SARAH', '2026-05-25', '10:00:00', '10:30:00', 'Available'),
(171, 'DOC_SARAH', '2026-06-01', '09:00:00', '09:30:00', 'Available'),
(172, 'DOC_SARAH', '2026-06-01', '09:30:00', '10:00:00', 'Available'),
(173, 'DOC_SARAH', '2026-06-01', '10:00:00', '10:30:00', 'Available'),
(174, 'DOC_SARAH', '2026-06-08', '09:00:00', '09:30:00', 'Available'),
(175, 'DOC_SARAH', '2026-06-08', '09:30:00', '10:00:00', 'Available'),
(176, 'DOC_SARAH', '2026-06-08', '10:00:00', '10:30:00', 'Available'),
(177, 'DOC_SARAH', '2026-06-15', '09:00:00', '09:30:00', 'Available'),
(178, 'DOC_SARAH', '2026-06-15', '09:30:00', '10:00:00', 'Available'),
(179, 'DOC_SARAH', '2026-06-15', '10:00:00', '10:30:00', 'Available'),
(180, 'DOC_SARAH', '2026-06-22', '09:00:00', '09:30:00', 'Available'),
(181, 'DOC_SARAH', '2026-06-22', '09:30:00', '10:00:00', 'Available'),
(182, 'DOC_SARAH', '2026-06-22', '10:00:00', '10:30:00', 'Available'),
(183, 'DOC_SARAH', '2026-06-29', '09:00:00', '09:30:00', 'Available'),
(184, 'DOC_SARAH', '2026-06-29', '09:30:00', '10:00:00', 'Available'),
(185, 'DOC_SARAH', '2026-06-29', '10:00:00', '10:30:00', 'Available'),
(186, 'DOC_SARAH', '2026-07-06', '09:00:00', '09:30:00', 'Available'),
(187, 'DOC_SARAH', '2026-07-06', '09:30:00', '10:00:00', 'Available'),
(188, 'DOC_SARAH', '2026-07-06', '10:00:00', '10:30:00', 'Available'),
(189, 'DOC_SARAH', '2026-07-13', '09:00:00', '09:30:00', 'Available'),
(190, 'DOC_SARAH', '2026-07-13', '09:30:00', '10:00:00', 'Available'),
(191, 'DOC_SARAH', '2026-07-13', '10:00:00', '10:30:00', 'Available'),
(192, 'DOC_SARAH', '2026-07-20', '09:00:00', '09:30:00', 'Available'),
(193, 'DOC_SARAH', '2026-07-20', '09:30:00', '10:00:00', 'Available'),
(194, 'DOC_SARAH', '2026-07-20', '10:00:00', '10:30:00', 'Available'),
(195, 'DOC_SARAH', '2026-07-27', '09:00:00', '09:30:00', 'Available'),
(196, 'DOC_SARAH', '2026-07-27', '09:30:00', '10:00:00', 'Available'),
(197, 'DOC_SARAH', '2026-07-27', '10:00:00', '10:30:00', 'Available'),
(198, 'DOC_SARAH', '2026-08-03', '09:00:00', '09:30:00', 'Available'),
(199, 'DOC_SARAH', '2026-08-03', '09:30:00', '10:00:00', 'Available'),
(200, 'DOC_SARAH', '2026-08-03', '10:00:00', '10:30:00', 'Available'),
(201, 'DOC_SARAH', '2026-08-10', '09:00:00', '09:30:00', 'Available'),
(202, 'DOC_SARAH', '2026-08-10', '09:30:00', '10:00:00', 'Available'),
(203, 'DOC_SARAH', '2026-08-10', '10:00:00', '10:30:00', 'Available'),
(204, 'DOC_SARAH', '2026-08-17', '09:00:00', '09:30:00', 'Available'),
(205, 'DOC_SARAH', '2026-08-17', '09:30:00', '10:00:00', 'Available'),
(206, 'DOC_SARAH', '2026-08-17', '10:00:00', '10:30:00', 'Available'),
(207, 'DOC_SARAH', '2026-08-24', '09:00:00', '09:30:00', 'Available'),
(208, 'DOC_SARAH', '2026-08-24', '09:30:00', '10:00:00', 'Available'),
(209, 'DOC_SARAH', '2026-08-24', '10:00:00', '10:30:00', 'Available'),
(210, 'DOC_SARAH', '2026-08-31', '09:00:00', '09:30:00', 'Available'),
(211, 'DOC_SARAH', '2026-08-31', '09:30:00', '10:00:00', 'Available'),
(212, 'DOC_SARAH', '2026-08-31', '10:00:00', '10:30:00', 'Available'),
(213, 'DOC_SARAH', '2026-09-07', '09:00:00', '09:30:00', 'Available'),
(214, 'DOC_SARAH', '2026-09-07', '09:30:00', '10:00:00', 'Available'),
(215, 'DOC_SARAH', '2026-09-07', '10:00:00', '10:30:00', 'Available'),
(216, 'DOC_SARAH', '2026-09-14', '09:00:00', '09:30:00', 'Available'),
(217, 'DOC_SARAH', '2026-09-14', '09:30:00', '10:00:00', 'Available'),
(218, 'DOC_SARAH', '2026-09-14', '10:00:00', '10:30:00', 'Available'),
(219, 'DOC_SARAH', '2026-09-21', '09:00:00', '09:30:00', 'Available'),
(220, 'DOC_SARAH', '2026-09-21', '09:30:00', '10:00:00', 'Available'),
(221, 'DOC_SARAH', '2026-09-21', '10:00:00', '10:30:00', 'Available'),
(222, 'DOC_SARAH', '2026-09-28', '09:00:00', '09:30:00', 'Available'),
(223, 'DOC_SARAH', '2026-09-28', '09:30:00', '10:00:00', 'Available'),
(224, 'DOC_SARAH', '2026-09-28', '10:00:00', '10:30:00', 'Available'),
(225, 'DOC_SARAH', '2026-10-05', '09:00:00', '09:30:00', 'Available'),
(226, 'DOC_SARAH', '2026-10-05', '09:30:00', '10:00:00', 'Available'),
(227, 'DOC_SARAH', '2026-10-05', '10:00:00', '10:30:00', 'Available'),
(228, 'DOC_SARAH', '2026-10-12', '09:00:00', '09:30:00', 'Available'),
(229, 'DOC_SARAH', '2026-10-12', '09:30:00', '10:00:00', 'Available'),
(230, 'DOC_SARAH', '2026-10-12', '10:00:00', '10:30:00', 'Available'),
(231, 'DOC_SARAH', '2026-10-19', '09:00:00', '09:30:00', 'Available'),
(232, 'DOC_SARAH', '2026-10-19', '09:30:00', '10:00:00', 'Available'),
(233, 'DOC_SARAH', '2026-10-19', '10:00:00', '10:30:00', 'Available'),
(234, 'DOC_SARAH', '2026-10-26', '09:00:00', '09:30:00', 'Available'),
(235, 'DOC_SARAH', '2026-10-26', '09:30:00', '10:00:00', 'Available'),
(236, 'DOC_SARAH', '2026-10-26', '10:00:00', '10:30:00', 'Available'),
(237, 'DOC_SARAH', '2026-11-02', '09:00:00', '09:30:00', 'Available'),
(238, 'DOC_SARAH', '2026-11-02', '09:30:00', '10:00:00', 'Available'),
(239, 'DOC_SARAH', '2026-11-02', '10:00:00', '10:30:00', 'Available'),
(240, 'DOC_SARAH', '2026-11-09', '09:00:00', '09:30:00', 'Available'),
(241, 'DOC_SARAH', '2026-11-09', '09:30:00', '10:00:00', 'Available'),
(242, 'DOC_SARAH', '2026-11-09', '10:00:00', '10:30:00', 'Available'),
(243, 'DOC_SARAH', '2026-11-16', '09:00:00', '09:30:00', 'Available'),
(244, 'DOC_SARAH', '2026-11-16', '09:30:00', '10:00:00', 'Available'),
(245, 'DOC_SARAH', '2026-11-16', '10:00:00', '10:30:00', 'Available'),
(246, 'DOC_SARAH', '2026-11-23', '09:00:00', '09:30:00', 'Available'),
(247, 'DOC_SARAH', '2026-11-23', '09:30:00', '10:00:00', 'Available'),
(248, 'DOC_SARAH', '2026-11-23', '10:00:00', '10:30:00', 'Available'),
(249, 'DOC_SARAH', '2026-11-30', '09:00:00', '09:30:00', 'Available'),
(250, 'DOC_SARAH', '2026-11-30', '09:30:00', '10:00:00', 'Available'),
(251, 'DOC_SARAH', '2026-11-30', '10:00:00', '10:30:00', 'Available'),
(252, 'DOC_SARAH', '2026-12-07', '09:00:00', '09:30:00', 'Available'),
(253, 'DOC_SARAH', '2026-12-07', '09:30:00', '10:00:00', 'Available'),
(254, 'DOC_SARAH', '2026-12-07', '10:00:00', '10:30:00', 'Available'),
(255, 'DOC_SARAH', '2026-12-14', '09:00:00', '09:30:00', 'Available'),
(256, 'DOC_SARAH', '2026-12-14', '09:30:00', '10:00:00', 'Available'),
(257, 'DOC_SARAH', '2026-12-14', '10:00:00', '10:30:00', 'Available'),
(258, 'DOC_SARAH', '2026-12-21', '09:00:00', '09:30:00', 'Available'),
(259, 'DOC_SARAH', '2026-12-21', '09:30:00', '10:00:00', 'Available'),
(260, 'DOC_SARAH', '2026-12-21', '10:00:00', '10:30:00', 'Available'),
(261, 'DOC_SARAH', '2026-12-28', '09:00:00', '09:30:00', 'Available'),
(262, 'DOC_SARAH', '2026-12-28', '09:30:00', '10:00:00', 'Available'),
(263, 'DOC_SARAH', '2026-12-28', '10:00:00', '10:30:00', 'Available'),
(264, 'DOC_SARAH', '2027-01-04', '09:00:00', '09:30:00', 'Available'),
(265, 'DOC_SARAH', '2027-01-04', '09:30:00', '10:00:00', 'Available'),
(266, 'DOC_SARAH', '2027-01-04', '10:00:00', '10:30:00', 'Available'),
(267, 'DOC_SARAH', '2027-01-11', '09:00:00', '09:30:00', 'Available'),
(268, 'DOC_SARAH', '2027-01-11', '09:30:00', '10:00:00', 'Available'),
(269, 'DOC_SARAH', '2027-01-11', '10:00:00', '10:30:00', 'Available'),
(270, 'DOC_SARAH', '2027-01-18', '09:00:00', '09:30:00', 'Available'),
(271, 'DOC_SARAH', '2027-01-18', '09:30:00', '10:00:00', 'Available'),
(272, 'DOC_SARAH', '2027-01-18', '10:00:00', '10:30:00', 'Available'),
(273, 'DOC_SARAH', '2027-01-25', '09:00:00', '09:30:00', 'Available'),
(274, 'DOC_SARAH', '2027-01-25', '09:30:00', '10:00:00', 'Available'),
(275, 'DOC_SARAH', '2027-01-25', '10:00:00', '10:30:00', 'Available'),
(276, 'DOC_SARAH', '2027-02-01', '09:00:00', '09:30:00', 'Available'),
(277, 'DOC_SARAH', '2027-02-01', '09:30:00', '10:00:00', 'Available'),
(278, 'DOC_SARAH', '2027-02-01', '10:00:00', '10:30:00', 'Available'),
(279, 'DOC_SARAH', '2027-02-08', '09:00:00', '09:30:00', 'Available'),
(280, 'DOC_SARAH', '2027-02-08', '09:30:00', '10:00:00', 'Available'),
(281, 'DOC_SARAH', '2027-02-08', '10:00:00', '10:30:00', 'Available'),
(282, 'DOC_SARAH', '2027-02-15', '09:00:00', '09:30:00', 'Available'),
(283, 'DOC_SARAH', '2027-02-15', '09:30:00', '10:00:00', 'Available'),
(284, 'DOC_SARAH', '2027-02-15', '10:00:00', '10:30:00', 'Available'),
(285, 'DOC_SARAH', '2027-02-22', '09:00:00', '09:30:00', 'Available'),
(286, 'DOC_SARAH', '2027-02-22', '09:30:00', '10:00:00', 'Available'),
(287, 'DOC_SARAH', '2027-02-22', '10:00:00', '10:30:00', 'Available'),
(288, 'DOC_SARAH', '2027-03-01', '09:00:00', '09:30:00', 'Available'),
(289, 'DOC_SARAH', '2027-03-01', '09:30:00', '10:00:00', 'Available'),
(290, 'DOC_SARAH', '2027-03-01', '10:00:00', '10:30:00', 'Available'),
(291, 'DOC_SARAH', '2027-03-08', '09:00:00', '09:30:00', 'Available'),
(292, 'DOC_SARAH', '2027-03-08', '09:30:00', '10:00:00', 'Available'),
(293, 'DOC_SARAH', '2027-03-08', '10:00:00', '10:30:00', 'Available'),
(294, 'DOC_SARAH', '2027-03-15', '09:00:00', '09:30:00', 'Available'),
(295, 'DOC_SARAH', '2027-03-15', '09:30:00', '10:00:00', 'Available'),
(296, 'DOC_SARAH', '2027-03-15', '10:00:00', '10:30:00', 'Available'),
(297, 'DOC_SARAH', '2027-03-22', '09:00:00', '09:30:00', 'Available'),
(298, 'DOC_SARAH', '2027-03-22', '09:30:00', '10:00:00', 'Available'),
(299, 'DOC_SARAH', '2027-03-22', '10:00:00', '10:30:00', 'Available'),
(300, 'DOC_SARAH', '2027-03-29', '09:00:00', '09:30:00', 'Available'),
(301, 'DOC_SARAH', '2027-03-29', '09:30:00', '10:00:00', 'Available'),
(302, 'DOC_SARAH', '2027-03-29', '10:00:00', '10:30:00', 'Available'),
(303, 'DOC_SARAH', '2027-04-05', '09:00:00', '09:30:00', 'Available'),
(304, 'DOC_SARAH', '2027-04-05', '09:30:00', '10:00:00', 'Available'),
(305, 'DOC_SARAH', '2027-04-05', '10:00:00', '10:30:00', 'Available'),
(306, 'DOC_SARAH', '2027-04-12', '09:00:00', '09:30:00', 'Available'),
(307, 'DOC_SARAH', '2027-04-12', '09:30:00', '10:00:00', 'Available'),
(308, 'DOC_SARAH', '2027-04-12', '10:00:00', '10:30:00', 'Available'),
(309, 'DOC_SARAH', '2027-04-19', '09:00:00', '09:30:00', 'Available'),
(310, 'DOC_SARAH', '2027-04-19', '09:30:00', '10:00:00', 'Available'),
(311, 'DOC_SARAH', '2027-04-19', '10:00:00', '10:30:00', 'Available'),
(312, 'DOC_ARJUN', '2026-04-27', '09:00:00', '09:30:00', 'Available'),
(313, 'DOC_ARJUN', '2026-04-27', '09:30:00', '10:00:00', 'Available'),
(314, 'DOC_ARJUN', '2026-04-27', '10:00:00', '10:30:00', 'Available'),
(315, 'DOC_ARJUN', '2026-05-04', '09:00:00', '09:30:00', 'Booked'),
(316, 'DOC_ARJUN', '2026-05-04', '09:30:00', '10:00:00', 'Booked'),
(317, 'DOC_ARJUN', '2026-05-04', '10:00:00', '10:30:00', 'Available'),
(318, 'DOC_ARJUN', '2026-05-11', '09:00:00', '09:30:00', 'Available'),
(319, 'DOC_ARJUN', '2026-05-11', '09:30:00', '10:00:00', 'Available'),
(320, 'DOC_ARJUN', '2026-05-11', '10:00:00', '10:30:00', 'Available'),
(321, 'DOC_ARJUN', '2026-05-18', '09:00:00', '09:30:00', 'Available'),
(322, 'DOC_ARJUN', '2026-05-18', '09:30:00', '10:00:00', 'Available'),
(323, 'DOC_ARJUN', '2026-05-18', '10:00:00', '10:30:00', 'Available'),
(324, 'DOC_ARJUN', '2026-05-25', '09:00:00', '09:30:00', 'Available'),
(325, 'DOC_ARJUN', '2026-05-25', '09:30:00', '10:00:00', 'Available'),
(326, 'DOC_ARJUN', '2026-05-25', '10:00:00', '10:30:00', 'Available'),
(327, 'DOC_ARJUN', '2026-06-01', '09:00:00', '09:30:00', 'Available'),
(328, 'DOC_ARJUN', '2026-06-01', '09:30:00', '10:00:00', 'Available'),
(329, 'DOC_ARJUN', '2026-06-01', '10:00:00', '10:30:00', 'Available'),
(330, 'DOC_ARJUN', '2026-06-08', '09:00:00', '09:30:00', 'Available'),
(331, 'DOC_ARJUN', '2026-06-08', '09:30:00', '10:00:00', 'Available'),
(332, 'DOC_ARJUN', '2026-06-08', '10:00:00', '10:30:00', 'Available'),
(333, 'DOC_ARJUN', '2026-06-15', '09:00:00', '09:30:00', 'Available'),
(334, 'DOC_ARJUN', '2026-06-15', '09:30:00', '10:00:00', 'Available'),
(335, 'DOC_ARJUN', '2026-06-15', '10:00:00', '10:30:00', 'Available'),
(336, 'DOC_ARJUN', '2026-06-22', '09:00:00', '09:30:00', 'Available'),
(337, 'DOC_ARJUN', '2026-06-22', '09:30:00', '10:00:00', 'Available'),
(338, 'DOC_ARJUN', '2026-06-22', '10:00:00', '10:30:00', 'Available'),
(339, 'DOC_ARJUN', '2026-06-29', '09:00:00', '09:30:00', 'Available'),
(340, 'DOC_ARJUN', '2026-06-29', '09:30:00', '10:00:00', 'Available'),
(341, 'DOC_ARJUN', '2026-06-29', '10:00:00', '10:30:00', 'Available'),
(342, 'DOC_ARJUN', '2026-07-06', '09:00:00', '09:30:00', 'Available'),
(343, 'DOC_ARJUN', '2026-07-06', '09:30:00', '10:00:00', 'Available'),
(344, 'DOC_ARJUN', '2026-07-06', '10:00:00', '10:30:00', 'Available'),
(345, 'DOC_ARJUN', '2026-07-13', '09:00:00', '09:30:00', 'Available'),
(346, 'DOC_ARJUN', '2026-07-13', '09:30:00', '10:00:00', 'Available'),
(347, 'DOC_ARJUN', '2026-07-13', '10:00:00', '10:30:00', 'Available'),
(348, 'DOC_ARJUN', '2026-07-20', '09:00:00', '09:30:00', 'Available'),
(349, 'DOC_ARJUN', '2026-07-20', '09:30:00', '10:00:00', 'Available'),
(350, 'DOC_ARJUN', '2026-07-20', '10:00:00', '10:30:00', 'Available'),
(351, 'DOC_ARJUN', '2026-07-27', '09:00:00', '09:30:00', 'Available'),
(352, 'DOC_ARJUN', '2026-07-27', '09:30:00', '10:00:00', 'Available'),
(353, 'DOC_ARJUN', '2026-07-27', '10:00:00', '10:30:00', 'Available'),
(354, 'DOC_ARJUN', '2026-08-03', '09:00:00', '09:30:00', 'Available'),
(355, 'DOC_ARJUN', '2026-08-03', '09:30:00', '10:00:00', 'Available'),
(356, 'DOC_ARJUN', '2026-08-03', '10:00:00', '10:30:00', 'Available'),
(357, 'DOC_ARJUN', '2026-08-10', '09:00:00', '09:30:00', 'Available'),
(358, 'DOC_ARJUN', '2026-08-10', '09:30:00', '10:00:00', 'Available'),
(359, 'DOC_ARJUN', '2026-08-10', '10:00:00', '10:30:00', 'Available'),
(360, 'DOC_ARJUN', '2026-08-17', '09:00:00', '09:30:00', 'Available'),
(361, 'DOC_ARJUN', '2026-08-17', '09:30:00', '10:00:00', 'Available'),
(362, 'DOC_ARJUN', '2026-08-17', '10:00:00', '10:30:00', 'Available'),
(363, 'DOC_ARJUN', '2026-08-24', '09:00:00', '09:30:00', 'Available'),
(364, 'DOC_ARJUN', '2026-08-24', '09:30:00', '10:00:00', 'Available'),
(365, 'DOC_ARJUN', '2026-08-24', '10:00:00', '10:30:00', 'Available'),
(366, 'DOC_ARJUN', '2026-08-31', '09:00:00', '09:30:00', 'Available'),
(367, 'DOC_ARJUN', '2026-08-31', '09:30:00', '10:00:00', 'Available'),
(368, 'DOC_ARJUN', '2026-08-31', '10:00:00', '10:30:00', 'Available'),
(369, 'DOC_ARJUN', '2026-09-07', '09:00:00', '09:30:00', 'Available'),
(370, 'DOC_ARJUN', '2026-09-07', '09:30:00', '10:00:00', 'Available'),
(371, 'DOC_ARJUN', '2026-09-07', '10:00:00', '10:30:00', 'Available'),
(372, 'DOC_ARJUN', '2026-09-14', '09:00:00', '09:30:00', 'Available'),
(373, 'DOC_ARJUN', '2026-09-14', '09:30:00', '10:00:00', 'Available'),
(374, 'DOC_ARJUN', '2026-09-14', '10:00:00', '10:30:00', 'Available'),
(375, 'DOC_ARJUN', '2026-09-21', '09:00:00', '09:30:00', 'Available'),
(376, 'DOC_ARJUN', '2026-09-21', '09:30:00', '10:00:00', 'Available'),
(377, 'DOC_ARJUN', '2026-09-21', '10:00:00', '10:30:00', 'Available'),
(378, 'DOC_ARJUN', '2026-09-28', '09:00:00', '09:30:00', 'Available'),
(379, 'DOC_ARJUN', '2026-09-28', '09:30:00', '10:00:00', 'Available'),
(380, 'DOC_ARJUN', '2026-09-28', '10:00:00', '10:30:00', 'Available'),
(381, 'DOC_ARJUN', '2026-10-05', '09:00:00', '09:30:00', 'Available'),
(382, 'DOC_ARJUN', '2026-10-05', '09:30:00', '10:00:00', 'Available'),
(383, 'DOC_ARJUN', '2026-10-05', '10:00:00', '10:30:00', 'Available'),
(384, 'DOC_ARJUN', '2026-10-12', '09:00:00', '09:30:00', 'Available'),
(385, 'DOC_ARJUN', '2026-10-12', '09:30:00', '10:00:00', 'Available'),
(386, 'DOC_ARJUN', '2026-10-12', '10:00:00', '10:30:00', 'Available'),
(387, 'DOC_ARJUN', '2026-10-19', '09:00:00', '09:30:00', 'Available'),
(388, 'DOC_ARJUN', '2026-10-19', '09:30:00', '10:00:00', 'Available'),
(389, 'DOC_ARJUN', '2026-10-19', '10:00:00', '10:30:00', 'Available'),
(390, 'DOC_ARJUN', '2026-10-26', '09:00:00', '09:30:00', 'Available'),
(391, 'DOC_ARJUN', '2026-10-26', '09:30:00', '10:00:00', 'Available'),
(392, 'DOC_ARJUN', '2026-10-26', '10:00:00', '10:30:00', 'Available'),
(393, 'DOC_ARJUN', '2026-11-02', '09:00:00', '09:30:00', 'Available'),
(394, 'DOC_ARJUN', '2026-11-02', '09:30:00', '10:00:00', 'Available'),
(395, 'DOC_ARJUN', '2026-11-02', '10:00:00', '10:30:00', 'Available'),
(396, 'DOC_ARJUN', '2026-11-09', '09:00:00', '09:30:00', 'Available'),
(397, 'DOC_ARJUN', '2026-11-09', '09:30:00', '10:00:00', 'Available'),
(398, 'DOC_ARJUN', '2026-11-09', '10:00:00', '10:30:00', 'Available'),
(399, 'DOC_ARJUN', '2026-11-16', '09:00:00', '09:30:00', 'Available'),
(400, 'DOC_ARJUN', '2026-11-16', '09:30:00', '10:00:00', 'Available'),
(401, 'DOC_ARJUN', '2026-11-16', '10:00:00', '10:30:00', 'Available'),
(402, 'DOC_ARJUN', '2026-11-23', '09:00:00', '09:30:00', 'Available'),
(403, 'DOC_ARJUN', '2026-11-23', '09:30:00', '10:00:00', 'Available'),
(404, 'DOC_ARJUN', '2026-11-23', '10:00:00', '10:30:00', 'Available'),
(405, 'DOC_ARJUN', '2026-11-30', '09:00:00', '09:30:00', 'Available'),
(406, 'DOC_ARJUN', '2026-11-30', '09:30:00', '10:00:00', 'Available'),
(407, 'DOC_ARJUN', '2026-11-30', '10:00:00', '10:30:00', 'Available'),
(408, 'DOC_ARJUN', '2026-12-07', '09:00:00', '09:30:00', 'Available'),
(409, 'DOC_ARJUN', '2026-12-07', '09:30:00', '10:00:00', 'Available'),
(410, 'DOC_ARJUN', '2026-12-07', '10:00:00', '10:30:00', 'Available'),
(411, 'DOC_ARJUN', '2026-12-14', '09:00:00', '09:30:00', 'Available'),
(412, 'DOC_ARJUN', '2026-12-14', '09:30:00', '10:00:00', 'Available'),
(413, 'DOC_ARJUN', '2026-12-14', '10:00:00', '10:30:00', 'Available'),
(414, 'DOC_ARJUN', '2026-12-21', '09:00:00', '09:30:00', 'Available'),
(415, 'DOC_ARJUN', '2026-12-21', '09:30:00', '10:00:00', 'Available'),
(416, 'DOC_ARJUN', '2026-12-21', '10:00:00', '10:30:00', 'Available'),
(417, 'DOC_ARJUN', '2026-12-28', '09:00:00', '09:30:00', 'Available'),
(418, 'DOC_ARJUN', '2026-12-28', '09:30:00', '10:00:00', 'Available'),
(419, 'DOC_ARJUN', '2026-12-28', '10:00:00', '10:30:00', 'Available'),
(420, 'DOC_ARJUN', '2027-01-04', '09:00:00', '09:30:00', 'Available'),
(421, 'DOC_ARJUN', '2027-01-04', '09:30:00', '10:00:00', 'Available'),
(422, 'DOC_ARJUN', '2027-01-04', '10:00:00', '10:30:00', 'Available'),
(423, 'DOC_ARJUN', '2027-01-11', '09:00:00', '09:30:00', 'Available'),
(424, 'DOC_ARJUN', '2027-01-11', '09:30:00', '10:00:00', 'Available'),
(425, 'DOC_ARJUN', '2027-01-11', '10:00:00', '10:30:00', 'Available'),
(426, 'DOC_ARJUN', '2027-01-18', '09:00:00', '09:30:00', 'Available'),
(427, 'DOC_ARJUN', '2027-01-18', '09:30:00', '10:00:00', 'Available'),
(428, 'DOC_ARJUN', '2027-01-18', '10:00:00', '10:30:00', 'Available'),
(429, 'DOC_ARJUN', '2027-01-25', '09:00:00', '09:30:00', 'Available'),
(430, 'DOC_ARJUN', '2027-01-25', '09:30:00', '10:00:00', 'Available'),
(431, 'DOC_ARJUN', '2027-01-25', '10:00:00', '10:30:00', 'Available'),
(432, 'DOC_ARJUN', '2027-02-01', '09:00:00', '09:30:00', 'Available'),
(433, 'DOC_ARJUN', '2027-02-01', '09:30:00', '10:00:00', 'Available'),
(434, 'DOC_ARJUN', '2027-02-01', '10:00:00', '10:30:00', 'Available'),
(435, 'DOC_ARJUN', '2027-02-08', '09:00:00', '09:30:00', 'Available'),
(436, 'DOC_ARJUN', '2027-02-08', '09:30:00', '10:00:00', 'Available'),
(437, 'DOC_ARJUN', '2027-02-08', '10:00:00', '10:30:00', 'Available'),
(438, 'DOC_ARJUN', '2027-02-15', '09:00:00', '09:30:00', 'Available'),
(439, 'DOC_ARJUN', '2027-02-15', '09:30:00', '10:00:00', 'Available'),
(440, 'DOC_ARJUN', '2027-02-15', '10:00:00', '10:30:00', 'Available'),
(441, 'DOC_ARJUN', '2027-02-22', '09:00:00', '09:30:00', 'Available'),
(442, 'DOC_ARJUN', '2027-02-22', '09:30:00', '10:00:00', 'Available'),
(443, 'DOC_ARJUN', '2027-02-22', '10:00:00', '10:30:00', 'Available'),
(444, 'DOC_ARJUN', '2027-03-01', '09:00:00', '09:30:00', 'Available'),
(445, 'DOC_ARJUN', '2027-03-01', '09:30:00', '10:00:00', 'Available'),
(446, 'DOC_ARJUN', '2027-03-01', '10:00:00', '10:30:00', 'Available'),
(447, 'DOC_ARJUN', '2027-03-08', '09:00:00', '09:30:00', 'Available'),
(448, 'DOC_ARJUN', '2027-03-08', '09:30:00', '10:00:00', 'Available'),
(449, 'DOC_ARJUN', '2027-03-08', '10:00:00', '10:30:00', 'Available'),
(450, 'DOC_ARJUN', '2027-03-15', '09:00:00', '09:30:00', 'Available'),
(451, 'DOC_ARJUN', '2027-03-15', '09:30:00', '10:00:00', 'Available'),
(452, 'DOC_ARJUN', '2027-03-15', '10:00:00', '10:30:00', 'Available'),
(453, 'DOC_ARJUN', '2027-03-22', '09:00:00', '09:30:00', 'Available'),
(454, 'DOC_ARJUN', '2027-03-22', '09:30:00', '10:00:00', 'Available'),
(455, 'DOC_ARJUN', '2027-03-22', '10:00:00', '10:30:00', 'Available'),
(456, 'DOC_ARJUN', '2027-03-29', '09:00:00', '09:30:00', 'Available'),
(457, 'DOC_ARJUN', '2027-03-29', '09:30:00', '10:00:00', 'Available'),
(458, 'DOC_ARJUN', '2027-03-29', '10:00:00', '10:30:00', 'Available'),
(459, 'DOC_ARJUN', '2027-04-05', '09:00:00', '09:30:00', 'Available'),
(460, 'DOC_ARJUN', '2027-04-05', '09:30:00', '10:00:00', 'Available'),
(461, 'DOC_ARJUN', '2027-04-05', '10:00:00', '10:30:00', 'Available'),
(462, 'DOC_ARJUN', '2027-04-12', '09:00:00', '09:30:00', 'Available'),
(463, 'DOC_ARJUN', '2027-04-12', '09:30:00', '10:00:00', 'Available'),
(464, 'DOC_ARJUN', '2027-04-12', '10:00:00', '10:30:00', 'Available'),
(465, 'DOC_ARJUN', '2027-04-19', '09:00:00', '09:30:00', 'Available'),
(466, 'DOC_ARJUN', '2027-04-19', '09:30:00', '10:00:00', 'Available'),
(467, 'DOC_ARJUN', '2027-04-19', '10:00:00', '10:30:00', 'Available'),
(468, 'DOC_ARJUN', '2026-05-04', '16:00:00', '16:30:00', 'Available'),
(469, 'DOC_EA8D58', '2026-04-27', '09:00:00', '09:30:00', 'Available'),
(470, 'DOC_EA8D58', '2026-04-27', '09:30:00', '10:00:00', 'Available'),
(471, 'DOC_EA8D58', '2026-04-27', '10:00:00', '10:30:00', 'Available'),
(472, 'DOC_EA8D58', '2026-05-04', '09:00:00', '09:30:00', 'Available'),
(473, 'DOC_EA8D58', '2026-05-04', '09:30:00', '10:00:00', 'Available'),
(474, 'DOC_EA8D58', '2026-05-04', '10:00:00', '10:30:00', 'Available'),
(475, 'DOC_EA8D58', '2026-05-11', '09:00:00', '09:30:00', 'Available'),
(476, 'DOC_EA8D58', '2026-05-11', '09:30:00', '10:00:00', 'Available'),
(477, 'DOC_EA8D58', '2026-05-11', '10:00:00', '10:30:00', 'Available'),
(478, 'DOC_EA8D58', '2026-05-18', '09:00:00', '09:30:00', 'Available'),
(479, 'DOC_EA8D58', '2026-05-18', '09:30:00', '10:00:00', 'Available'),
(480, 'DOC_EA8D58', '2026-05-18', '10:00:00', '10:30:00', 'Available'),
(481, 'DOC_EA8D58', '2026-05-25', '09:00:00', '09:30:00', 'Available'),
(482, 'DOC_EA8D58', '2026-05-25', '09:30:00', '10:00:00', 'Available'),
(483, 'DOC_EA8D58', '2026-05-25', '10:00:00', '10:30:00', 'Available'),
(484, 'DOC_EA8D58', '2026-06-01', '09:00:00', '09:30:00', 'Available'),
(485, 'DOC_EA8D58', '2026-06-01', '09:30:00', '10:00:00', 'Available'),
(486, 'DOC_EA8D58', '2026-06-01', '10:00:00', '10:30:00', 'Available'),
(487, 'DOC_EA8D58', '2026-06-08', '09:00:00', '09:30:00', 'Available'),
(488, 'DOC_EA8D58', '2026-06-08', '09:30:00', '10:00:00', 'Available'),
(489, 'DOC_EA8D58', '2026-06-08', '10:00:00', '10:30:00', 'Available'),
(490, 'DOC_EA8D58', '2026-06-15', '09:00:00', '09:30:00', 'Available'),
(491, 'DOC_EA8D58', '2026-06-15', '09:30:00', '10:00:00', 'Available'),
(492, 'DOC_EA8D58', '2026-06-15', '10:00:00', '10:30:00', 'Available'),
(493, 'DOC_EA8D58', '2026-06-22', '09:00:00', '09:30:00', 'Available'),
(494, 'DOC_EA8D58', '2026-06-22', '09:30:00', '10:00:00', 'Available'),
(495, 'DOC_EA8D58', '2026-06-22', '10:00:00', '10:30:00', 'Available'),
(496, 'DOC_EA8D58', '2026-06-29', '09:00:00', '09:30:00', 'Available'),
(497, 'DOC_EA8D58', '2026-06-29', '09:30:00', '10:00:00', 'Available'),
(498, 'DOC_EA8D58', '2026-06-29', '10:00:00', '10:30:00', 'Available'),
(499, 'DOC_EA8D58', '2026-07-06', '09:00:00', '09:30:00', 'Available'),
(500, 'DOC_EA8D58', '2026-07-06', '09:30:00', '10:00:00', 'Available'),
(501, 'DOC_EA8D58', '2026-07-06', '10:00:00', '10:30:00', 'Available'),
(502, 'DOC_EA8D58', '2026-07-13', '09:00:00', '09:30:00', 'Available'),
(503, 'DOC_EA8D58', '2026-07-13', '09:30:00', '10:00:00', 'Available'),
(504, 'DOC_EA8D58', '2026-07-13', '10:00:00', '10:30:00', 'Available'),
(505, 'DOC_EA8D58', '2026-07-20', '09:00:00', '09:30:00', 'Available'),
(506, 'DOC_EA8D58', '2026-07-20', '09:30:00', '10:00:00', 'Available'),
(507, 'DOC_EA8D58', '2026-07-20', '10:00:00', '10:30:00', 'Available'),
(508, 'DOC_EA8D58', '2026-07-27', '09:00:00', '09:30:00', 'Available'),
(509, 'DOC_EA8D58', '2026-07-27', '09:30:00', '10:00:00', 'Available'),
(510, 'DOC_EA8D58', '2026-07-27', '10:00:00', '10:30:00', 'Available'),
(511, 'DOC_EA8D58', '2026-08-03', '09:00:00', '09:30:00', 'Available'),
(512, 'DOC_EA8D58', '2026-08-03', '09:30:00', '10:00:00', 'Available'),
(513, 'DOC_EA8D58', '2026-08-03', '10:00:00', '10:30:00', 'Available'),
(514, 'DOC_EA8D58', '2026-08-10', '09:00:00', '09:30:00', 'Available'),
(515, 'DOC_EA8D58', '2026-08-10', '09:30:00', '10:00:00', 'Available'),
(516, 'DOC_EA8D58', '2026-08-10', '10:00:00', '10:30:00', 'Available'),
(517, 'DOC_EA8D58', '2026-08-17', '09:00:00', '09:30:00', 'Available'),
(518, 'DOC_EA8D58', '2026-08-17', '09:30:00', '10:00:00', 'Available'),
(519, 'DOC_EA8D58', '2026-08-17', '10:00:00', '10:30:00', 'Available'),
(520, 'DOC_EA8D58', '2026-08-24', '09:00:00', '09:30:00', 'Available'),
(521, 'DOC_EA8D58', '2026-08-24', '09:30:00', '10:00:00', 'Available'),
(522, 'DOC_EA8D58', '2026-08-24', '10:00:00', '10:30:00', 'Available'),
(523, 'DOC_EA8D58', '2026-08-31', '09:00:00', '09:30:00', 'Available'),
(524, 'DOC_EA8D58', '2026-08-31', '09:30:00', '10:00:00', 'Available'),
(525, 'DOC_EA8D58', '2026-08-31', '10:00:00', '10:30:00', 'Available'),
(526, 'DOC_EA8D58', '2026-09-07', '09:00:00', '09:30:00', 'Available'),
(527, 'DOC_EA8D58', '2026-09-07', '09:30:00', '10:00:00', 'Available'),
(528, 'DOC_EA8D58', '2026-09-07', '10:00:00', '10:30:00', 'Available'),
(529, 'DOC_EA8D58', '2026-09-14', '09:00:00', '09:30:00', 'Available'),
(530, 'DOC_EA8D58', '2026-09-14', '09:30:00', '10:00:00', 'Available'),
(531, 'DOC_EA8D58', '2026-09-14', '10:00:00', '10:30:00', 'Available'),
(532, 'DOC_EA8D58', '2026-09-21', '09:00:00', '09:30:00', 'Available'),
(533, 'DOC_EA8D58', '2026-09-21', '09:30:00', '10:00:00', 'Available'),
(534, 'DOC_EA8D58', '2026-09-21', '10:00:00', '10:30:00', 'Available'),
(535, 'DOC_EA8D58', '2026-09-28', '09:00:00', '09:30:00', 'Available'),
(536, 'DOC_EA8D58', '2026-09-28', '09:30:00', '10:00:00', 'Available'),
(537, 'DOC_EA8D58', '2026-09-28', '10:00:00', '10:30:00', 'Available'),
(538, 'DOC_EA8D58', '2026-10-05', '09:00:00', '09:30:00', 'Available'),
(539, 'DOC_EA8D58', '2026-10-05', '09:30:00', '10:00:00', 'Available'),
(540, 'DOC_EA8D58', '2026-10-05', '10:00:00', '10:30:00', 'Available'),
(541, 'DOC_EA8D58', '2026-10-12', '09:00:00', '09:30:00', 'Available'),
(542, 'DOC_EA8D58', '2026-10-12', '09:30:00', '10:00:00', 'Available'),
(543, 'DOC_EA8D58', '2026-10-12', '10:00:00', '10:30:00', 'Available'),
(544, 'DOC_EA8D58', '2026-10-19', '09:00:00', '09:30:00', 'Available'),
(545, 'DOC_EA8D58', '2026-10-19', '09:30:00', '10:00:00', 'Available'),
(546, 'DOC_EA8D58', '2026-10-19', '10:00:00', '10:30:00', 'Available'),
(547, 'DOC_EA8D58', '2026-10-26', '09:00:00', '09:30:00', 'Available'),
(548, 'DOC_EA8D58', '2026-10-26', '09:30:00', '10:00:00', 'Available'),
(549, 'DOC_EA8D58', '2026-10-26', '10:00:00', '10:30:00', 'Available'),
(550, 'DOC_EA8D58', '2026-11-02', '09:00:00', '09:30:00', 'Available'),
(551, 'DOC_EA8D58', '2026-11-02', '09:30:00', '10:00:00', 'Available'),
(552, 'DOC_EA8D58', '2026-11-02', '10:00:00', '10:30:00', 'Available'),
(553, 'DOC_EA8D58', '2026-11-09', '09:00:00', '09:30:00', 'Available'),
(554, 'DOC_EA8D58', '2026-11-09', '09:30:00', '10:00:00', 'Available'),
(555, 'DOC_EA8D58', '2026-11-09', '10:00:00', '10:30:00', 'Available'),
(556, 'DOC_EA8D58', '2026-11-16', '09:00:00', '09:30:00', 'Available'),
(557, 'DOC_EA8D58', '2026-11-16', '09:30:00', '10:00:00', 'Available'),
(558, 'DOC_EA8D58', '2026-11-16', '10:00:00', '10:30:00', 'Available'),
(559, 'DOC_EA8D58', '2026-11-23', '09:00:00', '09:30:00', 'Available'),
(560, 'DOC_EA8D58', '2026-11-23', '09:30:00', '10:00:00', 'Available'),
(561, 'DOC_EA8D58', '2026-11-23', '10:00:00', '10:30:00', 'Available'),
(562, 'DOC_EA8D58', '2026-11-30', '09:00:00', '09:30:00', 'Available'),
(563, 'DOC_EA8D58', '2026-11-30', '09:30:00', '10:00:00', 'Available'),
(564, 'DOC_EA8D58', '2026-11-30', '10:00:00', '10:30:00', 'Available'),
(565, 'DOC_EA8D58', '2026-12-07', '09:00:00', '09:30:00', 'Available'),
(566, 'DOC_EA8D58', '2026-12-07', '09:30:00', '10:00:00', 'Available'),
(567, 'DOC_EA8D58', '2026-12-07', '10:00:00', '10:30:00', 'Available'),
(568, 'DOC_EA8D58', '2026-12-14', '09:00:00', '09:30:00', 'Available'),
(569, 'DOC_EA8D58', '2026-12-14', '09:30:00', '10:00:00', 'Available'),
(570, 'DOC_EA8D58', '2026-12-14', '10:00:00', '10:30:00', 'Available'),
(571, 'DOC_EA8D58', '2026-12-21', '09:00:00', '09:30:00', 'Available'),
(572, 'DOC_EA8D58', '2026-12-21', '09:30:00', '10:00:00', 'Available'),
(573, 'DOC_EA8D58', '2026-12-21', '10:00:00', '10:30:00', 'Available'),
(574, 'DOC_EA8D58', '2026-12-28', '09:00:00', '09:30:00', 'Available'),
(575, 'DOC_EA8D58', '2026-12-28', '09:30:00', '10:00:00', 'Available'),
(576, 'DOC_EA8D58', '2026-12-28', '10:00:00', '10:30:00', 'Available'),
(577, 'DOC_EA8D58', '2027-01-04', '09:00:00', '09:30:00', 'Available'),
(578, 'DOC_EA8D58', '2027-01-04', '09:30:00', '10:00:00', 'Available'),
(579, 'DOC_EA8D58', '2027-01-04', '10:00:00', '10:30:00', 'Available'),
(580, 'DOC_EA8D58', '2027-01-11', '09:00:00', '09:30:00', 'Available'),
(581, 'DOC_EA8D58', '2027-01-11', '09:30:00', '10:00:00', 'Available'),
(582, 'DOC_EA8D58', '2027-01-11', '10:00:00', '10:30:00', 'Available'),
(583, 'DOC_EA8D58', '2027-01-18', '09:00:00', '09:30:00', 'Available'),
(584, 'DOC_EA8D58', '2027-01-18', '09:30:00', '10:00:00', 'Available'),
(585, 'DOC_EA8D58', '2027-01-18', '10:00:00', '10:30:00', 'Available'),
(586, 'DOC_EA8D58', '2027-01-25', '09:00:00', '09:30:00', 'Available'),
(587, 'DOC_EA8D58', '2027-01-25', '09:30:00', '10:00:00', 'Available'),
(588, 'DOC_EA8D58', '2027-01-25', '10:00:00', '10:30:00', 'Available'),
(589, 'DOC_EA8D58', '2027-02-01', '09:00:00', '09:30:00', 'Available'),
(590, 'DOC_EA8D58', '2027-02-01', '09:30:00', '10:00:00', 'Available'),
(591, 'DOC_EA8D58', '2027-02-01', '10:00:00', '10:30:00', 'Available'),
(592, 'DOC_EA8D58', '2027-02-08', '09:00:00', '09:30:00', 'Available'),
(593, 'DOC_EA8D58', '2027-02-08', '09:30:00', '10:00:00', 'Available'),
(594, 'DOC_EA8D58', '2027-02-08', '10:00:00', '10:30:00', 'Available'),
(595, 'DOC_EA8D58', '2027-02-15', '09:00:00', '09:30:00', 'Available'),
(596, 'DOC_EA8D58', '2027-02-15', '09:30:00', '10:00:00', 'Available'),
(597, 'DOC_EA8D58', '2027-02-15', '10:00:00', '10:30:00', 'Available'),
(598, 'DOC_EA8D58', '2027-02-22', '09:00:00', '09:30:00', 'Available'),
(599, 'DOC_EA8D58', '2027-02-22', '09:30:00', '10:00:00', 'Available'),
(600, 'DOC_EA8D58', '2027-02-22', '10:00:00', '10:30:00', 'Available'),
(601, 'DOC_EA8D58', '2027-03-01', '09:00:00', '09:30:00', 'Available'),
(602, 'DOC_EA8D58', '2027-03-01', '09:30:00', '10:00:00', 'Available'),
(603, 'DOC_EA8D58', '2027-03-01', '10:00:00', '10:30:00', 'Available'),
(604, 'DOC_EA8D58', '2027-03-08', '09:00:00', '09:30:00', 'Available'),
(605, 'DOC_EA8D58', '2027-03-08', '09:30:00', '10:00:00', 'Available'),
(606, 'DOC_EA8D58', '2027-03-08', '10:00:00', '10:30:00', 'Available'),
(607, 'DOC_EA8D58', '2027-03-15', '09:00:00', '09:30:00', 'Available'),
(608, 'DOC_EA8D58', '2027-03-15', '09:30:00', '10:00:00', 'Available'),
(609, 'DOC_EA8D58', '2027-03-15', '10:00:00', '10:30:00', 'Available'),
(610, 'DOC_EA8D58', '2027-03-22', '09:00:00', '09:30:00', 'Available'),
(611, 'DOC_EA8D58', '2027-03-22', '09:30:00', '10:00:00', 'Available'),
(612, 'DOC_EA8D58', '2027-03-22', '10:00:00', '10:30:00', 'Available'),
(613, 'DOC_EA8D58', '2027-03-29', '09:00:00', '09:30:00', 'Available'),
(614, 'DOC_EA8D58', '2027-03-29', '09:30:00', '10:00:00', 'Available'),
(615, 'DOC_EA8D58', '2027-03-29', '10:00:00', '10:30:00', 'Available'),
(616, 'DOC_EA8D58', '2027-04-05', '09:00:00', '09:30:00', 'Available'),
(617, 'DOC_EA8D58', '2027-04-05', '09:30:00', '10:00:00', 'Available'),
(618, 'DOC_EA8D58', '2027-04-05', '10:00:00', '10:30:00', 'Available'),
(619, 'DOC_EA8D58', '2027-04-12', '09:00:00', '09:30:00', 'Available'),
(620, 'DOC_EA8D58', '2027-04-12', '09:30:00', '10:00:00', 'Available'),
(621, 'DOC_EA8D58', '2027-04-12', '10:00:00', '10:30:00', 'Available'),
(622, 'DOC_EA8D58', '2027-04-19', '09:00:00', '09:30:00', 'Available'),
(623, 'DOC_EA8D58', '2027-04-19', '09:30:00', '10:00:00', 'Available'),
(624, 'DOC_EA8D58', '2027-04-19', '10:00:00', '10:30:00', 'Available');

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
('DOC_ARJUN', '', 'Cardiology', '9876098765', 5, 'Masters in Health Science', 500.00, 'Myself Amit Mehta. Iam Cardiologist. I can literally do anything and everything so please hire me ok. bye.', 37),
('DOC_D0BF60', '1234', 'Dentist', '9876109876', NULL, '', 500.00, 'Iam the best. Iam the GOAT. No one is better than me. Iam better than messi ok. Bye', 41),
('DOC_EA8D58', '', 'General', '9876109876', 20, 'MD, FACC - Cardiology & Internal Medicine, Board Certified', 500.00, 'Senior Dentist. I can do anything and everything. I can even make dead people alive..so please hire me ok. bye', 54),
('DOC_EMILY', '', 'Pediatrician', '', NULL, NULL, 500.00, 'Caring for children from birth to young adulthood.', NULL),
('DOC_MIKE', '', 'Neurologist', '', NULL, NULL, 500.00, 'Specializes in brain and nervous system disorders.', NULL),
('DOC_SARAH', '5678', 'Cardiology', '+1 (555) 123-4567', 15, 'MD, Board Certified Cardiologist', 500.00, 'Experienced cardiologist with 15 years of clinical practice. Specializes in interventional cardiology and heart disease prevention. Published numerous research papers in cardiac medicine.', 45);

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
(51, 'DOC_AC98CD', 'Appointment Reminder', 'You have an appointment with James Wilson tomorrow (Apr 29, 2026) at 10:00 AM. Appointment ref. #28.', 1, '2026-04-28 15:38:21'),
(52, 'PAT_002', 'Appointment Reminder', 'You have an appointment with Dr. Dr. Sarah tomorrow (Apr 30, 2026) at 11:00 AM. Appointment ref. #27.', 1, '2026-04-28 19:40:19'),
(53, 'DOC_D0BF60', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-04-29 at 10:00.', 0, '2026-04-28 19:40:35'),
(54, 'PAT_002', 'Follow-up Reminder: Tomorrow', 'Reminder: You have a follow-up appointment with Dr Cristiano Ronaldo tomorrow at 10:00 AM. Please arrive 10 minutes early.', 1, '2026-04-28 19:42:51'),
(55, 'DOC_D0BF60', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-04-29 at 14:00.', 0, '2026-04-28 19:43:02'),
(56, 'DOC_ARJUN', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-05-08 at 10:00.', 0, '2026-04-28 19:45:37'),
(57, 'DOC_ARJUN', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-05-07 at 09:00.', 0, '2026-04-30 15:02:37'),
(58, 'DOC_SARAH', 'New Feedback', 'Patient Stacy Mitchell left a feedback review.', 0, '2026-04-30 15:02:55'),
(59, 'DOC_ARJUN', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-05-08 at 14:00.', 0, '2026-04-30 15:04:32'),
(60, 'DOC_SARAH', 'Action Required: Consultation Follow-up', 'Your appointment with Stacy Mitchell on Apr 30, 2026 at 11:00 AM has ended. Please write your comments and schedule the next follow-up date. Appointment ref. #27.', 0, '2026-04-30 15:45:05'),
(61, 'DOC_ARJUN', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-05-04 at 09:00.', 0, '2026-04-30 15:54:26'),
(62, 'DOC_ARJUN', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-05-07 at 10:00.', 0, '2026-04-30 15:55:13'),
(63, 'DOC_AC98CD', 'Action Required: Consultation Follow-up', 'Your appointment with James Wilson on Apr 29, 2026 at 10:00 AM has ended. Please write your comments and schedule the next follow-up date. Appointment ref. #28.', 1, '2026-04-30 16:04:38'),
(64, 'DOC_ARJUN', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-05-04 at 09:30.', 0, '2026-04-30 16:12:24'),
(65, 'DOC_SARAH', 'New Appointment', 'Stacy Mitchell has booked an appointment with you for 2026-05-11 at 09:00.', 0, '2026-04-30 16:12:46');

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
-- Table structure for table `treatment_categories`
--

CREATE TABLE `treatment_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `estimated_cost` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `treatment_categories`
--

INSERT INTO `treatment_categories` (`id`, `name`, `description`, `estimated_cost`) VALUES
(1, 'General Consultation', 'Basic consultation with a general physician', 500.00),
(2, 'Cardiology', 'Heart-related examination and diagnosis', 1500.00),
(3, 'Orthopedics', 'Bone and joint assessment and treatment', 1200.00),
(4, 'Dermatology', 'Skin condition evaluation and treatment', 1200.00),
(5, 'Neurology', 'Brain and nervous system assessment', 2000.00),
(6, 'Pediatrics', 'Child health consultation and checkup', 1000.00),
(7, 'Gynecology', 'Women\'s health consultation', 1000.00),
(8, 'Ophthalmology', 'Eye examination and diagnosis', 1200.00),
(9, 'Physiotherapy', 'Physical rehabilitation and therapy session', 1100.00),
(10, 'Dentistry', 'Dental checkup and treatment', 1500.00);

-- --------------------------------------------------------

--
-- Table structure for table `treatment_tickets`
--

CREATE TABLE `treatment_tickets` (
  `id` int(11) NOT NULL,
  `ticket_number` varchar(30) NOT NULL,
  `patient_id` varchar(20) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `treatment_tickets`
--

INSERT INTO `treatment_tickets` (`id`, `ticket_number`, `patient_id`, `appointment_id`, `category_id`, `cost`, `generated_at`) VALUES
(1, 'TKT-20260428-392F09', 'PAT_002', 29, 10, 1500.00, '2026-04-28 21:40:35'),
(2, 'TKT-20260428-61FA9B', 'PAT_002', 30, 10, 1500.00, '2026-04-28 21:43:02'),
(3, 'TKT-20260429-138BD6', 'PAT_002', 31, 2, 1500.00, '2026-04-29 01:30:37'),
(4, 'TKT-20260430-D9013B', 'PAT_002', 32, 2, 1500.00, '2026-04-30 20:47:37'),
(5, 'TKT-20260430-04DD00', 'PAT_002', 33, 2, 1500.00, '2026-04-30 20:49:32'),
(6, 'TKT-20260430-2A35C1', 'PAT_002', 34, 2, 1500.00, '2026-04-30 21:39:26'),
(7, 'TKT-20260430-195453', 'PAT_002', 35, 2, 1500.00, '2026-04-30 21:40:13'),
(8, 'TKT-20260430-84EF80', 'PAT_002', 36, 2, 1500.00, '2026-04-30 21:57:24'),
(9, 'TKT-20260430-E3D68E', 'PAT_002', 37, 2, 1500.00, '2026-04-30 21:57:46');

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
-- Indexes for table `treatment_categories`
--
ALTER TABLE `treatment_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `treatment_tickets`
--
ALTER TABLE `treatment_tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_number` (`ticket_number`),
  ADD UNIQUE KEY `appointment_id` (`appointment_id`),
  ADD KEY `category_id` (`category_id`);

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
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `doctor_approvals`
--
ALTER TABLE `doctor_approvals`
  MODIFY `approval_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `doctor_availability`
--
ALTER TABLE `doctor_availability`
  MODIFY `avail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=625;

--
-- AUTO_INCREMENT for table `earnings`
--
ALTER TABLE `earnings`
  MODIFY `earning_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `treatment_categories`
--
ALTER TABLE `treatment_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `treatment_tickets`
--
ALTER TABLE `treatment_tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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

--
-- Constraints for table `treatment_tickets`
--
ALTER TABLE `treatment_tickets`
  ADD CONSTRAINT `treatment_tickets_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `treatment_categories` (`id`);
-- --------------------------------------------------------

--
-- Table structure for table `otp_tokens`
--

CREATE TABLE `otp_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
