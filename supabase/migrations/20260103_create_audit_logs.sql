-- Migration: Create audit_logs table
-- Description: Creates audit_logs table for tracking all CRUD operations
-- Date: 2026-01-03

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add comment to table
COMMENT ON TABLE audit_logs IS 'Audit log table for tracking all CRUD operations with user context and change history';

-- Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can see audit logs for their organization
CREATE POLICY "Users can view their organization's audit logs"
ON audit_logs FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM organizations WHERE id = organization_id
  )
);

-- Create RLS policy: Users can insert audit logs for their organization
CREATE POLICY "Users can insert audit logs for their organization"
ON audit_logs FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE id = organization_id
  )
);

-- Grant permissions to authenticated users
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;

-- Create retention policy (optional - uncomment to enable automatic cleanup)
-- This function will delete audit logs older than 90 days
/*
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup job (requires pg_cron extension)
-- Uncomment to enable automatic cleanup
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', $$SELECT cleanup_old_audit_logs()$$);
*/

-- Create view for recent audit activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
  al.id,
  al.user_id,
  al.organization_id,
  al.table_name,
  al.record_id,
  al.action,
  al.created_at,
  u.email as user_email
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
WHERE al.created_at > NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC
LIMIT 1000;
