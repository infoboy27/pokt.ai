import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireAuth(redirectTo: string = '/login') {
  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    redirect(`${redirectTo}?redirect=${redirectTo}`);
  }
  
  return userId;
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    return null;
  }
  
  // TODO: Fetch user data from database
  return {
    id: userId,
    email: 'demo@pokt.ai',
    name: 'Demo User'
  };
}










