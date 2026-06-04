import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Kabab Jee" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/admin" } });
  }, [loading, user, nav]);

  if (loading) return <div className="container mx-auto px-4 py-24 text-center">Loading...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-md px-4 py-24 text-center">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account doesn't have admin privileges.
        </p>
        <Link to="/" className="mt-6 inline-block"><Button>Go home</Button></Link>
      </div>
    );
  }

  const tabs = [
    { to: "/admin", label: "Orders" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/reservations", label: "Reservations" },
    { to: "/admin/menu", label: "Menu" },
    { to: "/admin/tables", label: "Tables" },
    { to: "/admin/settings", label: "Settings" },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => {
          const active = t.to === "/admin" ? path === "/admin" : path.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}