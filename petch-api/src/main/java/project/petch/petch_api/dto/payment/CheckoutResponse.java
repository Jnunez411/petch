package project.petch.petch_api.dto.payment;

/**
 * Response DTO containing the Stripe Checkout session URL
 */
public record CheckoutResponse(
        String sessionId,
        String checkoutUrl
) {
}
