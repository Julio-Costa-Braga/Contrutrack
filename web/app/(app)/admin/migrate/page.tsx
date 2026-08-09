// web/app/(app)/admin/migrate/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function MigratePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  async function runMigration() {
    setLoading(true)
    setResult('')
    
    const queries = [
      `ALTER TABLE obras ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Portugal'`,
      `ALTER TABLE obras ADD COLUMN IF NOT EXISTS rua TEXT`,
      `ALTER TABLE obras ADD COLUMN IF NOT EXISTS numero TEXT`,
      `ALTER TABLE obras ADD COLUMN IF NOT EXISTS codigo_postal TEXT`,
      `ALTER TABLE registos_ponto ADD COLUMN IF NOT EXISTS contruck_track BOOLEAN DEFAULT false`
    ]
    
    try {
      for (const sql of queries) {
        const res = await fetch('/api/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        })
        const data = await res.json()
        if (data.error) {
          setResult(prev => prev + `Erro: ${data.error}\n`)
        }
      }
      setResult(prev => prev + 'Migração concluída com sucesso!\n')
      toast.success('Base de dados atualizada!')
      setTimeout(() => router.push('/obras/nova'), 1500)
    } catch (err: any) {
      setResult(`Erro: ${err.message}`)
      toast.error('Erro ao executar migração')
    }
    
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Migração da Base de Dados</h1>
      <p className="text-gray-600 mb-6">
        Esta página irá adicionar as novas colunas (pais, rua, numero, codigo_postal) à tabela 'obras' e (contruck_track) à tabela 'registos_ponto'.
        Necessário para criar obras com o novo formulário e registar pontos com Contruck Track.
      </p>
      
      <button
        onClick={runMigration}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'A executar...' : 'Executar Migração'}
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  )
}
