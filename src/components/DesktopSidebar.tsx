import {
  Activity,
  Bell,
  Layers,
  ClipboardCheck,
  Settings,
  Beaker,
  Gauge,
  Package,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

const navItems = [
  { path: "/", label: "Live", icon: Activity },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/batches", label: "Batches", icon: Layers },
  { path: "/latex/field", label: "Field Latex", icon: Beaker },
  { path: "/latex/process", label: "Latex Process", icon: Gauge },
  { path: "/gloves", label: "Gloves", icon: Package },
  { path: "/qc", label: "QC", icon: ClipboardCheck },
];

export const DesktopSidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const allNavItems = useMemo(() => {
    const isAdmin = session?.user?.roles?.includes("admin");
    return isAdmin ? [...navItems, { path: "/admin", label: "Admin", icon: Settings }] : navItems;
  }, [session?.user?.roles]);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col z-40">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">DT</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent"></h1>
            <p className="text-xs text-muted-foreground">Glove Manufacturing</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {allNavItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
