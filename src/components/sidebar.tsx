"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import {UserCheck, Handshake, LayoutDashboard, Users, Building2, Menu, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useState} from "react";

const navItems = [
  { href: "/", title: "Home", icon: LayoutDashboard },
  { href: "/deal-desk", title: "Deal Desk", icon: Handshake},
  { href: "/onboarding", title: "Onboarding", icon:  UserCheck},
  { href: "/customer-accounts", title: "Customer Accounts", icon: Building2},
  { href: "/user-management", title: "User Management", icon:  Users},
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <X className="h-6 w-6"/>
                ) : (
                    <Menu className="h-6 w-6"/>
                )}
                <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Navigation */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-[calc(100%-3.5rem)]">
                    <nav className="flex-1 space-y-1 p-4">
                        {navItems.map((item) => {
                            // Check if user has permission to see this navigation item
                            // if (item.requiredAction && !canPerformAction(item.requiredAction.entity, item.requiredAction.action)) {
                            //     return null; // Don't render this navigation item
                            // }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                                        pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                                    )}
                                >
                                    {item.icon && <item.icon className="h-4 w-4"/>}
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>

                    {session && (
                        <div className="mt-auto border-t pt-4">
                            <div className="px-4 py-2 text-sm text-muted-foreground">
                                Signed in as: {session.user?.email || 'User'}
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}