import type { User } from "~/types/auth";
import { Button } from "./ui/button";
import { Form, Link, useLocation } from "react-router";
import { Dog, Menu, X, Home, Search, Heart, User as UserIcon, Plus, LogOut, Info } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  user?: User | null;
}

export function Header(props: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Helper for active route logic
  const isRouteActive = (currentPath: string, linkPath: string, allLinks: { to: string }[]) => {
    // Check if this exact path is active, or if it's a parent path
    // But exclude parent if a more specific route is in navLinks and matches
    const isExactMatch = currentPath === linkPath;
    const isParentMatch = currentPath.startsWith(`${linkPath}/`);

    // Check if there's another nav link that's a more specific match
    const hasMoreSpecificMatch = allLinks.some(otherLink =>
      otherLink.to !== linkPath &&
      otherLink.to.startsWith(`${linkPath}/`) &&
      (currentPath === otherLink.to || currentPath.startsWith(`${otherLink.to}/`))
    );

    return linkPath === '/'
      ? currentPath === '/'
      : isExactMatch || (isParentMatch && !hasMoreSpecificMatch);
  };

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

  const navLinks = props.user?.userType === 'ADMIN'
    ? [{ to: "/admin", label: "Admin Dashboard", icon: Home }]
    : [
      { to: "/", label: "Home", icon: Home },
      { to: "/about", label: "About", icon: Info },
      { to: "/pets", label: "Pet Listings", icon: Search },
      { to: "/discover", label: "Discover", icon: Heart },
      { to: "/profile", label: "Profile", icon: UserIcon },
      ...(props.user?.userType === 'VENDOR'
        ? [{ to: "/pets/create", label: "Create Listing", icon: Plus }]
        : []
      ),
    ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-coral flex items-center justify-center">
              <Dog className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Petch</span>
          </Link>

          {/* Desktop Navigation */}
          {props.user && (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                // Check if this exact path is active, or if it's a parent path
                // But exclude parent if a more specific route is in navLinks and matches
                const isActive = isRouteActive(location.pathname, link.to, navLinks);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`transition-colors hover:text-coral ${isActive ? 'text-coral font-semibold' : 'text-foreground'
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Logout */}
            {props.user && (
              <Form method="post" action="/logout" className="hidden md:block">
                <Button size="sm" type="submit" className="rounded-full bg-coral hover:bg-coral-dark text-white">
                  Logout
                </Button>
              </Form>
            )}

            {/* Mobile Menu Toggle */}
            {props.user && (
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
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {props.user && (
        <div
          className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      {props.user && (
        <div
          className={`fixed top-16 left-0 right-0 z-50 md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all duration-300 ease-out ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}
        >
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                // Check if this exact path is active, or if it's a parent path
                // But exclude parent if a more specific route is in navLinks and matches
                const isActive = isRouteActive(location.pathname, link.to, navLinks);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-coral/10 text-coral font-semibold'
                      : 'text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className={`size-5 ${isActive ? 'text-coral' : 'text-muted-foreground'}`} />
                    <span>{link.label}</span>
                    {isActive && (
                      <div className="ml-auto size-2 rounded-full bg-coral animate-pulse" />
                    )}
                  </Link>
                );
              })}

              {/* Mobile Logout */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
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
      )}
    </>
  );
}