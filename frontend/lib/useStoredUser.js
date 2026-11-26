"use client";
import { useMemo, useSyncExternalStore } from "react";
import { USER_CHANGE_EVENT, getStoredUser, getToken } from "./api";

const subscribe = (cb) => {
  window.addEventListener("storage", cb);
  window.addEventListener(USER_CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(USER_CHANGE_EVENT, cb);
  };
};

// The logged-in user from localStorage, re-rendering whenever it changes.
// Server snapshot is null, so there's no hydration mismatch.
export default function useStoredUser() {
  const raw = useSyncExternalStore(subscribe, () => (getToken() ? localStorage.getItem("user") : null), () => null);
  return useMemo(() => (raw ? getStoredUser() : null), [raw]);
}
