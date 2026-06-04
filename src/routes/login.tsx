import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: "Sign in — Kabab Jee" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    const safe =
      redirect && /^\/(?!\/)/.test(redirect) ? redirect : "/";
    nav({ to: safe as "/" });
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your Kabab Jee account</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in..." : "Sign in"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}