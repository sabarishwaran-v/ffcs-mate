"use client";

import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MigratePage() {
  const [status, setStatus] = useState("Ready to download...");

  const runDownload = async () => {
    setStatus("Fetching from approved_faculties...");
    try {
      const querySnapshot = await getDocs(collection(db, "approved_faculties"));
      const bundleData: Record<string, any> = {};
      let count = 0;

      querySnapshot.forEach((docSnap) => {
        bundleData[docSnap.id] = docSnap.data();
        count++;
      });

      setStatus(`Fetched ${count} documents. Generating file...`);
      
      if (count > 0) {
        // Create a blob and download it
        const jsonString = JSON.stringify(bundleData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fallback_faculties.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setStatus(`Success! Downloaded fallback_faculties.json with ${count} faculties.`);
      } else {
        setStatus("No approved faculties found.");
      }
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Data Rescue Tool</h1>
      <p className="text-gray-600">Download your database as a local JSON file to bypass Firebase limits.</p>
      <button 
        onClick={runDownload}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Download Data
      </button>
      <p className="text-lg mt-4">{status}</p>
    </div>
  );
}
