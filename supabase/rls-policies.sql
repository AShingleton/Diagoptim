-- ==========================================================================
-- DiagOptim - Row Level Security Policies
-- ==========================================================================
-- Run this AFTER all tables are created.
-- Assumes Supabase auth with auth.uid() returning the authenticated user's ID.
-- ==========================================================================

-- =========================================================================
-- Helper functions
-- =========================================================================

CREATE OR REPLACE FUNCTION public.is_company_owner(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM companies
    WHERE id = p_company_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_consultant_of(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM consultant_clients
    WHERE company_id = p_company_id
      AND consultant_id = auth.uid()
      AND status::text = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_team_role(p_company_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
      AND role::text = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND role::text = 'admin'
  );
$$;

-- =========================================================================
-- USERS
-- =========================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin can read all users
CREATE POLICY users_admin_select ON users
  FOR SELECT
  USING (is_admin());

-- =========================================================================
-- COMPANIES
-- =========================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Owner: full CRUD
CREATE POLICY companies_owner_all ON companies
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Consultant: SELECT their clients
CREATE POLICY companies_consultant_select ON companies
  FOR SELECT
  USING (is_consultant_of(id));

-- Team members: SELECT
CREATE POLICY companies_team_select ON companies
  FOR SELECT
  USING (is_team_member(id));

-- =========================================================================
-- SUBSCRIPTIONS
-- =========================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_owner_select ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY subscriptions_owner_update ON subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System/webhook inserts are handled via service_role key (bypasses RLS)

-- =========================================================================
-- DIAGNOSTICS
-- =========================================================================
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

-- Company owner: full CRUD
CREATE POLICY diagnostics_owner_all ON diagnostics
  FOR ALL
  USING (is_company_owner(company_id))
  WITH CHECK (is_company_owner(company_id));

-- Team members: SELECT only
CREATE POLICY diagnostics_team_select ON diagnostics
  FOR SELECT
  USING (is_team_member(company_id));

-- Consultant: SELECT
CREATE POLICY diagnostics_consultant_select ON diagnostics
  FOR SELECT
  USING (is_consultant_of(company_id));

-- =========================================================================
-- DIAGNOSTIC_ANSWERS
-- =========================================================================
ALTER TABLE diagnostic_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_answers_owner_all ON diagnostic_answers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = diagnostic_answers.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = diagnostic_answers.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY diagnostic_answers_team_select ON diagnostic_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = diagnostic_answers.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY diagnostic_answers_consultant_select ON diagnostic_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = diagnostic_answers.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- =========================================================================
-- DIAGNOSTIC_INSIGHTS
-- =========================================================================
ALTER TABLE diagnostic_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_insights_owner_all ON diagnostic_insights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = diagnostic_insights.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = diagnostic_insights.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY diagnostic_insights_team_select ON diagnostic_insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = diagnostic_insights.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY diagnostic_insights_consultant_select ON diagnostic_insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = diagnostic_insights.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- =========================================================================
-- DOCUMENTS (strict - sensitive financial data)
-- =========================================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_owner_all ON documents
  FOR ALL
  USING (is_company_owner(company_id))
  WITH CHECK (is_company_owner(company_id));

-- No team or consultant access to raw documents (sensitive data)

-- =========================================================================
-- DOCUMENT_JOBS (access follows parent document -> company)
-- =========================================================================
ALTER TABLE document_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_jobs_owner_all ON document_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM documents doc
      WHERE doc.id = document_jobs.document_id
        AND is_company_owner(doc.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents doc
      WHERE doc.id = document_jobs.document_id
        AND is_company_owner(doc.company_id)
    )
  );

-- =========================================================================
-- REPORT_JOBS (access follows parent diagnostic -> company)
-- =========================================================================
ALTER TABLE report_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_jobs_owner_all ON report_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = report_jobs.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = report_jobs.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY report_jobs_team_select ON report_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = report_jobs.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY report_jobs_consultant_select ON report_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = report_jobs.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- =========================================================================
-- ROADMAPS (access through diagnostic -> company)
-- =========================================================================
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY roadmaps_owner_all ON roadmaps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = roadmaps.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = roadmaps.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY roadmaps_team_select ON roadmaps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = roadmaps.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY roadmaps_consultant_select ON roadmaps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = roadmaps.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- =========================================================================
-- ROADMAP_ACTIONS
-- =========================================================================
ALTER TABLE roadmap_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY roadmap_actions_owner_all ON roadmap_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roadmaps r
      JOIN diagnostics d ON d.id = r.diagnostic_id
      WHERE r.id = roadmap_actions.roadmap_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roadmaps r
      JOIN diagnostics d ON d.id = r.diagnostic_id
      WHERE r.id = roadmap_actions.roadmap_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY roadmap_actions_team_select ON roadmap_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roadmaps r
      JOIN diagnostics d ON d.id = r.diagnostic_id
      WHERE r.id = roadmap_actions.roadmap_id
        AND is_team_member(d.company_id)
    )
  );

-- Team members with 'editor' role can update actions
CREATE POLICY roadmap_actions_team_editor_update ON roadmap_actions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM roadmaps r
      JOIN diagnostics d ON d.id = r.diagnostic_id
      WHERE r.id = roadmap_actions.roadmap_id
        AND has_team_role(d.company_id, 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roadmaps r
      JOIN diagnostics d ON d.id = r.diagnostic_id
      WHERE r.id = roadmap_actions.roadmap_id
        AND has_team_role(d.company_id, 'editor')
    )
  );

-- =========================================================================
-- TRAININGS (public content for authenticated users)
-- =========================================================================
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY trainings_authenticated_select ON trainings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admin can manage trainings
CREATE POLICY trainings_admin_all ON trainings
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =========================================================================
-- USER_TRAINING_PROGRESS
-- =========================================================================
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_training_progress_own ON user_training_progress
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- WHITE_LABEL_CONFIGS
-- =========================================================================
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY white_label_configs_owner_all ON white_label_configs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- CONSULTANT_CLIENTS
-- =========================================================================
ALTER TABLE consultant_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY consultant_clients_consultant_all ON consultant_clients
  FOR ALL
  USING (consultant_id = auth.uid())
  WITH CHECK (consultant_id = auth.uid());

-- Company owner can see their own consultant relationship
CREATE POLICY consultant_clients_company_select ON consultant_clients
  FOR SELECT
  USING (is_company_owner(company_id));

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_own_select ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY notifications_own_update ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_own_delete ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- System inserts via service_role key

-- =========================================================================
-- SUPPORT_PACKS
-- =========================================================================
ALTER TABLE support_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_packs_owner_all ON support_packs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- SUPPORT_SESSIONS
-- =========================================================================
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_sessions_owner_all ON support_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM support_packs sp
      WHERE sp.id = support_sessions.pack_id
        AND sp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_packs sp
      WHERE sp.id = support_sessions.pack_id
        AND sp.user_id = auth.uid()
    )
  );

-- =========================================================================
-- AFFILIATES
-- =========================================================================
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliates_owner_all ON affiliates
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- REFERRALS
-- =========================================================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referrals_affiliate_select ON referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliates a
      WHERE a.id = referrals.affiliate_id
        AND a.user_id = auth.uid()
    )
  );

-- No direct insert/update/delete by users (managed by system)

-- =========================================================================
-- TEAM_MEMBERS
-- =========================================================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Company owner: full CRUD
CREATE POLICY team_members_owner_all ON team_members
  FOR ALL
  USING (is_company_owner(company_id))
  WITH CHECK (is_company_owner(company_id));

-- Members can SELECT their own row
CREATE POLICY team_members_self_select ON team_members
  FOR SELECT
  USING (user_id = auth.uid());

-- =========================================================================
-- AUDIT_LOGS
-- =========================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT
CREATE POLICY audit_logs_admin_select ON audit_logs
  FOR SELECT
  USING (is_admin());

-- System inserts via service_role key (bypasses RLS)

-- =========================================================================
-- LEAN TOOL TABLES (access through diagnostic -> company)
-- =========================================================================

-- VSM Maps
ALTER TABLE vsm_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY vsm_maps_owner_all ON vsm_maps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = vsm_maps.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = vsm_maps.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY vsm_maps_team_select ON vsm_maps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = vsm_maps.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY vsm_maps_consultant_select ON vsm_maps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = vsm_maps.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- Ishikawa Diagrams
ALTER TABLE ishikawa_diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY ishikawa_diagrams_owner_all ON ishikawa_diagrams
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = ishikawa_diagrams.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = ishikawa_diagrams.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY ishikawa_diagrams_team_select ON ishikawa_diagrams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = ishikawa_diagrams.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY ishikawa_diagrams_consultant_select ON ishikawa_diagrams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = ishikawa_diagrams.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- A3 Reports
ALTER TABLE a3_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY a3_reports_owner_all ON a3_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = a3_reports.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = a3_reports.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY a3_reports_team_select ON a3_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = a3_reports.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY a3_reports_consultant_select ON a3_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = a3_reports.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- SWOT Analyses
ALTER TABLE swot_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY swot_analyses_owner_all ON swot_analyses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = swot_analyses.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = swot_analyses.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY swot_analyses_team_select ON swot_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = swot_analyses.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY swot_analyses_consultant_select ON swot_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = swot_analyses.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- =========================================================================
-- STRATEGY TOOL TABLES (access through diagnostic -> company)
-- =========================================================================

-- STEEPLE Analyses
ALTER TABLE steeple_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY steeple_analyses_owner_all ON steeple_analyses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = steeple_analyses.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = steeple_analyses.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY steeple_analyses_team_select ON steeple_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = steeple_analyses.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY steeple_analyses_consultant_select ON steeple_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = steeple_analyses.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- Porter Analyses
ALTER TABLE porter_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY porter_analyses_owner_all ON porter_analyses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = porter_analyses.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = porter_analyses.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY porter_analyses_team_select ON porter_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = porter_analyses.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY porter_analyses_consultant_select ON porter_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = porter_analyses.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- BCG Matrices
ALTER TABLE bcg_matrices ENABLE ROW LEVEL SECURITY;

CREATE POLICY bcg_matrices_owner_all ON bcg_matrices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = bcg_matrices.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = bcg_matrices.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY bcg_matrices_team_select ON bcg_matrices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = bcg_matrices.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY bcg_matrices_consultant_select ON bcg_matrices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = bcg_matrices.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- Hoshin Matrices
ALTER TABLE hoshin_matrices ENABLE ROW LEVEL SECURITY;

CREATE POLICY hoshin_matrices_owner_all ON hoshin_matrices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = hoshin_matrices.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = hoshin_matrices.diagnostic_id
        AND is_company_owner(d.company_id)
    )
  );

CREATE POLICY hoshin_matrices_team_select ON hoshin_matrices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = hoshin_matrices.diagnostic_id
        AND is_team_member(d.company_id)
    )
  );

CREATE POLICY hoshin_matrices_consultant_select ON hoshin_matrices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostics d
      WHERE d.id = hoshin_matrices.diagnostic_id
        AND is_consultant_of(d.company_id)
    )
  );

-- =========================================================================
-- KNOWLEDGE TABLES (owner-based + public access)
-- =========================================================================

-- Knowledge Bases
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_bases_owner_all ON knowledge_bases
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY knowledge_bases_public_select ON knowledge_bases
  FOR SELECT
  USING (is_public = true AND auth.role() = 'authenticated');

CREATE POLICY knowledge_bases_admin_all ON knowledge_bases
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Knowledge Documents
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_documents_owner_all ON knowledge_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_bases kb
      WHERE kb.id = knowledge_documents.knowledge_base_id
        AND kb.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_bases kb
      WHERE kb.id = knowledge_documents.knowledge_base_id
        AND kb.owner_id = auth.uid()
    )
  );

CREATE POLICY knowledge_documents_public_select ON knowledge_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_bases kb
      WHERE kb.id = knowledge_documents.knowledge_base_id
        AND kb.is_public = true
    )
  );

CREATE POLICY knowledge_documents_admin_all ON knowledge_documents
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Knowledge Chunks
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_chunks_owner_all ON knowledge_chunks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      JOIN knowledge_bases kb ON kb.id = kd.knowledge_base_id
      WHERE kd.id = knowledge_chunks.document_id
        AND kb.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      JOIN knowledge_bases kb ON kb.id = kd.knowledge_base_id
      WHERE kd.id = knowledge_chunks.document_id
        AND kb.owner_id = auth.uid()
    )
  );

CREATE POLICY knowledge_chunks_public_select ON knowledge_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      JOIN knowledge_bases kb ON kb.id = kd.knowledge_base_id
      WHERE kd.id = knowledge_chunks.document_id
        AND kb.is_public = true
    )
  );

CREATE POLICY knowledge_chunks_admin_all ON knowledge_chunks
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =========================================================================
-- Grant usage on helper functions to authenticated role
-- =========================================================================
GRANT EXECUTE ON FUNCTION public.is_company_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_consultant_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_team_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
