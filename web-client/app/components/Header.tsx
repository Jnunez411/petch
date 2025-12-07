import type { User } from "~/types/auth";
import { Button } from "./ui/button";
import { PawIcon } from "./ui/paw-icon";
import { Form, Link } from "react-router";

interface HeaderProps{
    user?: User| null;
}
export function Header(props:HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <PawIcon className="h-8 w-8" />
            <span className="text-xl font-bold text-primary">Petch</span>
          </Link>
          
          {/* Only show nav links for authenticated users */}
          {props.user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Home
              </Link> 
              <Link to="/pets" className="text-foreground hover:text-primary transition-colors">
                Pet Listings
              </Link> 
              <Link to="/ai-match" className="text-foreground hover:text-primary transition-colors">
                AI Match
              </Link>
              <Link to="/profile" className="text-foreground hover:text-primary transition-colors">
                Profile Preferences
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {props.user ? (
            <Form method="post" action="/logout">
              <Button variant="outline" size="sm" type="submit" className="bg-primary">
                Logout
              </Button>
            </Form>
          ) : null}
        </div>
      </div>
    </header>
  );
}