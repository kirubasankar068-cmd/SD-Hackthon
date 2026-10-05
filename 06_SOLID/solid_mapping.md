# SALESTORM - 06 SOLID Principles Mapping

| SOLID Principle | Target Class / Component | Architectural Application & Implementation Detail | Design Benefit & Risk Prevented |
|---|---|---|---|
| **Single Responsibility (SRP)** | `InventoryService`<br>`PaymentService`<br>`OrderService` | `InventoryService` strictly manages stock decrement and reservation TTLs.<br>`PaymentService` strictly manages 3rd-party PSP gateway calls.<br>`OrderService` strictly persists orders. | **Isolation of Side-Effects**: Prevents database schema edits or payment API changes from breaking inventory reservation logic. |
| **Open/Closed (OCP)** | `PaymentProviderStrategy` Interface | New payment providers (Stripe, Adyen, ApplePay) are introduced by adding a new class implementing `PaymentProviderStrategy`. | **Zero Core Code Modifications**: Adding a payment vendor requires 0 changes to existing checkout or inventory microservices. |
| **Liskov Substitution (LSP)** | `MockPaymentAdapter`<br>`StripePaymentAdapter` | Both adapters implement the `PaymentGatewayStrategy` interface contracts and behave identically under all assertions. | **Seamless Simulation Testing**: Load tests and mock unit tests substitute real PSP APIs without runtime exceptions or type coercions. |
| **Interface Segregation (ISP)** | `ReadOnlyInventory`<br>`WriteInventory` | Frontend product catalog services only depend on `ReadOnlyInventory` (`getStockCount`). Checkout microservice depends on `WriteInventory` (`reserveStockAtomic`). | **Least Privilege Access**: Search services cannot accidentally invoke mutating stock methods or hold write locks. |
| **Dependency Inversion (DIP)** | `CheckoutWorkflowUseCase` | High-level `CheckoutWorkflowUseCase` depends on abstract interfaces (`InventoryRepository`, `PaymentGatewayStrategy`), not concrete Redis/Stripe SDKs. | **Technology Agnostic Core**: Datastores (e.g. Redis to KeyDB) or Payment Vendors can be swapped seamlessly via dependency injection. |

---

## Code Example: Open/Closed Principle (OCP) in Action

```typescript
// Core Payment Gateway Abstraction
export interface PaymentGatewayStrategy {
  readonly providerName: string;
  processCharge(amount: number, cardToken: string, idempotencyKey: string): Promise<PaymentResult>;
}

// Concrete Implementation 1: Stripe
export class StripePaymentAdapter implements PaymentGatewayStrategy {
  readonly providerName = 'STRIPE';
  async processCharge(amount: number, cardToken: string, idempotencyKey: string): Promise<PaymentResult> {
    // Stripe SDK Call with idempotency header
    return { success: true, transactionRef: `ch_stripe_${Date.now()}` };
  }
}

// Concrete Implementation 2: Adyen (Added without modifying core checkout code!)
export class AdyenPaymentAdapter implements PaymentGatewayStrategy {
  readonly providerName = 'ADYEN';
  async processCharge(amount: number, cardToken: string, idempotencyKey: string): Promise<PaymentResult> {
    // Adyen API Call
    return { success: true, transactionRef: `tx_adyen_${Date.now()}` };
  }
}

// High-level Checkout Processor depends on interface (DIP)
export class CheckoutProcessor {
  constructor(private paymentProvider: PaymentGatewayStrategy) {}

  async executeCheckout(amount: number, cardToken: string, idempotencyKey: string) {
    return this.paymentProvider.processCharge(amount, cardToken, idempotencyKey);
  }
}
```
