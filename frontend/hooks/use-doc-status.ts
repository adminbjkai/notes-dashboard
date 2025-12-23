"use client";

import { useEffect, useState } from "react";
import type { DocStatus } from "@/types/docs";
import { getDocsStatus } from "@/lib/docs-api";

const POLL_MS = 5000;

export function useDocStatus() {
  const [status, setStatus] = useState<DocStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const next = await getDocsStatus();
        if (isMounted) setStatus(next);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    timer = setInterval(load, POLL_MS);

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  return { status, isLoading };
}
