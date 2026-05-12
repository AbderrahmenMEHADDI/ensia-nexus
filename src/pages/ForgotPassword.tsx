import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRepository } from '@/repositories/apiRepository';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onFormSubmit = async (data: ForgotPasswordValues) => {
    setSubmitting(true);
    try {
      const res = await apiRepository.forgetPassword(data.email);
      toast({
        title: 'Email sent',
        description: res.message || 'If the email exists, a reset link has been sent.'
      });
    } catch (err: any) {
      toast({
        title: 'Request failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-auto mb-4">
            <img src="/logo.svg" alt="ENSIA Research Hub Logo" className="h-full w-auto" />
          </div>
          <h1 className="text-xl font-display font-semibold text-foreground">Forgot password</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your ENSIA email to get a reset link</p>
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

          <Button
            type="submit"
            className="w-full h-11 mt-1"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
            Send reset link
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Remembered your password?{' '}
            <a href="/signin" className="text-primary hover:underline">Sign in</a>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;