/**
 * Editable customer reviews. The client can add, edit or remove entries here;
 * the homepage aggregate summary, distribution bars and carousel all derive
 * from this file. These mirror the owner-collected testimonials in the DB.
 */
export interface Review {
  name: string;
  city: string;
  rating: number;
  quote: string;
  product?: string;
  date?: string;
}

export const REVIEWS: Review[] = [
  {
    name: "Ananya R.",
    city: "Hyderabad",
    rating: 5,
    quote: "The jaggery laddus taste just like the ones my grandmother used to make. Fresh, not too sweet, and you can really taste the pure ghee.",
    product: "Roasted Coconut Jaggery Laddu",
  },
  {
    name: "Suresh K.",
    city: "Bengaluru",
    rating: 5,
    quote: "Ordered the millet cookies for my kids. Eggless and no maida was exactly what I wanted. Crisp, tasty and packed nicely.",
    product: "Millet Jaggery Cookies",
  },
  {
    name: "Priya M.",
    city: "Vijayawada",
    rating: 5,
    quote: "Brownies arrived well packed and tasted rich without being overly sweet. The original jaggery flavour comes through nicely.",
    product: "Ragi Jaggery Dry Fruits Brownie",
  },
  {
    name: "Ravi Teja G.",
    city: "Guntur",
    rating: 5,
    quote: "Good quality cashew chikki — proper jaggery flavour and generous nut pieces. Delivery was quick and everything reached fresh.",
    product: "Kaju Jaggery Chikki",
  },
  {
    name: "Kavya S.",
    city: "Hyderabad",
    rating: 5,
    quote: "My kids finish the ragi chocolate cookies before the box even reaches the shelf. Finally, a tiffin snack I feel good about — no maida, no refined sugar.",
    product: "Ragi Millet Jaggery Chocolate Cookies",
  },
  {
    name: "Manoj V.",
    city: "Chennai",
    rating: 4,
    quote: "The kaju jaggery chikki tastes like the ones from my childhood — crisp, buttery and not overly sweet. You can tell the jaggery is real.",
    product: "Kaju Jaggery Chikki",
  },
  {
    name: "Divya N.",
    city: "Bengaluru",
    rating: 5,
    quote: "Ordered the coconut jaggery laddus for a family function and guests kept asking where they were from. Soft, fresh and genuinely eggless.",
    product: "Roasted Coconut Jaggery Laddu",
  },
  {
    name: "Arjun P.",
    city: "Mumbai",
    rating: 5,
    quote: "Eggless brownies that are actually fudgy! The ragi dry-fruit brownie with hot milk is now my weekend ritual.",
    product: "Ragi Jaggery Dry Fruits Brownie",
  },
];

export function reviewSummary() {
  const total = REVIEWS.length;
  const average = total ? REVIEWS.reduce((n, r) => n + r.rating, 0) / total : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: REVIEWS.filter((r) => r.rating === stars).length,
  }));
  return { total, average: Math.round(average * 10) / 10, distribution };
}
