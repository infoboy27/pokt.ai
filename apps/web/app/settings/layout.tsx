import { BrandShell } from '@/components/brand-shell';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for authentication
  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    redirect('/login?redirect=/settings');
  }
  
  return (
    <BrandShell>
      {children}
    </BrandShell>
  );
}
