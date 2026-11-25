# POS Implementation Plan

## Safety boundary
- All development work stays on the `Testing` branch.
- Never push to or merge into `main` without the owner's explicit approval.
- Do not make any further changes to the existing Supabase project/database. The new POS backend must be isolated and separately configured.
- Do not reuse legacy branch, employee, shop, product, or account names as defaults.
- Free-tier only; do not create paid development branches or enable paid services.

## Product principles
- Arabic-first, responsive interface for iPad Safari, phones, and desktop.
- Neutral initial branding. Authorized users with the relevant permission can set the application name and logo.
- No single mandatory owner account. More than one user may be granted full permissions.
- Accounts are created manually only after email approval by the administrator.
- Every user's permissions are assigned individually; no hardcoded manager/employee permission assumptions.
- A user may be assigned to one or more branches. Branch access is always explicit.
- Branches and users can be created, renamed, deactivated, and managed from the application by users who have the relevant permissions.
- Sensitive changes are recorded in an append-only audit log.
- AI features are advisory only; sensitive actions always require explicit human confirmation.

## Account creation and authentication
- Login screen asks for username and password only; do not display an email field.
- A new user submits an account request with username, contact email, and required identity details.
- The request remains pending and cannot authenticate or access application data.
- Send an approval message to the configured administrator email. Only an authorized approver can approve or reject.
- Approval creates/enables the account through a trusted server-side operation; never trust a browser-supplied approval flag.
- After approval, send the user a secure password-setup link to their contact email.
- Login uses username and password. If the auth provider requires an email identifier, resolve the username to the verified auth identity only through a rate-limited server-side endpoint; never expose a public username-to-email directory.
- Keep the service-role/secret key server-side only. No public signup that creates active accounts.
- Record request, approval/rejection, activation, deactivation, and permission changes in the audit log.
- More than one approver may be assigned account-approval permission; the administrator email is configurable by an authorized settings user.

## Planned application areas
1. Dashboard and branch switcher
2. Sales, returns, receipts, and mixed USD/LBP payments
3. Purchases and suppliers
4. Inventory, product images, barcode search, phone IMEI/serial tracking
5. Screen protectors: ready-made and machine-cut
6. Repairs and service tracking
7. Cash registers, expenses, and cash movements per branch
8. Alfa and Touch top-ups with transaction number, cost, sale price, employee, and profit
9. Reports and audit history
10. User, branch, role, permission, approval queue, branding, and system settings

## Security model required before live data
- Enforce authorization in database/RLS and server-side operations; UI visibility is not security.
- Use granular permission grants per user (or reusable permission sets that are explicitly assigned); multiple users may receive the full permission set.
- Separate account-approval permission from general user management and from permission administration.
- Every branch-scoped query and mutation must verify that the authenticated user is assigned to that branch.
- Protect approval actions against forged requests, replay, and unauthorized access. Use short-lived, single-use approval links or authenticated approver sessions with server-side authorization.
- Store password hashes and credentials only in the auth provider; never store plaintext passwords or email approval tokens.
- Audit privileged changes with actor, action, target, timestamp, and relevant before/after metadata. Ordinary users cannot edit or delete audit records.
- Validate inventory quantities, payment totals, exchange rates, serial/IMEI uniqueness, and cash movements transactionally.

## Proposed data domains
- profiles / account_requests / account_approvals
- permissions / user_permissions / permission_sets (optional)
- branches / user_branches
- audit_logs / application_settings
- products / product_images / product_barcodes
- inventory_balances / inventory_movements / serial_items
- suppliers / purchases / purchase_items
- customers / sales / sale_items / sale_payments / returns
- cash_registers / cash_movements / expenses
- repairs / repair_parts / repair_status_history
- topup_transactions
- exchange_rates

Names, SQL types, indexes, foreign keys, and RLS policies must be finalized against the new isolated backend before migration. Do not apply changes to the existing database.

## Delivery sequence
1. Keep the live/legacy database untouched and work only on `Testing`.
2. Build a neutral, responsive application shell.
3. Implement secure account requests, email approval, username/password login, and granular user permissions.
4. Design and review the isolated database schema and RLS policies.
5. Implement branch management and explicit multi-branch assignments.
6. Implement operational modules with transactional writes and audit logging.
7. Test desktop, iPad Safari, and phone; run security and end-to-end checks.
8. Present the Testing preview for owner approval before any production release.
