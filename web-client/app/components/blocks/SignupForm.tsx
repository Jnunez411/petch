"use client";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Eye, EyeOff, AlertCircle, CheckCircle, Dog } from "lucide-react";
import { Link, Form } from "react-router";
import { useState } from "react";

interface SignupFormProps {
  error?: string;
  isSubmitting?: boolean;
}

export function SignupForm({ error, isSubmitting }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    termsAccepted: false,
  });
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phoneNumber: false,
    password: false,
    terms: false,
  });

  // Human-friendly validation messages
  const validateFirstName = (name: string) => {
    if (!name) return "What's your first name?";
    if (name.length < 2) return "Your name should be at least 2 characters";
    if (!/^[a-zA-Z\s-']+$/.test(name)) return "Please use only letters, spaces, or hyphens";
    return null;
  };

  const validateLastName = (name: string) => {
    if (!name) return "What's your last name?";
    if (name.length < 2) return "Your last name should be at least 2 characters";
    if (!/^[a-zA-Z\s-']+$/.test(name)) return "Please use only letters, spaces, or hyphens";
    return null;
  };

  const validateEmail = (email: string) => {
    if (!email) return "We'll need your email to create your account";
    if (!email.includes("@")) return "That doesn't look like a valid email. Did you forget the @?";
    if (!email.includes(".")) return "Please include a domain (like .com or .org)";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Hmm, this email doesn't look quite right";
    return null;
  };

  const validatePhone = (phone: string) => {
    if (!phone) return null; // Phone is optional
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) return "Phone number should have at least 10 digits";
    if (digitsOnly.length > 15) return "That phone number seems too long";
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Please create a password";
    if (password.length < 8) return `Just ${8 - password.length} more character${8 - password.length === 1 ? '' : 's'} needed!`;
    return null;
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Weak - consider adding numbers or symbols", color: "bg-red-500" };
    if (strength <= 3) return { strength, label: "Getting better!", color: "bg-yellow-500" };
    if (strength <= 4) return { strength, label: "Strong password!", color: "bg-green-500" };
    return { strength, label: "Excellent! Very secure", color: "bg-green-600" };
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const firstNameError = touched.firstName ? validateFirstName(formData.firstName) : null;
  const lastNameError = touched.lastName ? validateLastName(formData.lastName) : null;
  const emailError = touched.email ? validateEmail(formData.email) : null;
  const phoneError = touched.phoneNumber ? validatePhone(formData.phoneNumber) : null;
  const passwordError = touched.password ? validatePassword(formData.password) : null;
  const passwordStrength = getPasswordStrength(formData.password);

  const hasErrors = firstNameError || lastNameError || emailError || phoneError || passwordError;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-coral relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral to-coral-dark" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <Dog className="size-24 mb-8" />
          <h1 className="text-4xl font-bold mb-4">Join Petch</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Start your journey to find the perfect pet companion today.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-950 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="size-16 rounded-2xl bg-coral flex items-center justify-center mb-4">
              <Dog className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">
              Create account
            </h2>
            <p className="mt-2 text-muted-foreground">
              Join thousands finding their perfect pet match.
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

          <Form method="post" className="space-y-5">
            {/* User Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="userType" className="text-sm font-medium">I am a...</Label>
              <Select name="userType" defaultValue="ADOPTER">
                <SelectTrigger id="userType" className="h-12">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADOPTER">
                    <span>Pet Adopter - Looking for a pet</span>
                  </SelectItem>
                  <SelectItem value="VENDOR">
                    <span>Vendor - Breeder or Shelter</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                  className={`h-12 ${firstNameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {firstNameError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {firstNameError}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  className={`h-12 ${lastNameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {lastNameError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {lastNameError}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={`h-12 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {emailError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Phone (Optional)
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                onBlur={() => handleBlur("phoneNumber")}
                className={`h-12 ${phoneError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {phoneError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {phoneError}
                </p>
              )}
              {!phoneError && formData.phoneNumber && touched.phoneNumber && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Looks good!
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`h-12 pr-12 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
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
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {passwordError}
                </p>
              )}
              {/* Password strength indicator */}
              {formData.password && !passwordError && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${level <= passwordStrength.strength
                          ? passwordStrength.color
                          : "bg-gray-200"
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                required
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => {
                  handleChange("termsAccepted", checked as boolean);
                  handleBlur("terms");
                }}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                I agree to the{" "}
                <Link to="/terms" className="text-coral hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-coral hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-coral hover:bg-coral-dark text-white rounded-lg"
              disabled={isSubmitting || !!hasErrors}
            >
              {isSubmitting ? "Creating account..." : "Create free account"}
            </Button>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-coral hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
