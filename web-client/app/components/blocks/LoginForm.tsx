"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Eye, EyeOff, AlertCircle, Dog } from "lucide-react";
import { Link, Form } from "react-router";
import { useState } from "react";

interface LoginFormProps {
  error?: string;
  isSubmitting?: boolean;
}

export function LoginForm({ error, isSubmitting }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  // Validation helpers
  const validateEmail = (email: string) => {
    if (!email) return "Please enter your email address";
    if (!email.includes("@")) return "That doesn't look like a valid email. Did you forget the @?";
    if (!email.includes(".")) return "Please include a domain (like .com or .org)";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Please enter your password";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  };

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-coral relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral to-coral-dark" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <Dog className="size-24 mb-8" />
          <h1 className="text-4xl font-bold mb-4">Welcome to Petch</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Find your perfect furry companion. Swipe, match, and adopt.
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
              Sign in
            </h2>
            <p className="mt-2 text-muted-foreground">
              Welcome back! Please enter your details.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Oops! Something went wrong</p>
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
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                className={`h-12 text-base ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {emailError && (
                <p className="text-sm text-destructive">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`h-12 text-base pr-12 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  required
                  placeholder="Enter your password"
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
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">
                  {passwordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-coral hover:bg-coral-dark text-white rounded-lg"
              disabled={isSubmitting || !!emailError || !!passwordError}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-coral hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
