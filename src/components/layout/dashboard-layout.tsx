"use client";

import { useState, createContext, useContext } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import type { UserRole } from "@/lib/auth/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
}

const UserRoleContext = createContext<UserRole>("viewer");

export function useUserRole() {
  return useContext(UserRoleContext);
}

export function DashboardLayout({ children, userRole = "viewer" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserRoleContext.Provider value={userRole}>
      <div>
        <MobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Sidebar userRole={userRole} />
        <div className="lg:pl-72">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </UserRoleContext.Provider>
  );
}
