"use client";

import {
  Users,
  LogOut,
  Copy,
  Check,
  Shield,
  Eye,
  ShieldAlert,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InviteDialog } from "./invite-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteField,
  arrayRemove,
  query,
  collection,
  where,
  arrayUnion,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/auth-provider";

export function RoomHeader({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<Record<string, any>>({});
  const [hostId, setHostId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const prevReqCount = useRef(0);
  const prevMembersRef = useRef<Record<string, any> | null>(null);
  const prevHostRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newMembers = data.members || {};
        const newHostId = data.activeHostId || data.creatorId;

        // Host migration notification
        if (
          prevHostRef.current &&
          prevHostRef.current !== newHostId &&
          newMembers[newHostId]
        ) {
          if (newHostId === user?.uid) {
            toast.success("You are the new Host! 👑", { duration: 6000 });
          } else {
            toast.info(`${newMembers[newHostId].regNo} is now the Host! 👑`);
          }
        }
        prevHostRef.current = newHostId;

        // Check for joins/leaves and role changes
        if (prevMembersRef.current) {
          const prevKeys = Object.keys(prevMembersRef.current);
          const newKeys = Object.keys(newMembers);

          newKeys.forEach((key) => {
            const prevMember = prevMembersRef.current![key];
            const newMember = newMembers[key];

            if (!prevKeys.includes(key) && newMember.regNo) {
              if (key !== user?.uid)
                toast.success(`${newMember.regNo} joined the room!`);
            } else if (
              prevMember &&
              newMember &&
              prevMember.role !== newMember.role
            ) {
              if (key !== user?.uid) {
                toast.info(
                  `${newMember.regNo} was moved to ${
                    newMember.role === "spectator" ? "Spectator Mode" : "Editor"
                  }`
                );
              } else {
                toast.info(
                  `You were moved to ${
                    newMember.role === "spectator" ? "Spectator Mode" : "Editor"
                  }`
                );
              }
            }
          });

          prevKeys.forEach((key) => {
            if (!newKeys.includes(key) && prevMembersRef.current![key].regNo) {
              if (key !== user?.uid)
                toast.error(
                  `${prevMembersRef.current![key].regNo} left the room.`
                );
            }
          });
        }

        prevMembersRef.current = newMembers;
        setMembers(newMembers);
        setHostId(newHostId);
      }
    });
    return () => unsub();
  }, [roomId, user]);

  useEffect(() => {
    if (!user || !hostId || user.uid !== hostId) return;
    const q = query(
      collection(db, "invitations"),
      where("roomId", "==", roomId),
      where("toUid", "==", user.uid),
      where("status", "==", "pending"),
      where("type", "==", "request")
    );
    const unsubInvs = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubInvs();
  }, [user, hostId, roomId]);

  useEffect(() => {
    if (requests.length > prevReqCount.current) {
      toast.info("New Join Request!", {
        description: "Someone is asking to join the room.",
        action: {
          label: "Scroll to Top",
          onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        },
        duration: 8000,
      });
    }
    prevReqCount.current = requests.length;
  }, [requests]);

  const handleAcceptRequest = async (inv: any) => {
    try {
      if (Object.keys(members).length >= 8) {
        toast.error("Room is full!", {
          description: "You cannot have more than 8 members in a room.",
        });
        return;
      }

      await updateDoc(doc(db, "invitations", inv.id), { status: "accepted" });
      const roomRef = doc(db, "rooms", roomId);
      await setDoc(
        roomRef,
        {
          memberIds: arrayUnion(inv.fromUid),
          members: {
            [inv.fromUid]: {
              role: "editor",
              status: "offline",
              joinedAt: serverTimestamp(),
              regNo: inv.fromRegNo,
              name: inv.fromName,
            },
          },
        },
        { merge: true }
      );
      toast.success(`Request from ${inv.fromName} approved!`);
    } catch (e: any) {
      toast.error("Failed to accept", { description: e.message });
    }
  };

  const handleRejectRequest = async (inv: any) => {
    try {
      await updateDoc(doc(db, "invitations", inv.id), { status: "rejected" });
      toast.success("Request declined.");
    } catch (e: any) {
      toast.error("Failed to decline", { description: e.message });
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success("Room Code Copied", {
      description: "Share this code with your friends!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveRoom = async () => {
    if (user?.uid) {
      try {
        await updateDoc(doc(db, "rooms", roomId), {
          [`members.${user.uid}`]: deleteField(),
          memberIds: arrayRemove(user.uid),
        });
      } catch (e) {
        console.error("Failed to leave room cleanly", e);
      }
    }
    router.push("/planner");
  };

  const toggleSpectatorMode = async (
    memberUid: string,
    currentRole: string
  ) => {
    if (!user || user.uid !== hostId) return; // Only host can toggle
    const newRole = currentRole === "spectator" ? "editor" : "spectator";
    try {
      await updateDoc(doc(db, "rooms", roomId), {
        [`members.${memberUid}.role`]: newRole,
      });
      toast.success(
        newRole === "spectator"
          ? "User moved to Spectator Mode"
          : "Edit access restored"
      );
    } catch (e) {
      toast.error("Failed to update user role");
    }
  };

  const isHost = user?.uid === hostId;
  const myRole = members[user?.uid || ""]?.role || "editor";

  // Filter Active Members (lastSeen within 25 seconds)
  const now = Date.now();
  const TIMEOUT_MS = 25000;
  const activeMembersObj: Record<string, any> = {};

  Object.entries(members).forEach(([uid, m]: [string, any]) => {
    const lastSeenMs = m.lastSeen
      ? m.lastSeen.seconds
        ? m.lastSeen.seconds * 1000
        : m.lastSeen.toMillis
        ? m.lastSeen.toMillis()
        : now
      : now;
    if (now - lastSeenMs < TIMEOUT_MS) {
      activeMembersObj[uid] = m;
    }
  });

  const AVATAR_COLORS = [
    "bg-emerald-400 text-emerald-950 ring-emerald-500/30",
    "bg-[#B4D33F] text-[#425200] ring-[#B4D33F]/30", // green-yellow matching the screenshot
    "bg-purple-400 text-purple-950 ring-purple-500/30",
    "bg-blue-400 text-blue-950 ring-blue-500/30",
    "bg-rose-400 text-rose-950 ring-rose-500/30",
    "bg-amber-400 text-amber-950 ring-amber-500/30",
  ];

  const getAvatarColor = (uid: string) => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="mb-8 rounded-xl border bg-card p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative z-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 flex items-center gap-2">
            Collaborative Room
            {myRole === "spectator" && (
              <span className="text-[10px] uppercase px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-bold border border-red-500/20 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Spectator Mode
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
              Code:
            </span>
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-1.5 text-sm font-mono font-bold bg-muted px-2 py-0.5 rounded hover:bg-muted/80 transition-colors"
            >
              {roomId}
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex flex-col items-start gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border text-left">
              <span className="text-xs font-semibold text-muted-foreground mb-1">
                Room Members ({Object.keys(members).length})
              </span>
              <div className="flex -space-x-2">
                {Object.entries(members).map(
                  ([uid, m]: [string, any], index) => {
                    const colorClass = getAvatarColor(uid);
                    const isOnline = !!activeMembersObj[uid];
                    return (
                      <div
                        key={uid}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-background z-[${
                          10 - index
                        }] ${colorClass} relative`}
                        title={`${m.name} ${
                          isOnline ? "(Online)" : "(Offline)"
                        }`}
                      >
                        {getInitials(m.name)}
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 p-0 border border-border shadow-xl"
          >
            <div className="p-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm">Room Members</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
              {Object.entries(members).map(([uid, m]: [string, any]) => {
                const isOnline = !!activeMembersObj[uid];
                return (
                  <div
                    key={uid}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${getAvatarColor(
                          uid
                        )} relative`}
                      >
                        {getInitials(m.name)}
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          {m.name}
                          {uid === hostId && (
                            <Shield className="w-3 h-3 text-yellow-500" />
                          )}
                          {uid === user?.uid && (
                            <span className="text-[10px] text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {m.role || "editor"}
                        </span>
                      </div>
                    </div>
                    {isHost && uid !== hostId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSpectatorMode(uid, m.role)}
                        className={`h-7 text-xs px-2 ${
                          m.role === "spectator"
                            ? "text-green-500 hover:text-green-600 hover:bg-green-500/10"
                            : "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        }`}
                      >
                        {m.role === "spectator"
                          ? "Restore Access"
                          : "Revoke Access"}
                      </Button>
                    )}
                    {!isHost && m.role === "spectator" && (
                      <ShieldAlert className="w-4 h-4 text-red-500 opacity-50" />
                    )}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {isHost && requests.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="relative border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700 h-9"
              >
                <Inbox className="w-4 h-4 mr-2" />
                Requests
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {requests.length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="bg-muted px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Join Requests</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-2">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="border p-3 rounded-lg flex flex-col gap-2 bg-card shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-sm">{req.fromName}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.fromRegNo}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleRejectRequest(req)}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleAcceptRequest(req)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {myRole !== "spectator" && <InviteDialog roomId={roomId} />}

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Connected
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={leaveRoom}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 sm:hidden"
        >
          <LogOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={leaveRoom}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20 hidden sm:flex"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Leave Room
        </Button>
      </div>
    </div>
  );
}
