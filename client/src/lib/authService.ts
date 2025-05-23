// Simple authentication service for client-side management

// Types
export interface User {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
}

// User storage key in local storage
const USER_STORAGE_KEY = 'currentUser';

// Default admin user for fallback
const DEFAULT_ADMIN: User = {
  id: 1,
  username: 'admin',
  displayName: 'Admin',
  email: 'ankit@logiciel.io'
};

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<User> {
  try {
    // Try server login first
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    // If the server endpoint works, use that
    if (response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.success && data.user) {
          saveUser(data.user);
          return data.user;
        }
      } catch (e) {
        console.error('Error parsing login response:', e);
      }
    }
  } catch (error) {
    console.error('Server login failed:', error);
  }

  // Client-side fallback for demo purposes
  if (username === 'admin' && password === 'password123') {
    saveUser(DEFAULT_ADMIN);
    return DEFAULT_ADMIN;
  }

  throw new Error('Invalid username or password');
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    // Try server logout
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Server logout failed:', error);
  }

  // Always clear local storage
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem(USER_STORAGE_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
    return null;
  }
}

/**
 * Save user to localStorage
 */
function saveUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}