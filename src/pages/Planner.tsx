import React from 'react';
import CoursePreference from '../components/planner/CoursePreference';
import TimetableGrid from '../components/planner/TimetableGrid';

export default function Planner() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full">
        <CoursePreference />
        
        {/* Render Timetable directly below in a white container to match the grid styling */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <TimetableGrid />
        </div>
      </div>
    </div>
  );
}
