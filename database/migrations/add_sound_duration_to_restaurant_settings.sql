-- ============================================
-- Add NewOrderSoundDuration to RestaurantSettings
-- ============================================
-- Adds a column to store the duration (in seconds) for new order notification sounds
-- Created: 2025-01-XX
-- For: Kitchen Sound Settings Feature

-- Add the new column
ALTER TABLE public.RestaurantSettings
ADD COLUMN IF NOT EXISTS NewOrderSoundDuration integer DEFAULT 2;

-- Add comment
COMMENT ON COLUMN public.RestaurantSettings.NewOrderSoundDuration IS 'Duration in seconds for new order notification sound (default: 2 seconds)';

-- Ensure there's at least one row in the table
INSERT INTO public.RestaurantSettings (WorkingHours, IsClosed, NewOrderSoundDuration)
VALUES (NULL, 0, 2)
ON CONFLICT DO NOTHING;
