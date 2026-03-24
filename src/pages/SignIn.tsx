import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { authProvider } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { hashPassword } from '@/lib/passwordUtils';

const signInSchema = z.object({
  email: z.string().email('Invalid email address').endsWith('@ensia.edu.dz', 'Must be an ENSIA email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

const SignIn = () => {
  const { signInWithGoogle, isLoading, isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const onFormSubmit = async (data: SignInValues) => {
    setSubmitting(true);
    try {
      const hashedPassword = await hashPassword(data.password);
      await authProvider.login({ email: data.email, password: hashedPassword });
      await checkAuth(); // refresh auth context from the new session cookie
      navigate('/dashboard', { replace: true });
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to ENSIA Research Hub</p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@ensia.edu.dz"
              className={errors.email ? 'border-destructive' : ''}
              {...register('email')}
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className={errors.password ? 'border-destructive' : ''}
              {...register('password')}
              autoComplete="current-password"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-11 mt-1"
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

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => signInWithGoogle()}
            disabled={submitting || isLoading}
            type="button"
          >
            Google
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary hover:underline">Sign up</a>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default SignIn;