"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function PrivacyOnboarding() {
  const { user, userData, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    displayIdentity: "full_name",
    discoverable: true,
    showPresence: true,
    allowExport: true,
  });

  useEffect(() => {
    if (!loading && user && userData && userData.onboardingComplete === false) {
      setIsOpen(true);
    }
  }, [user, userData, loading]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-privacy-settings', handleOpen);
    return () => window.removeEventListener('open-privacy-settings', handleOpen);
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        privacySettings: settings,
        onboardingComplete: true,
      });
      toast.success("Privacy settings saved!", {
        description: "You can change these anytime in your profile settings.",
      });
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Failed to save settings", {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Force modal to stay open if onboarding is not complete
      if (userData?.onboardingComplete === false && !open) return;
      setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-md pointer-events-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to Collaboration!</DialogTitle>
          <DialogDescription>
            Before you join or create a room, let's configure your privacy settings. Your privacy is our top priority.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">How should others see you?</Label>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center space-x-3 border p-3 rounded-md cursor-pointer transition-colors ${settings.displayIdentity === "full_name" ? "border-purple-500 bg-purple-500/5" : "hover:bg-muted/50"}`}>
                <input 
                  type="radio" 
                  name="identity" 
                  value="full_name" 
                  checked={settings.displayIdentity === "full_name"}
                  onChange={() => setSettings({...settings, displayIdentity: "full_name"})}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Show Full Name</span>
                  <span className="text-xs text-muted-foreground">e.g. "{userData?.name || "John Doe"}"</span>
                </div>
              </label>
              
              <label className={`flex items-center space-x-3 border p-3 rounded-md cursor-pointer transition-colors ${settings.displayIdentity === "reg_no" ? "border-purple-500 bg-purple-500/5" : "hover:bg-muted/50"}`}>
                <input 
                  type="radio" 
                  name="identity" 
                  value="reg_no" 
                  checked={settings.displayIdentity === "reg_no"}
                  onChange={() => setSettings({...settings, displayIdentity: "reg_no"})}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Show Registration Number Only</span>
                  <span className="text-xs text-muted-foreground">e.g. "{userData?.registrationNumber || "21BCEXXXX"}"</span>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Additional Settings</Label>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-4">
                <Label htmlFor="discoverable" className="cursor-pointer">Discoverable</Label>
                <span className="text-xs text-muted-foreground">Allow friends to send you room requests using your Registration Number.</span>
              </div>
              <Switch 
                id="discoverable" 
                checked={settings.discoverable}
                onCheckedChange={(c) => setSettings({...settings, discoverable: c})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-4">
                <Label htmlFor="presence" className="cursor-pointer">Show Online Status</Label>
                <span className="text-xs text-muted-foreground">Display a green dot when you are actively viewing a room.</span>
              </div>
              <Switch 
                id="presence" 
                checked={settings.showPresence}
                onCheckedChange={(c) => setSettings({...settings, showPresence: c})}
              />
            </div>

          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:opacity-90 transition-all duration-300">
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
