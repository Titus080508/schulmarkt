-- ============================================================
-- LFS Markt: Fix - Admins/Moderatoren konnten fremde Posts nicht
-- löschen, da Soft-Delete ein UPDATE ist und es dafür keine
-- RLS-Policy für is_admin gab (nur für Owner).
-- ============================================================

create policy "posts_update_admin" on posts
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );
