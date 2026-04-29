import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { business } = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Sidebar businessName={business.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
