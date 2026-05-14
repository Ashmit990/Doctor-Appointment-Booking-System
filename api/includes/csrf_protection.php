<?php
/**
 * CSRF Protection Utility
 * Provides functions for generating, storing, and validating CSRF tokens
 */

class CSRFProtection {
    const TOKEN_NAME = '_csrf_token';
    const TOKEN_LENGTH = 32;
    const SESSION_KEY = 'csrf_token';

    /**
     * Generate a new CSRF token and store it in the session
     * @return string The CSRF token
     */
    public static function generateToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Generate a new token if one doesn't exist or regenerate for security
        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));
        $_SESSION[self::SESSION_KEY] = $token;
        return $token;
    }

    /**
     * Get the current CSRF token from session
     * If no token exists, generate one
     * @return string The CSRF token
     */
    public static function getToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION[self::SESSION_KEY])) {
            return self::generateToken();
        }

        return $_SESSION[self::SESSION_KEY];
    }

    /**
     * Validate a CSRF token from POST/GET request
     * @param string $token The token to validate (optional, will check POST/GET if not provided)
     * @return bool True if token is valid, false otherwise
     */
    public static function validateToken($token = null) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // If token not provided, try to get from POST or GET
        if ($token === null) {
            $token = $_POST[self::TOKEN_NAME] ?? $_GET[self::TOKEN_NAME] ?? '';
        }

        if (empty($token)) {
            return false;
        }

        $sessionToken = $_SESSION[self::SESSION_KEY] ?? '';

        // Constant-time comparison to prevent timing attacks
        return hash_equals($sessionToken, $token);
    }

    /**
     * Generate HTML input field with CSRF token
     * @return string HTML hidden input field
     */
    public static function getTokenField() {
        $token = self::getToken();
        return '<input type="hidden" name="' . self::TOKEN_NAME . '" value="' . htmlspecialchars($token, ENT_QUOTES, 'UTF-8') . '">';
    }

    /**
     * Regenerate CSRF token (call after login/logout for security)
     * @return string The new CSRF token
     */
    public static function regenerateToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Unset old token
        unset($_SESSION[self::SESSION_KEY]);

        // Generate new token
        return self::generateToken();
    }
}
?>
