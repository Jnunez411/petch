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
import { PawIcon } from "~/components/ui/paw-icon";
import { Heart, Store, Eye, EyeOff } from "lucide-react";
import { Link, Form } from "react-router";
import { useState } from "react";

// Petch Logo - Paw print
const PetchLogo = () => (
  <div className="flex items-center gap-2">
    <PawIcon className="w-10 h-10" />
  </div>
);

interface SignupFormProps {
  error?: string;
  isSubmitting?: boolean;
}

export default function SignupForm({ error, isSubmitting }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("ADOPTER");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-4">
        <Card className="border-none shadow-lg pb-0">
          <CardHeader className="flex flex-col items-center space-y-1.5 pb-4 pt-6">
            <PetchLogo />
            <div className="space-y-0.5 flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-foreground">
                Join Petch
              </h2>
              <p className="text-muted-foreground text-center">
                Find your perfect furry companion 🐕
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Form method="post">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="userType">I am a...</Label>
                  <Select 
                    name="userType" 
                    defaultValue="ADOPTER"
                    onValueChange={setUserType}
                  >
                    <SelectTrigger
                      id="userType"
                      className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0"
                    >
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
                      <SelectItem value="ADOPTER">
                        <Heart size={16} aria-hidden="true" className="text-pink-500" />
                        <span className="truncate">Pet Adopter - Looking for a pet</span>
                      </SelectItem>
                      <SelectItem value="VENDOR">
                        <Store size={16} aria-hidden="true" className="text-blue-500" />
                        <span className="truncate">Vendor - Breeder or Shelter</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" name="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" name="lastName" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone (Optional)</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+1 (555) 000-0000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="pr-10"
                      required
                      minLength={8}
                      placeholder="Minimum 8 characters"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create free account"}
                </Button>
              </div>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-4!">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
