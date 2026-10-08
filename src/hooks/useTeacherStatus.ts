'use client';

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type TeacherStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

interface TeacherStatusState {
  /** null while loading, and for anyone who isn't a teacher. */
  status: TeacherStatus | null;
  /** Profile completion, 0–100. */
  percent: number;
  rejectionReason: string | null;
  /** Why an admin suspended this teacher, while SUSPENDED. */
  suspensionReason: string | null;
  loading: boolean;
  isTeacher: boolean;
  /** True only for a teacher an admin has approved. */
  isApproved: boolean;
  refresh: () => void;
}

/**
 * The signed-in teacher's verification state. Anything a teacher may only do
 * after admin approval (posting classes, responding to requests) checks
 * `isApproved`. The server enforces the same rule.
 */
export function useTeacherStatus(): TeacherStatusState {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";
  const [status, setStatus] = useState<TeacherStatus | null>(null);
  const [percent, setPercent] = useState(0);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(isTeacher);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!isTeacher) {
      setStatus(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetch("/api/teachers/profile-completion")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        setStatus(d.verificationStatus ?? "PENDING");
        setPercent(d.percent ?? 0);
        setRejectionReason(d.rejectionReason ?? null);
        setSuspensionReason(d.suspensionReason ?? null);
      })
      .catch(() => {
        /* leave the last known state */
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isTeacher, user?.id, tick]);

  // An admin may decide while the tab is open: re-check when the teacher comes back.
  useEffect(() => {
    if (!isTeacher) return;
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isTeacher, refresh]);

  return {
    status,
    percent,
    rejectionReason,
    suspensionReason,
    loading,
    isTeacher,
    isApproved: isTeacher && status === "APPROVED",
    refresh,
  };
}
