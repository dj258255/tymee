-- V1__create_users_table.sql
-- 사용자 테이블 생성

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    nickname VARCHAR(50) NOT NULL,
    profile_image_id BIGINT,
    bio TEXT,
    level INT,
    tier VARCHAR(20),
    total_study_minutes BIGINT DEFAULT 0,
    status VARCHAR(20),
    role VARCHAR(20),
    last_login_at DATETIME(6),
    last_active_at DATETIME(6),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    deleted_at DATETIME(6),

    INDEX idx_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;