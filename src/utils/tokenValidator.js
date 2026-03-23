/**
 * Check if the stored token is a JWT session token or old Firebase token
 * @param {string} token - Token to check
 * @returns {boolean} True if it's a valid JWT session token
 */
export const isSessionToken = (token) => {
  if (!token) {
    console.log('[TokenValidator] No token provided');
    return false;
  }

  try {
    // Check if token has JWT structure (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('[TokenValidator] Invalid JWT structure - not 3 parts');
      return false;
    }

    // Decode JWT payload from base64url format.
    const base64Url = parts[1];
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
    const payload = JSON.parse(atob(base64));
    console.log('[TokenValidator] Token payload:', { 
      hasIat: payload.hasOwnProperty('iat'), 
      hasExp: payload.hasOwnProperty('exp'),
      role: payload.role,
      type: payload.type 
    });

    // Check if it has JWT fields (iat, exp) - this means it's our JWT, not Firebase
    // Firebase tokens are much longer and have different structure
    const isValid = payload.hasOwnProperty('iat') && payload.hasOwnProperty('exp');
    console.log('[TokenValidator] Token is valid JWT:', isValid);
    return isValid;
  } catch (error) {
    console.error('[TokenValidator] Error parsing token:', error);
    return false;
  }
};

/**
 * Force logout if user has old Firebase token
 * Call this on app initialization or dashboard load
 */
export const validateAndCleanupToken = () => {
  const token = localStorage.getItem('studentAuthToken');
  console.log('[TokenValidator] Validating token, exists:', !!token);

  if (token && !isSessionToken(token)) {
    console.log('[TokenValidator] Old Firebase token detected, clearing session...');

    // Clear all auth data
    localStorage.removeItem('studentAuthToken');
    localStorage.removeItem('studentId');
    localStorage.removeItem('studentName');
    localStorage.removeItem('rollNumber');
    localStorage.removeItem('email');
    localStorage.removeItem('institute');

    return false; // Token invalid, need to re-login
  }

  console.log('[TokenValidator] Token validation passed');
  return true; // Token valid
};