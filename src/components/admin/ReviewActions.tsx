"use client";

import { useRouter } from "next/navigation";
import { Check, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function ReviewActions({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const { toast } = useToast();

  const act = async (method: string, body?: unknown) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      toast({ message: "Updated", type: "success" });
      router.refresh();
    } else {
      const data = await res.json();
      toast({ message: data.error || "Failed", type: "error" });
    }
  };

  return (
    <div className="flex gap-1">
      {!approved && (
        <button
          onClick={() => act("PATCH", { approved: true })}
          className="rounded p-1.5 text-leaf-600 hover:bg-leaf-50"
          title="Approve"
        >
          <Check size={15} />
        </button>
      )}
      {approved && (
        <button
          onClick={() => act("PATCH", { approved: false })}
          className="rounded p-1.5 text-caramel-600 hover:bg-sand-50"
          title="Unpublish"
        >
          <X size={15} />
        </button>
      )}
      <button
        onClick={() => confirm("Delete this review?") && act("DELETE")}
        className="rounded p-1.5 text-bark-400 hover:bg-red-50 hover:text-red-600"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
