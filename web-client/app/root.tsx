import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Header } from "./components/Header";
import { getUserFromSession } from "./services/auth";
import { Dog } from "lucide-react";
import { routeLogger, logErrorBoundary } from "./utils/logger";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FF6B6B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5'/><path d='M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5'/><path d='M8 14v.5'/><path d='M16 14v.5'/><path d='M11.25 16.25h1.5L12 17l-.75-.75Z'/><path d='M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306'/></svg>" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  return { user };
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();

  // Hide main header on admin routes (admin has its own header)
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Header user={user} />}
      <Outlet />
    </>
  );

}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  // Log the error using structured logging
  if (error && error instanceof Error) {
    logErrorBoundary(error, { componentStack: undefined }, 'Root');
  } else if (isRouteErrorResponse(error)) {
    routeLogger.warn('Route error response', { status: error.status, statusText: error.statusText });
  }

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 - Page Not Found" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "The page you're looking for doesn't exist."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center space-y-4 p-8">
        <div className="size-16 rounded-xl bg-coral flex items-center justify-center mx-auto">
          <Dog className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold">{message}</h1>
        <p className="text-muted-foreground max-w-md">{details}</p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-coral text-white rounded-full hover:bg-coral-dark transition-colors"
        >
          Go Home
        </a>
        {stack && (
          <pre className="mt-8 w-full p-4 overflow-x-auto text-left bg-muted rounded-md text-xs">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
