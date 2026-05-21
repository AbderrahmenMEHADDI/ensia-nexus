import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRepository } from '@/repositories/apiRepository';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LogOut, Loader2 } from 'lucide-react';

const Settings = () => {
  const { user, signOut, checkAuth } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);

  // Sync state if user loads later
  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiRepository.updateUser(user.id, { full_name: fullName });
      await checkAuth(); // Refresh the user data in context
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your account preferences and settings.</p>
        </div>

        <div className="grid gap-10">
          {/* Profile */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Profile</h2>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="h-11"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled className="h-11 opacity-60 bg-muted" />
                  <p className="text-xs text-muted-foreground">Managed by your institution.</p>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  size="default"
                  className="px-8"
                  onClick={handleSaveProfile}
                  disabled={isSaving || fullName === user?.full_name}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Notifications</h2>
            <div className="rounded-2xl border border-border bg-card shadow-sm divide-y divide-border">
              <div className="flex items-center justify-between p-6 sm:p-8">
                <div className="space-y-1 pr-4">
                  <p className="text-base font-semibold text-foreground">Email notifications</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Receive email updates about your projects.</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} className="data-[state=checked]:bg-primary" />
              </div>
              <div className="flex items-center justify-between p-6 sm:p-8">
                <div className="space-y-1 pr-4">
                  <p className="text-base font-semibold text-foreground">Task reminders</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Get notified about upcoming due dates.</p>
                </div>
                <Switch checked={taskReminders} onCheckedChange={setTaskReminders} className="data-[state=checked]:bg-primary" />
              </div>
              <div className="flex items-center justify-between p-6 sm:p-8">
                <div className="space-y-1 pr-4">
                  <p className="text-base font-semibold text-foreground">Application updates</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Notifications when your applications are reviewed.</p>
                </div>
                <Switch checked={applicationUpdates} onCheckedChange={setApplicationUpdates} className="data-[state=checked]:bg-primary" />
              </div>
            </div>
          </section>

          {/* Account */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Account</h2>
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1 pr-4">
                  <p className="text-base font-semibold text-foreground">Sign out</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Sign out of your account on this device.</p>
                </div>
                <Button variant="destructive" size="default" onClick={signOut} className="gap-2 px-6">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
