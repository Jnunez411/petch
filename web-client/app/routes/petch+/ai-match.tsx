import { useState } from 'react';
import { Link, redirect } from 'react-router';
import type { Route } from './+types/ai-match';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Home, Activity, Users, Heart, Star } from 'lucide-react';
import { getUserFromSession } from '~/services/auth';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'AI Match - Petch' },
    { name: 'description', content: 'Find your perfect pet match with AI' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Require authentication
  const user = await getUserFromSession(request);
  if (!user) {
    return redirect('/login');
  }
  return null;
}

// Feature item component
function FeatureItem({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function AIMatch() {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = [
    {
      id: 'living',
      title: 'What type of home do you live in?',
      options: ['Apartment', 'House with yard', 'Condo/Townhouse', 'Rural property'],
    },
    {
      id: 'activity',
      title: 'How active is your lifestyle?',
      options: ['Very active (daily exercise)', 'Moderately active', 'Relaxed/Low activity', 'Variable'],
    },
    {
      id: 'household',
      title: 'Who lives in your household?',
      options: ['Just me', 'Couple', 'Family with kids', 'Roommates'],
    },
    {
      id: 'pets',
      title: 'Do you have other pets?',
      options: ['No other pets', 'Dogs', 'Cats', 'Other animals'],
    },
    {
      id: 'experience',
      title: 'What is your pet experience level?',
      options: ['First-time owner', 'Some experience', 'Experienced', 'Professional/Expert'],
    },
    {
      id: 'time',
      title: 'How much time can you dedicate daily?',
      options: ['1-2 hours', '3-4 hours', '5+ hours', 'I work from home'],
    },
  ];

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [questions[currentStep].id]: answer });
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Quiz completed - show coming soon message
      setCurrentStep(-1); // Use -1 to indicate completion
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentStep(0);
    setAnswers({});
  };

  // Quiz completion screen
  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Quiz Complete!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for completing the matching quiz! Our AI matching feature is coming soon. 
            In the meantime, browse our available pets to find your perfect companion.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={resetQuiz} variant="outline">
              Retake Quiz
            </Button>
            <Button asChild>
              <Link to="/pets">Browse Pets</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  if (quizStarted) {
    const question = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <Card className="border-2">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold text-center mb-8">{question.title}</h2>
              
              <div className="space-y-3">
                {question.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full p-4 text-left rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Back button */}
          {currentStep > 0 && (
            <Button 
              variant="ghost" 
              className="mt-4"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              ← Previous Question
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Landing page
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        {/* Star Icon */}
        <div className="flex justify-center mb-6">
          <Star className="w-16 h-16 text-yellow-500 fill-yellow-500" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Find Your Perfect Match
        </h1>
        
        <p className="text-muted-foreground max-w-md mx-auto mb-12">
          Answer a few questions about your home, lifestyle, and preferences. 
          Our AI will recommend pets that are best fit for you.
        </p>

        {/* What to Expect Card */}
        <Card className="max-w-xl mx-auto bg-secondary border-0 mb-8">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-6 text-left">What to Expect</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <FeatureItem
                icon={Home}
                title="Living Situation"
                description="Tell us about your home type"
                color="bg-primary/20"
              />
              <FeatureItem
                icon={Activity}
                title="Activity Level"
                description="Share how active you are"
                color="bg-accent/20"
              />
              <FeatureItem
                icon={Users}
                title="Household"
                description="Let us know who lives with you and any other pets"
                color="bg-primary/20"
              />
              <FeatureItem
                icon={Heart}
                title="Preferences"
                description="Choose traits and characteristics"
                color="bg-accent/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Time estimate */}
        <p className="text-sm text-muted-foreground mb-6">
          This will take about 5 minutes. Your answers will help us find pets that truly fit your lifestyle.
        </p>

        {/* Start Quiz Button */}
        <Button 
          size="lg" 
          className="px-8 py-6 text-lg font-semibold"
          onClick={() => setQuizStarted(true)}
        >
          Start Quiz
        </Button>
      </div>
    </div>
  );
}
