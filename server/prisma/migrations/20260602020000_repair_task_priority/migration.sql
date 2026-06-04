DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskPriority') THEN
    CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');
  END IF;
END $$;

ALTER TABLE "Task"
ADD COLUMN IF NOT EXISTS "priority" "TaskPriority" NOT NULL DEFAULT 'medium';
