import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function AuthLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await redirectAuthenticatedUser();

  return (
    <div className="surface-grid flex min-h-screen items-center justify-center bg-background px-6 py-10">
      {children}
    </div>
  );
}
