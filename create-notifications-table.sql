-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('order', 'driver', 'system', 'payment', 'invitation', 'alert')),
  "isRead" BOOLEAN DEFAULT FALSE,
  "actionUrl" VARCHAR(500),
  data JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications("createdAt" DESC);
