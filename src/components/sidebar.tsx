"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/deal-desk", label: "Deal Desk" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/customer-accounts", label: "Customer Accounts" },
  { href: "/admin", label: "Admin" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-2 w-56 min-h-screen py-8 pr-4 border-r bg-background">
      <div className="mb-8 px-4">
        <Image
          src="/paiperless-logo-horizontal.png"
          alt="Paiperless Logo"
          width={180}
          height={40}
          className="dark:invert"
        />
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-4 py-2 rounded transition-colors hover:bg-accent hover:text-accent-foreground font-medium",
            pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
} 