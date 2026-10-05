# SALESTORM - 07 Design Patterns Matrix

| Design Pattern | Implementation Location | Problem Solved | Architectural Trade-Off |
|---|---|---|---|
| **Strategy** | `PaymentGatewayStrategy` | Allows dynamic switching of payment processors (Stripe, Adyen, ApplePay) based on user location or currency. | Slightly higher class count and initial abstraction overhead. |
| **Factory** | `PaymentProviderFactory` | Encapsulates complex creation logic and API key configuration for 3rd-party payment gateway SDKs. | Indirection layer hides concrete instantiation details. |
| **State** | `OrderLifecycleState`<br>`ReservationState` | Explicitly models valid state transitions (e.g. `CREATED -> CONFIRMED -> SHIPPED`), rejecting illegal transitions like shipping an unpaid order. | Requires managing state classes and transition guard rules. |
| **Observer** | `KafkaEventPublisher` | Decouples payment confirmation from downstream actions like order creation, warehouse dispatch, and email alerts. | Eventual consistency; downstream consumers experience 1-3 sec lag. |
| **Adapter** | `StripePaymentAdapter` | Translates heterogeneous 3rd-party PSP API request/response formats into a unified internal `PaymentResult` domain model. | Requires ongoing maintenance if external vendor API schemas change. |
| **Facade** | `FlashSaleCheckoutFacade` | Provides a unified, single entry-point method (`executeCheckout`) orchestrating Inventory, Payment, and Order microservices. | Risk of creating a god class if not kept strictly focused on orchestration. |
| **Repository** | `InventoryRepository`<br>`OrderRepository` | Abstrates underlying datastore operations (Redis Lua, PostgreSQL queries) away from core business logic. | Adds mapping overhead between relational database rows and domain objects. |
| **Circuit Breaker** | `Resilience4j / Hystrix` on Payment API | Prevents cascading thread pool exhaustion when payment gateway experiences high latency or outage. Trips OPEN fast (< 1 ms). | Requests fail fast during gateway degradation instead of waiting. |
