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
import { PublicLayout } from '@/components/layout/PublicLayout';

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
    <PublicLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-20 bg-[#F8FAFC]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-xl bg-[#F37F20] flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
            <img src="/logo_small.svg" alt="ENSIA Research Hub Logo" className="h-8 w-8 brightness-0 invert" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[#074a75]">Forgot password</h1>
          <p className="text-sm md:text-base mt-2" style={{ color: '#64748B' }}>Enter your ENSIA email to get a reset link</p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="rounded-2xl bg-white p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] flex flex-col gap-5 border border-slate-100">
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
            className="w-full h-11 mt-2 rounded-lg font-semibold transition-all hover:brightness-110"
            style={{ background: '#F37F20', color: '#fff' }}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
            Send reset link
          </Button>

          <p className="text-sm text-center mt-2" style={{ color: '#64748B' }}>
            Remembered your password?{' '}
            <a href="/signin" style={{ color: '#F37F20' }} className="font-semibold hover:underline">Sign in</a>
          </p>
        </form>
      </motion.div>
      </div>
    </PublicLayout>
  );
};

export default ForgotPassword;