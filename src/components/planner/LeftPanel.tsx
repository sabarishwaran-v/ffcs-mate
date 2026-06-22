import React, { useState } from 'react';
import { Search, Filter, ArrowLeft, ClipboardList, Plus } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';

export default function LeftPanel() {
  const [activeView, setActiveView] = useState<'catalog' | 'faculty'>('catalog');
  const setHoveredSlots = useUserStore(state => state.setHoveredSlots);
  const addCourse = useUserStore(state => state.addCourse);
  const selectedCourses = useUserStore(state => state.selectedCourses);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [vtopData, setVtopData] = useState('');

  // Dummy courses for now
  const courses = [
    { id: '1', code: 'CSE1001', title: 'Problem Solving with C', credits: 4 },
    { id: '2', code: 'CSE1002', title: 'Problem Solving with Object Oriented Programming', credits: 4 },
    { id: '3', code: 'CSE1003', title: 'Data Structures and Algorithms', credits: 4 },
    { id: '4', code: 'CSE1004', title: 'Computer Architecture and Organization', credits: 4 },
  ];

  const handleAddCourse = (course: any) => {
    setSelectedCourse(course);
    setActiveView('faculty');
  };

  const handleBack = () => {
    setActiveView('catalog');
    setSelectedCourse(null);
    setHoveredSlots([]);
  };

  const onAddFaculty = (slots: string[], facultyName: string, venue: string) => {
    const result = addCourse({
      id: Math.random().toString(36).substr(2, 9),
      code: selectedCourse.code,
      title: selectedCourse.title,
      slots,
      faculty: facultyName,
      venue,
      credits: selectedCourse.credits
    });

    if (!result.success && result.clashingWith) {
      const clashNames = result.clashingWith.map(c => c.code).join(', ');
      alert(`Cannot add course. Slot(s) ${slots.join('+')} clashing with ${clashNames}`);
    } else {
      handleBack();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#fafafa]">
      
      {/* View: Course Catalog */}
      {activeView === 'catalog' && (
        <>
          <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10 flex-shrink-0">
            <div className="flex gap-2 mb-3">
              <button className="flex-1 py-2 text-sm font-semibold text-[#0056b3] border-b-2 border-[#0056b3]">
                Course Catalog
              </button>
              <button className="flex-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                My Courses ({selectedCourses.length})
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus:border-[#0056b3] sm:text-sm transition-shadow"
                placeholder="Search courses e.g. CSE1001..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {courses.map(course => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{course.code}</h3>
                  <span className="bg-blue-50 text-[#0056b3] text-xs font-bold px-2 py-1 rounded border border-blue-100">
                    {course.credits} Cr
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{course.title}</p>
                <button 
                  onClick={() => handleAddCourse(course)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0056b3] hover:border-gray-300 transition-all"
                >
                  <Plus className="h-4 w-4" /> Add Course
                </button>
              </div>
            ))}

            <button className="w-full border-2 border-dashed border-[#0056b3]/30 rounded-xl p-4 text-[#0056b3] font-medium hover:bg-[#0056b3]/5 transition-colors flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" /> Add Custom Course
            </button>
          </div>
        </>
      )}

      {/* View: Faculty Selection / VTOP Parser */}
      {activeView === 'faculty' && selectedCourse && (
        <div className="flex flex-col h-full bg-white z-20">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white shadow-sm flex-shrink-0">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">{selectedCourse.code}</h2>
              <p className="text-xs text-gray-500">{selectedCourse.title}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">VTOP Course Registration</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-800 mb-3">
                  Paste the row data from VTOP below to instantly add the faculty and slot.
                </p>
                <div className="relative">
                  <textarea 
                    value={vtopData}
                    onChange={(e) => setVtopData(e.target.value)}
                    placeholder="Paste VTOP row here..."
                    className="w-full h-24 p-3 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-[#0056b3] focus:border-[#0056b3] resize-none"
                  />
                  <button className="absolute bottom-3 right-3 bg-[#0056b3] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[#004494] transition-colors shadow-sm">
                    Parse & Add
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white text-xs text-gray-500 uppercase font-medium">Or select manually</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {/* Dummy Faculty 1 */}
              <div 
                onMouseEnter={() => setHoveredSlots(['A1', 'TA1'])}
                onMouseLeave={() => setHoveredSlots([])}
                className="p-3 border border-gray-200 rounded-xl hover:border-[#0056b3] hover:bg-blue-50/30 cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-[#0056b3]">Dr. Alice Smith</h4>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">A1+TA1</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">SJT 301</p>
                <button 
                  onClick={() => onAddFaculty(['A1', 'TA1'], 'Dr. Alice Smith', 'SJT 301')}
                  className="w-full py-1.5 text-sm font-medium text-[#0056b3] border border-[#0056b3] rounded-lg hover:bg-[#0056b3] hover:text-white transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Dummy Faculty 2 */}
              <div 
                onMouseEnter={() => setHoveredSlots(['B2', 'TB2'])}
                onMouseLeave={() => setHoveredSlots([])}
                className="p-3 border border-gray-200 rounded-xl hover:border-[#0056b3] hover:bg-blue-50/30 cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-[#0056b3]">Prof. Bob Jones</h4>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">B2+TB2</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">PRP 101</p>
                <button 
                  onClick={() => onAddFaculty(['B2', 'TB2'], 'Prof. Bob Jones', 'PRP 101')}
                  className="w-full py-1.5 text-sm font-medium text-[#0056b3] border border-[#0056b3] rounded-lg hover:bg-[#0056b3] hover:text-white transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
