import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function TestAuthPage() {
  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    redirect('/login?redirect=/test-auth');
  }
  
  return (
    <div>
      <h1>Authentication Test</h1>
      <p>User ID: {userId}</p>
      <p>✅ Authentication working!</p>
    </div>
  );
}










