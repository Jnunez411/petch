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
  UserCheck,
  BookOpen,
  Globe,
  FileText,
  Newspaper,
  GraduationCap,
  User
} from 'lucide-react';

export function meta() {
  return [
    { title: "About - Petch | CS 426 Senior Project" },
    { name: "description", content: "Petch - CS 426 Senior Project in Computer Science, Spring 2025, at UNR CSE Department. A modern pet adoption platform connecting pets with loving homes." },
  ];
}

export default function About() {
  const teamMembers = [
    { name: "Luis Carrillo" },
    { name: "Jhade Mondragon" },
    { name: "Jonathan Nunez" },
    { name: "Omar Rojas" },
  ];

  const instructorsAndAdvisors = [
    { name: "Carlos Hernandez", role: "External Advisor", affiliation: "CS Alumni" },
  ];

  const resources = [
    {
      category: "Problem Domain Books",
      icon: BookOpen,
      items: [
        { title: "Clean Code: A Handbook of Agile Software Craftsmanship", author: "Robert C. Martin", description: "Best practices for writing maintainable and scalable code" },
        { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", description: "Foundations for building reliable, scalable, and maintainable systems" },
        { title: "Don't Make Me Think", author: "Steve Krug", description: "Web usability and user experience design principles" },
      ]
    },
    {
      category: "Useful Websites",
      icon: Globe,
      items: [
        { title: "Petfinder API Documentation", url: "https://www.petfinder.com/developers/", description: "Reference for pet adoption platform APIs and data structures" },
        { title: "React Router Documentation", url: "https://reactrouter.com/", description: "Official docs for React Router used in our frontend" },
        { title: "Spring Boot Documentation", url: "https://spring.io/projects/spring-boot", description: "Official documentation for our backend framework" },
        { title: "Tailwind CSS", url: "https://tailwindcss.com/", description: "Utility-first CSS framework used for styling" },
      ]
    },
    {
      category: "Technical Reports & Papers",
      icon: FileText,
      items: [
        { title: "Recommendation Systems in Pet Adoption", description: "Research on matching algorithms for pet-adopter compatibility" },
        { title: "Mobile-First Design Patterns", description: "UX research on swipe-based interfaces and user engagement" },
        { title: "RESTful API Design Best Practices", description: "Guidelines for building scalable web service architectures" },
      ]
    },
    {
      category: "News & Related Information",
      icon: Newspaper,
      items: [
        { title: "ASPCA Pet Adoption Statistics", description: "Annual reports on pet adoption trends and shelter statistics in the US" },
        { title: "Technology in Animal Welfare", description: "How modern tech is transforming pet rescue and adoption processes" },
        { title: "Mobile App Adoption Trends", description: "User behavior research on mobile-first platforms" },
      ]
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50" role="main">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden" aria-labelledby="about-heading">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-coral/10 rounded-full blur-3xl" aria-hidden="true" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-coral/20 bg-coral/10 text-coral text-sm font-medium">
              <GraduationCap className="size-4" aria-hidden="true" />
              <span>CS 426 Senior Project</span>
            </div>
            
            <h1 id="about-heading" className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Petch: Connecting pets with{' '}
              <span className="text-coral">loving homes</span>
            </h1>
            
            <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium">
              CS 426 Senior Project in Computer Science, Spring 2025
              <br />
              University of Nevada, Reno — CSE Department
            </p>
          </div>
        </div>
      </section>

      {/* Project Description Section */}
      <section className="py-20 bg-white dark:bg-zinc-900" aria-labelledby="project-description-heading">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 id="project-description-heading" className="text-3xl font-bold mb-8 text-center">Project Description</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                Petch is a modern pet adoption platform designed to revolutionize the way people discover and adopt pets. 
                Inspired by the intuitive swipe-based interfaces of popular dating apps, Petch brings a fresh, engaging 
                approach to pet adoption that makes the process enjoyable and accessible for everyone.
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                The platform addresses a critical problem in animal welfare: despite millions of pets in shelters across 
                the United States, traditional adoption processes can be cumbersome, fragmented, and discouraging for 
                potential adopters. Petch solves this by providing a unified, mobile-first experience where users can 
                browse available pets through an intuitive discovery interface, filter by preferences such as species, 
                breed, age, and special needs, and connect directly with verified shelters and rescue organizations.
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                Our platform features a sophisticated matching algorithm that considers user preferences, lifestyle 
                factors, and pet characteristics to suggest compatible matches. Shelters and breeders can create 
                verified vendor accounts to list their pets with detailed profiles including photos, personality 
                descriptions, and adoption requirements. Special attention is given to at-risk animals who need 
                urgent placement, with dedicated visibility features to ensure they find homes quickly.
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Built with modern web technologies including React, TypeScript, and Spring Boot, Petch demonstrates 
                full-stack development best practices while addressing a meaningful social cause. Our goal is to 
                increase adoption rates, reduce shelter overcrowding, and ultimately save more animal lives by making 
                pet adoption as simple and enjoyable as possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20" aria-labelledby="team-heading">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 id="team-heading" className="text-3xl font-bold mb-4 text-center">Team 36</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 text-center mb-12">Meet the developers behind Petch</p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {teamMembers.map((member, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="size-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
                      <User className="size-8 text-coral" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Team Member</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h3 id="advisors-heading" className="text-2xl font-bold mb-6 text-center">Instructors & Advisors</h3>
            <div className="flex justify-center">
              {instructorsAndAdvisors.map((advisor, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow max-w-sm w-full">
                  <CardContent className="p-6">
                    <div className="size-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="size-8 text-teal" aria-hidden="true" />
                    </div>
                    <h4 className="font-semibold text-lg">{advisor.name}</h4>
                    <p className="text-sm text-coral font-medium">{advisor.role}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{advisor.affiliation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-zinc-900" aria-labelledby="mission-heading">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 id="mission-heading" className="text-3xl font-bold">Our Mission</h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  We're on a mission to revolutionize pet adoption by creating meaningful 
                  connections between pets and adopters. Through innovative technology and 
                  a user-friendly experience, we aim to reduce the number of pets in shelters 
                  and increase successful adoptions.
                </p>
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-coral/10 flex items-center justify-center">
                    <Heart className="size-6 text-coral" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">Every swipe matters</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Each interaction helps pets find their forever homes</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4" role="list" aria-label="Project statistics">
                <Card className="bg-coral/5 border-coral/20" role="listitem">
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold text-coral" aria-label="Over 1000 pets listed">1000+</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Pets Listed</p>
                  </CardContent>
                </Card>
                <Card className="bg-teal/5 border-teal/20" role="listitem">
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold text-teal" aria-label="Over 500 happy adoptions">500+</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Happy Adoptions</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" role="listitem">
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold" aria-label="Over 50 partner shelters">50+</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Partner Shelters</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" role="listitem">
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold" aria-label="24 hours, 7 days a week support">24/7</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Support</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 id="how-it-works-heading" className="text-3xl font-bold mb-4">How Petch Works</h2>
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
                  <UserCheck className="size-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold">For Adopters</h3>
              </div>
              
              <ol className="space-y-4" aria-label="Steps for adopters">
                {[
                  { icon: Users, title: "Create Your Profile", desc: "Tell us about your home, lifestyle, and pet preferences" },
                  { icon: Search, title: "Browse or Discover", desc: "Search listings or swipe through our Discover mode" },
                  { icon: Heart, title: "Like Your Favorites", desc: "Save pets you love and compare your matches" },
                  { icon: Home, title: "Connect & Adopt", desc: "Reach out to shelters and bring your new friend home" },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="size-10 rounded-lg bg-coral/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="size-5 text-coral" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* For Vendors */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-teal flex items-center justify-center">
                  <Building2 className="size-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold">For Shelters & Breeders</h3>
              </div>
              
              <ol className="space-y-4" aria-label="Steps for shelters and breeders">
                {[
                  { icon: Shield, title: "Register as Vendor", desc: "Create your organization profile with verification" },
                  { icon: Sparkles, title: "List Your Pets", desc: "Add photos, descriptions, and adoption details" },
                  { icon: AlertTriangle, title: "Highlight Urgent Cases", desc: "Mark at-risk pets for priority visibility" },
                  { icon: HandHeart, title: "Complete Adoptions", desc: "Connect with verified adopters and finalize" },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="size-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="size-5 text-teal" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-zinc-900" aria-labelledby="features-heading">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-3xl font-bold mb-4">Why Choose Petch?</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              A modern approach to pet adoption
            </p>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto" role="list">
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
              <li key={i} role="listitem">
                <Card className="group hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className={`size-12 rounded-xl ${feature.color === 'coral' ? 'bg-coral/10' : 'bg-teal/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`size-6 ${feature.color === 'coral' ? 'text-coral' : 'text-teal'}`} aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">{feature.desc}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Project Resources Section */}
      <section className="py-20" aria-labelledby="resources-heading">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="resources-heading" className="text-3xl font-bold mb-4">Project Related Resources</h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Research materials and references that informed our project
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {resources.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-coral/10 flex items-center justify-center">
                          <category.icon className="size-5 text-coral" aria-hidden="true" />
                        </div>
                        <h3 className="font-bold text-lg">{category.category}</h3>
                      </div>
                    </div>
                    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800" role="list" aria-label={category.category}>
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          {'url' in item && item.url ? (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 rounded"
                              aria-label={`${item.title} (opens in new tab)`}
                            >
                              <p className="font-medium text-coral hover:underline">{item.title}</p>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{item.description}</p>
                            </a>
                          ) : (
                            <div>
                              <p className="font-medium">
                                {item.title}
                                {'author' in item && item.author && (
                                  <span className="font-normal text-zinc-500 dark:text-zinc-400"> by {item.author}</span>
                                )}
                              </p>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{item.description}</p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-zinc-900" aria-labelledby="cta-heading">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 id="cta-heading" className="text-3xl lg:text-4xl font-bold">
              Ready to find your perfect match?
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Join thousands of happy adopters and pets who found each other on Petch. 
              Your new best friend is waiting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 rounded-full text-base bg-coral hover:bg-coral-dark shadow-lg shadow-coral/20" asChild>
                <Link to="/signup" aria-label="Get started with Petch for free">
                  Get Started Free
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base" asChild>
                <Link to="/pets" aria-label="Browse available pets">Browse Pets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}