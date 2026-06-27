import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, LogOut } from 'lucide-react';

export default function Unverified() {
  const { isAuthenticated, user, isInitialLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);

  if (isInitialLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }

  if (user.is_email_verified) {
    return <Navigate to="/projects" replace />;
  }

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: user.email });
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox and spam folder.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to send email',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="p-8 bg-white shadow-xl rounded-2xl max-w-md w-full text-center border border-slate-100">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
          <Mail className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">Verify your email</h2>
        <p className="text-slate-500 mb-6 leading-relaxed">
          We've sent a verification link to <span className="font-semibold text-slate-800">{user.email}</span>. Please verify your email to access ENSIA Nexus.
        </p>

        <div className="space-y-3">
          <Button 
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors" 
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
