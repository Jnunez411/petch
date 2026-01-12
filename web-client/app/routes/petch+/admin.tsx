import { Outlet, useLoaderData, Link, redirect, Form, useLocation } from 'react-router';
import type { Route } from './+types/admin';
import { getUserFromSession } from '~/services/auth';
import { Button } from '~/components/ui/button';
import { Dog, Menu, X, LayoutDashboard, Users, PawPrint, List, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getUserFromSession(request);

    // Security: Only allow ADMIN users
    if (!user || user.userType !== 'ADMIN') {
        throw redirect('/');
    }

    return { user };
}

export default function AdminLayout() {
    const { user } = useLoaderData<typeof loader>();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const navLinks = [
        { to: "/admin", label: "Overview" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/pets", label: "Pets" },
        { to: "/admin/listings", label: "Listings" },
    ];

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Admin Header */}
            <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    {/* Logo */}
                    <Link to="/admin" className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-coral flex items-center justify-center">
                            <Dog className="size-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight hidden sm:inline">Admin Dashboard</span>
                        <span className="text-xl font-bold tracking-tight sm:hidden">Admin</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const active = isActive(link.to);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`px-4 py-2 rounded-lg transition-colors ${active
                                        ? 'bg-coral/10 text-coral font-semibold'
                                        : 'text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-3">

                        {/* Desktop Logout */}
                        <Form method="post" action="/logout" className="hidden md:block">
                            <Button size="sm" type="submit" className="rounded-full bg-coral hover:bg-coral-dark text-white">
                                Logout
                            </Button>
                        </Form>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            <div className="relative size-6">
                                <Menu
                                    className={`absolute inset-0 size-6 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                                        }`}
                                />
                                <X
                                    className={`absolute inset-0 size-6 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                                        }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Drawer */}
            <div
                className={`fixed top-16 left-0 right-0 z-50 md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all duration-300 ease-out ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
            >
                <nav className="container mx-auto px-4 py-4">
                    <div className="flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const active = isActive(link.to);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`px-4 py-3 rounded-xl transition-all duration-200 ${active
                                        ? 'bg-coral/10 text-coral font-semibold'
                                        : 'text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}

                        {/* Mobile User Info & Logout */}
                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <div className="px-4 py-2 text-sm text-muted-foreground mb-2">
                                Signed in as <span className="font-medium text-foreground">{user.firstName}</span>
                            </div>
                            <Form method="post" action="/logout">
                                <button
                                    type="submit"
                                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                >
                                    <LogOut className="size-5" />
                                    <span>Logout</span>
                                </button>
                            </Form>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 md:py-8">
                <Outlet />
            </main>
        </div>
    );
}
