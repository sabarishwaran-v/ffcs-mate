import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowRight } from 'lucide-react';

export default function Hub() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
      <div className="text-center max-w-3xl mb-12 animate-fade-in-up">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Master Your Semester with <span className="text-[#0056b3]">FFCS Mate</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          The ultimate scheduling and collaboration tool designed exclusively for VIT-AP students.
          Say goodbye to complex spreadsheets and build your perfect timetable in minutes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Product 1: Planner */}
        <div 
          onClick={() => navigate('/select-semester')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
        >
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Calendar className="w-8 h-8 text-[#0056b3]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">FFCS Planner</h2>
          <p className="text-gray-600 mb-6">
            Build your personal timetable, instantly check for clashes, and collaborate with your friends in real-time.
          </p>
          <div className="flex items-center font-semibold text-[#0056b3] group-hover:gap-2 transition-all">
            Open Planner <ArrowRight className="w-5 h-5 ml-1" />
          </div>
        </div>

        {/* Product 2: Teaser (Commented out per user request, but structurally planned) */}
        {/* 
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-8 opacity-75">
          <div className="bg-gray-200 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-500 mb-3">Friend Tracker</h2>
          <p className="text-gray-500 mb-6">
            See your friends' live schedules. Know exactly when they are in class and when they are free.
          </p>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">
            Coming Soon
          </div>
        </div>
        */}
      </div>
    </div>
  );
}
