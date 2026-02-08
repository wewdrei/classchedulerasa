-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 06, 2026 at 06:45 PM
-- Server version: 8.0.44
-- PHP Version: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `classcheduler`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class`
--

CREATE TABLE `class` (
  `id` int NOT NULL,
  `adviser` int NOT NULL DEFAULT '0',
  `section` varchar(255) DEFAULT NULL,
  `level` varchar(10) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_count` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `class`
--

INSERT INTO `class` (`id`, `adviser`, `section`, `level`, `course`, `created_at`, `updated_at`, `student_count`) VALUES
(1, 1, 'A', '11', '(ABM) Accountancy, Business and Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(2, 1, 'B', '11', '(ABM) Accountancy, Business and Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(3, 1, 'A', '11', '(GAS) General Academic Strand', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(4, 1, 'B', '11', '(GAS) General Academic Strand', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(5, 1, 'A', '11', '(HUMSS) Humanities and Social Sciences', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(6, 1, 'B', '11', '(HUMSS) Humanities and Social Sciences', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(7, 1, 'A', '11', '(STEM) Science, Technology, Engineering, and Mathematics', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(8, 1, 'B', '11', '(STEM) Science, Technology, Engineering, and Mathematics', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(9, 1, 'A', '11', '(ICT) Information and Communication Technology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(10, 1, 'B', '11', '(ICT) Information and Communication Technology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(11, 1, 'A', '11', '(HE) Home Economics', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(12, 1, 'B', '11', '(HE) Home Economics', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(13, 1, 'A', '11', '(SMAW) Shielded Metal Arc Welding', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(14, 1, 'B', '11', '(SMAW) Shielded Metal Arc Welding', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(15, 1, 'A', '11', '(AUTO) Automotive Servicing', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(16, 1, 'B', '11', '(AUTO) Automotive Servicing', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(17, 1, 'A', '12', '(ABM) Accountancy, Business and Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(18, 1, 'B', '12', '(ABM) Accountancy, Business and Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(19, 1, 'A', '12', '(GAS) General Academic Strand', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(20, 1, 'B', '12', '(GAS) General Academic Strand', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(21, 1, 'A', '12', '(HUMSS) Humanities and Social Sciences', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(22, 1, 'B', '12', '(HUMSS) Humanities and Social Sciences', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(23, 1, 'A', '12', '(STEM) Science, Technology, Engineering, and Mathematics', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(24, 1, 'B', '12', '(STEM) Science, Technology, Engineering, and Mathematics', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(25, 1, 'A', '12', '(ICT) Information and Communication Technology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(26, 1, 'B', '12', '(ICT) Information and Communication Technology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(27, 1, 'A', '12', '(HE) Home Economics', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(28, 1, 'B', '12', '(HE) Home Economics', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(29, 1, 'A', '12', '(SMAW) Shielded Metal Arc Welding', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(30, 1, 'B', '12', '(SMAW) Shielded Metal Arc Welding', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(31, 1, 'A', '12', '(AUTO) Automotive Servicing', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(32, 1, 'B', '12', '(AUTO) Automotive Servicing', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(33, 1, 'A', '1', '(BSIT) Bachelor of Science in Information Technology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(34, 1, 'B', '1', '(BSIT) Bachelor of Science in Information Technology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(35, 1, 'A', '1', '(BSHM) Bachelor of Science in Hospitality Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(36, 1, 'B', '1', '(BSHM) Bachelor of Science in Hospitality Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(37, 1, 'A', '1', '(BSAIS) Bachelor of Science in Accounting Information Systems', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(38, 1, 'B', '1', '(BSAIS) Bachelor of Science in Accounting Information Systems', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(39, 1, 'A', '1', '(BSTM) Bachelor of Science in Tourism Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(40, 1, 'B', '1', '(BSTM) Bachelor of Science in Tourism Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(41, 1, 'A', '1', '(BSOA) Bachelor of Science in Office Administration', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(42, 1, 'B', '1', '(BSOA) Bachelor of Science in Office Administration', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(43, 1, 'A', '1', '(BSENTREP) Bachelor of Science in Entrepreneurship', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(44, 1, 'B', '1', '(BSENTREP) Bachelor of Science in Entrepreneurship', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(45, 1, 'A', '1', '(BSBA-HRM) Bachelor of Science in Business Administration Major in HRM', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(46, 1, 'B', '1', '(BSBA-HRM) Bachelor of Science in Business Administration Major in HRM', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(47, 1, 'A', '1', '(BSBA-MM) Bachelor of Science in Business Administration Major in Marketing Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(48, 1, 'B', '1', '(BSBA-MM) Bachelor of Science in Business Administration Major in Marketing Management', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(49, 1, 'A', '1', '(BLIS) Bachelor of Library Information Science', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(50, 1, 'B', '1', '(BLIS) Bachelor of Library Information Science', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(51, 1, 'A', '1', '(BSCpE) Bachelor of Science in Computer Engineering', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(52, 1, 'B', '1', '(BSCpE) Bachelor of Science in Computer Engineering', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(53, 1, 'A', '1', '(BSP) Bachelor of Science in Psychology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(54, 1, 'B', '1', '(BSP) Bachelor of Science in Psychology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(55, 1, 'A', '1', '(BSCRIM) Bachelor of Science in Criminology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(56, 1, 'B', '1', '(BSCRIM) Bachelor of Science in Criminology', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(57, 1, 'A', '1', '(BPED) Bachelor of Physical Education', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(58, 1, 'B', '1', '(BPED) Bachelor of Physical Education', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(59, 1, 'A', '1', '(BTLED) Bachelor of Technology and Livelihood Education', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(60, 1, 'B', '1', '(BTLED) Bachelor of Technology and Livelihood Education', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(61, 1, 'A', '1', '(BEED) Bachelor of Elementary Education', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(62, 1, 'B', '1', '(BEED) Bachelor of Elementary Education', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(63, 1, 'A', '1', '(BSED) Bachelor of Secondary Education', '2025-08-24 17:23:53', '2025-09-07 04:38:26', 0),
(65, 0, 'wo', '1', 'bsit', '2025-09-20 14:04:45', '2025-09-20 14:04:45', 0),
(66, 0, 'lklnsdlfegnsjfgnhgsjdgnjd', '2032043040', 'ejfdfi', '2025-09-20 14:05:06', '2025-09-20 14:05:06', 0),
(67, 0, 'asmadka', '12', '3434bbb', '2025-09-20 15:03:48', '2025-09-20 15:03:48', 0),
(68, 0, 'aburaman', '12', 'bsit', '2025-09-21 12:35:31', '2025-09-21 12:35:39', 0),
(69, 0, 'hahahaahaha', '12', 'biitt', '2025-09-21 13:17:57', '2025-09-21 13:18:14', 0);

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int DEFAULT NULL,
  `message` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `logs`
--

INSERT INTO `logs` (`id`, `user_id`, `action`, `table_name`, `record_id`, `message`, `ip_address`, `user_agent`, `old_values`, `new_values`, `created_at`) VALUES
(1, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-08 20:38:04'),
(2, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-09 04:38:05'),
(3, NULL, 'insert', 'logs', 2, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-08 20:38:05'),
(4, NULL, 'update', 'users', 1, 'Updated 1 record(s) in users', NULL, NULL, NULL, NULL, '2025-09-08 20:42:40'),
(5, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-08 21:06:45'),
(6, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-09 05:06:45'),
(7, NULL, 'insert', 'logs', 6, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-08 21:06:45'),
(8, NULL, 'update', 'users', 1, 'Updated 1 record(s) in users', NULL, NULL, NULL, NULL, '2025-09-08 21:11:06'),
(9, 1, 'update', 'users', 1, 'Updated 1 record(s) in users', NULL, NULL, NULL, NULL, '2025-09-08 21:14:04'),
(10, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 05:58:10'),
(11, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 13:58:10'),
(12, 2, 'insert', 'logs', 11, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 05:58:10'),
(13, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 06:00:42'),
(14, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 14:00:43'),
(15, 2, 'insert', 'logs', 14, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 06:00:43'),
(16, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 06:02:01'),
(17, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 14:02:01'),
(18, 2, 'insert', 'logs', 17, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 06:02:01'),
(19, 2, 'update', 'users', 1, 'Updated 1 record(s) in users', NULL, NULL, NULL, NULL, '2025-09-20 06:03:31'),
(20, 2, 'update', 'users', 2, 'Updated 1 record(s) in users', NULL, NULL, NULL, NULL, '2025-09-20 06:03:46'),
(21, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 06:04:07'),
(22, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 14:04:07'),
(23, 2, 'insert', 'logs', 22, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 06:04:07'),
(24, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 06:04:16'),
(25, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 14:04:16'),
(26, 1, 'insert', 'logs', 25, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 06:04:16'),
(27, 1, 'insert', 'class', 65, 'Inserted new record into class', NULL, NULL, NULL, NULL, '2025-09-20 06:04:45'),
(28, 1, 'delete', 'class', NULL, 'Deleted 1 record(s) from class', NULL, NULL, NULL, NULL, '2025-09-20 06:04:55'),
(29, 1, 'insert', 'class', 66, 'Inserted new record into class', NULL, NULL, NULL, NULL, '2025-09-20 06:05:06'),
(30, 1, 'insert', 'subjects', 20, 'Inserted new record into subjects', NULL, NULL, NULL, NULL, '2025-09-20 06:05:22'),
(31, 1, 'update', 'subjects', 20, 'Updated 1 record(s) in subjects', NULL, NULL, NULL, NULL, '2025-09-20 06:05:35'),
(32, 1, 'delete', 'subjects', NULL, 'Deleted 1 record(s) from subjects', NULL, NULL, NULL, NULL, '2025-09-20 06:05:40'),
(33, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 06:09:27'),
(34, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 14:09:27'),
(35, 1, 'insert', 'logs', 34, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 06:09:27'),
(36, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 06:18:15'),
(37, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 14:18:15'),
(38, 1, 'insert', 'logs', 37, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 06:18:15'),
(39, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 06:21:46'),
(40, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 14:21:48'),
(41, 1, 'insert', 'logs', 40, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 06:21:48'),
(42, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 06:35:55'),
(43, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 14:35:55'),
(44, 1, 'insert', 'logs', 43, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 06:35:55'),
(45, 1, 'insert', 'schedules', 7, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-20 06:36:47'),
(46, 1, 'insert', 'schedules', 8, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-20 06:37:16'),
(47, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 07:00:10'),
(48, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 15:00:10'),
(49, 1, 'insert', 'logs', 48, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 07:00:10'),
(50, 1, 'update', 'schedules', 8, 'Updated 1 record(s) in schedules', NULL, NULL, NULL, NULL, '2025-09-20 07:00:48'),
(51, 1, 'insert', 'schedules', 9, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-20 07:01:41'),
(52, 1, 'insert', 'schedules', 10, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-20 07:02:31'),
(53, 1, 'insert', 'class', 67, 'Inserted new record into class', NULL, NULL, NULL, NULL, '2025-09-20 07:03:48'),
(54, 1, 'insert', 'subjects', 21, 'Inserted new record into subjects', NULL, NULL, NULL, NULL, '2025-09-20 07:04:09'),
(55, 1, 'update', 'subjects', 21, 'Updated 1 record(s) in subjects', NULL, NULL, NULL, NULL, '2025-09-20 07:04:26'),
(56, 1, 'update', 'subjects', 21, 'Updated 1 record(s) in subjects', NULL, NULL, NULL, NULL, '2025-09-20 07:04:56'),
(57, 1, 'insert', 'rooms', 5, 'Inserted new record into rooms', NULL, NULL, NULL, NULL, '2025-09-20 07:05:23'),
(58, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 07:08:41'),
(59, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 15:08:42'),
(60, 2, 'insert', 'logs', 59, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 07:08:42'),
(61, 2, 'insert', 'schedules', 11, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-20 07:09:42'),
(62, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 07:10:13'),
(63, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 15:10:13'),
(64, 1, 'insert', 'logs', 63, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 07:10:13'),
(65, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 08:42:23'),
(66, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 08:42:23'),
(67, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 16:42:24'),
(68, 1, 'insert', 'logs', 67, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 08:42:24'),
(69, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-20 16:42:25'),
(70, 1, 'insert', 'logs', 69, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-20 08:42:25'),
(71, 1, 'insert', 'schedules', 12, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-20 08:43:00'),
(72, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 02:51:04'),
(73, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 10:51:08'),
(74, 1, 'insert', 'logs', 73, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-21 02:51:08'),
(75, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 02:51:28'),
(76, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 10:51:30'),
(77, 2, 'insert', 'logs', 76, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-21 02:51:30'),
(78, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 02:52:14'),
(79, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 10:52:15'),
(80, 1, 'insert', 'logs', 79, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-21 02:52:15'),
(81, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 02:52:28'),
(82, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 10:52:29'),
(83, 2, 'insert', 'logs', 82, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-21 02:52:29'),
(84, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 04:34:51'),
(85, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 12:34:52'),
(86, 1, 'insert', 'logs', 85, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-21 04:34:52'),
(87, 1, 'insert', 'class', 68, 'Inserted new record into class', NULL, NULL, NULL, NULL, '2025-09-21 04:35:31'),
(88, 1, 'update', 'class', 68, 'Updated 1 record(s) in class', NULL, NULL, NULL, NULL, '2025-09-21 04:35:39'),
(89, 1, 'insert', 'subjects', 22, 'Inserted new record into subjects', NULL, NULL, NULL, NULL, '2025-09-21 04:36:06'),
(90, 1, 'update', 'subjects', 22, 'Updated 1 record(s) in subjects', NULL, NULL, NULL, NULL, '2025-09-21 04:36:19'),
(91, 1, 'update', 'subjects', 22, 'Updated 1 record(s) in subjects', NULL, NULL, NULL, NULL, '2025-09-21 04:36:59'),
(92, 1, 'insert', 'rooms', 6, 'Inserted new record into rooms', NULL, NULL, NULL, NULL, '2025-09-21 04:37:24'),
(93, 1, 'insert', 'schedules', 13, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:38:01'),
(94, 1, 'insert', 'schedules', 14, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:39:04'),
(95, 1, 'insert', 'schedules', 15, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:40:23'),
(96, 1, 'delete', 'schedules', NULL, 'Deleted 1 record(s) from schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:40:58'),
(97, 1, 'delete', 'schedules', NULL, 'Deleted 1 record(s) from schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:41:07'),
(98, 1, 'delete', 'schedules', NULL, 'Deleted 1 record(s) from schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:41:14'),
(99, 1, 'insert', 'schedules', 16, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:41:54'),
(100, 1, 'insert', 'schedules', 17, 'Inserted new record into schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:42:19'),
(101, 1, 'update', 'schedules', 11, 'Updated 1 record(s) in schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:42:41'),
(102, 1, 'update', 'schedules', 17, 'Updated 1 record(s) in schedules', NULL, NULL, NULL, NULL, '2025-09-21 04:43:49'),
(103, 1, 'update', 'users', 1, 'Updated 1 record(s) in users', NULL, NULL, NULL, NULL, '2025-09-21 04:44:45'),
(104, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 05:17:27'),
(105, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 13:17:28'),
(106, 1, 'insert', 'logs', 105, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-21 05:17:28'),
(107, 1, 'insert', 'class', 69, 'Inserted new record into class', NULL, NULL, NULL, NULL, '2025-09-21 05:17:57'),
(108, 1, 'update', 'class', 69, 'Updated 1 record(s) in class', NULL, NULL, NULL, NULL, '2025-09-21 05:18:14'),
(109, 1, 'insert', 'subjects', 23, 'Inserted new record into subjects', NULL, NULL, NULL, NULL, '2025-09-21 05:18:32'),
(110, 1, 'update', 'subjects', 23, 'Updated 1 record(s) in subjects', NULL, NULL, NULL, NULL, '2025-09-21 05:18:47'),
(111, 1, 'update', 'subjects', 23, 'Updated 1 record(s) in subjects', NULL, NULL, NULL, NULL, '2025-09-21 05:19:30'),
(112, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 05:20:03'),
(113, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 13:20:05'),
(114, 2, 'insert', 'logs', 113, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-21 05:20:05'),
(115, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 05:20:26'),
(116, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2025-09-21 13:20:28'),
(117, 1, 'insert', 'logs', 116, 'Inserted new record into logs', NULL, NULL, NULL, NULL, '2025-09-21 05:20:28'),
(118, 1, 'update', 'users', 1, 'Updated 1 record(s) in users', NULL, NULL, NULL, NULL, '2026-01-28 23:33:54'),
(119, 2, 'login', 'users', 2, 'User admin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2026-01-28 23:45:00'),
(120, 2, 'update', 'users', 2, 'Updated 1 record(s) in users', NULL, NULL, NULL, NULL, '2026-01-28 23:45:15'),
(121, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2026-01-28 23:45:24'),
(122, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2026-01-29 00:11:09'),
(123, 1, 'login', 'users', 1, 'User superadmin@gmail.com logged in successfully', NULL, NULL, NULL, NULL, '2026-02-06 07:34:24'),
(124, 1, 'update', 'rooms', 1, 'Updated room 101 (101)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '{\"id\": 1, \"status\": \"Active\", \"capacity\": 0, \"room_code\": \"101\", \"room_name\": \"101\", \"room_type\": \"Lecture Hall\", \"created_at\": \"2025-08-25T02:01:13.000000Z\", \"updated_at\": \"2026-02-07T00:37:48.000000Z\", \"room_number\": \"101\", \"campus_building\": \"Main Building\"}', '{\"status\": \"Active\", \"capacity\": 50, \"room_code\": \"101\", \"room_name\": \"101\", \"room_type\": \"Lecture Hall\", \"campus_building\": \"Main Building\"}', '2026-02-06 08:40:01'),
(125, 1, 'update', 'rooms', 2, 'Updated room 102 (102)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '{\"id\": 2, \"status\": \"Active\", \"capacity\": 0, \"room_code\": \"102\", \"room_name\": \"102\", \"room_type\": \"Lecture Hall\", \"created_at\": \"2025-08-25T02:01:13.000000Z\", \"updated_at\": \"2026-02-07T00:37:48.000000Z\", \"room_number\": \"102\", \"campus_building\": \"Main Building\"}', '{\"status\": \"Active\", \"capacity\": 50, \"room_code\": \"102\", \"room_name\": \"102\", \"room_type\": \"Lecture Hall\", \"campus_building\": \"Main Building\"}', '2026-02-06 08:40:06'),
(126, 1, 'update', 'rooms', 3, 'Updated room 103 (103)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '{\"id\": 3, \"status\": \"Active\", \"capacity\": 0, \"room_code\": \"103\", \"room_name\": \"103\", \"room_type\": \"Lecture Hall\", \"created_at\": \"2025-08-25T02:01:13.000000Z\", \"updated_at\": \"2026-02-07T00:37:48.000000Z\", \"room_number\": \"103\", \"campus_building\": \"Main Building\"}', '{\"status\": \"Active\", \"capacity\": 50, \"room_code\": \"103\", \"room_name\": \"103\", \"room_type\": \"Lecture Hall\", \"campus_building\": \"Main Building\"}', '2026-02-06 08:40:13'),
(127, 1, 'update', 'rooms', 4, 'Updated room 104 (104)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '{\"id\": 4, \"status\": \"Active\", \"capacity\": 0, \"room_code\": \"104\", \"room_name\": \"104\", \"room_type\": \"Lecture Hall\", \"created_at\": \"2025-08-25T02:01:13.000000Z\", \"updated_at\": \"2026-02-07T00:37:48.000000Z\", \"room_number\": \"104\", \"campus_building\": \"Main Building\"}', '{\"status\": \"Active\", \"capacity\": 50, \"room_code\": \"104\", \"room_name\": \"104\", \"room_type\": \"Lecture Hall\", \"campus_building\": \"Main Building\"}', '2026-02-06 08:40:21'),
(128, 1, 'update', 'rooms', 5, 'Updated room 105 (105)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '{\"id\": 5, \"status\": \"Active\", \"capacity\": 0, \"room_code\": \"105\", \"room_name\": \"105\", \"room_type\": \"Lecture Hall\", \"created_at\": \"2025-09-20T23:05:23.000000Z\", \"updated_at\": \"2026-02-07T00:37:48.000000Z\", \"room_number\": \"105\", \"campus_building\": \"Main Building\"}', '{\"status\": \"Active\", \"capacity\": 50, \"room_code\": \"105\", \"room_name\": \"105\", \"room_type\": \"Lecture Hall\", \"campus_building\": \"Main Building\"}', '2026-02-06 08:40:29'),
(129, 1, 'update', 'rooms', 6, 'Updated room 106 (106)', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '{\"id\": 6, \"status\": \"Active\", \"capacity\": 0, \"room_code\": \"106\", \"room_name\": \"106\", \"room_type\": \"Lecture Hall\", \"created_at\": \"2025-09-21T20:37:24.000000Z\", \"updated_at\": \"2026-02-07T00:37:48.000000Z\", \"room_number\": \"106\", \"campus_building\": \"Main Building\"}', '{\"status\": \"Active\", \"capacity\": 50, \"room_code\": \"106\", \"room_name\": \"106\", \"room_type\": \"Lecture Hall\", \"campus_building\": \"Main Building\"}', '2026-02-06 08:40:36');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_09_09_045124_create_sessions_table', 1),
(5, '2025_10_30_000001_fix_users_id_auto_increment', 1),
(6, '2026_01_03_081749_add_columns_to_rooms_table', 1),
(7, '2026_01_03_093532_add_columns_to_subjects_table', 1),
(8, '2026_01_03_103441_create_class_table', 1),
(9, '2026_01_28_181203_update_subjects_table', 1),
(10, '2026_01_29_000001_refactor_schema_for_smart_scheduler', 1),
(11, '2026_02_06_000001_add_audit_columns_to_logs_table', 2),
(12, '2026_02_06_162644_alter_rooms_status_to_string', 3),
(13, '2026_02_06_163723_fix_rooms_missing_data_and_active', 4);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int NOT NULL,
  `room_number` varchar(50) NOT NULL,
  `room_name` varchar(255) DEFAULT NULL,
  `room_code` varchar(255) DEFAULT NULL,
  `campus_building` varchar(255) DEFAULT NULL,
  `room_type` varchar(255) DEFAULT NULL,
  `capacity` int DEFAULT '0',
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `room_number`, `room_name`, `room_code`, `campus_building`, `room_type`, `capacity`, `status`, `created_at`, `updated_at`) VALUES
(1, '101', '101', '101', 'Main Building', 'Lecture Hall', 50, 'Active', '2025-08-24 18:01:13', '2026-02-06 08:40:01'),
(2, '102', '102', '102', 'Main Building', 'Lecture Hall', 50, 'Active', '2025-08-24 18:01:13', '2026-02-06 08:40:06'),
(3, '103', '103', '103', 'Main Building', 'Lecture Hall', 50, 'Active', '2025-08-24 18:01:13', '2026-02-06 08:40:13'),
(4, '104', '104', '104', 'Main Building', 'Lecture Hall', 50, 'Active', '2025-08-24 18:01:13', '2026-02-06 08:40:21'),
(5, '105', '105', '105', 'Main Building', 'Lecture Hall', 50, 'Active', '2025-09-20 15:05:23', '2026-02-06 08:40:29'),
(6, '106', '106', '106', 'Main Building', 'Lecture Hall', 50, 'Active', '2025-09-21 12:37:24', '2026-02-06 08:40:36'),
(7, 'MC-101', 'Lecture Room 101', 'MC101', 'Main Building', 'Lecture Hall', 50, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(8, 'MC-102', 'Lecture Room 102', 'MC102', 'Main Building', 'Lecture Hall', 50, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(9, 'MC-103', 'Lecture Room 103', 'MC103', 'Main Building', 'Lecture Hall', 45, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(10, 'MC-201', 'Computer Lab 201', 'MCL201', 'Main Building', 'Computer Lab', 40, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(11, 'MC-202', 'Computer Lab 202', 'MCL202', 'Main Building', 'Computer Lab', 40, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(12, 'MC-301', 'Faculty Room', 'MCFR', 'Main Building', 'Faculty Room', 20, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(13, 'MC-LIB', 'Main Campus Library', 'MCLIB', 'Main Building', 'Library', 100, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(14, 'DC-101', 'Lecture Room 101', 'DC101', 'Dr. Carino Hall', 'Lecture Hall', 55, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(15, 'DC-102', 'Lecture Room 102', 'DC102', 'Dr. Carino Hall', 'Lecture Hall', 55, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(16, 'DC-103', 'Lecture Room 103', 'DC103', 'Dr. Carino Hall', 'Lecture Hall', 50, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(17, 'DC-201', 'IT Laboratory', 'DCIT201', 'Dr. Carino Hall', 'Computer Lab', 45, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(18, 'DC-202', 'ICT Laboratory', 'DCIT202', 'Dr. Carino Hall', 'Computer Lab', 45, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(19, 'DC-301', 'Science Laboratory', 'DCSCI301', 'Dr. Carino Hall', 'Science Laboratory', 35, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(20, 'DC-401', 'MV Campus Library', 'DCLIB', 'Dr. Carino Hall', 'Library', 120, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(21, 'DC-402', 'AVR / Seminar Room', 'DCAVR', 'Dr. Carino Hall', 'AVR', 80, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(22, 'DC-501', 'Multi-Purpose Hall', 'DCMPH', 'Dr. Carino Hall', 'Multi-Purpose Hall', 200, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(23, 'VB-101', 'Lecture Room 101', 'VB101', 'Vicente Building', 'Lecture Hall', 50, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(24, 'VB-102', 'Lecture Room 102', 'VB102', 'Vicente Building', 'Lecture Hall', 50, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(25, 'VB-201', 'Criminology Lab', 'VBCRIM', 'Vicente Building', 'Laboratory', 40, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(26, 'VB-OFF', 'Registrar Office', 'VBREG', 'Vicente Building', 'Office', 15, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(27, 'SA-101', 'Lecture Room 101', 'SA101', 'San Agustin Building', 'Lecture Hall', 45, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(28, 'SA-102', 'Lecture Room 102', 'SA102', 'San Agustin Building', 'Lecture Hall', 45, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41'),
(29, 'SA-201', 'Computer Lab', 'SACOMP', 'San Agustin Building', 'Computer Lab', 35, 'Active', '2026-02-06 08:27:41', '2026-02-06 08:27:41');

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `id` int NOT NULL,
  `room_id` int NOT NULL,
  `day_of_week` enum('Mon','Tue','Wed','Thu','Fri','Sat','Sun') DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `class_id` int NOT NULL,
  `type` tinyint NOT NULL COMMENT '0=Regular, 1=Special, 2=Exam, 3=Assignment',
  `description` varchar(255) DEFAULT NULL,
  `datetime_start` datetime NOT NULL,
  `datetime_end` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `subject_id` bigint UNSIGNED DEFAULT NULL,
  `teacher_id` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`id`, `room_id`, `day_of_week`, `start_time`, `end_time`, `class_id`, `type`, `description`, `datetime_start`, `datetime_end`, `created_at`, `updated_at`, `subject_id`, `teacher_id`) VALUES
(2, 2, NULL, NULL, NULL, 2, 1, 'Special session - Science Lab', '2025-09-02 14:00:00', '2025-09-02 16:00:00', '2025-08-25 07:19:20', '2025-08-25 07:19:20', NULL, NULL),
(3, 3, NULL, NULL, NULL, 3, 2, 'Midterm Exam - English', '2025-08-30 18:00:00', '2025-08-30 20:00:00', '2025-08-25 07:19:20', '2025-08-25 09:30:58', NULL, NULL),
(4, 1, NULL, NULL, NULL, 2, 3, 'Assignment submission - History', '2025-09-15 17:00:00', '2025-09-15 19:00:00', '2025-08-25 07:19:20', '2025-08-25 09:28:58', NULL, NULL),
(6, 1, NULL, NULL, NULL, 7, 2, 'Class (A - 11 - (STEM) Science, Technology, Engineering, and Mathematics) will use room (101) for (Exam)', '2025-09-15 00:20:00', '2025-09-15 15:20:00', '2025-09-07 11:20:12', '2025-09-07 11:21:42', NULL, NULL),
(7, 1, NULL, NULL, NULL, 66, 0, 'Class (lklnsdlfegnsjfgnhgsjdgnjd - 2032043040 - ejfdfi) will use room (101) for (Regular Class)', '2025-09-20 22:36:00', '2025-09-20 23:36:00', '2025-09-20 14:36:47', '2025-09-20 14:36:47', NULL, NULL),
(8, 1, NULL, NULL, NULL, 66, 0, 'Class (lklnsdlfegnsjfgnhgsjdgnjd - 2032043040 - ejfdfi) will use room (101) for (Regular Class)', '2025-09-20 17:37:00', '2025-09-20 15:37:00', '2025-09-20 14:37:16', '2025-09-20 15:00:48', NULL, NULL),
(9, 1, NULL, NULL, NULL, 65, 3, 'Class (wo - 1 - bsit) will use room (101) for (Assignment)', '2025-09-20 14:01:00', '2025-09-20 14:03:00', '2025-09-20 15:01:41', '2025-09-20 15:01:41', NULL, NULL),
(10, 3, NULL, NULL, NULL, 1, 3, 'Class (A - 11 - (ABM) Accountancy, Business and Management) will use room (103) for (Assignment)', '2025-09-20 23:03:00', '2025-09-20 15:02:00', '2025-09-20 15:02:31', '2025-09-20 15:02:31', NULL, NULL),
(11, 1, NULL, NULL, NULL, 2, 2, 'Class (B - 11 - (ABM) Accountancy, Business and Management) will use room (101) for (Exam)', '2025-09-21 15:09:00', '2025-09-22 15:09:00', '2025-09-20 15:09:42', '2025-09-21 12:42:41', NULL, NULL),
(12, 1, NULL, NULL, NULL, 1, 0, 'Class (A - 11 - (ABM) Accountancy, Business and Management) will use room (101) for (Regular Class)', '2025-09-21 04:42:00', '2025-09-21 05:46:00', '2025-09-20 16:43:00', '2025-09-20 16:43:00', NULL, NULL),
(16, 6, NULL, NULL, NULL, 1, 0, 'Class (A - 11 - (ABM) Accountancy, Business and Management) will use room (106) for (Regular Class)', '2025-09-21 20:45:00', '2025-09-21 20:50:00', '2025-09-21 12:41:54', '2025-09-21 12:41:54', NULL, NULL),
(17, 6, NULL, NULL, NULL, 6, 0, 'Class (B - 11 - (HUMSS) Humanities and Social Sciences) will use room (106) for (Regular Class)', '2025-09-21 12:46:00', '2025-09-21 12:51:00', '2025-09-21 12:42:19', '2025-09-21 12:43:49', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int NOT NULL,
  `class_id` int NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `subject_code` varchar(255) DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `year_level` int DEFAULT NULL,
  `semester` tinyint(1) NOT NULL COMMENT '1 = First Sem, 2 = Second Sem',
  `units` int DEFAULT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `class_id`, `subject_name`, `subject_code`, `program_id`, `year_level`, `semester`, `units`, `description`, `created_at`, `updated_at`) VALUES
(1, 46, 'Purposive Communication', 'CC101', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(2, 46, 'Mathematics in the Modern World', 'CC102', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(3, 46, 'Understanding the Self', 'CC103', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(4, 46, 'Philippine History', 'CC104', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(5, 46, 'The Contemporary World', 'CC105', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(6, 46, 'Physical Education 1', 'CC106', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(7, 46, 'National Service Training Program 1 (NSTP 1)', 'CC107', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(8, 46, 'Introduction to Computing', 'CC108', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(9, 46, 'Living in the IT Era', 'CC109', NULL, 1, 1, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(10, 46, 'Readings in Philippine History', 'CC201', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(11, 46, 'Ethics', 'CC202', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(12, 46, 'Science, Technology, and Society', 'CC203', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(13, 46, 'Art Appreciation', 'CC204', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(14, 46, 'Physical Education 2', 'CC205', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(15, 46, 'National Service Training Program 2 (NSTP 2)', 'CC206', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(16, 46, 'Programming 1 (Java Fundamentals)', 'CC207', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(17, 46, 'The Life and Works of Rizal', 'CC208', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(18, 46, 'Writing in the Discipline', 'CC209', NULL, 1, 2, 3, NULL, '2025-08-24 17:27:22', '2026-01-29 00:12:31'),
(19, 1, 'Filipino', 'SUBJ-19', NULL, 11, 1, 3, NULL, '2025-09-07 11:23:23', '2026-01-29 00:12:31'),
(21, 67, 'awuergghdghdfhdfh', 'SUBJ-21', NULL, 12, 1, 3, NULL, '2025-09-20 15:04:09', '2026-01-29 00:12:31'),
(22, 68, 'hotdogs', 'SUBJ-22', NULL, 12, 2, 3, NULL, '2025-09-21 12:36:06', '2026-01-29 00:12:31'),
(23, 69, 'wew', 'SUBJ-23', NULL, 12, 1, 3, NULL, '2025-09-21 13:18:32', '2026-01-29 00:12:31');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `role` enum('Student','Instructor','Admin','SuperAdmin') DEFAULT 'Student',
  `email` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `middle_name`, `last_name`, `password`, `profile`, `department`, `role`, `email`, `created_at`) VALUES
(1, 'Super', NULL, 'Admin', '$2y$12$wwTBiFMYViZY6ALIpSRo1evR.B8T0HTW3UIT7iZ3cHsP4eMCADcmm', '/storage/profiles/prof_697b0d62d44a2.gif', NULL, 'SuperAdmin', 'superadmin@gmail.com', '2025-08-23 08:03:31'),
(2, 'Admin', 'null', 'Admins', '$2y$12$1P/WKgNQcW4cViEzSPk8e.Ag/EoJ4UPaUY/TkANMgec.CfQWOWyaK', '/storage/profiles/prof_697b100b70f79.gif', NULL, 'Admin', 'admin@gmail.com', '2025-08-23 08:03:31');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `class`
--
ALTER TABLE `class`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_number` (`room_number`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `schedules_time_idx` (`day_of_week`,`start_time`,`end_time`),
  ADD KEY `schedules_subject_id_index` (`subject_id`),
  ADD KEY `schedules_teacher_id_index` (`teacher_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subjects_subject_code_index` (`subject_code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `class`
--
ALTER TABLE `class`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=130;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
