export function PageContainer({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
