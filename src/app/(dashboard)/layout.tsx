import { redirect } from "next/navigation";
import { neonAuth, authServer } from "@/lib/auth/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getAppUserByAuthId, getAppUserByEmail } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, user } = await neonAuth();

  if (!session || !user) {
    redirect("/login");
  }

  // Check if user exists in app_users table by auth ID
  let appUser = await getAppUserByAuthId(user.id);

  // If not found by auth ID, check by email (for users invited by admin)
  if (!appUser && user.email) {
    const userByEmail = await getAppUserByEmail(user.email);

    // If found by email and neon_auth_id starts with "pending_", update it
    if (userByEmail && userByEmail.neonAuthId.startsWith("pending_")) {
      const [updated] = await db
        .update(appUsers)
        .set({
          neonAuthId: user.id,
          name: user.name || userByEmail.name,
          updatedAt: new Date(),
        })
        .where(eq(appUsers.id, userByEmail.id))
        .returning();

      appUser = updated;
    }
  }

  if (!appUser) {
    redirect("/access-denied");
  }

  if (!appUser.isActive) {
    redirect("/access-denied");
  }

  return <DashboardLayout userRole={appUser.role}>{children}</DashboardLayout>;
}
