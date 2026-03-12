import { useLoaderData, Link, redirect } from 'react-router';
import type { Route } from './+types/payment-success';
import { getSession, getUserFromSession } from '~/services/auth';
import { verifyPayment } from '~/services/payment.server';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { CheckCircle, XCircle, Home, Heart, AlertCircle } from 'lucide-react';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Payment Complete | Petch' },
    { name: 'description', content: 'Your adoption fee payment has been processed' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  if (!token || !user) {
    return redirect('/login');
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  const petId = url.searchParams.get('pet_id');

  if (!sessionId) {
    return {
      success: false,
      error: 'No payment session found',
      petId: petId ? parseInt(petId, 10) : null,
      amount: null,
    };
  }

  try {
    const verification = await verifyPayment(token, sessionId);
    
    return {
      success: verification.paid,
      petId: verification.petId ? parseInt(verification.petId, 10) : (petId ? parseInt(petId, 10) : null),
      amount: verification.amountTotal ? verification.amountTotal / 100 : null,
      status: verification.status,
      paymentStatus: verification.paymentStatus,
      error: verification.error,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: 'Failed to verify payment',
      petId: petId ? parseInt(petId, 10) : null,
      amount: null,
    };
  }
}

export default function PaymentSuccess({ loaderData }: Route.ComponentProps) {
  const { success, petId, amount, error } = loaderData;

  if (!success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                {error ? (
                  <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                )}
              </div>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                Payment Issue
              </CardTitle>
              <CardDescription>
                {error || 'Your payment could not be verified. Please try again or contact support.'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {petId && (
                  <Button asChild className="flex-1">
                    <Link to={`/checkout?pet_id=${petId}`}>
                      Try Again
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/discover">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg">
              Thank you for your adoption fee payment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {amount && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount Paid</p>
                <p className="text-3xl font-bold">${amount.toFixed(2)}</p>
              </div>
            )}

            <div className="space-y-3 text-center text-gray-600 dark:text-gray-400">
              <p>
                🎉 Congratulations on your new furry friend!
              </p>
              <p className="text-sm">
                A confirmation email has been sent to your registered email address.
                The shelter will contact you soon with next steps.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1 bg-orange-500 hover:bg-orange-600">
                <Link to="/favorites">
                  <Heart className="w-4 h-4 mr-2" />
                  View My Pets
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/discover">
                  <Home className="w-4 h-4 mr-2" />
                  Discover More
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          This was a test payment. No real charges were made.
        </p>
      </div>
    </div>
  );
}
