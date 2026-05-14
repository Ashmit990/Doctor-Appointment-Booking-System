<?php

/**
 * One-time CLI: bcrypt-hash any legacy plaintext passwords in `users` and `doctor_approvals`.
 *
 * Usage (from project root):
 *   php database/rehash_legacy_passwords.php
 */

declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root . '/api/config/db.php';
require_once $root . '/api/includes/password_helper.php';

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "Run from command line only.\n");
    exit(1);
}

$nUsers = 0;
$nApprovals = 0;

$res = $conn->query('SELECT user_id, password_hash FROM users');
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $stored = (string) ($row['password_hash'] ?? '');
        if ($stored === '' || app_password_is_hashed($stored)) {
            continue;
        }
        $hash = app_hash_password($stored);
        $u = $conn->prepare('UPDATE users SET password_hash = ? WHERE user_id = ?');
        if ($u) {
            $uid = (string) $row['user_id'];
            $u->bind_param('ss', $hash, $uid);
            $u->execute();
            $u->close();
            $nUsers++;
        }
    }
    $res->free();
}

$res = $conn->query('SELECT approval_id, password_hash FROM doctor_approvals');
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $stored = (string) ($row['password_hash'] ?? '');
        if ($stored === '' || app_password_is_hashed($stored)) {
            continue;
        }
        $hash = app_hash_password($stored);
        $u = $conn->prepare('UPDATE doctor_approvals SET password_hash = ? WHERE approval_id = ?');
        if ($u) {
            $id = (int) $row['approval_id'];
            $u->bind_param('si', $hash, $id);
            $u->execute();
            $u->close();
            $nApprovals++;
        }
    }
    $res->free();
}

$conn->close();

echo "Updated users: {$nUsers}, doctor_approvals: {$nApprovals}\n";
