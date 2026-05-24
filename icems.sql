-- ============================================================
--  ICEMS-main  |  Full Database Schema
--  Generated from Laravel migrations & AuthController
-- ============================================================
CREATE DATABASE IF NOT EXISTS `ICEMS-main` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ICEMS-main`;
-- ──────────────────────────────────────────────────────────────
-- 1. students
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `students` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_number` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `course` VARCHAR(255) DEFAULT NULL,
    `year` VARCHAR(255) DEFAULT NULL,
    `section` VARCHAR(255) DEFAULT NULL,
    `profile_picture` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `students_student_number_unique` (`student_number`),
    UNIQUE KEY `students_email_unique` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 2. notifications
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_number` VARCHAR(255) NOT NULL,
    `type` ENUM('success', 'info', 'warning', 'error') NOT NULL DEFAULT 'info',
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `category` ENUM(
        'payments',
        'events',
        'clearance',
        'general',
        'attendance'
    ) NOT NULL DEFAULT 'general',
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `read_at` TIMESTAMP NULL DEFAULT NULL,
    `action_url` VARCHAR(255) DEFAULT NULL,
    `reference_type` VARCHAR(255) DEFAULT NULL,
    `reference_id` BIGINT UNSIGNED DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `notifications_student_number_is_read_index` (`student_number`, `is_read`),
    KEY `notifications_student_number_category_index` (`student_number`, `category`),
    KEY `notifications_created_at_index` (`created_at`),
    CONSTRAINT `notifications_student_number_foreign` FOREIGN KEY (`student_number`) REFERENCES `students` (`student_number`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 3. events
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `event_date` DATE NOT NULL,
    `time` VARCHAR(255) NOT NULL,
    `start_time` VARCHAR(255) DEFAULT NULL,
    `end_time` VARCHAR(255) DEFAULT NULL,
    `location` VARCHAR(255) NOT NULL,
    `audience` VARCHAR(255) NOT NULL DEFAULT 'All Students',
    `admin` VARCHAR(255) NOT NULL,
    `is_clearance` TINYINT(1) NOT NULL DEFAULT 0,
    `category` ENUM('mandatory', 'optional') NOT NULL DEFAULT 'optional',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 4a. clearance_submissions  (event attendance proof)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `clearance_submissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_email` VARCHAR(255) NOT NULL,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `event_title` VARCHAR(255) NOT NULL,
    `event_date` DATE NOT NULL,
    `proof_image` TEXT NOT NULL,
    `notes` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `admin_notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `clearance_submissions_student_email_status_index` (`student_email`, `status`),
    CONSTRAINT `clearance_submissions_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 4b. gymnasium_clearances
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `gymnasium_clearances` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` VARCHAR(255) NOT NULL,
    `student_name` VARCHAR(255) NOT NULL,
    `student_email` VARCHAR(255) NOT NULL,
    `section` VARCHAR(255) DEFAULT NULL,
    `clearance_type` ENUM('online', 'direct_visit') NOT NULL DEFAULT 'online',
    `borrowed_equipment` TINYINT(1) NOT NULL DEFAULT 0,
    `equipment_items` JSON DEFAULT NULL,
    `proof_image` TEXT DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `remarks` TEXT DEFAULT NULL,
    `submitted_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `gymnasium_clearances_student_id_status_index` (`student_id`, `status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 4c. laboratory_clearances
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `laboratory_clearances` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` VARCHAR(255) NOT NULL,
    `student_name` VARCHAR(255) NOT NULL,
    `student_email` VARCHAR(255) NOT NULL,
    `section` VARCHAR(255) DEFAULT NULL,
    `clearance_type` ENUM('online', 'direct_visit') NOT NULL DEFAULT 'online',
    `borrowed_equipment` TINYINT(1) NOT NULL DEFAULT 0,
    `equipment_items` JSON DEFAULT NULL,
    `proof_image` TEXT DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `remarks` TEXT DEFAULT NULL,
    `submitted_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `laboratory_clearances_student_id_status_index` (`student_id`, `status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 4d. library_clearances
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `library_clearances` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` VARCHAR(255) NOT NULL,
    `student_name` VARCHAR(255) NOT NULL,
    `student_email` VARCHAR(255) NOT NULL,
    `section` VARCHAR(255) DEFAULT NULL,
    `clearance_type` ENUM('online', 'direct_visit') NOT NULL DEFAULT 'online',
    `borrowed_books` TINYINT(1) NOT NULL DEFAULT 0,
    `book_items` JSON DEFAULT NULL,
    `proof_image` TEXT DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `remarks` TEXT DEFAULT NULL,
    `submitted_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `library_clearances_student_id_status_index` (`student_id`, `status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 4e. nurse_clearances
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `nurse_clearances` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` VARCHAR(255) NOT NULL,
    `student_name` VARCHAR(255) NOT NULL,
    `section` VARCHAR(255) DEFAULT NULL,
    `health_answers` JSON DEFAULT NULL,
    `medical_certificate` TEXT DEFAULT NULL,
    `vaccination_record` TEXT DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `remarks` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `nurse_clearances_student_id_status_index` (`student_id`, `status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 4f. health_questions  (managed by nurse/admin)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `health_questions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `question` TEXT NOT NULL,
    `description` TEXT DEFAULT NULL,
    `type` ENUM('yes/no', 'text', 'textarea') NOT NULL DEFAULT 'yes/no',
    `order` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 5a. payment_requirements
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payment_requirements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `due_date` DATE NOT NULL,
    `is_mandatory` TINYINT(1) NOT NULL DEFAULT 1,
    `gcash_name` VARCHAR(255) DEFAULT NULL,
    `gcash_number` VARCHAR(255) DEFAULT NULL,
    `qr_code` VARCHAR(255) DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 5b. payments
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_number` VARCHAR(255) NOT NULL,
    `requirement_id` BIGINT UNSIGNED NOT NULL,
    `requirement_title` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `proof_image` VARCHAR(255) NOT NULL,
    `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    `admin_notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `payments_student_number_status_index` (`student_number`, `status`),
    CONSTRAINT `payments_requirement_id_foreign` FOREIGN KEY (`requirement_id`) REFERENCES `payment_requirements` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- 5c. password_reset_codes
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `password_reset_codes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `token` VARCHAR(255) DEFAULT NULL,
    `is_used` TINYINT(1) NOT NULL DEFAULT 0,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `password_reset_codes_email_index` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ──────────────────────────────────────────────────────────────
-- Laravel internal tables (required by the framework)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `migrations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INT NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `abilities` TEXT DEFAULT NULL,
    `last_used_at` TIMESTAMP NULL DEFAULT NULL,
    `expires_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
    KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ============================================================
--  END OF SCHEMA
-- ============================================================