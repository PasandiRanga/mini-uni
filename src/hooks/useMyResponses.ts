'use client';

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/** Responses that still count: a declined or withdrawn one can be sent again. */
const LIVE = new Set(["PENDING", "RESPONDED", "ACCEPTED"]);

/**
 * For a teacher: the student requests they've already responded to, so the
 * Respond button can show "Responded" instead of letting them send twice.
 */
export function useMyResponses() {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";
  const [responded, setResponded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isTeacher || !user?.id) return;
    let active = true;
    fetch(`/api/inquiries/teacher/${user.id}?box=sent`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { postId: string; status: string }[]) => {
        if (!active || !Array.isArray(list)) return;
        setResponded(new Set(list.filter((i) => LIVE.has(i.status)).map((i) => i.postId)));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isTeacher, user?.id]);

  const markResponded = useCallback((postId: string) => {
    setResponded((prev) => new Set(prev).add(postId));
  }, []);

  return { hasResponded: (postId: string) => responded.has(postId), markResponded };
}
