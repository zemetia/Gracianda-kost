# be-research Examples

## Example 1: Payment Gateway (Tripay)
**Input**: "Research Tripay integration for a SaaS app."
**Workflow**:
1. Scan for `entity` in project.
2. Find `User` and `Subscription` entities.
3. Recommend `tripay-node` or official SDK.
4. Suggest adding `Invoice` entity with `payment_method`, `tripay_reference`, and `status`.

## Example 2: Auth System (Zitadel)
**Input**: "Research Zitadel OIDC integration."
**Workflow**:
1. Identify framework (e.g., Next.js).
2. Recommend `next-auth` or `@zitadel/next`.
3. Locate `User` entity to see how to store `oidc_sub`.
4. Suggest middleware for session protection.
