import { useLoaderData, useNavigate, Form, redirect } from 'react-router';
import type { Route } from './+types/checkout';
import { getSession, getUserFromSession } from '~/services/auth';
import { createCheckoutSession } from '~/services/payment.server';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { CreditCard, ArrowLeft, PawPrint, CheckCircle } from 'lucide-react';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Checkout - Adoption Fee | Petch' },
    { name: 'description', content: 'Complete your adoption fee payment' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  if (!token || !user) {
    return redirect('/login?redirectTo=/checkout');
  }

  // Get pet info from URL params
  const url = new URL(request.url);
  const petId = url.searchParams.get('pet_id');
  const petName = url.searchParams.get('pet_name');
  const priceCents = url.searchParams.get('price');

  return { 
    token, 
    user,
    petId: petId ? parseInt(petId, 10) : null,
    petName: petName || 'Your New Pet',
    priceCents: priceCents ? parseInt(priceCents, 10) : 5000, // Default to $50 if no price
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

  if (!token) {
    return redirect('/login?redirectTo=/checkout');
  }

  const formData = await request.formData();
  const petId = parseInt(formData.get('petId') as string, 10);
  const petName = formData.get('petName') as string;
  const amountCents = parseInt(formData.get('amountCents') as string, 10);

  try {
    const checkoutResponse = await createCheckoutSession(token, {
      petId,
      amountCents,
      petName,
      description: `Adoption fee for ${petName}`,
    });

    // Redirect to Stripe Checkout
    return redirect(checkoutResponse.checkoutUrl);
  } catch (error) {
    console.error('Checkout error:', error);
    return { error: 'Failed to create checkout session. Please try again.' };
  }
}

export default function Checkout({ loaderData, actionData }: Route.ComponentProps) {
  const { petId, petName, priceCents } = loaderData;
  const navigate = useNavigate();
  const priceDollars = (priceCents / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
              <PawPrint className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-2xl">Adoption Fee</CardTitle>
            <CardDescription>
              Complete your adoption payment for <strong>{petName}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {actionData?.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                {actionData.error}
              </div>
            )}

            <Form method="post" className="space-y-6">
              <input type="hidden" name="petId" value={petId || 0} />
              <input type="hidden" name="petName" value={petName} />
              <input type="hidden" name="amountCents" value={priceCents} />

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Pet</span>
                  <span className="font-medium">{petName}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Adoption Fee</span>
                  <span className="font-medium">${priceDollars}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">${priceDollars}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay ${priceDollars} with Stripe
              </Button>

              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Secure payment powered by Stripe</span>
              </div>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          This is a test payment. No real charges will be made.
          <br />
          Use card number <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">4242 4242 4242 4242</code>
        </p>
      </div>
    </div>
  );
}
