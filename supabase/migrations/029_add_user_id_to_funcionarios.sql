-- Adicionar coluna user_id para ligar ao auth.users
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) UNIQUE;

-- Atualizar registos existentes se possível (assumindo que o email corresponde)
UPDATE funcionarios f
SET user_id = u.id
FROM auth.users u
WHERE f.user_id IS NULL AND f.email = u.email;
