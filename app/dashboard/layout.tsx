import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardProvider } from '@/context/DashboardContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <main className="min-h-screen bg-amber-50">
        <DashboardHeader />
        {children}
      </main>
    </DashboardProvider>
  );
}
