-- Add qr_data column to store QR code string data
-- This is separate from qr_code which stores the QR image (Data URL)

ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_data TEXT;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_qr_data ON users(qr_data);

-- Update existing users with email as qr_data (temporary for existing users)
UPDATE users
SET qr_data = email
WHERE qr_data IS NULL AND role = 'pengguna';
