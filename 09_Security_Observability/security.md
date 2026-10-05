# SALESTORM - 09 Security Architecture & Checklist

## 1. Security Checklist & Defensive Measures

| Security Layer | Threat Guarded Against | Implementation Mechanism |
|---|---|---|
| **Edge Protection** | DDoS / Bot Bursts | Cloudflare Web Application Firewall (WAF) & Rate Limiting Rules. |
| **Authentication** | Unauthorized Access | JWT Bearer tokens with RS256 asymmetric signature verification. |
| **Payload Integrity** | Tampering / SQL Injection | Strict JSON schema validation at API Gateway + ORM parameterized queries. |
| **Idempotency Safeguard** | Duplicate Charges / Bot Replay | Mandatory `Idempotency-Key` (UUIDv4) header validated against Redis cache. |
| **Payment Security** | PCI-DSS Compliance | Payment card details never touch SALESTORM servers; client sends tokenized PSP tokens. |
| **Data Encryption** | Data Interception | TLS 1.3 in transit; AES-256 encryption at rest for PostgreSQL database tables. |

---

## 2. API Key & Secret Rotation Protocol
- All microservice DB credentials and Kafka TLS certs are injected dynamically via AWS Secrets Manager.
- Zero hardcoded secrets in source code or Docker images.
