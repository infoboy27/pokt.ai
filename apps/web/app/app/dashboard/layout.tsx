import { BrandShell } from '@/components/brand-shell';

export default async function DashboardLayout({
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