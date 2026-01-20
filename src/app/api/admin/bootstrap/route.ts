import { NextRequest, NextResponse } from "next/server";
import { neonAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

// POST /api/admin/bootstrap - Create first admin user
// This only works when there are no users in the system
export async function POST(request: NextRequest) {
  try {
    const { session, user } = await neonAuth();

    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized - Please sign in first" }, { status: 401 });
    }

    // Check if any users exist
    const [result] = await db.select({ count: count() }).from(appUsers);

    if (result.count > 0) {
      return NextResponse.json(
        { error: "Bootstrap not allowed - users already exist in the system" },
        { status: 403 }
      );
    }

    // Create the first admin user
    const [newAdmin] = await db
      .insert(appUsers)
      .values({
        neonAuthId: user.id,
        email: user.email || "",
        name: user.name || null,
        role: "admin",
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "First admin user created successfully",
      user: newAdmin,
    });
  } catch (error) {
    console.error("Error bootstrapping admin:", error);
    return NextResponse.json(
      { error: "Failed to bootstrap admin" },
      { status: 500 }
    );
  }
}
