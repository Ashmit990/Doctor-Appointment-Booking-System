-- ============================================================
-- AI Chat History Migration
-- Run this once to add chat history support for logged-in patients
-- ============================================================

-- OPTION A: Fresh install (table does not exist yet)
-- Run this if you have never set up ai_chat_history before

CREATE TABLE IF NOT EXISTS ai_chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(64) NOT NULL DEFAULT '',
    role ENUM('user', 'ai') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_session (session_id)
);

-- ============================================================
-- OPTION B: Table already exists but is missing session_id
-- Run these two lines if you already created the table without session_id

ALTER TABLE ai_chat_history
    ADD COLUMN session_id VARCHAR(64) NOT NULL DEFAULT '' AFTER user_id;

ALTER TABLE ai_chat_history
    ADD INDEX idx_session (session_id);
