'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { ShieldCheck, LogOut, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/button';
import { toast } from 'sonner';

interface PendingFaculty {
  id: string;
  courseCode: string;
  courseTitle: string;
  slot: string;
  faculty: string;
  venue: string;
  submittedAt: string;
  submittedBy: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingFaculty[]>([]);

  useEffect(() => {
    // Listen for auth state and check claims
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

    // Listen to pending_faculties
    const q = query(collection(db, 'pending_faculties'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: PendingFaculty[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as PendingFaculty);
      });
      // Sort oldest first
      data.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
      setPending(data);
    }, (error) => {
      console.error("Firestore error:", error);
      toast.error("Could not load pending data. Check Firebase Security Rules.");
    });

    return () => unsubscribe();
  }, [loading]);

  const handleApprove = async (item: PendingFaculty) => {
    try {
      // 1. Move to approved_faculties
      await setDoc(doc(db, 'approved_faculties', item.id), {
        courseCode: item.courseCode,
        slot: item.slot,
        faculty: item.faculty,
        venue: item.venue,
        approvedAt: new Date().toISOString(),
        approvedBy: auth.currentUser?.email
      });
      // 2. Delete from pending
      await deleteDoc(doc(db, 'pending_faculties', item.id));
      toast.success('Approved successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pending_faculties', id));
      toast.success('Rejected and removed.');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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

      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b bg-secondary/20 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Pending Approvals ({pending.length})</h2>
        </div>
        
        {pending.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>You're all caught up! No pending submissions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Slot</th>
                  <th className="px-6 py-4">Faculty</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Submitted By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pending.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{item.courseCode}</div>
                      <div className="text-xs text-muted-foreground">{item.courseTitle}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded">
                      {item.slot}
                    </td>
                    <td className="px-6 py-4 font-medium">{item.faculty}</td>
                    <td className="px-6 py-4">{item.venue}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{item.submittedBy}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <AnimatedButton 
                          onClick={() => handleReject(item.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-600 p-2 h-auto"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </AnimatedButton>
                        <AnimatedButton 
                          onClick={() => handleApprove(item.id)}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 h-auto"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </AnimatedButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
