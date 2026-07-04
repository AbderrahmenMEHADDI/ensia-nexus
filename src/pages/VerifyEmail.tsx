import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  const handleGoToDashboard = async () => {
    setNavigating(true);
    // Refresh the auth context so the updated is_email_verified=true
    // is reflected before the ProtectedRoute guard checks it.
    await checkAuth();
    navigate('/projects', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white shadow rounded-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Verifying your email...</h2>
            <p className="text-gray-500">Please wait while we verify your email address.</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-green-600">Email Verified!</h2>
            <p className="text-gray-500 mb-6">Your email has been successfully verified.</p>
            <Button onClick={handleGoToDashboard} disabled={navigating}>
              {navigating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : 'Go to Dashboard'}
            </Button>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Failed</h2>
            <p className="text-gray-500 mb-6">The verification link is invalid or has expired.</p>
            <Button onClick={() => navigate('/signin')}>Go to Sign In</Button>
          </div>
        )}
      </div>
    </div>
  );
}
