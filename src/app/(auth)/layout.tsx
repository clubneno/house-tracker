import { redirect } from "next/navigation";
import { neonAuth } from "@/lib/auth/server";
import { Building2 } from "lucide-react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await neonAuth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center">
        <div className="text-center text-primary-foreground space-y-4">
          <Building2 className="h-20 w-20 mx-auto" />
          <h1 className="text-4xl font-bold">House Tracker</h1>
          <p className="text-lg opacity-90 max-w-sm">
            Track all finances related to your house construction project
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">House Tracker</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
