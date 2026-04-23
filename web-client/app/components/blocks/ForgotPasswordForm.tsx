"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { AlertCircle, CheckCircle, Dog, ArrowLeft } from "lucide-react";
import { Link, Form } from "react-router";
import { useState } from "react";

interface ForgotPasswordFormProps {
  error?: string;
  success?: boolean;
  isSubmitting?: boolean;
}

export function ForgotPasswordForm({ error, success, isSubmitting }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const validateEmail = (email: string) => {
    if (!email) return "Please enter your email address";
    if (!email.includes("@")) return "That doesn't look like a valid email. Did you forget the @?";
    if (!email.includes(".")) return "Please include a domain (like .com or .org)";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return null;
  };

  const emailError = touched ? validateEmail(email) : null;

  if (success) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-coral relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-coral to-coral-dark" />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
            <Dog className="size-24 mb-8" />
            <h1 className="text-4xl font-bold mb-4">Check Your Email</h1>
            <p className="text-xl text-white/80 text-center max-w-md">
              We've sent you instructions to reset your password.
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
              <h2 className="text-3xl font-bold text-foreground">Check your email</h2>
              <p className="mt-4 text-muted-foreground">
                If an account with that email exists, we've sent a password reset link.
                Please check your inbox and spam folder.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-coral hover:underline font-medium"
            >
              <ArrowLeft className="size-4" />
              Back to sign in
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
          <h1 className="text-4xl font-bold mb-4">Forgot Password?</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            No worries! Enter your email and we'll send you a reset link.
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
              Reset your password
            </h2>
            <p className="mt-2 text-muted-foreground">
              Enter the email associated with your account and we'll send you a link to reset your password.
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
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className={`h-12 text-base ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {emailError && (
                <p className="text-sm text-destructive">
                  {emailError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-coral hover:bg-coral-dark text-white rounded-lg"
              disabled={isSubmitting || !!emailError}
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="inline-flex items-center gap-1 text-coral hover:underline font-medium">
              <ArrowLeft className="size-3" />
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
