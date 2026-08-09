# ConstruTrack

ConstruTrack é uma plataforma completa de gestão operacional para empresas de construção civil, com módulo web para gestão diária e CLI para automação administrativa e relatórios.

## Visão geral

O projeto reúne funcionalidades para:
- gestão de obras e orçamento;
- ponto eletrónico com geolocalização e selfie;
- RH e onboarding de colaboradores;
- compras, cotações e aprovações;
- relatórios ACT e resumos de conformidade.

## Stack

| Camada | Tecnologia | Custo |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Grátis (Vercel) |
| Base de dados | Supabase PostgreSQL | Grátis |
| Autenticação | Supabase Auth | Grátis |
| Storage | Supabase Storage | Grátis |
| CLI admin | Python + Typer | Local |

---

## Instalação rápida

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd construtrack
```

### 2. Configurar a aplicação web

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

### 3. Configurar o CLI Python

```bash
cd ../cli
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
```

### 4. Configurar a base de dados

Consulte [docs/SETUP.md](docs/SETUP.md) para instruções completas de configuração do Supabase.

---

## Documentação

- [docs/SETUP.md](docs/SETUP.md) — instalação e configuração local
- [docs/DEPLOY.md](docs/DEPLOY.md) — deploy em produção
- [CONTRIBUTING.md](CONTRIBUTING.md) — boas práticas para contribuições

---

## Instalação — Web (Next.js)

### 1. Clonar e instalar dependências

```bash
cd web
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Preencher com as chaves do Supabase
```

As chaves estão em: **Supabase Dashboard → Settings → API**

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Iniciar em desenvolvimento

```bash
npm run dev
# Abrir http://localhost:3000
```

### 4. Deploy na Vercel

```bash
npm install -g vercel
vercel
# Seguir as instruções e adicionar as variáveis de ambiente
```

---

## Instalação — Base de dados (Supabase)

### 1. Criar projeto no Supabase

Aceder a [supabase.com](https://supabase.com) → New Project

### 2. Executar o schema SQL

1. No dashboard do Supabase: **SQL Editor → New Query**
2. Copiar o conteúdo de `supabase/migrations/001_schema_completo.sql`
3. Colar e clicar **Run**

### 3. Criar buckets de storage

No dashboard: **Storage → New Bucket** — criar os seguintes (todos privados):

| Bucket | Uso |
|---|---|
| `selfies` | Fotos de ponto eletrónico |
| `documentos-rh` | Documentos dos funcionários |
| `fotos-obra` | Fotos de requisições |
| `guias-remessa` | Guias de remessa e faturas |

### 4. Criar primeiro utilizador administrador

No dashboard: **Authentication → Users → Invite user**

Depois executar no SQL Editor:
```sql
-- Substituir pelo email e UUID do utilizador criado
INSERT INTO perfis (id, nome_completo, email, papel)
VALUES (
  'UUID_DO_UTILIZADOR',  -- copiar de Authentication > Users
  'Nome Completo',
  'email@empresa.pt',
  'administrador'
);
```

---

## Instalação — CLI (Typer / Python)

### 1. Criar ambiente virtual e instalar dependências

```bash
cd cli
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Preencher SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
```

### 3. Verificar ligação

```bash
python main.py status
```

### 4. Exemplos de uso

```bash
# Ver todas as obras ativas
python main.py obras

# Listar presenças de hoje numa obra
python main.py ponto listar UUID_OBRA

# Registar ponto manualmente (ponto coletivo)
python main.py ponto registar UUID_FUNC UUID_OBRA \
  --tipo entrada --lat 38.8029 --lon -9.3817 --manual

# Alertas de documentos SHT
python main.py rh alertas-docs --dias 30

# Criar link de onboarding para candidato
python main.py rh link-onboarding \
  --nome "João Silva" --email joao@email.com

# Criar novo funcionário (modo interativo)
python main.py rh criar-funcionario

# Listar requisições pendentes
python main.py compras listar --pendentes

# Aprovar requisição
python main.py compras aprovar UUID_REQUISICAO

# Ver cotações comparativas
python main.py compras cotacoes UUID_REQUISICAO

# Gerar relatório ACT em PDF
python main.py relatorios gerar UUID_OBRA --mes 4 --ano 2026

# Resumo de conformidade no terminal
python main.py relatorios resumo UUID_OBRA --mes 4

# Ajuda geral
python main.py --help
python main.py ponto --help
python main.py rh --help
```

---

## Estrutura de ficheiros

```
construtrack/
├── web/                          # Next.js — interface web
│   ├── app/
│   │   ├── (app)/                # Páginas autenticadas
│   │   │   ├── dashboard/        # Dashboard principal
│   │   │   ├── ponto/            # Ponto eletrónico
│   │   │   ├── rh/               # RH e onboarding
│   │   │   ├── compras/          # Compras e logística
│   │   │   └── relatorios/       # Relatórios ACT
│   │   ├── login/                # Página de login
│   │   └── onboarding/[token]/   # Onboarding público para candidatos
│   ├── components/
│   │   ├── ui/                   # Sidebar, botões, etc.
│   │   └── modules/              # Componentes por módulo
│   ├── lib/
│   │   ├── supabase/             # Clientes Supabase
│   │   └── actions/              # Server Actions (rh.ts, compras.ts)
│   └── types/                    # TypeScript types
│
├── cli/                          # Python Typer CLI
│   ├── main.py                   # Ponto de entrada
│   ├── ponto.py                  # Comandos de ponto
│   ├── rh.py                     # Comandos de RH
│   ├── compras.py                # Comandos de compras
│   ├── relatorios.py             # Geração de PDF ACT
│   ├── db.py                     # Cliente Supabase
│   └── requirements.txt
│
└── supabase/
    └── migrations/
        └── 001_schema_completo.sql   # Schema completo da BD
```

---

## Módulos implementados

### Dashboard
- Métricas macro: funcionários, obras, alertas, aprovações pendentes
- Gráfico de rentabilidade (custo real vs orçado) por obra
- Alertas SHT em destaque
- Requisições pendentes de aprovação

### Ponto Eletrónico
- Registo com GPS (Geolocation API do browser)
- Geofencing: verificação automática de perímetro
- Selfie para verificação de presença
- Tabela de presenças em tempo real
- Histórico com colunas GPS e selfie

### RH & Onboarding
- Alertas automáticos de documentos SHT a expirar
- Link único de onboarding para candidatos
- Upload guiado de documentos pelo candidato
- Dossiê digital criado automaticamente (pasta `NOME_NIF`)
- Tabela de funcionários com estado de conformidade

### Compras & Logística
- Requisições de material com fotos da obra
- Tabela comparativa de cotações com suporte a PDF
- Fluxo de aprovação por valor (direto / financeiro / diretoria)
- IVA Autoliquidação sinalizado
- Registo de receção de materiais com guia de remessa

### Relatórios ACT
- Geração de PDF com todas as batidas do período
- Inclui: hora, GPS, selfie, geofence, horas extra
- Resumo de conformidade no terminal (CLI)

---

## Hierarquia de permissões (RLS)

| Papel | Acesso |
|---|---|
| `administrador` | Tudo |
| `gerente_obra` | Obras próprias + ponto + compras |
| `rh_dp` | Funcionários + documentos + alertas |
| `financeiro` | Compras + aprovações + relatórios |
| `engenheiro` | Requisições + receção de materiais |
| `encarregado` | Ponto coletivo da equipa |

---

## Próximo passo para publicar no GitHub

1. Inicializar o Git no projeto.
2. Adicionar um repositório remoto.
3. Fazer o primeiro commit e enviar para o GitHub.

Exemplo:

```bash
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/construtrack.git
git push -u origin main
```

---

## Conceitos Typer aprendidos

| Conceito | Ficheiro | Linha |
|---|---|---|
| `typer.run()` + type hints | ponto.py | `registar()` |
| `@app.command()` + Enum | ponto.py, rh.py | subcomandos |
| `typer.Option` com prompt | rh.py | `criar_funcionario()` |
| `typer.confirm(abort=True)` | compras.py | `aprovar()` |
| `typer.secho` com cores | todos | vários |
| `typer.launch()` | rh.py | `link_onboarding()` |
| Rich Table | todos | `listar()` |
| Rich Progress | relatorios.py | `gerar()` |
| Callback de validação | rh.py | NIF validation |
| `app.add_typer()` (subcomandos) | main.py | topo |
