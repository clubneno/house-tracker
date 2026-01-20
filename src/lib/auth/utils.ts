import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "admin" | "editor" | "viewer";

export interface AppUser {
  id: string;
  neonAuthId: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get app user by Neon Auth ID
 */
export async function getAppUserByAuthId(neonAuthId: string): Promise<AppUser | null> {
  const users = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.neonAuthId, neonAuthId))
    .limit(1);

  return users[0] || null;
}

/**
 * Get app user by email
 */
export async function getAppUserByEmail(email: string): Promise<AppUser | null> {
  const users = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);

  return users[0] || null;
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user can edit (admin or editor)
 */
export function canEdit(userRole: UserRole): boolean {
  return hasRole(userRole, ["admin", "editor"]);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === "admin";
}
