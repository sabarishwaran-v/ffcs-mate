import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StoreState } from "./types";

export const syncToCloud = async (
  roomId: string, 
  state: Pick<StoreState, "timetables" | "courses" | "teachers" | "activeTimetableId">,
  actor?: { uid: string; name: string; regNo: string; action: string }
) => {
  try {
    const roomRef = doc(db, "rooms", roomId);
    // We only update the sharedTimetable property
    const payload: any = {
      timetables: state.timetables,
      courses: state.courses,
      teachers: state.teachers,
      activeTimetableId: state.activeTimetableId,
      lastUpdated: new Date().toISOString()
    };
    if (actor) {
      payload.lastActor = actor;
    }

    await setDoc(roomRef, {
      sharedTimetable: payload
    }, { merge: true });
  } catch (error) {
    console.error("Failed to sync to cloud:", error);
  }
};
