"use client";

import { useEffect, useRef, useState } from "react";
import { ListTree } from "lucide-react";
import { slugify } from "@/lib/utils";

interface PolicyLayoutProps {
  title: string;
  children: React.ReactNode;
}

/** Legal page shell: header, last-updated stamp and an auto-generated sticky TOC. */
export function PolicyLayout({ title, children }: PolicyLayoutProps) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    setUpdated(
      new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    );
    const root = articleRef.current;
    if (!root) return;
    const found = Array.from(root.querySelectorAll("h2")).map((el, i) => {
      const id = el.id || `${slugify(el.textContent || `section-${i + 1}`)}`;
      el.id = id;
      el.classList.add("scroll-mt-28");
      return { id, title: el.textContent || `Section ${i + 1}` };
    });
    setSections(found);
  }, []);

  return (
    <div className="container-site max-w-5xl py-14 sm:py-20">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="section-title">{title}</h1>
      {updated && <p className="mt-2 text-xs text-bark-500">Last updated: {updated}</p>}
      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        {sections.length > 1 && (
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-24 rounded-2xl border border-bark-800/10 bg-ivory-100 p-5">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-bark-500">
                <ListTree size={13} /> On this page
              </p>
              <ul className="space-y-2">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-xs font-medium leading-snug text-bark-600 transition hover:text-caramel-700">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
        <div ref={articleRef} className="min-w-0 space-y-6 text-sm leading-relaxed text-bark-600">
          {children}
        </div>
      </div>
    </div>
  );
}
