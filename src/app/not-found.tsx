import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="font-serif text-4xl text-bark-900 sm:text-5xl">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-bark-600">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-primary mt-7">
        Back to Home
      </Link>
    </div>
  );
}
