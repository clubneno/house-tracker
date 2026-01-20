import { redirect } from "next/navigation";
import { neonAuth } from "@/lib/auth/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await neonAuth();

  if (!session) {
    redirect("/login");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
