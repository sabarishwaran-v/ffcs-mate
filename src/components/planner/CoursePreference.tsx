import React, { useState } from 'react';
import { Pencil, Plus, Upload, Download, Trash2, Settings2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useUserStore, BaseCourse, CourseData } from '../../store/useUserStore';
import { parseVitApData } from '../../utils/vitApParser';
import { parseVTOPData } from '../../utils/vtopParser';
import FFCSRegistrationModal from './FFCSRegistrationModal';

export default function CoursePreference() {
  const { 
    baseCourses, addBaseCourse, removeBaseCourse, 
    selectedCourses, removeCourse, addCourse, 
    courseOptions, setCourseOptions,
    isVitApMode, setVitApMode 
  } = useUserStore();
  
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkData, setBulkData] = useState('');
  
  // Vellore workflow states
  const [showAddBaseModal, setShowAddBaseModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');

  const [activeCourseForParse, setActiveCourseForParse] = useState<string | null>(null);
  const [vtopText, setVtopText] = useState('');

  const [activeCourseForSelection, setActiveCourseForSelection] = useState<string | null>(null);

  const handleBulkAdd = () => {
    if (isVitApMode) {
      const courses = parseVitApData(bulkData);
      let added = 0;
      courses.forEach(course => {
        const res = addCourse(course);
        if (res.success) added++;
      });
      alert(`Successfully added ${added} courses from VIT-AP data format!`);
      setShowBulkAdd(false);
      setBulkData('');
    } else {
      alert("Please use the 'Add Course' button to follow the Vellore workflow.");
    }
  };

  const handleAddBaseCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourseCode.trim()) {
      addBaseCourse({ code: newCourseCode.toUpperCase().trim(), title: newCourseTitle.trim() });
      setShowAddBaseModal(false);
      setNewCourseCode('');
      setNewCourseTitle('');
    }
  };

  const handleParseVtop = () => {
    if (!activeCourseForParse) return;
    const parsed = parseVTOPData(vtopText, activeCourseForParse);
    if (parsed.length > 0) {
      setCourseOptions(activeCourseForParse, parsed);
      setVtopText('');
      setActiveCourseForParse(null);
      // Immediately open the selection modal now that we have options
      setActiveCourseForSelection(activeCourseForParse);
    } else {
      alert("Could not parse data. Ensure it is correct.");
    }
  };

  const handleCourseClick = (code: string) => {
    if (courseOptions[code] && courseOptions[code].length > 0) {
      setActiveCourseForSelection(code);
    } else {
      setActiveCourseForParse(code);
    }
  };

  const handleConfirmRegistration = (courseData: CourseData) => {
    // Remove any previously selected instance of this course
    const existingSelection = selectedCourses.find(c => c.code === courseData.code);
    if (existingSelection) {
      removeCourse(existingSelection.id);
    }
    const res = addCourse(courseData);
    if (!res.success) {
      alert("Slot clash detected!");
    } else {
      setActiveCourseForSelection(null);
    }
  };

  return (
    <div className="w-full bg-[#0f172a] text-slate-300 p-6 rounded-xl border border-slate-800 font-sans shadow-lg mb-6 relative">
      
      {/* Top Header Row */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-3">
          <span>Course Preference</span>
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-medium ml-4 border border-slate-700">
            Mode: {isVitApMode ? 'VIT-AP (No Faculty)' : 'VIT Vellore'}
          </span>
        </h2>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setVitApMode(!isVitApMode)}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            title="Developer Toggle"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch to {isVitApMode ? 'Vellore' : 'VIT-AP'}</span>
          </button>

          <button className="flex items-center space-x-2 bg-[#2d2a26] hover:bg-[#3d3933] border border-[#4a3e2f] text-orange-400 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            <span>View Mode</span>
          </button>
          
          <button 
            onClick={() => setShowBulkAdd(true)}
            className="flex items-center space-x-2 bg-[#2d2a26] hover:bg-[#3d3933] border border-[#4a3e2f] text-orange-400 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Bulk Add Courses</span>
          </button>

          <button 
            onClick={() => setShowAddBaseModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Your Courses</h3>
        
        {(!isVitApMode && baseCourses.length === 0) || (isVitApMode && selectedCourses.length === 0) ? (
          <div className="w-full bg-[#1e293b] border border-slate-800 rounded-lg p-6 flex items-center justify-center text-sm text-slate-500">
            No courses added yet. Add your first course!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Render Base Courses in Vellore Mode */}
            {!isVitApMode && baseCourses.map(course => {
              const hasOptions = courseOptions[course.code] && courseOptions[course.code].length > 0;
              const selected = selectedCourses.find(c => c.code === course.code);
              
              return (
                <div 
                  key={course.code} 
                  onClick={() => handleCourseClick(course.code)}
                  className={`bg-[#1e293b] border ${selected ? 'border-green-600' : hasOptions ? 'border-blue-500' : 'border-red-500 border-dashed'} rounded-lg p-4 relative cursor-pointer hover:bg-slate-800 transition-colors`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeBaseCourse(course.code); }}
                    className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="font-bold text-slate-100">{course.code}</div>
                  <div className="text-xs text-slate-400 mt-1">{course.title}</div>
                  
                  <div className="mt-3 flex items-center space-x-2 text-xs">
                    {selected ? (
                      <span className="text-green-400 flex items-center gap-1 bg-green-900/30 px-2 py-1 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {selected.slots.join('+')} - {selected.faculty}
                      </span>
                    ) : hasOptions ? (
                      <span className="text-blue-400 flex items-center gap-1 bg-blue-900/30 px-2 py-1 rounded">
                        <AlertTriangle className="w-3.5 h-3.5" /> Needs Faculty Selection
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1 bg-red-900/30 px-2 py-1 rounded">
                        <AlertTriangle className="w-3.5 h-3.5" /> Needs VTOP Data
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Render directly plotted courses in VIT-AP mode */}
            {isVitApMode && selectedCourses.map(course => (
              <div key={course.id} className="bg-[#1e293b] border border-slate-700 rounded-lg p-4 relative">
                <button 
                  onClick={() => removeCourse(course.id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-100">{course.code}</div>
                <div className="text-xs text-slate-400 mt-1">{course.title}</div>
                <div className="mt-3 flex items-center space-x-2">
                  <span className="bg-slate-800 text-blue-400 text-xs px-2 py-0.5 rounded font-mono">
                    {course.slots.join('+')}
                  </span>
                  <span className="text-xs text-slate-500">{course.type}</span>
                </div>
              </div>
            ))}
            
          </div>
        )}
      </div>

      {/* Add Base Course Modal */}
      {showAddBaseModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 rounded-xl backdrop-blur-sm">
          <form onSubmit={handleAddBaseCourse} className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Add Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Course Code</label>
                <input required type="text" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} placeholder="e.g. CHY1009" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Course Title</label>
                <input required type="text" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} placeholder="e.g. Chemistry..." className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowAddBaseModal(false)} className="text-xs font-medium text-slate-400 hover:text-slate-200">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold transition-colors">Add</button>
            </div>
          </form>
        </div>
      )}

      {/* Parse VTOP Data Modal */}
      {activeCourseForParse && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 rounded-xl backdrop-blur-sm">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Parse VTOP Data for {activeCourseForParse}</h3>
            <p className="text-xs text-slate-400 mb-4">Paste the rows from VTOP's Registration table for this course.</p>
            <textarea
              value={vtopText}
              onChange={(e) => setVtopText(e.target.value)}
              className="w-full h-40 bg-slate-900 border border-slate-700 rounded p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
              placeholder="Paste VTOP table rows here..."
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setActiveCourseForParse(null)} className="text-xs font-medium text-slate-400 hover:text-slate-200">Cancel</button>
              <button onClick={handleParseVtop} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold transition-colors">Parse & Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* FFCS Registration Modal */}
      {activeCourseForSelection && (
        <FFCSRegistrationModal 
          courseCode={activeCourseForSelection}
          options={courseOptions[activeCourseForSelection] || []}
          selectedOptionId={selectedCourses.find(c => c.code === activeCourseForSelection)?.id}
          onConfirm={handleConfirmRegistration}
          onClose={() => setActiveCourseForSelection(null)}
        />
      )}

      {/* Bulk Add Modal (for VIT-AP mostly) */}
      {showBulkAdd && (
        <div className="mb-6 bg-[#1e293b] p-4 rounded-lg border border-slate-700 mt-4">
          <h4 className="text-sm font-bold text-slate-200 mb-2">
            {isVitApMode ? 'Paste Annexure II Format (Code | Title | Type | Slot)' : 'Paste VTOP Table'}
          </h4>
          <textarea
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
            placeholder={isVitApMode ? "CHY1001\tEnvironmental Studies\tETH\tA+A1+TA+TA1\n..." : "Paste standard VTOP format here..."}
          />
          <div className="mt-3 flex justify-end space-x-3">
            <button onClick={() => setShowBulkAdd(false)} className="text-xs text-slate-400 hover:text-slate-200">Cancel</button>
            <button onClick={handleBulkAdd} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-blue-500">Parse & Add</button>
          </div>
        </div>
      )}

      {/* Bottom Footer Row */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
        <div className="flex-1"></div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-[#2d2a26] hover:bg-[#3d3933] border border-[#4a3e2f] text-orange-400 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload TT</span>
          </button>
          <button className="flex items-center space-x-2 bg-[#1e3a8a] hover:bg-blue-800 border border-blue-900 text-blue-300 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Save TT</span>
          </button>
          <button className="flex items-center space-x-2 bg-[#4c1d95] hover:bg-purple-800 border border-purple-900 text-purple-300 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Selected</span>
          </button>
          <button className="flex items-center space-x-2 bg-[#7f1d1d] hover:bg-red-800 border border-red-900 text-red-300 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
