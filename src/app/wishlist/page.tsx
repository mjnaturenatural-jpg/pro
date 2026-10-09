import { WishlistGrid } from "@/components/wishlist/WishlistGrid";

export const metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="container-site py-14 sm:py-20">
      <h1 className="section-title mb-8">My Wishlist</h1>
      <WishlistGrid />
    </div>
  );
}
