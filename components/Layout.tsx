import { Navigation } from "@/components/Navigation";
import type React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Navigation />
      <main className="flex-1 ml-48 p-6">{children}</main>
    </div>
  );
}
