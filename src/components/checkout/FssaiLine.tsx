"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { siteConfig } from "@config/site";

let cached: string | null = null;

/** Text-based FSSAI trust line. Renders nothing until a licence number is configured. */
export function FssaiLine() {
  const [licence, setLicence] = useState<string | null>(cached);

  useEffect(() => {
    if (cached !== null) return;
    fetch("/api/public/store-info")
      .then((r) => r.json())
      .then((d) => {
        cached = typeof d.foodLicence === "string" ? d.foodLicence : "";
        setLicence(cached || siteConfig.fssai || null);
      })
      .catch(() => {
        cached = "";
        setLicence(siteConfig.fssai || null);
      });
  }, []);

  const value = licence || siteConfig.fssai || "";
  if (!value) return null;

  return (
    <p className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-leaf-700">
      <ShieldCheck size={13} /> FSSAI Lic. No. {value}
    </p>
  );
}
