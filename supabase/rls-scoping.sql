-- ==========================================================================
-- DiagOptim - Row Level Security for the multi-stakeholder scoping feature
-- Run AFTER rls-policies.sql (reuses public.is_company_owner).
-- ==========================================================================

ALTER TABLE public.scoping_projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoping_stakeholders ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER => bypass RLS, avoid recursion)
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_project_respondent(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM scoping_stakeholders
    WHERE project_id = p_project_id
      AND respondent_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_scoping_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM scoping_projects p
    WHERE p.id = p_project_id
      AND (p.created_by_user_id = auth.uid() OR public.is_company_owner(p.company_id))
  );
$$;

-- --------------------------------------------------------------------------
-- scoping_projects
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS scoping_projects_manage         ON public.scoping_projects;
DROP POLICY IF EXISTS scoping_projects_respondent_read ON public.scoping_projects;

-- Creator or company owner: full control
CREATE POLICY scoping_projects_manage ON public.scoping_projects
  FOR ALL
  USING (created_by_user_id = auth.uid() OR public.is_company_owner(company_id))
  WITH CHECK (created_by_user_id = auth.uid() OR public.is_company_owner(company_id));

-- A stakeholder respondent may read the project they are part of
CREATE POLICY scoping_projects_respondent_read ON public.scoping_projects
  FOR SELECT
  USING (public.is_project_respondent(id));

-- --------------------------------------------------------------------------
-- scoping_stakeholders
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS scoping_stakeholders_manage      ON public.scoping_stakeholders;
DROP POLICY IF EXISTS scoping_stakeholders_self_read   ON public.scoping_stakeholders;
DROP POLICY IF EXISTS scoping_stakeholders_self_update ON public.scoping_stakeholders;

-- Project owner/creator: full control over its stakeholders
CREATE POLICY scoping_stakeholders_manage ON public.scoping_stakeholders
  FOR ALL
  USING (public.can_manage_scoping_project(project_id))
  WITH CHECK (public.can_manage_scoping_project(project_id));

-- A respondent may read their own stakeholder row
CREATE POLICY scoping_stakeholders_self_read ON public.scoping_stakeholders
  FOR SELECT
  USING (respondent_user_id = auth.uid());

-- A respondent may update their own row (e.g. accept, mark started)
CREATE POLICY scoping_stakeholders_self_update ON public.scoping_stakeholders
  FOR UPDATE
  USING (respondent_user_id = auth.uid())
  WITH CHECK (respondent_user_id = auth.uid());
