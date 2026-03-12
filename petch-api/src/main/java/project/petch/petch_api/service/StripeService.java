package project.petch.petch_api.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import project.petch.petch_api.dto.payment.CheckoutRequest;
import project.petch.petch_api.dto.payment.CheckoutResponse;

/**
 * Service for handling Stripe payment operations.
 * Uses Stripe Checkout for secure, hosted payment pages.
 */
@Service
@Slf4j
public class StripeService {

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
        log.info("Stripe API initialized");
    }

    /**
     * Creates a Stripe Checkout Session for a one-time adoption fee payment.
     *
     * @param request The checkout request containing pet and payment details
     * @param userEmail The email of the user making the payment
     * @return CheckoutResponse containing the session ID and URL
     * @throws StripeException If Stripe API call fails
     */
    public CheckoutResponse createCheckoutSession(CheckoutRequest request, String userEmail) throws StripeException {
        log.info("Creating checkout session for pet {} with amount {} cents", 
                request.petId(), request.amountCents());

        String productName = request.petName() != null 
                ? "Adoption Fee - " + request.petName() 
                : "Adoption Fee";
        
        String description = request.description() != null 
                ? request.description() 
                : "One-time adoption fee for your new pet";

        // Build the checkout session
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setCustomerEmail(userEmail)
                // Success URL with session ID for verification
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}&pet_id=" + request.petId())
                .setCancelUrl(cancelUrl + "?pet_id=" + request.petId())
                // Add the adoption fee as a line item
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount((long) request.amountCents())
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(productName)
                                                                .setDescription(description)
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                // Add metadata for tracking
                .putMetadata("pet_id", String.valueOf(request.petId()))
                .putMetadata("payment_type", "adoption_fee")
                .build();

        Session session = Session.create(params);
        
        log.info("Checkout session created: {}", session.getId());
        return new CheckoutResponse(session.getId(), session.getUrl());
    }

    /**
     * Retrieves a Stripe Checkout Session by ID.
     * Used to verify payment status after redirect.
     *
     * @param sessionId The Stripe session ID
     * @return The Session object
     * @throws StripeException If Stripe API call fails
     */
    public Session retrieveSession(String sessionId) throws StripeException {
        return Session.retrieve(sessionId);
    }

    /**
     * Checks if a session payment was successful.
     *
     * @param sessionId The Stripe session ID
     * @return true if payment is complete
     * @throws StripeException If Stripe API call fails
     */
    public boolean isPaymentComplete(String sessionId) throws StripeException {
        Session session = retrieveSession(sessionId);
        return "complete".equals(session.getStatus()) && 
               "paid".equals(session.getPaymentStatus());
    }
}
