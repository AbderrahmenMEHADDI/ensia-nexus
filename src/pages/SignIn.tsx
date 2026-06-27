import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '@/lib/googleAuth';
import { PublicLayout } from '@/components/layout/PublicLayout';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

const SignIn = () => {
  const { signIn, signInWithGoogle, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const googleLoginContainerRef = useRef<HTMLDivElement | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/projects';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFormSubmit = async (data: SignInValues) => {
    setSubmitting(true);
    try {
      await signIn({ email: data.email, password: data.password });
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/projects';
      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.message || 'Invalid credentials',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignInSuccess = async (credentialResponse: { credential?: string }) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      toast({
        title: 'Google login failed',
        description: 'No Google token received',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await signInWithGoogle(idToken);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/projects';
      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast({
        title: 'Google login failed',
        description: err?.message || 'Unable to sign in with Google',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignInError = () => {
    toast({
      title: 'Google login failed',
      description: 'Unable to sign in with Google',
      variant: 'destructive',
    });
  };

  const triggerGoogleLogin = () => {
    const googleButton = googleLoginContainerRef.current?.querySelector('div[role="button"]') as HTMLElement | null;

    if (!googleButton) {
      toast({
        title: 'Google login unavailable',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    googleButton.click();
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 py-12 bg-[#F8FAFC] gap-12 md:gap-24">
        {/* Left Side: Logo & Text */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm">
          <div className="h-16 w-16 flex items-center justify-center mb-6">
            <img src="/aisi-logo-color.svg" alt="ENSIA Research Hub Logo" className="h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[#173C7E] mb-3">Welcome back</h1>
          <p className="text-base text-slate-500 leading-relaxed">Sign in to ENSIA Nexus to access your research projects, connect with your lab, and discover new opportunities.</p>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">

        <form onSubmit={handleSubmit(onFormSubmit)} className="rounded-2xl bg-white p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] flex flex-col gap-5 border border-slate-100">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@ensia.edu.dz" className={errors.email ? 'border-destructive' : ''} {...register('email')} autoComplete="email" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" className={errors.password ? 'border-destructive' : ''} {...register('password')} autoComplete="current-password" />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <p className="text-xs text-right -mt-1">
            <a href="/forgot-password" style={{ color: '#F47A1E' }} className="font-medium hover:underline">Forgot password?</a>
          </p>

          <Button
            type="submit"
            className="w-full h-11 mt-2 rounded-lg font-semibold transition-all hover:brightness-110"
            style={{ background: '#F47A1E', color: '#fff' }}
            disabled={submitting || isLoading}
          >
            {submitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
            Sign In
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {GOOGLE_CLIENT_ID ? (
            <>
              <div
                ref={googleLoginContainerRef}
                className="absolute pointer-events-none opacity-0 h-0 overflow-hidden"
                aria-hidden="true"
              >
                <GoogleLogin
                  onSuccess={onGoogleSignInSuccess}
                  onError={onGoogleSignInError}
                  useOneTap={false}
                />
              </div>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={triggerGoogleLogin}
                disabled={submitting || isLoading}
                type="button"
              >
                Google
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                toast({
                  title: 'Google client ID missing',
                  description: 'Set VITE_GOOGLE_CLIENT_ID before using Google sign-in.',
                  variant: 'destructive',
                });
              }}
              disabled={submitting || isLoading}
              type="button"
            >
              Google
            </Button>
          )}

          <p className="text-sm text-center mt-2" style={{ color: '#64748B' }}>
            Don't have an account? <a href="/signup" style={{ color: '#F47A1E' }} className="font-semibold hover:underline">Sign up</a>
          </p>
        </form>
      </motion.div>
      </div>
    </PublicLayout>
  );
};

export default SignIn;
