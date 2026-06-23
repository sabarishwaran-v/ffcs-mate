"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export function RoomGuard({ roomId, children }: { roomId: string, children: React.ReactNode }) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [roomHostId, setRoomHostId] = useState<string | null>(null);
  const [roomSize, setRoomSize] = useState<number>(0);

  useEffect(() => {
    if (authLoading) return;
    
    // If not signed in, redirect to home to sign in
    if (!user) {
      toast.error("Authentication Required", { description: "You must sign in to join a room." });
      router.push("/");
      return;
    }

    const unsubRoom = onSnapshot(doc(db, "rooms", roomId), async (roomSnap) => {
      try {
        if (!roomSnap.exists()) {
          setRoomExists(false);
          setHasAccess(false);
          return;
        }

        setRoomExists(true);
        const roomData = roomSnap.data();
        setRoomHostId(roomData.activeHostId || roomData.creatorId || null);
        const count = roomData.memberIds ? roomData.memberIds.length : (roomData.members ? Object.keys(roomData.members).length : 0);
        setRoomSize(count);

        // Check if user is a member
        if (roomData.members && roomData.members[user.uid]) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
          // Check if they already sent a request
          const reqQuery = query(
            collection(db, "invitations"), 
            where("roomId", "==", roomId),
            where("fromUid", "==", user.uid),
            where("type", "==", "request"),
            where("status", "==", "pending")
          );
          const reqSnap = await getDocs(reqQuery);
          setRequestSent(!reqSnap.empty);
        }
      } catch (error) {
        console.error("Error checking room access", error);
        setHasAccess(false);
      }
    }, (error) => {
      console.error("Snapshot error:", error);
      setHasAccess(false);
    });

    return () => unsubRoom();
  }, [roomId, user, authLoading, router]);

  const handleRequestAccess = async () => {
    if (!user || !userData || !roomHostId) {
      toast.error("Unable to identify room host.");
      return;
    }
    if (roomSize >= 8) {
      toast.error("Room is full!", { description: "You cannot request access because the room already has the maximum of 8 members." });
      return;
    }
    setIsRequesting(true);
    try {
      await addDoc(collection(db, "invitations"), {
        roomId: roomId,
        fromUid: user.uid,
        fromRegNo: userData.registrationNumber,
        fromName: userData.name,
        targetRegNo: "host", // Special target for requests
        toUid: roomHostId, // Crucial: so it shows in host's inbox
        status: "pending",
        type: "request",
        createdAt: serverTimestamp()
      });
      setRequestSent(true);
      toast.success("Request sent successfully!", {
        description: "Waiting for the host to approve your request."
      });
    } catch (error: any) {
      toast.error("Failed to send request", { description: error.message });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      const reqQuery = query(
        collection(db, "invitations"), 
        where("roomId", "==", roomId),
        where("fromUid", "==", user?.uid),
        where("type", "==", "request"),
        where("status", "==", "pending")
      );
      const reqSnap = await getDocs(reqQuery);
      
      const deletePromises = reqSnap.docs.map(docSnap => updateDoc(doc(db, "invitations", docSnap.id), { status: "cancelled" }));
      await Promise.all(deletePromises);
      
      setRequestSent(false);
      toast.success("Request cancelled.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel request");
    }
  };

  if (authLoading || hasAccess === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-muted-foreground animate-pulse">Verifying room access...</p>
      </div>
    );
  }

  if (roomExists === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-2">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">Room Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          The room code <span className="font-mono font-bold text-foreground">{roomId}</span> does not exist or has been closed.
        </p>
        <Button onClick={() => router.push("/")} className="mt-4">Return Home</Button>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500 mb-2">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You are not a member of room <span className="font-mono font-bold text-foreground">{roomId}</span>. You must request access from the host.
        </p>
        
        {requestSent ? (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              <p className="font-medium">Request Pending</p>
              <p className="text-sm text-muted-foreground">Waiting for the host to accept your request...</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleCancelRequest}>
              Cancel Request
            </Button>
          </div>
        ) : (
          <Button onClick={handleRequestAccess} disabled={isRequesting} className="mt-4 gap-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Request Access
          </Button>
        )}
        
        <Button variant="ghost" onClick={() => router.push("/")} className="mt-2 text-muted-foreground">
          Go back
        </Button>
      </div>
    );
  }

  // User has access! Render the room
  return <>{children}</>;
}
