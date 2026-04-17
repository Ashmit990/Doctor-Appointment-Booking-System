/**
 * Cache Prevention & Back Button Detection Script
 * 
 * This script detects when a user clicks the browser's back button
 * and checks if they're still logged in. If not, forces a redirect
 * to the login page immediately.
 * 
 * Include this script on all protected dashboard pages.
 */

(function() {
    // Detect if page is being loaded from bfcache (back/forward cache)
    window.addEventListener('pageshow', function(event) {
        // Check if page is being restored from bfcache
        if (event.persisted || performance.navigation.type === 2) {
            // Page was loaded via back button - verify session is still valid
            verifySession();
        }
    });

    // Also check on page load for extra safety
    window.addEventListener('load', function() {
        // Verify session on initial page load as well
        verifySession();
    });

    /**
     * Verify if user is still logged in via AJAX call
     * If session is expired, force redirect to login page
     */
    function verifySession() {
        // Use fetch to check session status without page reload
        fetch('../../api/auth/session_info.php', {
            method: 'GET',
            credentials: 'include', // Include cookies
            cache: 'no-store' // Don't cache this request
        })
        .then(response => response.json())
        .then(data => {
            // If user_id is not set, session has expired
            if (!data.user_id || !data.is_authenticated) {
                // Force redirect to login page immediately
                window.location.replace('../../pages/auth/login.html');
            }
        })
        .catch(error => {
            console.error('Session verification error:', error);
            // On error, force redirect to be safe
            window.location.replace('../../pages/auth/login.html');
        });
    }

    // Prevent going back to this page if user is not authenticated
    // This runs on unload to try to clear from history
    window.addEventListener('beforeunload', function() {
        // Clear any cached sensitive data
        sessionStorage.clear();
    });
})();
