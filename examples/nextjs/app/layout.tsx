import { GatehouseProvider } from "gatehouse/react";
import { gh } from "@/lib/gatehouse";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GatehouseProvider
          gatehouse={gh}
          resolve={async () => {
            // In a real app, call your API to get the user's role
            const res = await fetch("/api/me");
            if (!res.ok) return null;
            const { role } = await res.json();
            return { role };
          }}
        >
          {children}
        </GatehouseProvider>
      </body>
    </html>
  );
}
