// web/app/(app)/admin/integracoes/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Link2, Check, X, RefreshCw, ExternalLink } from 'lucide-react'

const KANBAN_PROVIDERS = [
  { 
    id: 'trello', 
    name: 'Trello', 
    desc: 'Gestão de tarefas em quadro Kanban',
    fields: ['api_key', 'token', 'board_id'],
    docs: 'https://trello.com/app-key'
  },
  { 
    id: 'jira', 
    name: 'Jira', 
    desc: 'Gestão de projetos ágeis',
    fields: ['domain', 'email', 'api_token', 'project_key'],
    docs: 'https://id.atlassian.com/manage-profile/security/api-tokens'
  },
  { 
    id: 'monday', 
    name: 'Monday.com', 
    desc: 'Gestão de trabalho online',
    fields: ['api_token', 'board_id'],
    docs: 'https://monday.com/developers/v2'
  },
  { 
    id: 'notion', 
    name: 'Notion', 
    desc: 'Base de conhecimento e tarefas',
    fields: ['api_token', 'database_id'],
    docs: 'https://www.notion.so/my-integrations'
  },
]

interface Integracao {
  id: string
  provider: string
  config: Record<string, string>
  ativo: boolean
}

export default function IntegracoesPage() {
  const supabase = createClient()
  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(KANBAN_PROVIDERS[0])
  const [form, setForm] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadIntegracoes()
  }, [])

  async function loadIntegracoes() {
    const { data } = await (supabase as any).from('integracoes').select('*')
    setIntegracoes(data ?? [])
    setLoading(false)
  }

  function openModal(provider: typeof KANBAN_PROVIDERS[0]) {
    setSelectedProvider(provider)
    const existing = integracoes.find(i => i.provider === provider.id)
    setForm(existing?.config || {})
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    const existing = integracoes.find(i => i.provider === selectedProvider.id)
    
    if (existing) {
      const { error } = await (supabase as any).from('integracoes')
        .update({ config: form, ativo: true })
        .eq('id', existing.id)
      if (error) toast.error(error.message)
      else toast.success('Integração atualizada!')
    } else {
      const { error } = await (supabase as any).from('integracoes')
        .insert({ provider: selectedProvider.id, config: form, ativo: true })
      if (error) toast.error(error.message)
      else toast.success('Integração criada!')
    }
    
    loadIntegracoes()
    setShowModal(false)
  }

  async function handleTest(integracao: Integracao) {
    setTesting(true)
    
    try {
      const res = await fetch('/api/integracoes/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integracao)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Conectado ao ${integracao.provider}!`)
      } else {
        toast.error(data.error || 'Erro ao conectar')
      }
    } catch {
      toast.error('Erro ao testar conexão')
    }
    
    setTesting(false)
  }

  async function handleToggle(integracao: Integracao) {
    await (supabase as any).from('integracoes')
      .update({ ativo: !integracao.ativo })
      .eq('id', integracao.id)
    loadIntegracoes()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta integração?')) return
    await (supabase as any).from('integracoes').delete().eq('id', id)
    toast.success('Eliminado')
    loadIntegracoes()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Integrações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Conecte com Trello, Jira, Monday ou Notion</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {KANBAN_PROVIDERS.map(provider => {
          const integracao = integracoes.find(i => i.provider === provider.id)
          
          return (
            <div key={provider.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                  <p className="text-xs text-gray-500">{provider.desc}</p>
                </div>
                {integracao && (
                  <span className={`pill ${integracao.ativo ? 'pill-green' : 'pill-gray'}`}>
                    {integracao.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => openModal(provider)}
                  className="btn flex-1"
                >
                  <Link2 className="w-4 h-4" />
                  {integracao ? 'Configurar' : 'Conectar'}
                </button>
                
                {integracao && (
                  <>
                    <button 
                      onClick={() => handleTest(integracao)}
                      disabled={testing}
                      className="btn"
                    >
                      <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                      onClick={() => handleToggle(integracao)}
                      className={`btn ${integracao.ativo ? 'btn-danger' : 'btn-primary'}`}
                    >
                      {integracao.ativo ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Configuração */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Configurar {selectedProvider.name}</h2>
            <p className="text-sm text-gray-500 mb-4">
              <a 
                href={selectedProvider.docs} 
                target="_blank" 
                className="flex items-center gap-1 text-blue-600 hover:underline inline-flex"
              >
                <ExternalLink className="w-3 h-3" /> Obter API Key
              </a>
            </p>
            
            <form onSubmit={handleSave} className="space-y-4">
              {selectedProvider.fields.map(field => (
                <div key={field}>
                  <label className="label capitalize">{field.replace('_', ' ')}</label>
                  <input
                    type={field.includes('token') || field.includes('key') ? 'password' : 'text'}
                    className="input"
                    value={form[field] || ''}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    required
                  />
                </div>
              ))}
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}