"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

export function ChangePasswordSection() {
  const fetcher = useFetcher();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({ current: false, new: false, confirm: false });

  const isSubmitting = fetcher.state === "submitting";
  const success = fetcher.data?.success;
  const error = fetcher.data?.error;

  const validateNew = (pwd: string) => {
    if (!pwd) return "Please enter a new password";
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Must contain at least one lowercase letter";
    if (!/\d/.test(pwd)) return "Must contain at least one number";
    if (!/[@$!%*?&]/.test(pwd)) return "Must contain at least one special character (@$!%*?&)";
    return null;
  };

  const validateConfirm = (confirm: string) => {
    if (!confirm) return "Please confirm your password";
    if (confirm !== newPassword) return "Passwords don't match";
    return null;
  };

  const newError = touched.new ? validateNew(newPassword) : null;
  const confirmError = touched.confirm ? validateConfirm(confirmPassword) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || newError || confirmError || !newPassword || !confirmPassword) return;

    fetcher.submit(
      { intent: "change-password", currentPassword, newPassword },
      { method: "POST" }
    );
  };

  // Reset form on success
  useEffect(() => {
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTouched({ current: false, new: false, confirm: false });
    }
  }, [success]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-800/50 px-6 py-5 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
        <Lock className="size-5 text-zinc-500" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Change Password</h2>
      </div>

      <div className="p-6">
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <CheckCircle className="size-4 flex-shrink-0" />
            Password updated successfully.
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle className="size-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, current: true }))}
                placeholder="Enter current password"
                className="h-12 rounded-xl pr-12"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPasswordProfile" className="text-sm font-medium">New Password</Label>
            <div className="relative">
              <Input
                id="newPasswordProfile"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, new: true }))}
                placeholder="Enter new password"
                className={`h-12 rounded-xl pr-12 ${newError ? "border-destructive" : ""}`}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            {newError && <p className="text-sm text-destructive">{newError}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPasswordProfile" className="text-sm font-medium">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPasswordProfile"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
                placeholder="Confirm new password"
                className={`h-12 rounded-xl pr-12 ${confirmError ? "border-destructive" : ""}`}
                required
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
            {confirmError && <p className="text-sm text-destructive">{confirmError}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-coral hover:bg-coral-dark text-white"
            disabled={isSubmitting || !!newError || !!confirmError || !currentPassword || !newPassword || !confirmPassword}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
