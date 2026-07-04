'use client';

import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function AppVersionMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION;
    // If we haven't set a local version, we can't compare, so do nothing
    if (!currentVersion) return; 

    const configRef = doc(db, 'system', 'config');
    
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const serverVersion = data.appVersion;
        
        // If server version exists and is different from our local version
        if (serverVersion && serverVersion !== currentVersion) {
          // Prevent infinite reload loop if the new code hasn't actually deployed yet
          const lastReloadedVersion = sessionStorage.getItem('last_reloaded_version');
          
          if (lastReloadedVersion !== serverVersion && navigator.onLine) {
            sessionStorage.setItem('last_reloaded_version', serverVersion);
            console.log(`[FFCS MATE] New version detected! Server: ${serverVersion}, Local: ${currentVersion}. Reloading...`);
            window.location.reload(); // Force hard refresh
          }
        }
      }
    }, (error) => {
      // Silently catch errors (e.g. if offline when first connecting)
      console.debug("AppVersionMonitor ignored error:", error.message);
    });

    return () => unsubscribe();
  }, []);

  return null; // Completely invisible component
}
