'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { ShieldCheck, LogOut, CheckCircle, ChevronDown, ChevronRight, Trash2, LayoutList, Loader2 } from 'lucide-react';
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

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState<ApprovedFaculty[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

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

    if (loading) return;

    const qApproved = query(collection(db, 'approved_faculties'));
    const unsubApproved = onSnapshot(qApproved, (snapshot) => {
      const data: ApprovedFaculty[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        data.push({ 
          id: doc.id,
          courseCode: d.courseCode,
          courseTitle: d.courseTitle || d.courseName || "",
          slot: d.slot,
          faculty: d.faculty || d.facultyName || "",
          venue: d.venue || "",
          approvedAt: d.approvedAt || "",
          approvedBy: d.approvedBy || ""
        });
      });
      setApproved(data);
    });

    return () => {
      unsubApproved();
    };
  }, [loading]);



  const handleDeleteApproved = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this approval? It will be removed from all students' planners.")) return;
    try {
      await deleteDoc(doc(db, 'approved_faculties', id));
      toast.success('Revoked approved faculty.');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCourse = async (courseCode: string) => {
    if (!confirm(`Are you absolutely sure you want to delete ALL slots and faculties for ${courseCode}? This cannot be undone.`)) return;
    
    try {
      const batch = writeBatch(db);
      const courseData = groupedData[courseCode];
      
      let count = 0;
      Object.values(courseData.slots).forEach(slotData => {
        slotData.approved.forEach(a => {
          batch.delete(doc(db, 'approved_faculties', a.id));
          count++;
        });
      });

      if (count > 0) {
        await batch.commit();
        toast.success(`Successfully deleted all ${count} slots for ${courseCode}.`);
      } else {
        toast.info(`No slots found for ${courseCode}.`);
      }
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

  const groupedData = useMemo(() => {
    const groups: Record<string, {
      courseTitle: string;
      slots: Record<string, { approved: ApprovedFaculty[] }>
    }> = {};

    const addToGroup = (courseCode: string, courseTitle: string, slot: string) => {
      if (!groups[courseCode]) {
        groups[courseCode] = { courseTitle: courseTitle || courseCode, slots: {} };
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

  const displayCourses = useMemo(() => {
    const courses = Object.entries(groupedData).map(([code, data]) => ({ code, ...data }));
    return courses.sort((a, b) => a.code.localeCompare(b.code));
  }, [groupedData]);

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
          {displayCourses.length === 0 ? (
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
          )}
        </div>
      </div>
    </div>
  );
}
