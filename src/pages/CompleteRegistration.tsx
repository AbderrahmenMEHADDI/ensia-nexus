import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, UserCircle, Briefcase, Building2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const completeRegistrationSchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER']),
  experienceYears: z.number().min(0, 'Experience years must be 0 or more').optional(),
  grade: z.enum(['MCA', 'PROFESSOR', 'DOCTOR', 'RESEARCHER']).optional(),
  department: z.string().optional(),
  researchInterests: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role !== 'TEACHER') return;

  if (data.experienceYears === undefined || Number.isNaN(data.experienceYears)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['experienceYears'],
      message: 'Experience years is required for teachers',
    });
  }

  if (!data.grade) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['grade'],
      message: 'Grade is required for teachers',
    });
  }

  if (!data.department?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['department'],
      message: 'Department is required for teachers',
    });
  }

  if (!data.researchInterests?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['researchInterests'],
      message: 'Research interests are required for teachers',
    });
  }
});

type CompleteRegistrationValues = z.infer<typeof completeRegistrationSchema>;

const CompleteRegistration = () => {
  const { completeRegistration, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const forcedRole = (location.state as { role?: 'STUDENT' | 'TEACHER' } | null)?.role;
  const isTeacherFlow = forcedRole === 'TEACHER';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CompleteRegistrationValues>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      role: forcedRole || (user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT'),
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: CompleteRegistrationValues) => {
    setSubmitting(true);
    try {
      await completeRegistration({
        role: data.role,
        ...(data.role === 'TEACHER'
          ? {
            experience_years: data.experienceYears,
            grade: data.grade,
            department: data.department?.trim(),
            research_interests: data.researchInterests?.trim(),
          }
          : {}),
      });
      toast({ title: 'Registration completed', description: 'Your profile has been updated.' });
      navigate('/projects', { replace: true });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
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
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-auto mb-4">
            <img src="/logo.svg" alt="ENSIA Research Hub Logo" className="h-full w-auto" />
          </div>
          <h1 className="text-xl font-display font-semibold text-foreground">Complete Registration</h1>
          <p className="text-sm text-muted-foreground mt-1">Finish setting up your ENSIA profile</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isTeacherFlow && (
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
            )}

            {selectedRole === 'TEACHER' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Experience Years</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="experienceYears"
                      type="number"
                      min={0}
                      placeholder="5"
                      className={`pl-10 ${errors.experienceYears ? 'border-destructive' : ''}`}
                      {...register('experienceYears', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.experienceYears && <p className="text-xs text-destructive">{errors.experienceYears.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select
                    value={watch('grade')}
                    onValueChange={(v: any) => setValue('grade', v, { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select your grade" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="PROFESSOR">Professor</SelectItem>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="RESEARCHER">Researcher</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.grade && <p className="text-xs text-destructive">{errors.grade.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="department"
                      placeholder="Computer Science"
                      className={`pl-10 ${errors.department ? 'border-destructive' : ''}`}
                      {...register('department')}
                    />
                  </div>
                  {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="researchInterests">Research Interests</Label>
                  <div className="relative">
                    <FlaskConical className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="researchInterests"
                      placeholder="AI, Data Science, NLP"
                      className={`pl-10 ${errors.researchInterests ? 'border-destructive' : ''}`}
                      {...register('researchInterests')}
                    />
                  </div>
                  {errors.researchInterests && <p className="text-xs text-destructive">{errors.researchInterests.message}</p>}
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={submitting || isLoading}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : null}
              Save and Continue
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteRegistration;
