import { motion } from 'framer-motion';
import { useState } from 'react';
import { currentUser } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LogOut, Moon, Sun } from 'lucide-react';

const Settings = () => {
  const { signOut } = useAuth();
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-display font-semibold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account preferences.</p>

        {/* Profile */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Profile</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={currentUser.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Managed by your Google account.</p>
            </div>
            <Button size="sm" className="mt-2">Save Changes</Button>
          </div>
        </section>

        {/* Notifications */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Notifications</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Receive email updates about your projects.</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Task reminders</p>
                <p className="text-xs text-muted-foreground">Get notified about upcoming due dates.</p>
              </div>
              <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Application updates</p>
                <p className="text-xs text-muted-foreground">Notifications when your applications are reviewed.</p>
              </div>
              <Switch checked={applicationUpdates} onCheckedChange={setApplicationUpdates} />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Appearance</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Dark mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark theme.</p>
                </div>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Account</h2>
          <div className="rounded-xl border border-destructive/20 bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out</p>
                <p className="text-xs text-muted-foreground">Sign out of your account on this device.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default Settings;
