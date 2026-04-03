import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopStatusBar } from "@/components/layout/TopStatusBar";

export default function ProtectedAppLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dashboard-shell flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopStatusBar />
        <PageContainer>{children}</PageContainer>
      </div>
      <MobileBottomNav />
    </div>
  );
}
