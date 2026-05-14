-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: hospital
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_chat_history`
--

DROP TABLE IF EXISTS `ai_chat_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_chat_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `session_id` varchar(64) NOT NULL DEFAULT '',
  `role` enum('user','ai') NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  KEY `idx_session` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appointment_payments`
--

DROP TABLE IF EXISTS `appointment_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appointment_payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) DEFAULT NULL,
  `patient_id` varchar(20) NOT NULL,
  `doctor_id` varchar(20) NOT NULL,
  `avail_id` int(11) NOT NULL,
  `payment_method` varchar(30) NOT NULL DEFAULT 'Khalti',
  `pidx` varchar(100) DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `amount_paisa` int(11) NOT NULL,
  `amount_rupees` decimal(10,2) NOT NULL,
  `payment_status` enum('Initiated','Pending','Completed','Failed','Expired','Cancelled','Refunded') NOT NULL DEFAULT 'Initiated',
  `booking_payload` longtext NOT NULL,
  `gateway_response` longtext DEFAULT NULL,
  `callback_status` varchar(40) DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_appointment_payments_pidx` (`pidx`),
  KEY `idx_appointment_payments_appointment_id` (`appointment_id`),
  KEY `idx_appointment_payments_patient_id` (`patient_id`),
  KEY `idx_appointment_payments_avail_id` (`avail_id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appointments` (
  `appointment_id` int(11) NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (`appointment_id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doctor_approvals`
--

DROP TABLE IF EXISTS `doctor_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctor_approvals` (
  `approval_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `bio` text DEFAULT NULL,
  `status` enum('Pending','Accepted','Rejected') DEFAULT 'Pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`approval_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doctor_availability`
--

DROP TABLE IF EXISTS `doctor_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctor_availability` (
  `avail_id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` varchar(20) NOT NULL,
  `available_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('Available','Booked','Blocked','Closed') DEFAULT 'Available',
  PRIMARY KEY (`avail_id`),
  UNIQUE KEY `unique_doctor_time_slot` (`doctor_id`,`available_date`,`start_time`,`end_time`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `doctor_availability_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7530 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doctor_profiles`
--

DROP TABLE IF EXISTS `doctor_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctor_profiles` (
  `user_id` varchar(20) NOT NULL,
  `medical_id` varchar(50) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `experience_years` int(2) DEFAULT NULL,
  `qualifications` varchar(255) DEFAULT NULL,
  `consultation_fee` decimal(10,2) DEFAULT 500.00,
  `bio` text DEFAULT NULL,
  `age` int(3) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `doctor_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `earnings`
--

DROP TABLE IF EXISTS `earnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `earnings` (
  `earning_id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` varchar(20) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`earning_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `earnings_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `earnings_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_reports`
--

DROP TABLE IF EXISTS `medical_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medical_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) NOT NULL,
  `patient_id` varchar(20) NOT NULL,
  `doctor_id` varchar(20) NOT NULL,
  `symptoms` text NOT NULL,
  `diagnosis` text NOT NULL,
  `blood_pressure` varchar(20) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `prescribed_medicines` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`prescribed_medicines`)),
  `additional_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`report_id`),
  UNIQUE KEY `appointment_report` (`appointment_id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `medical_reports_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  CONSTRAINT `medical_reports_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `medical_reports_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_profiles`
--

DROP TABLE IF EXISTS `patient_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient_profiles` (
  `user_id` varchar(20) NOT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(15) DEFAULT NULL,
  `age` int(3) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `patient_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `treatment_categories`
--

DROP TABLE IF EXISTS `treatment_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `treatment_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `estimated_cost` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `treatment_tickets`
--

DROP TABLE IF EXISTS `treatment_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `treatment_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(30) NOT NULL,
  `patient_id` varchar(20) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  UNIQUE KEY `appointment_id` (`appointment_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `treatment_tickets_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `treatment_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Patient','Doctor') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `schedule_setup_completed` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-14  9:46:24
