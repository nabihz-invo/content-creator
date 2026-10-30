-- P2-T04 (ADR-0006): the approved configuration is an approval in its own right.
-- Kept in its own migration: a new enum value can't be used in the transaction that adds it.
alter type public.approval_stage add value if not exists 'config' before 'script';
