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
        toast({ title: 'Account created', description: 'Please complete teacher profile details.' });
        navigate('/complete-registration', {
          replace: true,
          state: { role: 'TEACHER' },
        });
      } else {
        toast({ title: 'Account created', description: 'Welcome to ENSIA Research Hub!' });
        navigate('/dashboard', { replace: true });
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
      navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-auto mb-4">
            <img src="/logo.svg" alt="ENSIA Research Hub Logo" className="h-full w-auto" />
          </div>
          <h1 className="text-xl font-display font-semibold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join ENSIA Research Hub</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
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
              className="w-full h-11"
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

          <p className="text-xs text-muted-foreground text-center mt-6">
            Already have an account?{' '}
            <a href="/signin" className="text-primary hover:underline font-medium">Sign in</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;