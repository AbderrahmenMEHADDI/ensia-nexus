import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, User as UserIcon, Mail, Lock, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '@/lib/googleAuth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PublicLayout } from '@/components/layout/PublicLayout';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'TEACHER']),
});

type SignUpValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const { signInWithGoogle, signUp, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const googleLoginContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'STUDENT',
    },
  });

  const selectedRole = watch('role');

  const onFormSubmit = async (data: SignUpValues) => {
    setSubmitting(true);
    try {
      await signUp({
        email: data.email,
        full_name: data.fullName,
        password: data.password,
      });
      if (data.role === 'TEACHER') {
        toast({ title: 'Account created', description: 'Please complete teacher profile details. A verification email has also been sent.' });
        navigate('/complete-registration', {
          replace: true,
          state: { role: 'TEACHER' },
        });
      } else {
        toast({ title: 'Account created', description: 'Welcome! Please check your email to verify your account.' });
        navigate('/projects', { replace: true });
      }
    } catch (err: any) {
      toast({
        title: 'Sign up failed',
        description: err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignUpSuccess = async (credentialResponse: { credential?: string }) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      toast({
        title: 'Google sign-up failed',
        description: 'No Google token received',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await signInWithGoogle(idToken);
      toast({ title: 'Signed in with Google', description: 'Welcome to ENSIA Research Hub!' });
      navigate('/projects', { replace: true });
    } catch (err: any) {
      toast({
        title: 'Google sign-up failed',
        description: err?.message || 'Unable to continue with Google',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignUpError = () => {
    toast({
      title: 'Google sign-up failed',
      description: 'Unable to continue with Google',
      variant: 'destructive',
    });
  };

  const triggerGoogleSignUp = () => {
    const googleButton = googleLoginContainerRef.current?.querySelector('div[role="button"]') as HTMLElement | null;

    if (!googleButton) {
      toast({
        title: 'Google sign-up unavailable',
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
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[#173C7E] mb-3">Create your account</h1>
          <p className="text-base text-slate-500 leading-relaxed">Join ENSIA Nexus to start collaborating on high-impact research projects with the brightest minds.</p>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">

        <div className="rounded-2xl bg-white p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-100">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  className={`pl-10 ${errors.fullName ? 'border-destructive' : ''}`}
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@ensia.edu.dz"
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(v: any) => setValue('role', v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select your role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Professor / Researcher</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 rounded-lg font-semibold transition-all hover:brightness-110"
              style={{ background: '#F47A1E', color: '#fff' }}
              disabled={submitting || isLoading}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : null}
              Create Account
            </Button>
          </form>

          <div className="relative my-6">
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
                  onSuccess={onGoogleSignUpSuccess}
                  onError={onGoogleSignUpError}
                  useOneTap={false}
                />
              </div>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={triggerGoogleSignUp}
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
                  description: 'Set VITE_GOOGLE_CLIENT_ID before using Google sign-up.',
                  variant: 'destructive',
                });
              }}
              disabled={submitting || isLoading}
              type="button"
            >
              Google
            </Button>
          )}

          <p className="text-sm text-center mt-6" style={{ color: '#64748B' }}>
            Already have an account?{' '}
            <a href="/signin" style={{ color: '#F47A1E' }} className="font-semibold hover:underline">Sign in</a>
          </p>
        </div>
      </motion.div>
      </div>
    </PublicLayout>
  );
};

export default SignUp;