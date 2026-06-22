"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { UserMenu } from "./user-menu";

export function AuthDialog() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      // Force account selection to prevent auto-login with wrong accounts
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check domain restriction
      if (!user.email?.endsWith("@vitapstudent.ac.in")) {
        await signOut(auth);
        toast.error("Access Denied", {
          description:
            "Only @vitapstudent.ac.in email addresses are allowed to collaborate.",
        });
        setIsLoading(false);
        return;
      }

      // Extract Registration Number
      let regNo = "";
      let batchYear = "";

      if (user.email?.endsWith("@vitapstudent.ac.in")) {
        const emailLocalPart = user.email.split("@")[0];
        const nameParts = emailLocalPart.split(".");
        regNo = nameParts[nameParts.length - 1].toUpperCase();
        batchYear = regNo.substring(0, 2);
      } else {
        // Fallback for personal testing accounts
        regNo = "TEST" + Math.floor(1000 + Math.random() * 9000);
        batchYear = "99";
      }

      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // First time login - save profile
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          registrationNumber: regNo,
          batchYear: batchYear,
          createdAt: new Date(),
          onboardingComplete: false,
          privacySettings: {
            displayIdentity: "full_name", // 'full_name' or 'reg_no'
            discoverable: true,
            showPresence: true,
            allowExport: true,
          },
        });
        toast.success("Welcome to FFCS MATE Collaboration!", {
          description: `Logged in as ${regNo}`,
        });
      } else {
        toast.success("Welcome back!", {
          description: "Ready to collaborate.",
        });
      }

      setIsOpen(false);
    } catch (error: any) {
      // Firebase throws this if the user simply clicks the 'X' on the Google Login popup
      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        // Silently ignore. Do NOT console.error this or Next.js will show a scary red screen in Dev mode!
        return;
      }

      console.error("Firebase Auth Error:", error);
      toast.error("Authentication Failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <UserMenu />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isHomePage ? (
          <Button
            variant="outline"
            className="flex rounded-xl font-semibold bg-background hover:bg-muted/50 border-border w-full sm:w-auto"
          >
            Sign In
          </Button>
        ) : (
          <Button
            variant="default"
            className="flex rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/20 transition-all duration-300 w-full sm:w-auto"
          >
            ✨ Collaborate with Friends
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-extrabold tracking-tight">
            Hold up! Before you enter...
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-2">
            This is an independent, student-built tool to help us navigate
            course registration. To keep this site alive and useful, you must
            agree to the ground rules.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-2">
          <ul className="space-y-3 text-sm text-foreground/90 font-medium">
            <li className="flex items-start">
              <span className="mr-2 text-purple-500">•</span>I will only use my
              @vitapstudent.ac.in email address to verify my student status.
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-purple-500">•</span>I consent to FFCS
              Mate securely storing my Name, Email, and Registration Number for
              collaboration.
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-purple-500">•</span>I will not use
              bots, scripts, or spam the collaboration rooms.
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-purple-500">•</span>I understand this
              platform is completely unaffiliated with VIT-AP.
            </li>
          </ul>

          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            If people abuse the system, the site gets taken down. Let's protect
            this resource for everyone.
          </p>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 mt-4 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/5 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <span className="animate-pulse">Connecting...</span>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 bg-white rounded-full p-0.5"
                  aria-hidden="true"
                >
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                I Agree & Sign In
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
