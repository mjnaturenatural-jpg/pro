import Link from "next/link";
import { ArrowRight, Cookie } from "lucide-react";
import { getFeaturedProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product/ProductCard";

export const metadata = { title: "Page Not Found" };

export default async function NotFound() {
  let suggestions: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  try {
    suggestions = await getFeaturedProducts(4);
  } catch {
    suggestions = [];
  }

  return (
    <div className="container-site py-16 text-center sm:py-24">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sand-100 text-caramel-600">
        <Cookie size={36} />
      </span>
      <p className="eyebrow mb-3 mt-6">Lost your way?</p>
      <h1 className="font-serif text-5xl font-bold text-brown-900 sm:text-6xl">404</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-bark-600 sm:text-base">
        This page crumbled away. Let&apos;s get you back to something delicious.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back Home
        </Link>
        <Link href="/shop" className="btn-secondary">
          Shop Bestsellers <ArrowRight size={15} />
        </Link>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-14 text-left">
          <h2 className="mb-6 text-center font-serif text-2xl font-bold text-bark-900">
            You may like these instead
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p._id} product={JSON.parse(JSON.stringify(p))} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
