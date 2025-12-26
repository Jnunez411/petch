"use client";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
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
import { Heart, Store, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, Dog } from "lucide-react";
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
    <div className="flex items-center justify-center min-h-screen py-8">
      <div className="w-full max-w-md p-4">
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-col items-center space-y-1.5 pb-4 pt-6">
            <div className="size-14 rounded-xl bg-coral flex items-center justify-center">
              <Dog className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-0.5 flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-foreground">
                Join Petch
              </h2>
              <p className="text-muted-foreground text-center">
                Find your perfect furry companion
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-8">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Oops! Something went wrong</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <Form method="post">
              <div className="space-y-5">
                {/* User Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="userType">I am a...</Label>
                  <Select name="userType" defaultValue="ADOPTER">
                    <SelectTrigger id="userType">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADOPTER">
                        <div className="flex items-center gap-2">
                          <Heart size={16} className="text-coral" />
                          <span>Pet Adopter - Looking for a pet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="VENDOR">
                        <div className="flex items-center gap-2">
                          <Store size={16} className="text-teal" />
                          <span>Vendor - Breeder or Shelter</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
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
                      className={firstNameError ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {firstNameError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {firstNameError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      required
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      onBlur={() => handleBlur("lastName")}
                      className={lastNameError ? "border-destructive focus-visible:ring-destructive" : ""}
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
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
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
                    className={`${emailError ? "border-destructive focus-visible:ring-destructive" : ""} ${!emailError && formData.email ? "bg-zinc-300 border-zinc-400" : ""}`}
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
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
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
                    className={phoneError ? "border-destructive focus-visible:ring-destructive" : ""}
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
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={`pr-10 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
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
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
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
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-coral hover:bg-coral-dark text-white"
                  disabled={isSubmitting || !!hasErrors}
                >
                  {isSubmitting ? "Creating account..." : "Create free account"}
                </Button>
              </div>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-coral hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
