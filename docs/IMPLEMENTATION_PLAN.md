# POS Implementation Plan

## Safety boundary
- All work in this repository is developed on the `Testing` branch.
- Never push to or merge into `main` without the owner's explicit approval.
- Do not connect the new application to the existing production Supabase project until its schema, RLS policies, and data-isolation plan are reviewed and approved.
- Do not reuse legacy branch, employee, or shop names as defaults.

## Product principles
- Responsive Arabic-first interface; usable on iPad Safari, phones, and desktop.
- Neutral initial branding. The owner chooses the application name and logo.
- Exactly one owner/super-admin account. Owner bootstrap is one-time and permanently closes after the first owner is created.
- Only the owner can manage branding, branches, users, roles, permissions, and global settings.
- Managers and employees receive only explicitly granted operational permissions and branch assignments.
- A user may access multiple assigned branches. A reserve employee may be assigned to only one branch at a time.
- Sensitive changes are recorded in an append-only audit log.
- AI features are advisory only; sensitive actions always require owner confirmation.

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
10. Owner-only settings, branding, branch and user administration

## Security model required before live data
- Enforce authorization in the database/RLS and server-side operations; UI visibility is not security.
- Store the owner identity in a protected singleton configuration/ownership record. A transaction-safe database function must claim ownership only when no owner exists; no public client-side role assignment.
- Prevent owner replacement, second-owner creation, and privilege escalation through database constraints and policies.
- Use explicit user-to-branch assignment records. Every branch-scoped query and mutation must verify assignment server-side.
- Restrict branch and user administration, role/permission changes, branding, and global settings to the owner.
- Audit privileged changes with actor, action, target, timestamp, and relevant before/after metadata. Ordinary users cannot edit or delete audit records.
- Validate inventory quantities, payment totals, exchange rates, serial/IMEI uniqueness, and cash movements transactionally.

## Proposed data domains
- ownership / application_settings
- profiles / roles / permissions / role_permissions
- branches / user_branches
- audit_logs
- products / product_images / product_barcodes
- inventory_balances / inventory_movements / serial_items
- suppliers / purchases / purchase_items
- customers / sales / sale_items / sale_payments / returns
- cash_registers / cash_movements / expenses
- repairs / repair_parts / repair_status_history
- topup_transactions
- exchange_rates

Names, SQL types, indexes, foreign keys, and RLS policies must be finalized against the actual database before migration. No production schema changes are authorized by this plan.

## Delivery sequence
1. Confirm repository structure and keep the live database untouched.
2. Build a neutral, responsive application shell on `Testing`.
3. Design and review the isolated database schema and RLS policies.
4. Implement one-time owner bootstrap and branch-scoped authorization.
5. Implement operational modules with transactional writes and audit logging.
6. Test on desktop, iPad Safari, and phone; run security and end-to-end checks.
7. Present the Testing preview for owner approval before any production release.
