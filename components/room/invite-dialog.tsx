"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

export function InviteDialog({ roomId }: { roomId: string }) {
  const { user, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [regNo, setRegNo] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !regNo) return;

    const formattedRegNo = regNo.toUpperCase().trim();

    if (userData?.registrationNumber && formattedRegNo === userData.registrationNumber.toUpperCase()) {
      toast.error("Invalid Action", {
        description: "You cannot send an invitation to yourself.",
      });
      return;
    }

    setIsSending(true);

    try {
      // Check room size first
      const roomSnap = await getDoc(doc(db, "rooms", roomId));
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        const count = roomData.memberIds ? roomData.memberIds.length : (roomData.members ? Object.keys(roomData.members).length : 0);
        if (count >= 8) {
          toast.error("Room is full!", { description: "You cannot invite more people. The room has reached the maximum of 8 members." });
          setIsSending(false);
          return;
        }
      }

      // Check if user exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("registrationNumber", "==", formattedRegNo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("User not found", {
          description: `No registered user found with Registration Number ${formattedRegNo}. They must sign in to FFCS MATE at least once.`,
        });
        setIsSending(false);
        return;
      }

      const targetUser = querySnapshot.docs[0].data();
      const targetUid = targetUser.uid;

      // Check if they are discoverable
      if (targetUser.privacySettings?.discoverable === false) {
        toast.error("User not reachable", {
          description: "This user has disabled room invitations in their privacy settings.",
        });
        setIsSending(false);
        return;
      }

      // Send Invitation
      await addDoc(collection(db, "invitations"), {
        roomId: roomId,
        fromUid: user.uid,
        fromName: userData?.name || "Host",
        fromRegNo: userData?.registrationNumber || "Unknown",
        targetRegNo: formattedRegNo,
        toUid: targetUid,
        status: "pending",
        type: "invite",
        createdAt: serverTimestamp()
      });

      toast.success("Invitation Sent!", {
        description: `Successfully invited ${formattedRegNo} to the room.`,
      });
      
      setIsOpen(false);
      setRegNo("");
    } catch (error: any) {
      toast.error("Failed to send invite", { description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700">
          <UserPlus className="h-4 w-4" />
          Invite Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Room</DialogTitle>
          <DialogDescription>
            Invite a friend by entering their Registration Number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="flex flex-col gap-4 py-4">
          <Input 
            placeholder="e.g. 21BCE0000" 
            value={regNo}
            onChange={(e) => setRegNo(e.target.value.toUpperCase())}
            maxLength={9}
            className="uppercase font-mono tracking-widest text-center"
          />
          <Button type="submit" disabled={isSending || regNo.length !== 9} className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            {isSending ? "Searching & Sending..." : "Send Invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
