"use client";

export default function Loading() {
  return (
    <div className="container-site py-16">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-8 w-1/3" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-64" />
      </div>
    </div>
  );
}
