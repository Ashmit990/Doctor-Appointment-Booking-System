const API_BASE = '../../api';

/**
 * Verify doctor session on page load
 * Redirects to login if not authenticated
 */
(async () => {
  try {
    const sessionResponse = await fetch(`${API_BASE}/auth/session_info.php`, {
      credentials: 'include'
    });
    const sessionData = await sessionResponse.json();
    
    if (!sessionData.logged_in || sessionData.role !== 'Doctor') {
      console.error("Not logged in as doctor");
      window.location.href = '../auth/login.html';
      return;
    }
  } catch (error) {
    console.error("Session check failed:", error);
    window.location.href = '../auth/login.html';
  }
  
  console.log("Session verified, loading earnings...");
})();
