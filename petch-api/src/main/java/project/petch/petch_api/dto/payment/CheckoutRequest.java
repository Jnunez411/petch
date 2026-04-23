package project.petch.petch_api.dto.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for creating a Stripe Checkout session
 */
public record CheckoutRequest(
        @NotNull(message = "Pet ID is required") 
        Long petId,

        @NotNull(message = "Amount is required") 
        @Positive(message = "Amount must be positive")
        Integer amountCents,

        String petName,
        
        String description
) {
}
