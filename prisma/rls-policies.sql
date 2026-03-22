-- ===========================================================================
-- DiagOptim™ — Row Level Security (RLS) Policies
-- ===========================================================================
-- Apply after Prisma migrations. Requires Supabase with RLS enabled.
-- Each user sees only THEIR data.
-- Consultants see data of THEIR clients only.
-- Team members see data of THEIR company according to role.
-- ===========================================================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Diagnostic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiagnosticAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiagnosticInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Roadmap" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoadmapAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Training" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserTrainingProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsultantClient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhiteLabelConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportPack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Affiliate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VsmMap" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IshikawaDiagram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "A3Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SwotAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SteepleAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PorterAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BcgMatrix" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HoshinMatrix" ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- User
-- ===========================================================================

CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid() = id);

-- ===========================================================================
-- Company
-- ===========================================================================

CREATE POLICY "Users can view own company" ON "Company"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own company" ON "Company"
  FOR ALL USING (auth.uid() = "userId");

CREATE POLICY "Consultants can view client companies" ON "Company"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ConsultantClient"
      WHERE "consultantId" = auth.uid()
        AND "companyId" = "Company".id
        AND status = 'active'
    )
  );

CREATE POLICY "Team members can view their company" ON "Company"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "TeamMember"
      WHERE "userId" = auth.uid()
        AND "companyId" = "Company".id
        AND status = 'active'
    )
  );

-- ===========================================================================
-- Diagnostic
-- ===========================================================================

CREATE POLICY "Owner can manage diagnostics" ON "Diagnostic"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Company"
      WHERE id = "Diagnostic"."companyId"
        AND "userId" = auth.uid()
    )
  );

CREATE POLICY "Team members can view diagnostics" ON "Diagnostic"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "TeamMember" tm
      JOIN "Company" c ON c.id = tm."companyId"
      WHERE c.id = "Diagnostic"."companyId"
        AND tm."userId" = auth.uid()
        AND tm.status = 'active'
    )
  );

CREATE POLICY "Consultants can view client diagnostics" ON "Diagnostic"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ConsultantClient"
      WHERE "consultantId" = auth.uid()
        AND "companyId" = "Diagnostic"."companyId"
        AND status = 'active'
    )
  );

-- ===========================================================================
-- DiagnosticAnswer
-- ===========================================================================

CREATE POLICY "Owner can manage diagnostic answers" ON "DiagnosticAnswer"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "DiagnosticAnswer"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

-- ===========================================================================
-- DiagnosticInsight
-- ===========================================================================

CREATE POLICY "Owner can view diagnostic insights" ON "DiagnosticInsight"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "DiagnosticInsight"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

-- ===========================================================================
-- Document (CRITICAL: strict access)
-- ===========================================================================

CREATE POLICY "Only company owner can manage documents" ON "Document"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Company"
      WHERE id = "Document"."companyId"
        AND "userId" = auth.uid()
    )
  );

CREATE POLICY "Consultants can view client documents" ON "Document"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ConsultantClient"
      WHERE "consultantId" = auth.uid()
        AND "companyId" = "Document"."companyId"
        AND status = 'active'
    )
  );

-- ===========================================================================
-- Roadmap & RoadmapAction
-- ===========================================================================

CREATE POLICY "Owner can manage roadmaps" ON "Roadmap"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "Roadmap"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Team can view roadmaps" ON "Roadmap"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      JOIN "TeamMember" tm ON tm."companyId" = c.id
      WHERE d.id = "Roadmap"."diagnosticId"
        AND tm."userId" = auth.uid()
        AND tm.status = 'active'
    )
  );

CREATE POLICY "Owner can manage roadmap actions" ON "RoadmapAction"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Roadmap" r
      JOIN "Diagnostic" d ON d.id = r."diagnosticId"
      JOIN "Company" c ON c.id = d."companyId"
      WHERE r.id = "RoadmapAction"."roadmapId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Team can update roadmap actions" ON "RoadmapAction"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Roadmap" r
      JOIN "Diagnostic" d ON d.id = r."diagnosticId"
      JOIN "Company" c ON c.id = d."companyId"
      JOIN "TeamMember" tm ON tm."companyId" = c.id
      WHERE r.id = "RoadmapAction"."roadmapId"
        AND tm."userId" = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin', 'editor')
    )
  );

-- ===========================================================================
-- Training & UserTrainingProgress
-- ===========================================================================

-- Training content is public read (available to all authenticated users)
CREATE POLICY "Authenticated users can view training" ON "Training"
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own training progress" ON "UserTrainingProgress"
  FOR ALL USING (auth.uid() = "userId");

-- ===========================================================================
-- Notification
-- ===========================================================================

CREATE POLICY "Users can view own notifications" ON "Notification"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can update own notifications" ON "Notification"
  FOR UPDATE USING (auth.uid() = "userId");

-- ===========================================================================
-- Subscription
-- ===========================================================================

CREATE POLICY "Users can view own subscription" ON "Subscription"
  FOR SELECT USING (auth.uid() = "userId");

-- ===========================================================================
-- TeamMember
-- ===========================================================================

CREATE POLICY "Company owner can manage team" ON "TeamMember"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Company"
      WHERE id = "TeamMember"."companyId"
        AND "userId" = auth.uid()
    )
  );

CREATE POLICY "Team members can view team" ON "TeamMember"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "TeamMember" self
      WHERE self."companyId" = "TeamMember"."companyId"
        AND self."userId" = auth.uid()
        AND self.status = 'active'
    )
  );

-- ===========================================================================
-- ConsultantClient
-- ===========================================================================

CREATE POLICY "Consultants can manage own clients" ON "ConsultantClient"
  FOR ALL USING (auth.uid() = "consultantId");

CREATE POLICY "Clients can view consultant relationship" ON "ConsultantClient"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Company"
      WHERE id = "ConsultantClient"."companyId"
        AND "userId" = auth.uid()
    )
  );

-- ===========================================================================
-- WhiteLabelConfig
-- ===========================================================================

CREATE POLICY "Consultants can manage own white-label" ON "WhiteLabelConfig"
  FOR ALL USING (auth.uid() = "consultantId");

-- ===========================================================================
-- SupportPack & SupportSession
-- ===========================================================================

CREATE POLICY "Users can view own support packs" ON "SupportPack"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can view own support sessions" ON "SupportSession"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "SupportPack"
      WHERE id = "SupportSession"."packId"
        AND "userId" = auth.uid()
    )
  );

-- ===========================================================================
-- Affiliate & Referral
-- ===========================================================================

CREATE POLICY "Users can manage own affiliate" ON "Affiliate"
  FOR ALL USING (auth.uid() = "userId");

CREATE POLICY "Affiliates can view own referrals" ON "Referral"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Affiliate"
      WHERE id = "Referral"."affiliateId"
        AND "userId" = auth.uid()
    )
  );

-- ===========================================================================
-- AuditLog
-- ===========================================================================

CREATE POLICY "Users can view own audit logs" ON "AuditLog"
  FOR SELECT USING (auth.uid() = "userId");

-- ===========================================================================
-- Methodological tools (VSM, Ishikawa, A3, SWOT, etc.)
-- All linked to diagnostics, so follow diagnostic access pattern
-- ===========================================================================

CREATE POLICY "Owner can manage VSM maps" ON "VsmMap"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "VsmMap"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Owner can manage Ishikawa diagrams" ON "IshikawaDiagram"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "IshikawaDiagram"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Owner can manage A3 reports" ON "A3Report"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "A3Report"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Owner can manage SWOT analyses" ON "SwotAnalysis"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "SwotAnalysis"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Owner can manage STEEPLE analyses" ON "SteepleAnalysis"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "SteepleAnalysis"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Owner can manage Porter analyses" ON "PorterAnalysis"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "PorterAnalysis"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Owner can manage BCG matrices" ON "BcgMatrix"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "BcgMatrix"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );

CREATE POLICY "Owner can manage Hoshin matrices" ON "HoshinMatrix"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Diagnostic" d
      JOIN "Company" c ON c.id = d."companyId"
      WHERE d.id = "HoshinMatrix"."diagnosticId"
        AND c."userId" = auth.uid()
    )
  );
