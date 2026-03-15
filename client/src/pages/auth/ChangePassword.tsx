import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { sileo } from 'sileo';
import api from '@/api/axiosInstance';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const schema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ChangePassword() {
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // If no token, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If password change is NOT required, redirect to dashboard
  if (!user.mustChangePassword) {
    return <Navigate to="/dashboard" replace />;
  }

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.patch('/auth/change-password', {
        newPassword: data.newPassword
      });
      
      // Update auth store with new token and updated user object
      setAuth(res.data.token, res.data.user);
      
      sileo.success({ 
        title: 'Password Updated', 
        description: 'Your new password has been set. You can now access the system.' 
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      sileo.error({ 
        title: 'Update Failed', 
        description: err.response?.data?.message || 'Could not update password. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-[hsl(var(--primary))]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--primary))]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Secure Your Account</CardTitle>
          <CardDescription>
            For your security, you are required to change your temporary password before continuing.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="pl-10 pr-10"
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs font-medium text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="pl-10"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="rounded-lg bg-muted p-3 text-[11px] text-muted-foreground leading-relaxed">
              <p className="font-bold mb-1 uppercase opacity-70">Password Requirements:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Minimum 8 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Security...
                </>
              ) : (
                'Update Password & Continue'
              )}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-xs h-8"
              onClick={() => { clearAuth(); navigate('/login'); }}
            >
              Sign out and try later
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
