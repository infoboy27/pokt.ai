import { BrandShell } from '@/components/brand-shell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandShell>
      {children}
    </BrandShell>
  );
}













