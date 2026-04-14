// Storage utility with fallback chain: localStorage → sessionStorage → cookies
// Handles in-app browsers (Facebook, Instagram) that block localStorage

const storage = {
  getItem(key) {
    // Try localStorage first
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) return value;
    } catch (e) {
      // localStorage is blocked or unavailable
    }

    // Fall back to sessionStorage
    try {
      const value = window.sessionStorage.getItem(key);
      if (value !== null) return value;
    } catch (e) {
      // sessionStorage is blocked or unavailable
    }

    // Fall back to cookies
    try {
      const match = document.cookie.match(
        new RegExp('(?:^|; )' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
      );
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  },

  setItem(key, value) {
    // Try localStorage first
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch (e) {
      // localStorage is blocked
    }

    // Fall back to sessionStorage
    try {
      window.sessionStorage.setItem(key, value);
      return;
    } catch (e) {
      // sessionStorage is blocked
    }

    // Fall back to cookies (7 days, path=/, SameSite=Lax)
    try {
      document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=604800;SameSite=Lax`;
    } catch (e) {
      console.warn(`Failed to store ${key} in any storage mechanism`);
    }
  },

  removeItem(key) {
    // Remove from localStorage
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}

    // Remove from sessionStorage
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {}

    // Remove from cookies (expire immediately)
    try {
      document.cookie = `${key}=;path=/;max-age=0;SameSite=Lax`;
    } catch (e) {}
  }
};

export default storage;
