-- Migration: rename VERIFIED -> APPROVED in vendor_verification_requests.status
--
-- Context:
--   The vendor_verification_requests.status column previously stored the value
--   'VERIFIED' to indicate an approved request (reusing the vendor VerificationStatus
--   enum). After the decoupling in feature/fr-35-verified-badges, the column stores
--   'APPROVED' (VerificationRequestStatus enum).
--
-- When this is needed:
--   Run this against any environment where the application was started while
--   vendor_verification_requests.status still stored 'VERIFIED'. This includes any
--   developer database seeded before this branch was merged.
--
-- It is safe to run more than once (the WHERE clause is a no-op if already applied).
--
-- vendor.verification_status on vendor_profiles is NOT touched here; it retains
-- its own VERIFIED value and remains the sole source of truth for badge display.

UPDATE vendor_verification_requests
SET status = 'APPROVED'
WHERE status = 'VERIFIED';
