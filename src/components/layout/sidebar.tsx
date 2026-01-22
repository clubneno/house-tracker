"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  UsersRound,
  ShoppingCart,
  Layers,
  DoorOpen,
  FileText,
  FolderOpen,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/utils";
import { useTranslation } from "@/lib/i18n/client";
import { HomeSelector } from "@/components/homes/home-selector";

interface NavigationItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  { nameKey: "nav.dashboard", href: "/", icon: Home },
  { nameKey: "nav.suppliers", href: "/suppliers", icon: Users },
  { nameKey: "nav.purchases", href: "/purchases", icon: ShoppingCart },
  { nameKey: "nav.areas", href: "/areas", icon: Layers },
  { nameKey: "nav.rooms", href: "/rooms", icon: DoorOpen },
  { nameKey: "nav.documents", href: "/documents", icon: FolderOpen },
  { nameKey: "nav.warranties", href: "/warranties", icon: Shield },
  { nameKey: "nav.reports", href: "/reports", icon: FileText },
  { nameKey: "nav.userManagement", href: "/admin/users", icon: UsersRound, adminOnly: true },
  { nameKey: "nav.settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  userRole?: UserRole;
}

export function Sidebar({ userRole = "viewer" }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-elevated px-6 pb-4">
        <div className="flex shrink-0 items-center py-2">
          <Image
            src="/neno-logo.png"
            alt="NENO Real Estate"
            width={500}
            height={100}
            className="max-w-[180px] h-auto object-contain"
            priority
          />
        </div>
        <div className="-mx-4">
          <HomeSelector />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <li key={item.nameKey}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-glass p-2.5 text-sm font-medium leading-6 transition-all duration-200 ease-smooth",
                          isActive
                            ? "glass bg-primary/10 text-primary shadow-glass-sm"
                            : "text-muted-foreground hover:glass-subtle hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 shrink-0 transition-colors duration-200",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        {t(item.nameKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
