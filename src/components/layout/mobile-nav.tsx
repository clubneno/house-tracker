"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Home, Users, UsersRound, ShoppingCart, Layers, DoorOpen, FileText, FolderOpen, Shield, Settings, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUserRole } from "./dashboard-layout";
import { useTranslation } from "@/lib/i18n/client";

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

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const userRole = useUserRole();
  const { t } = useTranslation();

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  if (!open) return null;

  return (
    <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />

      <div className="fixed inset-0 flex">
        <div className="relative mr-16 flex w-full max-w-xs flex-1">
          <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6 text-white" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">House Tracker</span>
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
                            onClick={onClose}
                            className={cn(
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                              "group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6"
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
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
      </div>
    </div>
  );
}
