"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResumeSite } from "@/components/ResumeSite";
import { Resume } from "@/lib/schema";
import { STORAGE_KEY } from "@/lib/storage";

// Full-screen view of the resume you just made at /create (kept in this browser only).
export default function Preview() {
  const [resume, setResume] = useState<Resume | null | undefined>(undefined);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? Resume.safeParse(JSON.parse(raw)) : null;
      setResume(parsed?.success ? parsed.data : null);
    } catch {
      setResume(null);
    }
  }, []);
  if (resume === undefined) return null;
  if (!resume)
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-display text-2xl font-semibold">Nothing to preview yet</p>
          <Link href="/create" className="mt-4 inline-block text-accent hover:underline">
            Upload a resume first
          </Link>
        </div>
      </main>
    );
  return <ResumeSite resume={resume} sendResume />;
}
