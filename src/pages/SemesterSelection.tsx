import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Sun } from 'lucide-react';

export default function SemesterSelection() {
  const navigate = useNavigate();

  const semesters = [
    {
      id: 'winter_freshers_25',
      name: 'Winter Semester',
      batch: '2025-26 (Freshers)',
      icon: <BookOpen className="w-6 h-6 text-blue-600" />
    },
    {
      id: 'fall_24',
      name: 'Fall Semester',
      batch: '2024-25',
      icon: <GraduationCap className="w-6 h-6 text-emerald-600" />
    },
    {
      id: 'summer_25',
      name: 'Summer Semester',
      batch: '2025-26',
      icon: <Sun className="w-6 h-6 text-orange-500" />
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Select Your Semester</h2>
        <p className="text-gray-500 text-center mb-8">
          Choose the semester you are planning for to load the correct course catalog and timetable slots.
        </p>

        <div className="space-y-4">
          {semesters.map((sem) => (
            <button
              key={sem.id}
              onClick={() => navigate('/auth')}
              className="w-full flex items-center p-4 rounded-xl border-2 border-gray-100 hover:border-[#0056b3] hover:bg-blue-50/50 transition-all group text-left"
            >
              <div className="bg-gray-50 group-hover:bg-white p-3 rounded-lg mr-4 transition-colors shadow-sm">
                {sem.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0056b3] transition-colors">
                  {sem.name}
                </h3>
                <p className="text-sm text-gray-500">{sem.batch}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
