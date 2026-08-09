// web/components/modules/GerarRelatorioPDF.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Loader, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Obra { id: string; nome: string }
interface Props { obras: Obra[] }

export default function GerarRelatorioPDF({ obras }: Props) {
  const supabase = createClient()
  const [obraId, setObraId] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  async function gerarPDF() {
    if (!obraId) { toast.error('Selecione uma obra'); return }
    setLoading(true)

    try {
      // Importar jsPDF dinamicamente (só no browser)
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default
      await import('jspdf-autotable')

      // Buscar dados do período
      const inicio = new Date(ano, mes - 1, 1).toISOString()
      const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

      const { data: pontos } = await supabase
        .from('registos_ponto')
        .select('*, funcionarios(nome_completo, nif)')
        .eq('obra_id', obraId)
        .gte('data_hora', inicio)
        .lte('data_hora', fim)
        .order('data_hora')

      const { data: obra } = await supabase
        .from('obras').select('nome, cidade').eq('id', obraId).single()

      const { data: conf } = await supabase
        .from('configuracao').select('nome_empresa, nif_empresa').single()

      // Criar PDF
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // Cabeçalho
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('RELATÓRIO DE PONTO ELETRÓNICO — ACT', 14, 18)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Empresa: ${conf?.nome_empresa ?? ''}  |  NIF: ${conf?.nif_empresa ?? ''}`, 14, 26)
      doc.text(`Obra: ${obra?.nome ?? ''}  |  Período: ${mes.toString().padStart(2,'0')}/${ano}`, 14, 32)
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 38)

      // Linha separadora
      doc.setDrawColor(200)
      doc.line(14, 42, 283, 42)

      // Agrupar pontos por funcionário e data
      const linhas: any[] = []
      if (pontos) {
        const agrupado: Record<string, any[]> = {}
        pontos.forEach(p => {
          const key = `${p.funcionario_id}_${p.data_hora.split('T')[0]}`
          if (!agrupado[key]) agrupado[key] = []
          agrupado[key].push(p)
        })

        Object.values(agrupado).forEach(registos => {
          const entrada = registos.find(r => r.tipo === 'entrada')
          const saida   = registos.find(r => r.tipo === 'saida')
          const func    = registos[0].funcionarios

          const horaEntrada = entrada ? new Date(entrada.data_hora).toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' }) : '—'
          const horaSaida   = saida   ? new Date(saida.data_hora).toLocaleTimeString('pt-PT',   { hour:'2-digit', minute:'2-digit' }) : '—'

          let horasTotal = '—'
          if (entrada && saida) {
            const diff = (new Date(saida.data_hora).getTime() - new Date(entrada.data_hora).getTime()) / 3600000
            horasTotal = diff.toFixed(2) + 'h'
          }

          linhas.push([
            new Date(registos[0].data_hora).toLocaleDateString('pt-PT'),
            func?.nome_completo ?? '—',
            func?.nif ? func.nif.slice(0,6)+'***' : '—',
            horaEntrada,
            horaSaida,
            horasTotal,
            entrada?.dentro_geofence ? '✓' : '✗',
            entrada?.biometria_ok    ? '✓' : '✗',
            entrada?.estado === 'valido' ? 'Válido' : entrada?.estado ?? '—',
          ])
        })
      }

      // Tabela
      ;(doc as any).autoTable({
        startY: 48,
        head: [['Data','Funcionário','NIF','Entrada','Saída','Total','Geofence','Selfie','Estado']],
        body: linhas,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 92], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 22 }, 1: { cellWidth: 50 }, 2: { cellWidth: 25 },
          3: { cellWidth: 18 }, 4: { cellWidth: 18 }, 5: { cellWidth: 18 },
          6: { cellWidth: 18 }, 7: { cellWidth: 15 }, 8: { cellWidth: 22 },
        },
      })

      // Rodapé
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(
          `ConstruTrack — Documento gerado automaticamente para fins de fiscalização ACT — Página ${i} de ${pageCount}`,
          14, doc.internal.pageSize.height - 6
        )
      }

      // Guardar
      const nomeArquivo = `Relatorio_ACT_${obra?.nome?.replace(/\s/g,'_')}_${mes.toString().padStart(2,'0')}_${ano}.pdf`
      doc.save(nomeArquivo)
      toast.success(`PDF gerado: ${nomeArquivo}`)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao gerar PDF')
    } finally {
      setLoading(false)
    }
  }

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  return (
    <div className="card">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" /> Gerar relatório PDF
      </h2>
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="label">Estaleiro</label>
          <select className="input w-56" value={obraId} onChange={e => setObraId(e.target.value)}>
            <option value="">Selecionar obra...</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Mês</label>
          <select className="input w-36" value={mes} onChange={e => setMes(Number(e.target.value))}>
            {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ano</label>
          <select className="input w-24" value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button onClick={gerarPDF} disabled={loading} className="btn btn-primary">
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? 'A gerar PDF...' : 'Baixar PDF ACT'}
        </button>
      </div>
    </div>
  )
}
