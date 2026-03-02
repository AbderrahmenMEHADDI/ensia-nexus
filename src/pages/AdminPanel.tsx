import { useState } from 'react';
import { motion } from 'framer-motion';
import { users, researchGroups, getUserById, getGroupById, getLabById } from '@/data/mockData';
import { RoleBadge } from '@/components/Badges';
import type { ResearchGroup, User } from '@/types';
import { Shield, Users, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';

const AdminPanel = () => {
  const [localGroups, setLocalGroups] = useState<ResearchGroup[]>([...researchGroups]);
  const [userSearch, setUserSearch] = useState('');

  const pendingGroups = localGroups.filter(g => !g.is_validated);
  const validatedGroups = localGroups.filter(g => g.is_validated);

  const filteredUsers = userSearch
    ? users.filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const handleValidate = (groupId: number) => {
    setLocalGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, is_validated: true, validated_by_admin_id: 5, validated_at: new Date().toISOString() }
          : g
      )
    );
  };

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Administration</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Admin Panel</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Group Validation */}
          <div>
            <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pending Validation ({pendingGroups.length})
            </h2>
            {pendingGroups.length === 0 ? (
              <div className="p-6 rounded-xl border border-border bg-card text-center text-muted-foreground text-sm">
                All groups validated ✓
              </div>
            ) : (
              <div className="space-y-3">
                {pendingGroups.map(group => {
                  const leader = getUserById(group.leader_user_id);
                  const lab = getLabById(group.lab_id);
                  return (
                    <div key={group.id} className="p-4 rounded-xl border border-primary/20 bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-foreground">{group.name}</h3>
                          <span className="text-xs font-mono text-muted-foreground">{lab?.name.split('—')[0]?.trim()}</span>
                        </div>
                        <button
                          onClick={() => handleValidate(group.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium hover:bg-success/25 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Validate
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <span>Led by {leader?.full_name}</span>
                        {leader && <RoleBadge role={leader.role} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <h2 className="text-xl font-serif font-semibold text-foreground mt-8 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Validated Groups ({validatedGroups.length})
            </h2>
            <div className="space-y-2">
              {validatedGroups.map(group => {
                const leader = getUserById(group.leader_user_id);
                return (
                  <div key={group.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">{group.name}</span>
                      <span className="text-xs font-mono text-muted-foreground ml-2">by {leader?.full_name}</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Management */}
          <div>
            <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Users ({users.length})
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div key={user.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground block">{user.full_name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
