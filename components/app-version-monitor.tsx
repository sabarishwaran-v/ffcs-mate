'use client';

import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

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
          // Prevent showing the toast multiple times across tabs and reloads
          const lastNotifiedVersion = localStorage.getItem('last_notified_version');
          
          if (lastNotifiedVersion !== serverVersion && navigator.onLine) {
            localStorage.setItem('last_notified_version', serverVersion);
            console.log(`[FFCS MATE] New version detected! Server: ${serverVersion}, Local: ${currentVersion}.`);
            
            // Show a gentle toast instead of forcing a reload
            toast("A new version of FFCS Mate is available! 🎉", {
              description: "Refresh to get the latest features and bug fixes.",
              duration: Infinity, // Don't auto-dismiss
              action: {
                label: "Refresh Now",
                onClick: () => window.location.reload()
              },
            });
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
