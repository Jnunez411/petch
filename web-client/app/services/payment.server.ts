import { API_BASE_URL } from '~/config/api-config';

export interface CheckoutRequest {
  petId: number;
  amountCents: number;
  petName?: string;
  description?: string;
}

export interface CheckoutResponse {
  sessionId: string;
  checkoutUrl: string;
}

export interface PaymentVerification {
  paid: boolean;
  petId: string;
  status: string;
  paymentStatus: string;
  amountTotal: number;
  error?: string;
}

export interface SuggestedFee {
  petId: number;
  suggestedFeeCents: number;
  suggestedFeeDollars: number;
  currency: string;
}

/**
 * Create a Stripe Checkout session.
 * This is called from a server-side action to create a checkout session
 * and redirect the user to Stripe's hosted payment page.
 */
export async function createCheckoutSession(
  token: string,
  request: CheckoutRequest
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create checkout session: ${error}`);
  }

  return response.json();
}

/**
 * Verify a payment after successful redirect from Stripe.
 */
export async function verifyPayment(
  token: string,
  sessionId: string
): Promise<PaymentVerification> {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return {
      paid: false,
      petId: '',
      status: 'error',
      paymentStatus: 'error',
      amountTotal: 0,
      error: 'Failed to verify payment',
    };
  }

  return response.json();
}

/**
 * Get the suggested adoption fee for a pet.
 */
export async function getSuggestedFee(
  token: string,
  petId: number
): Promise<SuggestedFee> {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/suggested-fee?petId=${petId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get suggested fee');
  }

  return response.json();
}

// Re-export from shared config for backwards compatibility
export { ADOPTION_FEES, getAdoptionFee } from '~/config/payment';
