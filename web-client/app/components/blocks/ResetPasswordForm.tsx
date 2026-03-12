"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Eye, EyeOff, AlertCircle, CheckCircle, Dog } from "lucide-react";
import { Link, Form } from "react-router";
import { useState } from "react";

interface ResetPasswordFormProps {
  token: string;
  error?: string;
  success?: boolean;
  isSubmitting?: boolean;
}

export function ResetPasswordForm({ token, error, success, isSubmitting }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });

  const validatePassword = (password: string) => {
    if (!password) return "Please enter a new password";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter";
    if (!/\d/.test(password)) return "Must contain at least one number";
    if (!/[@$!%*?&]/.test(password)) return "Must contain at least one special character (@$!%*?&)";
    return null;
  };

  const validateConfirm = (confirm: string) => {
    if (!confirm) return "Please confirm your password";
    if (confirm !== password) return "Passwords don't match";
    return null;
  };

  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmError = touched.confirm ? validateConfirm(confirmPassword) : null;

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*?&]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Very weak", "Weak", "Fair", "Good", "Strong"];

  if (success) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-coral relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-coral to-coral-dark" />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
            <Dog className="size-24 mb-8" />
            <h1 className="text-4xl font-bold mb-4">Password Reset!</h1>
            <p className="text-xl text-white/80 text-center max-w-md">
              Your password has been successfully updated.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="flex justify-center">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Password updated</h2>
              <p className="mt-4 text-muted-foreground">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full h-12 text-base bg-coral hover:bg-coral-dark text-white rounded-lg font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-coral relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral to-coral-dark" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <Dog className="size-24 mb-8" />
          <h1 className="text-4xl font-bold mb-4">New Password</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Choose a strong password to keep your account secure.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="size-16 rounded-2xl bg-coral flex items-center justify-center mb-4">
              <Dog className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">
              Set new password
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your new password must be different from your previous password.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Something went wrong</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <Form method="post" className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  className={`h-12 text-base pr-12 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  required
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              {/* Password strength bar */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < strength ? strengthColors[strength - 1] : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strengthLabels[strength - 1] || "Too short"}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  className={`h-12 text-base pr-12 ${confirmError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {confirmError && (
                <p className="text-sm text-destructive">{confirmError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-coral hover:bg-coral-dark text-white rounded-lg"
              disabled={isSubmitting || !!passwordError || !!confirmError || !password || !confirmPassword}
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/login" className="text-coral hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
