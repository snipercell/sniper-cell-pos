# Existing Supabase Project Assessment (Read-only)

Date: 2026-11-25
Repository branch: Testing
Project ref: mtcnhlrvolyhdreuvlpg
Project status at inspection: ACTIVE_HEALTHY
Inspection method: metadata and table listing only. No SQL writes, migrations, auth changes, or data mutations were performed.

## Decision
Do not use the existing project as the live database for the new POS application. It contains the legacy POS schema and records. The new application should receive a separate Supabase project so that its tables, authentication users, storage, policies, and operational records are isolated from the old system.

Do not create a Supabase development branch for this purpose: it has previously been identified as a potentially billable option and is not required for this plan.

## Observed legacy schema
The public schema currently contains these tables, all reported with RLS enabled:
- profiles (4 rows)
- customers (0)
- suppliers (0)
- products (2)
- product_units (0)
- sales (0)
- sale_items (0)
- purchases (0)
- purchase_items (0)
- topups (0)
- recharge_cards (0)
- maintenance (0)
- expenses (0)
- cash_transactions (0)
- fx_transactions (0)
- branches (2)
- branch_stock (2)
- user_branches (4)

This confirms that the project is not an empty database. RLS being enabled does not make it safe to repurpose: its tables, policies, relationships, users, and existing records belong to the legacy application.

## New project requirements
- Separate Supabase project, preferably on the Free plan and in a nearby supported region, subject to the actual $0 quote and availability.
- Do not transfer or copy old users, branches, employee names, products, or transactions.
- Use a neutral new schema and create all branch names, users, and branding from the new owner's setup flow.
- Keep the service-role/secret key exclusively server-side; the browser may use only a publishable key.
- Enable RLS on every exposed table. Grant only the minimum Data API privileges explicitly. Supabase's 2026 Data API change means new public tables are not automatically exposed by default.
- Keep internal authorization tables and privileged helper functions in a non-exposed schema where practical.
- Do not rely on UI hiding or user-editable metadata for authorization.

## Ownership and authorization design
- A single protected ownership record represents the one owner for the entire application.
- Owner setup must be a transaction-safe, one-time claim operation. It succeeds only if no owner exists; concurrent attempts cannot create two owners.
- The first owner is established through a controlled server-side bootstrap, not by allowing a public browser client to set an admin flag or role.
- Owner replacement and owner deletion are prohibited through normal application operations.
- Managers and employees cannot modify branding, branches, users, roles, permissions, or global settings.
- Users receive explicit many-to-many branch assignments. Every branch-scoped read and write checks those assignments in the database.
- A reserve employee can have at most one active branch assignment at a time; this must be enforced transactionally, not only in the interface.
- Privileged changes are recorded in an append-only audit log with actor, action, target, timestamp, and safe before/after metadata.

## Proposed new data domains
- app_private.owner_claim / app_private.owner_identity
- app_private.application_settings
- app_private.roles / app_private.permissions / app_private.role_permissions
- public.profiles / public.branches / public.user_branches
- app_private.audit_logs (read access restricted; append through controlled server-side operations)
- public.products / public.product_images / public.product_barcodes
- public.inventory_balances / public.inventory_movements / public.serial_items
- public.suppliers / public.purchases / public.purchase_items
- public.customers / public.sales / public.sale_items / public.sale_payments / public.returns
- public.cash_registers / public.cash_movements / public.expenses
- public.repairs / public.repair_parts / public.repair_status_history
- public.topup_transactions
- public.exchange_rates

Final table definitions, indexes, constraints, policies, grants, and function privileges must be reviewed against the fresh project's actual Postgres version and Data API settings before any migration is applied.

## Required verification before production use
1. Confirm only one owner can be claimed, including concurrent first-owner attempts.
2. Confirm a second owner claim and all owner replacement attempts fail.
3. Test each role against every branch-scoped table using real authenticated sessions.
4. Test unauthorized branch reads, inserts, updates, deletes, and branch reassignment.
5. Confirm managers cannot change global settings, branches, users, roles, or permissions.
6. Confirm reserve employee has no more than one active branch assignment.
7. Confirm audit records cannot be edited or deleted by application users.
8. Run Supabase security and performance advisors and resolve findings.
9. Verify Data API grants explicitly; do not assume new public tables are automatically exposed.
10. Do not release to production until the owner approves the Testing preview.
