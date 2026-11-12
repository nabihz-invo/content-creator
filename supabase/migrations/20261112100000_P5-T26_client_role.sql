-- P5-T26: a client account (someone from the brand's company) sees the posts the team approved in a
-- calendar and approves them, requests changes or comments. Nothing else.
-- The enum value is added on its own: Postgres can't use a new enum value in the transaction that
-- adds it, and the next migration (rules for the role) must not depend on how the CLI groups files.
alter type public.member_role add value if not exists 'client';
