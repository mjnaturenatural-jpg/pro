"use client";

import { signOut } from "next-auth/react";
import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminTopbar({ name }: { name: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-bark-800/10 bg-ivory-100/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/admin/orders?q=${encodeURIComponent(q.trim())}`);
        }}
        className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-bark-800/10 bg-ivory-50 px-3 py-2"
      >
        <Search size={15} className="text-bark-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search orders by number, name, email…"
          className="w-full bg-transparent text-sm text-bark-800 placeholder:text-bark-400 focus:outline-none"
        />
      </form>
      <div className="ml-auto flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-bark-900">{name}</p>
          <p className="text-[11px] text-bark-500">Administrator</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-100 text-sm font-bold text-leaf-700">
          {name.charAt(0).toUpperCase()}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-1.5 text-sm text-bark-500 hover:text-red-600"
        >
          <LogOut size={15} /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
