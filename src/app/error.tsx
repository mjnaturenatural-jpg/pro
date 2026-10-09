"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-3">500</p>
      <h1 className="font-serif text-4xl text-bark-900 sm:text-5xl">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-sm text-bark-600">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-7 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
        <Link href="/" className="btn-secondary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
