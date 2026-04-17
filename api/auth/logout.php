<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set cache control headers to prevent back-button access
header("Cache-Control: no-cache, no-store, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");

// Unset all session variables
$_SESSION = array();

// Destroy the session completely
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

session_destroy();

// Return HTML with JavaScript to force complete browser refresh
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>Logging Out...</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
            font-family: Arial, sans-serif;
        }
        .logout-message {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 4px solid #e0e0e0;
            border-top: 4px solid #0d7377;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="logout-message">
        <div class="spinner"></div>
        <h2>Logging out...</h2>
        <p>Clearing session and browser cache...</p>
    </div>

    <script>
        // Clear all browser cache and memory
        // Force complete browser refresh to clear all cached data
        window.addEventListener('load', function() {
            // Use window.location.replace() with cache busting
            // This forces browser to fetch fresh content
            window.location.replace('../../pages/auth/login.html?nocache=' + new Date().getTime());
        });

        // Additional fallback: if load event doesn't fire quickly enough
        setTimeout(function() {
            window.location.replace('../../pages/auth/login.html?nocache=' + new Date().getTime());
        }, 1000);

        // Prevent going back
        window.history.forward();

        // Clear sessionStorage and localStorage if they contain sensitive data
        try {
            sessionStorage.clear();
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
        } catch(e) {
            console.log('Storage clearing not available');
        }
    </script>
</body>
</html>
