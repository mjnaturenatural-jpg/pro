"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";

export function ProductRowActions({ productId }: { productId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!confirm("Delete this product permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ message: "Product deleted", type: "success" });
        router.refresh();
      } else {
        const data = await res.json();
        toast({ message: data.error || "Failed to delete", type: "error" });
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/products/${productId}`} className="rounded p-1.5 text-bark-500 hover:bg-bark-800/10 hover:text-bark-800" title="Edit">
        <Pencil size={15} />
      </Link>
      <button onClick={remove} disabled={deleting} className="rounded p-1.5 text-bark-500 hover:bg-red-50 hover:text-red-600" title="Delete">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
