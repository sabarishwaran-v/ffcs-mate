"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useScheduleStore } from "@/lib/store";
import { syncToCloud } from "@/lib/store/sync";

import { toast } from "sonner";

export function RoomSyncProvider({ roomId }: { roomId: string }) {
  const { user, userData } = useAuth();
  const setRoomMode = useScheduleStore(state => state.setRoomMode);
  const setRoomRole = useScheduleStore(state => state.setRoomRole);
  const setIsReceivingCloudUpdate = useScheduleStore(state => state.setIsReceivingCloudUpdate);
  const setCloudData = useScheduleStore(state => state.setCloudData);
  
  const lastUpdateRef = useRef<string | null>(null);

  // 1. Enter Room Mode
  useEffect(() => {
    setRoomMode(roomId);
    return () => setRoomMode(null);
  }, [roomId, setRoomMode]);

  // Heartbeat Presence
  useEffect(() => {
    if (!roomId || !user) return;

    const sendHeartbeat = async () => {
      try {
        await updateDoc(doc(db, "rooms", roomId), {
          [`members.${user.uid}.lastSeen`]: serverTimestamp(),
          [`members.${user.uid}.status`]: "online"
        });
      } catch (e) {
        // Room might be deleted or user removed
      }
    };

    sendHeartbeat();
    const intervalId = setInterval(sendHeartbeat, 15000);

    const handleBeforeUnload = () => {
      // Attempt to fire a sync update to mark offline
      const url = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents/rooms/${roomId}?updateMask.fieldPaths=members.${user.uid}.status&updateMask.fieldPaths=members.${user.uid}.lastSeen`;
      // We can't easily do authenticated REST calls in beforeunload synchronously, 
      // so the 25-second serverTimeout is our primary offline mechanism.
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId, user]);

  // 2. Listen to Cloud changes
  useEffect(() => {
    if (!roomId) return;
    
    const unsub = onSnapshot(doc(db, "rooms", roomId), (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = snapshot.data();
      const sharedTimetable = data.sharedTimetable;
      
      // Update room role
      if (user?.uid && data.members && data.members[user.uid]) {
        setRoomRole(data.members[user.uid].role || "editor");
      }

      // Host Migration & Offline Pruning
      if (user?.uid && data.members && data.hostId) {
        const now = Date.now();
        const TIMEOUT_MS = 25000; // 25 seconds timeout
        
        let hostIsActive = false;
        const activeMembers: any[] = [];
        
        Object.entries(data.members).forEach(([uid, m]: [string, any]) => {
          // Fallback to current time if no lastSeen (e.g. just joined)
          const lastSeenMs = m.lastSeen ? m.lastSeen.toMillis() : now;
          if (now - lastSeenMs < TIMEOUT_MS) {
            activeMembers.push({ uid, joinedAt: m.joinedAt?.toMillis() || 0 });
            if (uid === data.hostId) hostIsActive = true;
          }
        });

        // If host is disconnected, the oldest active member takes over
        if (!hostIsActive && activeMembers.length > 0) {
          activeMembers.sort((a, b) => a.joinedAt - b.joinedAt);
          const nextHostUid = activeMembers[0].uid;
          
          if (nextHostUid === user.uid) {
            // I am the new host!
            updateDoc(doc(db, "rooms", roomId), {
              hostId: user.uid
            });
          }
        }
      }
      
      if (sharedTimetable) {
        // Prevent echo: only update if the cloud timestamp is newer/different from the last one we received or sent
        if (sharedTimetable.lastUpdated !== lastUpdateRef.current) {
          // Show toast if someone else made the change
          if (sharedTimetable.lastActor && sharedTimetable.lastActor.uid !== user?.uid) {
            toast.info(`${sharedTimetable.lastActor.regNo} ${sharedTimetable.lastActor.action}`);
          }
          
          lastUpdateRef.current = sharedTimetable.lastUpdated;
          
          setIsReceivingCloudUpdate(true);
          setCloudData({
            courses: sharedTimetable.courses || [],
            teachers: sharedTimetable.teachers || [],
            timetables: sharedTimetable.timetables || [],
            activeTimetableId: sharedTimetable.activeTimetableId || null
          });
          
          // Let the store settle before allowing local mutations to broadcast
          setTimeout(() => {
            setIsReceivingCloudUpdate(false);
          }, 100);
        }
      }
    });

    return () => unsub();
  }, [roomId, setCloudData, setIsReceivingCloudUpdate, user]);

  // 3. Broadcast Local changes to Cloud
  useEffect(() => {
    if (!roomId) return;

    const unsub = useScheduleStore.subscribe((state, prevState) => {
      if (state.isReceivingCloudUpdate) return; // Don't bounce back cloud updates
      if (state.viewMode === "personal") return; // Don't broadcast personal changes

      // Check if relevant state changed
      const stateChanged = 
        state.timetables !== prevState.timetables ||
        state.courses !== prevState.courses ||
        state.teachers !== prevState.teachers ||
        state.activeTimetableId !== prevState.activeTimetableId;

      if (stateChanged) {
        let actionStr = "updated the timetable";
        
        // Check Course Adds/Removes
        if (state.courses.length > prevState.courses.length) {
          const added = state.courses.find(c => !prevState.courses.find(pc => pc.id === c.id));
          if (added) actionStr = `added ${added.code} to the list`;
        } else if (state.courses.length < prevState.courses.length) {
          const removed = prevState.courses.find(pc => !state.courses.find(c => c.id === pc.id));
          if (removed) actionStr = `removed ${removed.code} from the list`;
        } 
        // Check Teacher/Slot Adds
        else if (state.teachers.length > prevState.teachers.length) {
          const added = state.teachers.find(t => !prevState.teachers.find(pt => pt.id === t.id));
          if (added) {
            const course = state.courses.find(c => c.id === added.course);
            const typeStr = course?.type === "ELA" ? "Lab slot" : course?.type === "ETH" ? "Theory slot" : "slot";
            actionStr = `assigned a ${typeStr} for ${course?.code || "a course"}`;
          }
        } 
        // Check Teacher/Slot Removes
        else if (state.teachers.length < prevState.teachers.length) {
          const removed = prevState.teachers.find(pt => !state.teachers.find(t => t.id === pt.id));
          if (removed) {
            const course = state.courses.find(c => c.id === removed.course);
            const typeStr = course?.type === "ELA" ? "Lab slot" : course?.type === "ETH" ? "Theory slot" : "slot";
            actionStr = `unassigned ${typeStr} for ${course?.code || "a course"}`;
          }
        } 
        // Check Teacher/Slot Modifications
        else {
          const modified = state.teachers.find(t => {
            const pt = prevState.teachers.find(p => p.id === t.id);
            if (!pt) return false;
            return JSON.stringify(pt.slots) !== JSON.stringify(t.slots) || pt.name !== t.name;
          });
          if (modified) {
            const course = state.courses.find(c => c.id === modified.course);
            const typeStr = course?.type === "ELA" ? "Lab slot" : course?.type === "ETH" ? "Theory slot" : "slot";
            actionStr = `modified ${typeStr} for ${course?.code || "a course"}`;
          } else if (state.activeTimetableId !== prevState.activeTimetableId) {
            actionStr = "switched timetable views";
          }
        }

        const timestamp = new Date().toISOString();
        lastUpdateRef.current = timestamp; // Immediately cache what we're sending to prevent echo

        syncToCloud(roomId, {
          timetables: state.timetables,
          courses: state.courses,
          teachers: state.teachers,
          activeTimetableId: state.activeTimetableId
        }, {
          uid: user?.uid || "",
          name: userData?.name || "Unknown",
          regNo: userData?.registrationNumber || "Someone",
          action: actionStr
        });
      }
    });

    return () => unsub();
  }, [roomId, user, userData]);

  // 4. Heartbeat (Presence)
  useEffect(() => {
    if (!roomId || !user) return;

    const heartbeat = async () => {
      try {
        const roomRef = doc(db, "rooms", roomId);
        await updateDoc(roomRef, {
          [`members.${user.uid}.lastSeen`]: serverTimestamp()
        });
      } catch (e) {
        // Ignore, room might have been deleted or permissions lost
      }
    };

    heartbeat(); // Run immediately
    const interval = setInterval(heartbeat, 10000); // Run every 10 seconds

    return () => clearInterval(interval);
  }, [roomId, user]);

  return null; // This is a logic-only provider
}
