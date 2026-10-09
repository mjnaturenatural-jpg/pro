import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Review } from "@/models";
import { ReviewActions } from "@/components/admin/ReviewActions";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({ searchParams }: { searchParams: { approved?: string } }) {
  await guardAdmin("/admin/reviews");
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (searchParams.approved === "true") filter.approved = true;
  if (searchParams.approved === "false") filter.approved = false;

  const reviews = (await Review.find(filter)
    .populate("product", "name slug")
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()) as unknown as {
    _id: string;
    rating: number;
    title: string;
    comment: string;
    approved: boolean;
    createdAt: string;
    product: { name: string; slug: string };
    user: { name: string; email: string };
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-bark-900">Reviews</h1>
        <p className="text-sm text-bark-500">
          {reviews.length} reviews — only reviews from verified purchases are shown publicly.
        </p>
      </div>

      <div className="card p-8 text-center text-sm text-bark-500">
        {reviews.length === 0 ? (
          <>
            <p className="font-serif text-lg text-bark-800">No reviews yet</p>
            <p className="mt-1">
              Reviews submitted by customers after verified purchases will appear here for approval.
            </p>
          </>
        ) : (
          <div className="space-y-4 text-left">
            {reviews.map((r) => (
              <div key={r._id} className="rounded-lg border border-bark-800/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-bark-900">
                      {r.user?.name}{" "}
                      <span className="font-normal text-bark-400">· {r.product?.name}</span>
                    </p>
                    <p className="text-xs text-bark-500">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)} · {r.rating}/5
                    </p>
                  </div>
                  <ReviewActions id={r._id} approved={r.approved} />
                </div>
                {r.title && <p className="mt-2 text-sm font-medium text-bark-800">{r.title}</p>}
                {r.comment && <p className="mt-1 text-sm text-bark-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
