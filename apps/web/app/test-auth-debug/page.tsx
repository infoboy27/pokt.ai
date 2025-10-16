import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function TestAuthDebugPage() {
  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  console.log('Debug - User ID:', userId);
  
  if (!userId) {
    console.log('Debug - No user ID, redirecting to login');
    redirect('/login?redirect=/test-auth-debug');
  }
  
  return (
    <div>
      <h1>Authentication Debug</h1>
      <p>User ID: {userId}</p>
      <p>✅ Authentication working!</p>
    </div>
  );
}










