import { BrandShell } from '@/components/brand-shell';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for authentication
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    redirect('/login?redirect=/billing');
  }
  
  return (
    <BrandShell>
      {children}
    </BrandShell>
  );
}
