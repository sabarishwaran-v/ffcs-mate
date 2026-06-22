import React from 'react';

export default function Header() {
  return (
    <header className="bg-[#004d40] text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider">FFCS MATE</h1>
        <div className="text-sm">
          SUMMER SEMESTER 2025-26
        </div>
      </div>
    </header>
  );
}
