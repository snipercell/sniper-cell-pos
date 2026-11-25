# Account Request, Email Approval, and Username Login

Status: design only; not deployed.
Target branch: `Testing`.
Administrator approval inbox for the first configuration: `Hassan@infoguinea.com` (must be configurable later by an authorized user).

## User experience
1. The login page displays only **Username** and **Password**.
2. A separate **Request an account** action asks for the requested username, the user's real contact email, and their display name.
3. Submitting a request does not create an Auth user and does not grant access. The request is stored as `pending`.
4. An approval notification is sent to the configured administrator inbox. It contains the request details and a short-lived, single-use approval action.
5. The approver reviews the request and chooses **Approve** or **Reject**. The decision is recorded.
6. On approval, the server creates the Auth identity and profile, then sends a secure password-setup link to the applicant's contact email.
7. The applicant sets a password and then signs in using username + password.
8. After activation, an authorized administrator assigns permissions and one or more branches. No branch access is granted by default.

## Authentication design
Supabase Auth authenticates email + password, while the product UI must remain username + password. Do not expose or display the Auth email as the login identifier.

Use a server-side login endpoint:
- Accept username and password over HTTPS.
- Normalize the username consistently and look up the corresponding active profile and Auth email using a privileged server-side query.
- Call Supabase Auth password sign-in with the resolved email and the user's password, using only the publishable/anon key for the Auth sign-in operation.
- Return the resulting session to the client only after successful authentication.
- Apply rate limits, generic failure messages, and abuse monitoring. Never return the resolved email or indicate whether a username exists.
- Do not store passwords in `profiles`, account request rows, logs, or email notifications.

## Approval security
- The browser must never be able to set `approved=true`, create active Auth users, or assign permissions.
- Keep the Supabase service-role/secret key only in server-side function secrets.
- Generate a cryptographically random, single-use, short-lived approval token. Store only its hash in the database.
- Validate token expiry, request status, and one-time use in a transaction before creating an account.
- Alternatively, require the approver to sign in and verify a dedicated account-approval permission on the server. Do not rely on possession of a link alone for high-privilege approval.
- Record approver identity, decision, timestamp, request ID, and safe metadata in an append-only audit log.
- Rejection leaves no active Auth account. Duplicate usernames and duplicate contact emails must be handled safely.
- Account approval and permission assignment are separate actions. Approval must not automatically grant full access.

## Suggested server-side endpoints
- `request-account`: validate input, create pending request, notify approver.
- `approve-account`: verify approver authorization/token, atomically approve, create Auth user/profile, send password setup link.
- `reject-account`: verify approver authorization, record rejection.
- `username-login`: resolve username privately and authenticate password.
- `set-initial-password`: validate one-time setup token and complete password setup if the selected Auth flow requires a custom handler.

All endpoints require strict input validation, rate limits, safe error handling, and audit events. Prefer authenticated approver sessions over an approval-only bearer link.

## Email delivery
- Configure a real SMTP/email provider in the new isolated Supabase project or send mail through a server-side email provider.
- Never put SMTP credentials or provider API keys in frontend code or Git.
- The notification recipient starts as `Hassan@infoguinea.com`; make it editable only by users with the relevant settings permission.
- Email delivery must be tested end-to-end, including approval, rejection, expired links, duplicate clicks, and invalid recipients.

## Required tests before release
- A pending request cannot sign in or read any application data.
- No unauthenticated caller can approve, reject, create a user, or grant permissions.
- Only a permitted approver can decide a request.
- Approval token expiry, replay, and duplicate approval attempts are rejected.
- Username login succeeds with the correct password and returns no email address to the browser.
- Incorrect password and unknown username produce indistinguishable public errors and are rate-limited.
- A newly approved account has no branch access and no operational permissions until assigned.
- Two or more users can independently receive the full permission set when explicitly granted.
- Revoking a user's access takes effect server-side, not merely by hiding UI controls.
- Audit events cannot be modified or deleted by ordinary application users.

## Deployment blockers
This design is not live until all of the following are configured and verified:
- A separate, isolated Supabase project for the new POS.
- Server-side functions and secrets.
- An SMTP/email provider and verified sender.
- Database schema, unique constraints, RLS policies, and audit logging.
- A configured administrator inbox and at least one secure initial approver/bootstrap path.
