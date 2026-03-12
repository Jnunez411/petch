package project.petch.petch_api.controller;

import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.payment.CheckoutRequest;
import project.petch.petch_api.dto.payment.CheckoutResponse;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.StripeService;

import java.util.Map;

/**
 * Controller for handling payment-related endpoints.
 * Uses Stripe Checkout for secure payment processing.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final StripeService stripeService;

    /**
     * Create a Stripe Checkout session for adoption fee payment.
     * POST /api/payments/create-checkout-session
     *
     * @param request The checkout request with pet ID and amount
     * @param user The authenticated user
     * @return CheckoutResponse with session ID and redirect URL
     */
    @PostMapping("/create-checkout-session")
    public ResponseEntity<CheckoutResponse> createCheckoutSession(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            log.warn("Unauthorized checkout attempt");
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Creating checkout session for user: {} and pet: {}", 
                    user.getEmail(), request.petId());
            
            CheckoutResponse response = stripeService.createCheckoutSession(request, user.getEmail());
            return ResponseEntity.ok(response);
            
        } catch (StripeException e) {
            log.error("Stripe error creating checkout session: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Verify payment status after successful redirect.
     * GET /api/payments/verify?session_id=xxx
     *
     * @param sessionId The Stripe session ID from the URL
     * @param user The authenticated user
     * @return Payment verification result
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @RequestParam("session_id") String sessionId,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            Session session = stripeService.retrieveSession(sessionId);
            boolean isPaid = "complete".equals(session.getStatus()) && 
                           "paid".equals(session.getPaymentStatus());

            // Extract metadata
            String petId = session.getMetadata().get("pet_id");

            log.info("Payment verification for session {}: paid={}, petId={}", 
                    sessionId, isPaid, petId);

            return ResponseEntity.ok(Map.of(
                    "paid", isPaid,
                    "petId", petId != null ? petId : "",
                    "status", session.getStatus(),
                    "paymentStatus", session.getPaymentStatus(),
                    "amountTotal", session.getAmountTotal() != null ? session.getAmountTotal() : 0
            ));
            
        } catch (StripeException e) {
            log.error("Stripe error verifying payment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Unable to verify payment",
                    "paid", false
            ));
        }
    }

    /**
     * Get suggested adoption fee based on pet characteristics.
     * This is a simple helper endpoint for the frontend.
     * GET /api/payments/suggested-fee?petId=xxx
     *
     * In a real app, you might calculate this based on pet size, age, breed, etc.
     */
    @GetMapping("/suggested-fee")
    public ResponseEntity<Map<String, Object>> getSuggestedFee(
            @RequestParam("petId") Long petId) {
        
        // Default fee structure (in cents)
        // You could enhance this to query the pet and calculate based on attributes
        int baseFee = 5000; // $50 base fee
        
        return ResponseEntity.ok(Map.of(
                "petId", petId,
                "suggestedFeeCents", baseFee,
                "suggestedFeeDollars", baseFee / 100.0,
                "currency", "usd"
        ));
    }
}
