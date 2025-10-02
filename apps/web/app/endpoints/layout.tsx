import { BrandShell } from '@/components/brand-shell';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function EndpointsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for authentication
  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    redirect('/login?redirect=/endpoints');
  }
  
  return (
    <BrandShell>
      {children}
    </BrandShell>
  );
}



