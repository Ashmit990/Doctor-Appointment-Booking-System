<?php
// ─── SMTP Email Configuration ────────────────────────────────────────────────
//
// Setup steps for Gmail:
//  1. Enable 2-Step Verification in your Google Account
//  2. Go to: Google Account → Security → App Passwords
//  3. Select app: Mail | Select device: Windows Computer
//  4. Copy the generated 16-char password → paste in SMTP_PASS below
//
// ─────────────────────────────────────────────────────────────────────────────

define('SMTP_HOST',      'smtp.gmail.com');
define('SMTP_PORT',      465);
define('SMTP_USER',      'healthcare2061@gmail.com');
define('SMTP_PASS',      'dddp hwvs psir cytl');
define('SMTP_FROM',      'healthcare2061@gmail.com');
define('SMTP_FROM_NAME', 'Health Care System');
