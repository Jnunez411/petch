import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { 
  Heart, 
  Search, 
  Users, 
  Shield, 
  Sparkles, 
  ArrowRight,
  Dog,
  Home,
  HandHeart,
  AlertTriangle,
  Building2,
  UserCheck
} from 'lucide-react';

export function meta() {
  return [
    { title: "About - Petch" },
    { name: "description", content: "Learn about Petch - the modern pet adoption platform connecting pets with loving homes." },
  ];
}

export default function About() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-coral/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-coral/20 bg-coral/10 text-coral text-sm font-medium">
              <Dog className="size-4" />
              About Petch
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Connecting pets with{' '}
              <span className="text-coral">loving homes</span>
            </h1>
            
            <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Petch is a modern pet adoption platform that makes finding your perfect 
              companion as easy as swiping right. We believe every pet deserves a 
              loving home, and every person deserves a loyal friend.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Our Mission</h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  We're on a mission to revolutionize pet adoption by creating meaningful 
                  connections between pets and adopters. Through innovative technology and 
                  a user-friendly experience, we aim to reduce the number of pets in shelters 
                  and increase successful adoptions.
                </p>
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-coral/10 flex items-center justify-center">
                    <Heart className="size-6 text-coral" />
                  </div>
                  <div>
                    <p className="font-semibold">Every swipe matters</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Each interaction helps pets find their forever homes</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-coral/5 border-coral/20">
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold text-coral">1000+</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Pets Listed</p>
                  </CardContent>
                </Card>
                <Card className="bg-teal/5 border-teal/20">
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold text-teal">500+</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Happy Adoptions</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold">50+</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Partner Shelters</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold">24/7</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Support</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How Petch Works</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Whether you're looking to adopt or you're a shelter with pets to rehome, 
              Petch makes the process simple and enjoyable.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Adopters */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-coral flex items-center justify-center">
                  <UserCheck className="size-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">For Adopters</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: Users, title: "Create Your Profile", desc: "Tell us about your home, lifestyle, and pet preferences" },
                  { icon: Search, title: "Browse or Discover", desc: "Search listings or swipe through our Discover mode" },
                  { icon: Heart, title: "Like Your Favorites", desc: "Save pets you love and compare your matches" },
                  { icon: Home, title: "Connect & Adopt", desc: "Reach out to shelters and bring your new friend home" },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="size-10 rounded-lg bg-coral/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="size-5 text-coral" />
                    </div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Vendors */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-teal flex items-center justify-center">
                  <Building2 className="size-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">For Shelters & Breeders</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: Shield, title: "Register as Vendor", desc: "Create your organization profile with verification" },
                  { icon: Sparkles, title: "List Your Pets", desc: "Add photos, descriptions, and adoption details" },
                  { icon: AlertTriangle, title: "Highlight Urgent Cases", desc: "Mark at-risk pets for priority visibility" },
                  { icon: HandHeart, title: "Complete Adoptions", desc: "Connect with verified adopters and finalize" },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="size-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="size-5 text-teal" />
                    </div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Petch?</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              A modern approach to pet adoption
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { 
                icon: Heart, 
                title: "Swipe to Discover", 
                desc: "Our Tinder-like interface makes finding your perfect pet fun and intuitive",
                color: "coral"
              },
              { 
                icon: Search, 
                title: "Advanced Filters", 
                desc: "Filter by species, age, breed, fosterable, and at-risk status",
                color: "teal"
              },
              { 
                icon: AlertTriangle, 
                title: "At-Risk Alerts", 
                desc: "Urgent cases are highlighted so pets in need get priority attention",
                color: "coral"
              },
              { 
                icon: Shield, 
                title: "Verified Vendors", 
                desc: "All shelters and breeders are verified for your peace of mind",
                color: "teal"
              },
              { 
                icon: HandHeart, 
                title: "Foster Options", 
                desc: "Can't adopt? Many pets are available for fostering too",
                color: "coral"
              },
              { 
                icon: Sparkles, 
                title: "Smart Matching", 
                desc: "Our algorithm suggests pets based on your preferences",
                color: "teal"
              },
            ].map((feature, i) => (
              <Card key={i} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`size-12 rounded-xl ${feature.color === 'coral' ? 'bg-coral/10' : 'bg-teal/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`size-6 ${feature.color === 'coral' ? 'text-coral' : 'text-teal'}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to find your perfect match?
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Join thousands of happy adopters and pets who found each other on Petch. 
              Your new best friend is waiting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 rounded-full text-base bg-coral hover:bg-coral-dark shadow-lg shadow-coral/20" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base" asChild>
                <Link to="/pets">Browse Pets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}