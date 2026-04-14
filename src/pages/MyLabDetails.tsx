import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRepository } from '@/repositories/apiRepository';
import type { ResearchLab, ResearchGroup, User } from '@/types';
import { User as UserIcon, Building2, ChevronRight, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MyLabDetails = () => {
  const { labId } = useParams<{ labId: string }>();
  const [lab, setLab] = useState<ResearchLab | null>(null);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [headUser, setHeadUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!labId) return;
    const load = async () => {
      try {
        const numericLabId = parseInt(labId);
        // Authorization check for this scoped page.
        await apiRepository.getLabAdmins(numericLabId);

        const labData = await apiRepository.getLab(numericLabId);
        setLab(labData);

        const [groupsData, userData] = await Promise.all([
          apiRepository.getGroups(numericLabId),
          apiRepository.getUser(labData.head_teacher_id)
        ]);

        setGroups(groupsData);
        setHeadUser(userData);
      } catch (e) {
        console.error('MyLabDetails load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [labId]);

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lab) return <div className="container py-20 text-center">Laboratory not found.</div>;

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div >
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-6">
          <Link to="/my-labs" className="hover:text-primary transition-colors">My Labs</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{lab.name}</span>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background rounded-3xl border border-border p-8 md:p-12 mb-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <img src="/logo_small.svg" alt="" className="w-[200px] h-[200px] object-contain" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-lg shadow-primary/5">
              <img src="/logo_small.svg" alt="Lab" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
              {lab.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {lab.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border shadow-sm">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-mono">Head of Laboratory</span>
                  <span className="text-sm font-semibold text-foreground">{headUser?.full_name}</span>
                </div>
              </div>

              <Button variant="outline" className="h-auto py-3 px-6 rounded-2xl gap-2 font-medium">
                <Mail className="h-4 w-4" /> Contact
              </Button>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" /> Research Groups
            </h2>
            <span className="text-xs font-mono text-muted-foreground px-3 py-1 bg-muted rounded-full">
              {groups.length} active teams
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Building2 className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {group.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                  {group.description}
                </p>

                <Link to={`/my-labs/groups/${group.id}`} className="inline-flex items-center text-sm font-semibold text-primary hover:underline gap-1.5">
                  View Group Details <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MyLabDetails;
