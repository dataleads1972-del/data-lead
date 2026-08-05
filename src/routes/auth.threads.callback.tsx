import { createFileRoute, redirect } from "@tanstack/react-router";
import { exchangeThreadsCode } from "@/lib/threads.functions";

export const Route = createFileRoute("/auth/threads/callback")({
  loader: async ({ location }) => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");

    let origin = "http://localhost:8080";
    let userId = "";
    let isAdminConnection = false;

    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(stateParam));
        if (decoded.origin) origin = decoded.origin;
        if (decoded.userId) userId = decoded.userId;
        if (decoded.isAdminConnection) isAdminConnection = !!decoded.isAdminConnection;
      } catch (e) {
        console.error("Failed to decode OAuth state parameter:", e);
      }
    }

    if (!code || !userId) {
      const redirectPage = isAdminConnection ? "admin" : "settings";
      throw redirect({
        href: `${origin}/${redirectPage}?threads=error&message=Missing+authorization+code+or+user+session`,
      });
    }

    try {
      await exchangeThreadsCode({ data: { code, userId, origin, isAdminConnection } });
      const redirectPage = isAdminConnection ? "admin" : "settings";
      throw redirect({
        href: `${origin}/${redirectPage}?threads=success`,
      });
    } catch (e: any) {
      console.error("Threads OAuth callback failed:", e);
      // Handle the redirect thrown inside or normal errors
      if (e instanceof Response || (e && typeof e.status === "number")) {
        throw e;
      }
      const redirectPage = isAdminConnection ? "admin" : "settings";
      throw redirect({
        href: `${origin}/${redirectPage}?threads=error&message=${encodeURIComponent(e.message || "Failed to exchange authorization code")}`,
      });
    }
  },
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Authorizing your Threads account...</p>
      </div>
    </div>
  ),
});
