import { requireUser } from "@/lib/auth/guards";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { ShellWarmup } from "@/components/layout/ShellWarmup";
import { TopStatusBar } from "@/components/layout/TopStatusBar";
import { TrainContextProvider } from "@/components/layout/TrainContextProvider";
import { DemoConsoleBridge } from "@/components/layout/DemoConsoleBridge";

export default async function ProtectedAppLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser();

  return (
    <TrainContextProvider>
      <DemoConsoleBridge />
      <ShellWarmup />
      <div className="dashboard-shell flex h-screen overflow-hidden bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-full flex-col overflow-y-auto">
          <AppSidebar />
        </div>
        <div className="flex min-h-screen flex-1 flex-col">
          <TopStatusBar />
          <PageContainer>{children}</PageContainer>
        </div>
        <MobileBottomNav />
      </div>
    </TrainContextProvider>
  );
}
