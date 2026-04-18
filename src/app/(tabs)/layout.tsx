import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/header";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
