'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, writeBatch, serverTimestamp, getDocs, updateDoc, setDoc, deleteField } from "firebase/firestore";
import { ShieldCheck, LogOut, CheckCircle, ChevronDown, ChevronRight, Trash2, LayoutList, Loader2, Sparkles, Inbox } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/button';
import { toast } from 'sonner';
import AdminBulkParser from './admin-bulk-parser';



interface ApprovedFaculty {
  id: string;
  courseCode: string;
  courseTitle?: string;
  slot: string;
  faculty: string;
  venue: string;
  approvedAt: string;
  approvedBy: string;
}

interface PendingFaculty {
  id: string;
  courseCode: string;
  courseTitle?: string;
  slot: string;
  faculty: string;
  venue: string;
  submittedByUid: string;
  submittedByName: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState<ApprovedFaculty[]>([]);
  const [pending, setPending] = useState<PendingFaculty[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedPendingCourses, setExpandedPendingCourses] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');

  useEffect(() => {
    const unsubscribeAuth = auth.onIdTokenChanged(async (user) => {
      if (!user) {
        router.push('/admin');
        return;
      }
      
      try {
        const tokenResult = await user.getIdTokenResult();
        if (!tokenResult.claims.admin || !tokenResult.claims.mfa_verified) {
          toast.error("Unauthorized: Missing Admin or MFA Claims");
          auth.signOut();
          router.push('/admin');
          return;
        }
        setLoading(false);
      } catch (err) {
        toast.error("Auth verification failed");
        router.push('/admin');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const unsubApproved = onSnapshot(doc(db, 'system', 'approved_faculties_bundle'), (docSnap) => {
      if (docSnap.exists()) {
        const bundleData = docSnap.data();
        const data: ApprovedFaculty[] = Object.values(bundleData);
        setApproved(data);
      } else {
        setApproved([]);
      }
    });

    const qPending = query(collection(db, 'pending_faculties'));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const data: PendingFaculty[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        data.push({ 
          id: doc.id,
          courseCode: d.courseCode,
          courseTitle: d.courseName || "",
          slot: d.slot,
          faculty: d.facultyName || "",
          venue: d.venue || "",
          submittedByUid: d.submittedByUid || "",
          submittedByName: d.submittedByName || "Student"
        });
      });
      setPending(data);
    });

    return () => {
      unsubApproved();
      unsubPending();
    };
  }, [loading]);



  const handleDeleteApproved = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this approval? It will be removed from all students' planners.")) return;
    try {
      await updateDoc(doc(db, 'system', 'approved_faculties_bundle'), {
        [id]: deleteField()
      });
      toast.success('Revoked approved faculty.');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCourse = async (courseCode: string) => {
    if (!confirm(`Are you absolutely sure you want to delete ALL slots and faculties for ${courseCode}? This cannot be undone.`)) return;
    
    try {
      const courseData = groupedData[courseCode];
      
      let count = 0;
      const updates: Record<string, any> = {};
      Object.values(courseData.slots).forEach(slotData => {
        slotData.approved.forEach(a => {
          updates[a.id] = deleteField();
          count++;
        });
      });

      if (count > 0) {
        await updateDoc(doc(db, 'system', 'approved_faculties_bundle'), updates);
        toast.success(`Successfully deleted all ${count} slots for ${courseCode}.`);
      } else {
        toast.info(`No slots found for ${courseCode}.`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleApprovePendingCourse = async (courseCode: string) => {
    if (!confirm(`Approve all pending slots for ${courseCode}? This will make them live for all users.`)) return;
    
    try {
      const batch = writeBatch(db);
      const bundleUpdates: Record<string, any> = {};
      const coursePendingSlots = pending.filter(p => p.courseCode === courseCode);
      
      // Group pending slots by slot to determine best entry
      const slots: Record<string, PendingFaculty[]> = {};
      coursePendingSlots.forEach(p => {
        if (!slots[p.slot]) slots[p.slot] = [];
        slots[p.slot].push(p);
      });

      Object.entries(slots).forEach(([slot, pSlots]) => {
        // Find most popular faculty
        const facultyCounts: Record<string, number> = {};
        pSlots.forEach(p => {
          facultyCounts[p.faculty] = (facultyCounts[p.faculty] || 0) + 1;
        });
        const mostPopularFaculty = Object.keys(facultyCounts).reduce((a, b) => facultyCounts[a] > facultyCounts[b] ? a : b);
        
        // Find most popular venue for this faculty
        const venueCounts: Record<string, number> = {};
        pSlots.filter(p => p.faculty === mostPopularFaculty).forEach(p => {
          venueCounts[p.venue] = (venueCounts[p.venue] || 0) + 1;
        });
        const mostPopularVenue = Object.keys(venueCounts).reduce((a, b) => venueCounts[a] > venueCounts[b] ? a : b);

        const newId = `${courseCode}_${slot}_${mostPopularFaculty.replace(/\s+/g, '_')}`;
        bundleUpdates[newId] = {
          id: newId,
          courseCode: courseCode,
          courseTitle: pSlots[0].courseTitle,
          slot: slot,
          faculty: mostPopularFaculty,
          venue: mostPopularVenue,
          approvedAt: new Date().toISOString(),
          approvedBy: "Admin"
        };
      });

      // Update bundle and delete pending
      batch.set(doc(db, 'system', 'approved_faculties_bundle'), bundleUpdates, { merge: true });
      coursePendingSlots.forEach(p => {
        batch.delete(doc(db, 'pending_faculties', p.id));
      });
      
      // Reset the contribution count for this course so the button reappears if needed later
      batch.set(doc(db, 'system', 'contributions_count'), {
        [courseCode]: 0
      }, { merge: true });

      await batch.commit();
      toast.success(`Approved ${coursePendingSlots.length} slots for ${courseCode}!`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleCourse = (courseCode: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseCode)) {
      newExpanded.delete(courseCode);
    } else {
      newExpanded.add(courseCode);
    }
    setExpandedCourses(newExpanded);
  };

  const togglePendingCourse = (courseCode: string) => {
    const newExpanded = new Set(expandedPendingCourses);
    if (newExpanded.has(courseCode)) {
      newExpanded.delete(courseCode);
    } else {
      newExpanded.add(courseCode);
    }
    setExpandedPendingCourses(newExpanded);
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, {
      code: string;
      courseTitle: string;
      slots: Record<string, { approved: ApprovedFaculty[] }>
    }> = {};

    const addToGroup = (courseCode: string, courseTitle: string, slot: string) => {
      if (!groups[courseCode]) {
        groups[courseCode] = { code: courseCode, courseTitle: courseTitle || courseCode, slots: {} };
      }
      if (!groups[courseCode].slots[slot]) {
        groups[courseCode].slots[slot] = { approved: [] };
      }
    };

    approved.forEach(a => {
      addToGroup(a.courseCode, a.courseTitle || "", a.slot);
      groups[a.courseCode].slots[a.slot].approved.push(a);
    });

    return groups;
  }, [approved]);

  const groupedPendingData = useMemo(() => {
    const grouped: Record<string, {
      code: string;
      courseTitle: string;
      slots: PendingFaculty[];
    }> = {};
    
    pending.forEach(p => {
      if (!grouped[p.courseCode]) {
        grouped[p.courseCode] = {
          code: p.courseCode,
          courseTitle: p.courseTitle || "",
          slots: []
        };
      }
      grouped[p.courseCode].slots.push(p);
    });
    return grouped;
  }, [pending]);

  const displayCourses = Object.values(groupedData).sort((a,b) => a.code.localeCompare(b.code));
  const displayPendingCourses = Object.values(groupedPendingData).sort((a,b) => a.code.localeCompare(b.code));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-green-500" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium bg-secondary px-3 py-1 rounded-full">
            {auth.currentUser?.email}
          </span>
          <AnimatedButton 
            variant="outline" 
            onClick={() => auth.signOut()}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </AnimatedButton>
        </div>
      </div>

      <AdminBulkParser />

      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 border-b px-6 bg-secondary/20">
          <button 
             className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 border-primary text-primary`}
          >
            Live Courses Database
            <span className="bg-secondary text-foreground text-xs px-2 py-0.5 rounded-full border">
              {Object.keys(groupedData).length}
            </span>
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all border-2 ${
                activeTab === 'approved' 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : 'border-border bg-background text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              Approved Faculties ({displayCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all border-2 flex items-center justify-center gap-2 ${
                activeTab === 'pending' 
                  ? 'border-purple-500 bg-purple-500 text-white' 
                  : 'border-border bg-background text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              <Inbox className="w-4 h-4" /> Pending Review 
              {displayPendingCourses.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{displayPendingCourses.length}</span>
              )}
            </button>
          </div>

          {activeTab === 'approved' ? (
            displayCourses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>You're all caught up! No courses to display in this view.</p>
              </div>
            ) : (
              displayCourses.map(course => (
                <div key={course.code} className="border rounded-xl bg-card overflow-hidden shadow-sm hover:shadow transition-shadow">
                  <button 
                    onClick={() => toggleCourse(course.code)}
                    className="w-full flex items-center justify-between p-4 bg-secondary/10 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-background p-2 rounded-lg border shadow-sm">
                        {expandedCourses.has(course.code) ? <ChevronDown className="w-5 h-5 text-primary" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-lg">{course.code}</h3>
                        <p className="text-xs font-medium text-muted-foreground">{course.courseTitle}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="bg-secondary text-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border">
                        <LayoutList className="w-3.5 h-3.5" />
                        {Object.keys(course.slots).length} Slots
                      </span>
                      <AnimatedButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.code);
                        }}
                        variant="outline"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1 h-auto text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete All
                      </AnimatedButton>
                    </div>
                  </button>
                  
                  {expandedCourses.has(course.code) && (
                    <div className="p-4 flex flex-col gap-4 bg-background">
                      {Object.entries(course.slots).sort((a,b) => a[0].localeCompare(b[0])).map(([slot, data]) => (
                        <div key={slot} className="border rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-secondary/40 px-5 py-3 font-mono font-bold text-primary text-sm flex justify-between items-center border-b">
                            <span>{slot}</span>
                            <span className="text-xs font-semibold bg-background px-2 py-1 rounded-md border text-muted-foreground">
                              {data.approved.length} Faculties Total
                            </span>
                          </div>
                          <div className="flex flex-col divide-y divide-border">
                            {data.approved.map(a => (
                              <div key={a.id} className="p-4 flex items-center justify-between bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                                <div className="flex flex-col">
                                  <span className="font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle className="w-4 h-4" />
                                    {a.faculty}
                                  </span>
                                  <span className="text-xs font-medium text-muted-foreground mt-1">
                                    Venue: {a.venue} | <span className="opacity-60">Approved By: {a.approvedBy}</span>
                                  </span>
                                </div>
                                <AnimatedButton 
                                  onClick={() => handleDeleteApproved(a.id)} 
                                  variant="outline" 
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 h-auto" 
                                  title="Revoke Approval"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </AnimatedButton>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            displayPendingCourses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20 text-purple-500" />
                <p>No pending student contributions to review.</p>
              </div>
            ) : (
              displayPendingCourses.map(course => (
                <div key={course.code} className="border-2 border-purple-500/20 rounded-xl bg-card overflow-hidden shadow-sm hover:shadow transition-shadow">
                  <button 
                    onClick={() => togglePendingCourse(course.code)}
                    className="w-full flex items-center justify-between p-4 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-background p-2 rounded-lg border shadow-sm">
                        {expandedPendingCourses.has(course.code) ? <ChevronDown className="w-5 h-5 text-purple-500" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-lg text-purple-700 dark:text-purple-400">{course.code}</h3>
                        <p className="text-xs font-medium text-muted-foreground">{course.courseTitle || "Course Data Contribution"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Inbox className="w-3.5 h-3.5" />
                        {course.slots.length} Pending Slots
                      </span>
                      <AnimatedButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprovePendingCourse(course.code);
                        }}
                        variant="default"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 h-auto text-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Approve All
                      </AnimatedButton>
                    </div>
                  </button>
                  
                  {expandedPendingCourses.has(course.code) && (
                    <div className="p-4 flex flex-col gap-3 bg-background">
                      {course.slots.sort((a,b) => a.slot.localeCompare(b.slot)).map(a => (
                        <div key={a.id} className="p-4 flex items-center justify-between bg-secondary/20 rounded-lg border">
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-2">
                              <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs px-2 py-0.5 rounded">{a.slot}</span>
                              {a.faculty}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground mt-1">
                              Venue: {a.venue} | <span className="opacity-60">Submitted by: {a.submittedByName}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
