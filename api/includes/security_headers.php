<?php
/**
 * Security Headers for Cache Control
 * Include this at the top of all protected pages to prevent browser caching
 * and back-button access after logout
 */

// Prevent browser caching completely
header("Cache-Control: no-cache, no-store, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");

// Additional security headers
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
?>
