import React, { useState } from 'react';
import { Users, User, Download, Copy } from 'lucide-react';
import TimetableGrid from './TimetableGrid';

export default function RightPanel() {
  const [workspace, setWorkspace] = useState<'PERSONAL' | 'COLLAB'>('PERSONAL');

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Top Workspace Header */}
      <div className="h-[60px] border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex space-x-6 h-full">
          <button 
            onClick={() => setWorkspace('PERSONAL')}
            className={`flex items-center space-x-2 h-full border-b-2 px-2 transition-colors ${
              workspace === 'PERSONAL' ? 'border-[#0056b3] text-[#0056b3]' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="font-semibold text-sm">Personal Timetable</span>
          </button>
          
          <button 
            onClick={() => setWorkspace('COLLAB')}
            className={`flex items-center space-x-2 h-full border-b-2 px-2 transition-colors ${
              workspace === 'COLLAB' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="font-semibold text-sm">Collaborative Planning</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {workspace === 'COLLAB' && (
            <>
              <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors border border-emerald-200">
                <Users className="w-4 h-4" />
                <span>Invite Friend</span>
              </button>
              <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors">
                <Copy className="w-4 h-4" />
                <span>Sync to Personal</span>
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
            </>
          )}
          
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0056b3] text-white hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export JPG</span>
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 overflow-auto bg-gray-50/30 p-6 relative">
        <TimetableGrid />
      </div>
    </div>
  );
}
