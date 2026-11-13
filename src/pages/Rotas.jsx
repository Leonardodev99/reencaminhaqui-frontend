import { useEffect, useState } from 'react'
import { canaisApi, rotasApi } from '../api'
import { Badge, PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Rotas.css'

const NUMERO = /^\+\d{8,15}$/
const ESTADOS = ['ATIVA', 'PAUSADA']

function validar(form) {
  const erros = {}
  if (!NUMERO.test(form.numeroOrigem)) erros.numeroOrigem = 'Use + e 8 a 15 dígitos, sem espaços (ex.: +17372508034).'
  if (!NUMERO.test(form.numeroDestino)) erros.numeroDestino = 'Use + e 8 a 15 dígitos, sem espaços (ex.: +244921687594).'
  if (!erros.numeroOrigem && form.numeroOrigem === form.numeroDestino)
    erros.numeroDestino = 'O destino tem de ser diferente da origem.'
  if (!form.canalId) erros.canalId = 'Escolha um canal.'
  return erros
}

function FormularioRota({ inicial, canais, onFechar, onGuardado }) {
  const [form, setForm] = useState(inicial)
  const [erros, setErros] = useState({})
  const [erroApi, setErroApi] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const editar = Boolean(inicial.id)

  // Fechar com Esc
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && !guardando && onFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar, guardando])

  const mudar = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value.trim() })
    if (erros[campo]) setErros({ ...erros, [campo]: undefined })
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErroApi(null)
    const encontrados = validar(form)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      if (editar) await rotasApi.atualizar(form.id, form)
      else await rotasApi.criar(form)
      onGuardado(editar ? 'Rota atualizada' : 'Rota criada')
    } catch (err) {
      setErroApi(err.message)
      setGuardando(false)
    }
  }

  return (
    <div className="rotas-overlay" onMouseDown={(e) => e.target === e.currentTarget && !guardando && onFechar()}>
      <form className="rotas-modal" onSubmit={guardar} noValidate role="dialog" aria-modal="true" aria-label={editar ? 'Editar rota' : 'Nova rota'}>
        <header className="rotas-modal-topo">
          <h2>{editar ? 'Editar rota' : 'Nova rota'}</h2>
          <button type="button" className="rotas-fechar" onClick={onFechar} aria-label="Fechar" disabled={guardando}>
            ×
          </button>
        </header>

        <div className="rotas-modal-corpo">
          {erroApi && (
            <div className="rotas-alerta" role="alert">
              {erroApi}
            </div>
          )}

          <div className="rotas-campo">
            <label htmlFor="rota-origem">Número A (origem)</label>
            <input
              id="rota-origem"
              className={`rotas-mono${erros.numeroOrigem ? ' rotas-invalido' : ''}`}
              value={form.numeroOrigem}
              onChange={mudar('numeroOrigem')}
              placeholder="+17372508034"
              inputMode="tel"
              autoFocus
              disabled={guardando}
              aria-invalid={Boolean(erros.numeroOrigem)}
            />
            {erros.numeroOrigem ? (
              <span className="rotas-erro-campo">{erros.numeroOrigem}</span>
            ) : (
              <span className="rotas-dica">Exatamente como o provedor envia: sem espaços, parênteses ou hífens.</span>
            )}
          </div>

          <div className="rotas-campo">
            <label htmlFor="rota-destino">Número B (destino)</label>
            <input
              id="rota-destino"
              className={`rotas-mono${erros.numeroDestino ? ' rotas-invalido' : ''}`}
              value={form.numeroDestino}
              onChange={mudar('numeroDestino')}
              placeholder="+244921687594"
              inputMode="tel"
              disabled={guardando}
              aria-invalid={Boolean(erros.numeroDestino)}
            />
            {erros.numeroDestino && <span className="rotas-erro-campo">{erros.numeroDestino}</span>}
          </div>

          <div className="rotas-campo">
            <label htmlFor="rota-canal">Canal</label>
            <select id="rota-canal" value={form.canalId} onChange={mudar('canalId')} disabled={guardando}>
              {canais.length === 0 && <option value="">Sem canais disponíveis</option>}
              {canais.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.provedor}){c.statusCanal === 'INATIVO' ? ' — inativo' : ''}
                </option>
              ))}
            </select>
            {erros.canalId && <span className="rotas-erro-campo">{erros.canalId}</span>}
          </div>

          <div className="rotas-campo">
            <label htmlFor="rota-estado">Estado</label>
            <select id="rota-estado" value={form.statusRota} onChange={mudar('statusRota')} disabled={guardando}>
              {ESTADOS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="rotas-dica">Só pode haver uma rota ativa por número de origem.</span>
          </div>
        </div>

        <footer className="rotas-modal-rodape">
          <button type="button" className="rotas-btn" onClick={onFechar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="rotas-btn rotas-btn-primario" disabled={guardando}>
            {guardando ? 'A guardar…' : editar ? 'Guardar alterações' : 'Criar rota'}
          </button>
        </footer>
      </form>
    </div>
  )
}

export default function Rotas() {
  const rotas = useCarregar(() => rotasApi.listar(), [])
  const canais = useCarregar(() => canaisApi.listar(), [])
  const [filtro, setFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState(null) // null = fechado
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const nomeCanal = (id) => canais.dados?.find((c) => c.id === id)?.nome ?? `#${id}`
  const contagem = (estado) => (rotas.dados ? rotas.dados.filter((r) => r.statusRota === estado).length : 0)

  const termo = busca.trim().toLowerCase()
  const visiveis = (rotas.dados ?? []).filter(
    (r) =>
      (!filtro || r.statusRota === filtro) &&
      (!termo || r.numeroOrigem.includes(termo) || r.numeroDestino.includes(termo)),
  )

  const abrirNova = () =>
    setForm({ numeroOrigem: '', numeroDestino: '', statusRota: 'ATIVA', canalId: canais.dados?.[0]?.id ?? '' })

  const guardado = (mensagem) => {
    setForm(null)
    setToast(mensagem)
    rotas.recarregar()
  }

  const alternar = async (rota) => {
    try {
      await rotasApi.atualizar(rota.id, { statusRota: rota.statusRota === 'ATIVA' ? 'PAUSADA' : 'ATIVA' })
      setToast(rota.statusRota === 'ATIVA' ? 'Rota pausada' : 'Rota ativada')
      rotas.recarregar()
    } catch (e) {
      setToast(e.message)
    }
  }

  const excluir = async (rota) => {
    if (!confirm(`Excluir a rota ${rota.numeroOrigem} → ${rota.numeroDestino}?`)) return
    try {
      await rotasApi.excluir(rota.id)
      setToast('Rota excluída')
      rotas.recarregar()
    } catch (e) {
      setToast(e.message)
    }
  }

  return (
    <>
      <PageHead titulo="Rotas" descricao="Regra: o que chega ao Número A é reencaminhado para o Número B.">
        <button type="button" className="rotas-btn rotas-btn-primario" onClick={abrirNova}>
          + Nova rota
        </button>
      </PageHead>

      <div className="rotas-filtros" role="group" aria-label="Filtrar por estado">
        <button
          type="button"
          className={`rotas-chip${filtro === '' ? ' rotas-chip-ativo' : ''}`}
          onClick={() => setFiltro('')}
          aria-pressed={filtro === ''}
        >
          Todas <span>{rotas.dados ? rotas.dados.length : '…'}</span>
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            type="button"
            className={`rotas-chip${filtro === e ? ' rotas-chip-ativo' : ''}`}
            onClick={() => setFiltro(filtro === e ? '' : e)}
            aria-pressed={filtro === e}
          >
            {e} <span>{rotas.dados ? contagem(e) : '…'}</span>
          </button>
        ))}
        <input
          type="search"
          className="rotas-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por número…"
          aria-label="Pesquisar rotas por número"
        />
      </div>

      <div className="rotas-card">
        {rotas.erro && <div className="rotas-vazio">{rotas.erro}</div>}
        {!rotas.erro && !rotas.dados && <div className="rotas-vazio">A carregar…</div>}
        {rotas.dados?.length === 0 && <div className="rotas-vazio">Nenhuma rota criada.</div>}
        {rotas.dados?.length > 0 && visiveis.length === 0 && (
          <div className="rotas-vazio">Nenhuma rota corresponde ao filtro.</div>
        )}
        {visiveis.length > 0 && (
          <div className="rotas-tabela-wrap">
            <table className="rotas-tabela">
              <thead>
                <tr>
                  <th>Número A (origem)</th>
                  <th />
                  <th>Número B (destino)</th>
                  <th>Canal</th>
                  <th>Estado</th>
                  <th>Criada em</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visiveis.map((r) => (
                  <tr key={r.id}>
                    <td className="rotas-mono">{r.numeroOrigem}</td>
                    <td className="rotas-seta" aria-hidden="true">→</td>
                    <td className="rotas-mono">{r.numeroDestino}</td>
                    <td>{nomeCanal(r.canalId)}</td>
                    <td>
                      <Badge valor={r.statusRota} />
                    </td>
                    <td className="rotas-muted">{formatarData(r.criadoEm)}</td>
                    <td>
                      <div className="rotas-acoes">
                        <button type="button" className="rotas-btn rotas-btn-sm" onClick={() => alternar(r)}>
                          {r.statusRota === 'ATIVA' ? 'Pausar' : 'Ativar'}
                        </button>
                        <button type="button" className="rotas-btn rotas-btn-sm" onClick={() => setForm({ ...r })}>
                          Editar
                        </button>
                        <button type="button" className="rotas-btn rotas-btn-sm rotas-btn-perigo" onClick={() => excluir(r)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <FormularioRota
          key={form.id ?? 'nova'}
          inicial={form}
          canais={canais.dados ?? []}
          onFechar={() => setForm(null)}
          onGuardado={guardado}
        />
      )}

      {toast && (
        <div className="rotas-toast" role="status">
          {toast}
        </div>
      )}
    </>
  )
}
