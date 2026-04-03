import { requireUser } from "@/lib/auth/guards";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopStatusBar } from "@/components/layout/TopStatusBar";
import { TrainContextProvider } from "@/components/layout/TrainContextProvider";

export default async function ProtectedAppLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser();

  return (
    <TrainContextProvider>
      <div className="dashboard-shell flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopStatusBar />
          <PageContainer>{children}</PageContainer>
        </div>
        <MobileBottomNav />
      </div>
    </TrainContextProvider>
  );
}
