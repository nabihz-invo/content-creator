-- P5-T22 (round 3): device frames (UI-xx) and presenters (PR-xx) are post images too.
alter table public.library_items drop constraint library_items_code_check;
alter table public.library_items add constraint library_items_code_check
  check (code ~ '^(BG|GFX|PI|SC|OB|SE|UI|PR)-[0-9]{2,3}$');

alter table public.library_items drop constraint library_items_check;
alter table public.library_items add constraint library_items_check
  check ((kind = 'background' and code like 'BG-%') or (kind = 'graphic' and code like 'GFX-%')
      or (kind = 'post_image' and code ~ '^(PI|SC|OB|SE|UI|PR)-'));
