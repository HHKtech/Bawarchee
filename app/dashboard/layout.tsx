import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardProvider } from '@/context/DashboardContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
        <DashboardHeader className="flex-shrink-0" />
        <main className="flex-1 overflow-hidden p-4 lg:p-6">
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
