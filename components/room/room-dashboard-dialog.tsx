"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  query,
  collection,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Plus, LogIn, Inbox } from "lucide-react";
import { useScheduleStore } from "@/lib/store";

export function RoomDashboardDialog() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "my_rooms" | "create_join" | "inbox"
  >("my_rooms");
  const [invitations, setInvitations] = useState<any[]>([]);
  const [myRooms, setMyRooms] = useState<any[]>([]);

  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Generate a random 6-character alphanumeric code
  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = async () => {
    if (!user || !userData) return;
    setIsCreating(true);

    try {
      const roomCode = generateRoomCode();
      const roomRef = doc(db, "rooms", roomCode);

      const { timetables, courses, teachers, activeTimetableId } =
        useScheduleStore.getState();

      await Promise.race([
        setDoc(roomRef, {
          id: roomCode,
          creatorId: user.uid,
          activeHostId: user.uid,
          createdAt: serverTimestamp(),
          members: {
            [user.uid]: {
              role: "host",
              status: "online",
              joinedAt: serverTimestamp(),
              regNo: userData.registrationNumber,
              name: userData.name,
            },
          },
          memberIds: [user.uid],
          sharedTimetable: {
            timetables,
            courses,
            teachers,
            activeTimetableId,
            lastUpdated: new Date().toISOString(),
          },
        }),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("Network timeout. Please check your connection.")
              ),
            5000
          )
        ),
      ]);

      toast.success("Room created successfully!", {
        description: `Code: ${roomCode}`,
      });

      setIsOpen(false);
      router.push(`/room/${roomCode}`);
    } catch (error: any) {
      toast.error("Failed to create room", {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || joinCode.length !== 6) {
      toast.error("Invalid Code", {
        description: "Room code must be 6 characters.",
      });
      return;
    }

    setIsJoining(true);
    // Real validation and request-to-join logic will be added in the next step
    // For now, just route them if they type a code
    toast.success("Attempting to join...");
    setIsOpen(false);
    router.push(`/room/${joinCode.toUpperCase()}`);
    setIsJoining(false);
  };

  // Listen for invitations
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "invitations"),
      where("toUid", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribeInvs = onSnapshot(q, (snapshot) => {
      const invs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInvitations(invs);
    });

    // Listen for My Rooms
    const qRooms = query(
      collection(db, "rooms"),
      where("memberIds", "array-contains", user.uid)
    );
    const unsubscribeRooms = onSnapshot(qRooms, (snapshot) => {
      const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMyRooms(rooms);
    });

    return () => {
      unsubscribeInvs();
      unsubscribeRooms();
    };
  }, [user]);

  const handleAccept = async (invitation: any) => {
    try {
      const roomRef = doc(db, "rooms", invitation.roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        if (roomData.memberIds && roomData.memberIds.length >= 8) {
          toast.error("Room is full!", {
            description: "You cannot have more than 8 members in a room.",
          });
          return;
        }
      }

      // 1. Mark as accepted
      await updateDoc(doc(db, "invitations", invitation.id), {
        status: "accepted",
      });

      const isRequest = invitation.type === "request";
      const targetUid = isRequest ? invitation.fromUid : user!.uid;
      const targetRegNo = isRequest
        ? invitation.fromRegNo
        : userData!.registrationNumber;
      const targetName = isRequest ? invitation.fromName : userData!.name;

      // 2. Add user to room
      await setDoc(
        roomRef,
        {
          memberIds: arrayUnion(targetUid),
          members: {
            [targetUid]: {
              role: "editor",
              status: "offline", // They will be online when they actually enter
              joinedAt: serverTimestamp(),
              regNo: targetRegNo,
              name: targetName,
            },
          },
        },
        { merge: true }
      );

      toast.success(isRequest ? "Request Approved!" : "Joined Room!");
      if (!isRequest) {
        setIsOpen(false);
        router.push(`/room/${invitation.roomId}`);
      }
    } catch (error: any) {
      toast.error("Failed to accept", { description: error.message });
    }
  };

  const handleReject = async (invitation: any) => {
    try {
      await updateDoc(doc(db, "invitations", invitation.id), {
        status: "rejected",
      });
      toast.success("Invitation rejected");
    } catch (error: any) {
      toast.error("Failed to reject", { description: error.message });
    }
  };

  if (!user || !userData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-600 transition-colors relative"
        >
          <Users className="h-4 w-4" />
          Rooms
          {invitations.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {invitations.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collaboration Hub</DialogTitle>
          <DialogDescription>
            Create a new room to plan with friends, or join an existing one.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Tabs */}
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                activeTab === "my_rooms"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("my_rooms")}
            >
              My Rooms
            </button>
            <button
              className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                activeTab === "create_join"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("create_join")}
            >
              Create / Join
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                activeTab === "inbox"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("inbox")}
            >
              Invites
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                  invitations.length > 0
                    ? "bg-red-500 text-white"
                    : "bg-purple-500 text-white"
                }`}
              >
                {invitations.length}
              </span>
            </button>
          </div>

          {activeTab === "my_rooms" ? (
            <div className="flex flex-col gap-3 mt-2 max-h-[300px] overflow-y-auto pr-2">
              {myRooms.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    You are not actively in any rooms.
                  </p>
                </div>
              ) : (
                myRooms.map((room) => {
                  const myData = room.members?.[user?.uid || ""];
                  return (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/50 hover:border-purple-500/30 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm">
                          Room{" "}
                          <span className="font-mono text-purple-600">
                            {room.id}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          Role: {myData?.role || "member"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/room/${room.id}`);
                        }}
                      >
                        Enter Room
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === "create_join" ? (
            <div className="flex flex-col gap-6 mt-2">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white h-12 gap-2 shadow-sm hover:opacity-90"
                >
                  <Plus className="h-5 w-5" />
                  {isCreating ? "Creating Room..." : "Create New Room"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You will be the host and can invite friends.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or join existing
                  </span>
                </div>
              </div>

              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <Input
                  placeholder="Enter 6-digit Code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="uppercase text-center font-mono tracking-widest h-11"
                />
                <Button
                  type="submit"
                  disabled={isJoining || joinCode.length !== 6}
                  className="h-11 px-6"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Join
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col py-2 max-h-[300px] overflow-y-auto">
              {invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3 opacity-60">
                  <Inbox className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">No pending invitations</p>
                    <p className="text-sm text-muted-foreground">
                      When friends invite you, they will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {invitations.map((inv) => {
                    const isRequest = inv.type === "request";
                    return (
                      <div
                        key={inv.id}
                        className="border p-3 rounded-lg flex items-center justify-between bg-card shadow-sm"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {isRequest ? "Join Request: " : "Room Invite: "}
                            <span className="font-mono text-purple-600">
                              {inv.roomId}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            From: {inv.fromName} ({inv.fromRegNo})
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleReject(inv)}
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => handleAccept(inv)}
                          >
                            {isRequest ? "Approve" : "Accept"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
