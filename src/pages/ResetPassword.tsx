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
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onFormSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      toast({
        title: 'Invalid reset link',
        description: 'Missing reset token.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiRepository.resetPasswordConfirm(token, data.password);
      toast({
        title: 'Password updated',
        description: 'Your password has been reset successfully.'
      });
      navigate('/signin');
    } catch (err: any) {
      toast({
        title: 'Reset failed',
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
          <div className="h-14 w-14 flex items-center justify-center mb-6">
            <img src="/aisi-logo-color.svg" alt="ENSIA Research Hub Logo" className="h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[#173C7E]">Reset password</h1>
          <p className="text-sm md:text-base mt-2" style={{ color: '#64748B' }}>Choose a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="rounded-2xl bg-white p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] flex flex-col gap-5 border border-slate-100">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className={errors.password ? 'border-destructive' : ''}
              {...register('password')}
              autoComplete="new-password"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className={errors.confirmPassword ? 'border-destructive' : ''}
              {...register('confirmPassword')}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-11 mt-2 rounded-lg font-semibold transition-all hover:brightness-110"
            style={{ background: '#F47A1E', color: '#fff' }}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
            Reset password
          </Button>

          <p className="text-sm text-center mt-2" style={{ color: '#64748B' }}>
            Back to{' '}
            <a href="/signin" style={{ color: '#F47A1E' }} className="font-semibold hover:underline">Sign in</a>
          </p>
        </form>
      </motion.div>
      </div>
    </PublicLayout>
  );
};

export default ResetPassword;

