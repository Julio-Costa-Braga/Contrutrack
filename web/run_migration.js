const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS lembrete BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS lembrete_dias INTEGER DEFAULT 0;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS recorrente BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS recorrente_tipo TEXT CHECK (recorrente_tipo IN ('mensal', 'trimestral', 'anual'));
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES funcionarios(id);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS mes_referencia TEXT;
`;

supabase.rpc('exec', { sql }).then(r => {
  console.log('SUCCESS:', JSON.stringify(r));
}).catch(e => {
  console.log('ERROR:', e.message);
  if (e.details) console.log('DETAILS:', e.details);
});
