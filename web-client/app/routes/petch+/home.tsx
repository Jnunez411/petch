import { useLoaderData, Link, redirect } from 'react-router';
import type { Route } from './+types/home';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { Button } from '~/components/ui/button';
import { SpotlightCard } from '~/components/ui/spotlight-card';
import { Marquee } from '~/components/ui/marquee';
import { Heart, ArrowRight, Dog, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE_URL, getImageUrl } from '~/config/api-config';
import { PLACEHOLDER_IMAGES } from '~/config/constants';
import type { Pet } from '~/types/pet';
import { routeLogger } from '~/utils/logger';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Petch" },
    { name: "description", content: "Find your perfect pet match today." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);

  // Redirect admin users to admin dashboard
  if (user?.userType === 'ADMIN') {
    routeLogger.info('Admin user redirected to dashboard', { email: user.email });
    throw redirect('/admin');
  }

  // Fetch trending/featured pets from the API
  let trendingPets: Pet[] = [];
  const startTime = performance.now();
  try {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');

    // Use the trending endpoint which returns most-viewed pets
    const response = await fetch(`${API_BASE_URL}/api/pets/trending?count=8`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (response.ok) {
      trendingPets = await response.json();
    }
    const duration = Math.round(performance.now() - startTime);
    routeLogger.debug('Home page loaded', {
      trendingPetsCount: trendingPets.length,
      isAuthenticated: !!user,
      duration: `${duration}ms`
    });
    return { user, trendingPets, error: null };
  } catch (error) {
    routeLogger.error('Failed to fetch trending pets', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { user, trendingPets: [], error: 'Failed to load trending pets' };
  }
}

// Fallback placeholder data if no pets are available
const PLACEHOLDER_PETS: Pet[] = [
  { id: -1, name: "Bella", breed: "Golden Retriever", age: 2, images: [], species: "Dog", atRisk: false, fosterable: true },
  { id: -2, name: "Luna", breed: "Siamese", age: 1, images: [], species: "Cat", atRisk: false, fosterable: true },
  { id: -3, name: "Charlie", breed: "Beagle", age: 3, images: [], species: "Dog", atRisk: false, fosterable: false },
  { id: -4, name: "Max", breed: "Maine Coon", age: 4, images: [], species: "Cat", atRisk: true, fosterable: true },
];

export default function Home() {
  const { user, trendingPets, error } = useLoaderData<typeof loader>();

  // Use real pets if available, otherwise use placeholders
  const displayPets = trendingPets.length > 0 ? trendingPets : PLACEHOLDER_PETS;

  // Helper to get pet image URL (client-side safe)
  const getPetImageUrl = (pet: Pet) => {
    if (pet.images && pet.images.length > 0) {
      const imageUrl = getImageUrl(pet.images[0].filePath);
      if (imageUrl) return imageUrl;
    }
    return PLACEHOLDER_IMAGES[pet.species] || PLACEHOLDER_IMAGES.default;
  };

  // Auto-swipe demo logic
  const [activeCard, setActiveCard] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-coral/30">

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 lg:pt-40 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Hero Content */}
            <div className="flex-1 space-y-8 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-coral/20 bg-coral/10 text-coral text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${error ? 'bg-yellow-500' : 'bg-coral'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${error ? 'bg-yellow-500' : 'bg-coral'}`}></span>
                </span>
                {error ? 'Demo Mode (API Offline)' : '#1 Pet Adoption App'}
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Find your <br />
                <span className="text-coral">
                  soulmate.
                </span>
              </h1>

              <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Swipe through thousands of verified pets nearby.
                Experience a modern, social way to adopt.
                Connecting hearts, one swipe at a time.
              </p>

              <div className="flex items-center justify-center lg:justify-start gap-4">
                <Button size="lg" className="h-12 px-8 rounded-full text-base bg-coral hover:bg-coral-dark shadow-lg shadow-coral/20" asChild>
                  <Link to={user ? "/discover" : "/signup"}>{user ? "Start Swiping" : "Get Started"}</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm" asChild>
                  <Link to={user ? "/pets" : "/login"}>{user ? "Browse Grid" : "Sign In"}</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 flex items-center justify-center lg:justify-start gap-3 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">Verified Vendors</span>
                <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">Instant Matches</span>
              </div>
            </div>

            {/* Interactive Phone Demo */}
            <div className="flex-1 relative w-full h-[600px] flex justify-center items-center perspective-1000">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-coral/20 rounded-full blur-3xl animate-pulse" />

              {/* Phone Mockup */}
              <div className="relative w-[320px] h-[640px] bg-black rounded-[3rem] border-8 border-zinc-900 shadow-2xl overflow-hidden rotate-[-5deg] hover:rotate-0 transition-all duration-500 ease-out">
                {/* Status Bar */}
                <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-between px-6 z-20">
                  <div className="text-xs font-semibold text-white">9:41</div>
                  <div className="flex gap-1">
                    <div className="size-3 bg-white rounded-full opacity-20" />
                    <div className="size-3 bg-white rounded-full opacity-20" />
                    <div className="size-3 bg-white rounded-full" />
                  </div>
                </div>

                {/* App Content */}
                <div className="absolute inset-0 bg-zinc-950 pt-12 pb-8 px-4 flex flex-col items-center">
                  {/* Cards Stack */}
                  <div className="relative w-full h-[400px] mt-4">
                    {[0, 1, 2].map((i) => {
                      const pet = displayPets[i % displayPets.length];
                      const isActive = i === activeCard;
                      return (
                        <div
                          key={i}
                          className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-out 
                              ${isActive ? 'opacity-100 scale-100 translate-y-0 z-30' :
                              i > activeCard ? 'opacity-0 scale-95 translate-y-10 z-10' :
                                'opacity-0 -translate-x-full rotate-[-20deg] z-20'
                            }
                            `}
                        >
                          <img src={getPetImageUrl(pet)} alt={pet.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                            <h3 className="text-2xl font-bold">{pet.name}</h3>
                            <p className="text-zinc-300">{pet.breed}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-6 mt-8">
                    <div className="size-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 shadow-lg">
                      <span className="text-2xl font-bold">X</span>
                    </div>
                    <div className="size-16 rounded-full bg-coral flex items-center justify-center text-white shadow-xl shadow-coral/30 scale-110">
                      <Heart className="size-8 fill-current" />
                    </div>
                    <div className="size-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-teal shadow-lg">
                      <Check className="size-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Feed Section (Bento Grid Style) */}
      <section className="py-24 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-6 mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Trending on Petch</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Discover pets that are capturing hearts across the country right now.
          </p>
        </div>

        <div className="relative flex flex-col gap-8 overflow-hidden">
          {/* Top Row Marquee */}
          <Marquee className="py-4" pauseOnHover speed={40}>
            {displayPets.map((pet: Pet) => (
              <Link key={pet.id} to={user && pet.id > 0 ? `/pets/${pet.id}` : "/signup"} className="block">
                <SpotlightCard className="w-[280px] h-[360px] flex-shrink-0 mx-4 bg-zinc-100 dark:bg-zinc-800/50 border-0" fill="rgba(255, 107, 107, 0.15)">
                  <div className="relative h-full w-full group cursor-pointer">
                    <img src={getPetImageUrl(pet)} alt={pet.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                    {/* Hover Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 opacity-100 translate-y-0 bg-gradient-to-t from-black/90 to-transparent text-white">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="font-bold text-lg">{pet.name}</h3>
                          <p className="text-sm text-zinc-300">{pet.breed}</p>
                        </div>
                        <div className="rounded-full h-10 w-10 bg-white flex items-center justify-center hover:bg-zinc-200 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
                          <Heart className="size-5 fill-coral text-coral" />
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            ))}
          </Marquee>
        </div>

        <div className="text-center mt-12">
          <Button variant="ghost" size="lg" className="group text-lg" asChild>
            <Link to="/pets">
              View All Pets <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Happy Adoptions", value: "12k+" },
              { label: "Verified Breeders", value: "850+" },
              { label: "Animal Shelters", value: "340+" },
              { label: "Daily Matches", value: "2.4k" },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="text-4xl lg:text-5xl font-black text-coral">
                  {stat.value}
                </div>
                <div className="text-zinc-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Only show for non-logged-in users */}
      {!user && (
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900 dark:bg-zinc-950" />

          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
              Ready to find <br /> your new best friend?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-10 rounded-full text-lg bg-white text-zinc-900 hover:bg-zinc-100" asChild>
                <Link to="/signup">Create Account</Link>
              </Button>
              <Button size="lg" className="h-14 px-10 rounded-full text-lg bg-transparent border-2 border-white text-white hover:bg-white/20" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - For logged-in users */}
      {user && (
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900 dark:bg-zinc-950" />

          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to find your match?
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto">
              Start swiping through pets nearby and find your new best friend today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-10 rounded-full text-lg bg-coral hover:bg-coral-dark text-white" asChild>
                <Link to="/discover">Start Swiping</Link>
              </Button>
              <Button size="lg" className="h-14 px-10 rounded-full text-lg bg-transparent border-2 border-white text-white hover:bg-white/20" asChild>
                <Link to="/pets">Browse All Pets</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <footer className="py-8 bg-zinc-950 border-t border-white/10 text-center text-zinc-500 text-sm">
        <p>&copy; 2025 Petch. The social adoption platform.</p>
      </footer>

    </div>
  );
}
