// JWT token management
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export async function login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Call the actual login API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      setAuthToken(data.token);
      // Store user data in localStorage for the /api/auth/me endpoint to retrieve
      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Login failed' };
    }
  } catch (error) {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

export function logout(): void {
  removeAuthToken();
  localStorage.removeItem('user_data');
  localStorage.removeItem('selectedOrgId');
  window.location.href = '/login';
}



