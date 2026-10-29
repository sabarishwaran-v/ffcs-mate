"use client";

import { useEffect } from "react";

export function CacheBuster() {
  useEffect(() => {
    // 1. Unregister all existing service workers to prevent stale PWA caching
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log("[CacheBuster] Unregistered service worker:", registration.scope);
            }
          });
        }
      }).catch((err) => console.debug("[CacheBuster] SW cleanup error:", err));
    }

    // 2. Clear stale CacheStorage entries
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((cacheNames) => {
        for (const cacheName of cacheNames) {
          caches.delete(cacheName).then(() => {
            console.log("[CacheBuster] Cleared cache:", cacheName);
          });
        }
      }).catch((err) => console.debug("[CacheBuster] Caches cleanup error:", err));
    }
  }, []);

  return null;
}
