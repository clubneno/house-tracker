import { NextRequest, NextResponse } from "next/server";
import { neonAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { getAppUserByAuthId, getAppUserByEmail } from "@/lib/auth/utils";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a new user
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["admin", "editor", "viewer"]),
});

// GET /api/admin/users - List all users
export async function GET() {
  try {
    const { session, user } = await neonAuth();

    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin
    const currentUser = await getAppUserByAuthId(user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users
    const users = await db
      .select()
      .from(appUsers)
      .orderBy(desc(appUsers.createdAt));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user (invitation)
export async function POST(request: NextRequest) {
  try {
    const { session, user } = await neonAuth();

    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin
    const currentUser = await getAppUserByAuthId(user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await getAppUserByEmail(validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new user with a placeholder neon_auth_id
    // The actual neon_auth_id will be updated when they sign in
    const [newUser] = await db
      .insert(appUsers)
      .values({
        neonAuthId: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: validatedData.email,
        name: validatedData.name || null,
        role: validatedData.role,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
