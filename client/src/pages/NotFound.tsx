import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[hsl(var(--foreground))]">404</h1>
        <p className="mt-2 text-lg text-[hsl(var(--muted-foreground))]">Page not found</p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm text-[hsl(var(--primary))] hover:underline"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
