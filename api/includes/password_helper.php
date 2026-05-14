<?php

declare(strict_types=1);

/**
 * Hash a plaintext password for storage (bcrypt via PASSWORD_DEFAULT).
 */
function app_hash_password(string $plain): string
{
    return password_hash($plain, PASSWORD_DEFAULT);
}

/**
 * True if the stored string is a hash produced by password_hash() (not legacy plaintext).
 */
function app_password_is_hashed(string $stored): bool
{
    $info = password_get_info($stored);

    return ($info['algo'] ?? 0) !== 0;
}

/**
 * Verify a plaintext password against the stored value.
 * Supports current bcrypt/argon hashes and legacy plaintext rows (migration).
 */
function app_verify_password(string $plain, string $stored): bool
{
    if ($stored === '') {
        return false;
    }
    if (app_password_is_hashed($stored)) {
        return password_verify($plain, $stored);
    }

    return hash_equals($stored, $plain);
}

/**
 * Value safe to persist in users.password_hash / doctor_approvals.password_hash:
 * re-hash legacy plaintext from older rows; leave modern hashes unchanged.
 */
function app_normalize_password_for_storage(string $storedFromDb): string
{
    if (app_password_is_hashed($storedFromDb)) {
        return $storedFromDb;
    }

    return app_hash_password($storedFromDb);
}
