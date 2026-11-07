-- P5-T22: the visual library also holds scenes (SC-xx), concept objects (OB-xx) and seasonal images
-- (SE-xx). They are post images (kind post_image, stored like PI-xx); the group goes in `collection`.
alter table public.library_items drop constraint library_items_code_check;
alter table public.library_items add constraint library_items_code_check
  check (code ~ '^(BG|GFX|PI|SC|OB|SE)-[0-9]{2,3}$');

alter table public.library_items drop constraint library_items_check;
alter table public.library_items add constraint library_items_check
  check ((kind = 'background' and code like 'BG-%') or (kind = 'graphic' and code like 'GFX-%')
      or (kind = 'post_image' and code ~ '^(PI|SC|OB|SE)-'));
