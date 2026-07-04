"use client";

import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MigratePage() {
  const [status, setStatus] = useState("Ready to rescue pending data...");

  const runDownloadPending = async () => {
    setStatus("Fetching from pending_faculties...");
    try {
      const querySnapshot = await getDocs(collection(db, "pending_faculties"));
      const pendingData: any[] = [];
      
      querySnapshot.forEach((docSnap) => {
        pendingData.push({ id: docSnap.id, ...docSnap.data() });
      });

      setStatus(`Fetched ${pendingData.length} pending documents. Generating file...`);
      
      if (pendingData.length > 0) {
        // Create a blob and download it
        const jsonString = JSON.stringify(pendingData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rescued_6_courses.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setStatus(`Success! Downloaded rescued_6_courses.json with ${pendingData.length} faculties.`);
      } else {
        setStatus("No pending faculties found. (The quota might be blocking it or cache is empty)");
      }
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const runDownloadLocal = () => {
    try {
      const localData = localStorage.getItem('optimistic-faculties-v1');
      if (localData) {
        const blob = new Blob([localData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'local_6_courses.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus("Success! Downloaded local_6_courses.json from your browser.");
      } else {
        setStatus("No local data found in this browser.");
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Rescue The 6 Courses</h1>
      <p className="text-gray-600">Since Firebase is locked, we need to extract the 6 courses you uploaded so I can hardcode them.</p>
      
      <div className="flex gap-4 mt-6">
        <button 
          onClick={runDownloadPending}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          1. Try Download from Firebase Pending
        </button>

        <button 
          onClick={runDownloadLocal}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          2. Try Download from Browser Local Storage
        </button>
      </div>
      
      <p className="text-lg mt-4">{status}</p>
    </div>
  );
}
