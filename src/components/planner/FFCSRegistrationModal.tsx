import React, { useState } from 'react';
import { CourseData } from '../../store/useUserStore';

interface FFCSRegistrationModalProps {
  courseCode: string;
  options: CourseData[];
  selectedOptionId?: string;
  onConfirm: (selectedCourse: CourseData) => void;
  onClose: () => void;
}

export default function FFCSRegistrationModal({ courseCode, options, selectedOptionId, onConfirm, onClose }: FFCSRegistrationModalProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedOptionId);

  // Group options into Theory and Lab
  const theorySlots = options.filter(c => !c.isLab);
  const labSlots = options.filter(c => c.isLab);
  const courseInfo = options[0] || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white bg-dot-pattern rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto font-sans relative">
        
        {/* Authentic Header */}
        <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Select Faculty & Slot</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
          </div>
        </div>

        <div className="p-8">
          {/* Course Detail Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-xs font-bold text-gray-700 text-center">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-4 px-4 w-1/2">COURSE DETAIL</th>
                  <th className="py-4 px-4">L T P J C</th>
                  <th className="py-4 px-4">COURSE TYPE (ELIGIBLE COMPONENTS)</th>
                  <th className="py-4 px-4">COURSE CATEGORY</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4 px-4">{courseCode} - {courseInfo.title}</td>
                  <td className="py-4 px-4 text-blue-800">{courseInfo.ltpjc || '3 0 0 0 3.0'}</td>
                  <td className="py-4 px-4">{courseInfo.type || 'Theory Only'}</td>
                  <td className="py-4 px-4">{courseInfo.category || 'UC'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Slots Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-xs font-bold text-center">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600 bg-gray-50">
                  <th className="py-4 px-4 w-[40%]">SLOT</th>
                  <th className="py-4 px-4 w-[20%]">VENUE</th>
                  <th className="py-4 px-4 w-[25%]">FACULTY NAME</th>
                  <th className="py-4 px-4 w-[15%]">AVAILABILITY</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                
                {/* Embedded Theory Slots Header */}
                {theorySlots.length > 0 && (
                  <tr className="bg-[#1a233a] text-white text-left">
                    <td colSpan={4} className="py-2 px-4 uppercase tracking-wider text-[10px]">EMBEDDED THEORY SLOTS</td>
                  </tr>
                )}
                
                {theorySlots.map((course) => (
                  <tr key={course.id} className={`border-b border-gray-100 ${selectedId === course.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="py-4 px-4 text-black">{course.fullSlotString || course.slots.join('+')}</td>
                    <td className="py-4 px-4 text-gray-600 font-normal">{course.venue}</td>
                    <td className="py-4 px-4 text-gray-600 font-normal uppercase">{course.faculty}</td>
                    <td className="py-4 px-4">
                      <label className="flex items-center justify-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`theory-selection-${courseCode}`}
                          checked={selectedId === course.id}
                          onChange={() => setSelectedId(course.id)}
                          className="w-4 h-4 text-blue-600 cursor-pointer"
                        />
                        <span>{Math.floor(Math.random() * 60) + 1}</span>
                      </label>
                    </td>
                  </tr>
                ))}

                {/* Lab Slots Header */}
                {labSlots.length > 0 && (
                  <tr className="bg-[#1a233a] text-white text-left">
                    <td colSpan={4} className="py-2 px-4 uppercase tracking-wider text-[10px]">LAB SLOTS</td>
                  </tr>
                )}

                {labSlots.map((course) => (
                  <tr key={course.id} className={`border-b border-gray-100 ${selectedId === course.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="py-4 px-4 text-black">{course.fullSlotString || course.slots.join('+')}</td>
                    <td className="py-4 px-4 text-gray-600 font-normal">{course.venue}</td>
                    <td className="py-4 px-4 text-gray-600 font-normal uppercase">{course.faculty}</td>
                    <td className="py-4 px-4">
                      <label className="flex items-center justify-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`lab-selection-${courseCode}`}
                          checked={selectedId === course.id}
                          onChange={() => setSelectedId(course.id)}
                          className="w-4 h-4 text-blue-600 cursor-pointer"
                        />
                        <span>{Math.floor(Math.random() * 60) + 1}</span>
                      </label>
                    </td>
                  </tr>
                ))}

                {/* Bottom Registration Option */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="py-6 px-4 font-bold text-left text-sm text-gray-800">
                    Registration Option
                  </td>
                  <td colSpan={3} className="py-6 px-4 text-left">
                    <label className="flex items-center space-x-2 border border-gray-200 bg-white p-3 rounded max-w-[200px]">
                      <input type="radio" checked readOnly className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs text-gray-800">Regular</span>
                    </label>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-center space-x-4 mt-8 pb-8">
            <button 
              onClick={() => {
                if (selectedId) {
                  const selectedCourse = options.find(o => o.id === selectedId);
                  if (selectedCourse) onConfirm(selectedCourse);
                } else {
                  alert("Please select a faculty and slot first.");
                }
              }}
              className="bg-[#1cc88a] text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-green-600 transition-colors"
            >
              CONFIRM REGISTRATION
            </button>
            <button 
              onClick={onClose}
              className="bg-[#3b4158] text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-slate-700 transition-colors"
            >
              GO BACK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
