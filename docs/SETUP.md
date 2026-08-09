# Setup do projeto

## Requisitos

- Node.js 18+
- npm
- Python 3.10+
- Conta no Supabase

## 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd construtrack
```

## 2. Configurar a aplicação web

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

## 3. Configurar o CLI Python

```bash
cd ../cli
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
```

## 4. Configurar a base de dados

1. Crie um projeto no Supabase.
2. Aplique os ficheiros SQL presentes em [supabase/migrations](../supabase/migrations).
3. Crie os buckets de storage necessários.

## 5. Variáveis de ambiente

As variáveis obrigatórias para a web são:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
