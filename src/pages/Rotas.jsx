import { useEffect, useRef, useState } from 'react'
import { canaisApi, rotasApi } from '../api'
import { Badge, PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Rotas.css'

const NUMERO = /^\+\d{8,15}$/
const ESTADOS = [
  { id: 'ATIVA', rotulo: 'Ativas', icone: 'check', tom: 'verde' },
  { id: 'PAUSADA', rotulo: 'Pausadas', icone: 'pausa', tom: 'ambar' },
]

const CAMINHOS = {
  mais: 'M12 5v14M5 12h14',
  busca: 'M11 18a7 7 0 100-14 7 7 0 000 14zm10 3l-4.5-4.5',
  fechar: 'M6 6l12 12M18 6L6 18',
  seta: 'M5 12h14m-6-6l6 6-6 6',
  editar: 'M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z',
  lixo: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  pausa: 'M8 5v14M16 5v14',
  rota: 'M6 5h.01M18 19h.01M6 5c0 7 12 5 12 14',
  telefone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  canal: 'M4.9 19.1a10 10 0 010-14.2M19.1 4.9a10 10 0 010 14.2M8 16a5 5 0 010-8M16 8a5 5 0 010 8M12 12h.01',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  caixa: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6H2v-6z',
}

function Icone({ nome, tamanho = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  )
}

function validar(form) {
  const erros = {}
  if (!NUMERO.test(form.numeroOrigem)) erros.numeroOrigem = 'Use + e 8 a 15 dígitos, sem espaços (ex.: +17372508034).'
  if (!NUMERO.test(form.numeroDestino)) erros.numeroDestino = 'Use + e 8 a 15 dígitos, sem espaços (ex.: +244921687594).'
  if (!erros.numeroOrigem && form.numeroOrigem === form.numeroDestino)
    erros.numeroDestino = 'O destino tem de ser diferente da origem.'
  if (!form.canalId) erros.canalId = 'Escolha um canal.'
  return erros
}

/** Interruptor ativa/pausada */
function Interruptor({ ativa, aoAlternar, ocupado }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativa}
      aria-label={ativa ? 'Pausar rota' : 'Ativar rota'}
      className={`rotas-switch${ativa ? ' rotas-switch-on' : ''}`}
      onClick={aoAlternar}
      disabled={ocupado}
    >
      <span className="rotas-switch-bola" />
    </button>
  )
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

  // Bloqueia o scroll da página
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  const mudar = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value.trim() })
    if (erros[campo]) setErros({ ...erros, [campo]: undefined })
  }

  const escolherEstado = (valor) => setForm({ ...form, statusRota: valor })

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

  const okOrigem = NUMERO.test(form.numeroOrigem)
  const okDestino = NUMERO.test(form.numeroDestino) && form.numeroDestino !== form.numeroOrigem

  return (
    <div className="rotas-overlay" onMouseDown={(e) => e.target === e.currentTarget && !guardando && onFechar()}>
      <form
        className="rotas-modal"
        onSubmit={guardar}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-label={editar ? 'Editar rota' : 'Nova rota'}
      >
        <header className="rotas-modal-topo">
          <span className="rotas-modal-emblema" aria-hidden="true">
            <Icone nome="rota" tamanho={22} />
          </span>
          <div className="rotas-modal-titulo">
            <h2>{editar ? 'Editar rota' : 'Nova rota'}</h2>
            <span>O que chega ao Número A segue para o Número B.</span>
          </div>
          <button type="button" className="rotas-fechar" onClick={onFechar} aria-label="Fechar" disabled={guardando}>
            <Icone nome="fechar" tamanho={18} />
          </button>
        </header>

        <div className="rotas-modal-corpo">
          {erroApi && (
            <div className="rotas-alerta" role="alert">
              {erroApi}
            </div>
          )}

          {/* Pré-visualização do percurso */}
          <div className="rotas-previa" aria-hidden="true">
            <span className={`rotas-previa-no${okOrigem ? ' rotas-previa-ok' : ''}`}>
              <small>Origem</small>
              <span className="rotas-mono">{form.numeroOrigem || '+ _ _ _'}</span>
            </span>
            <span className="rotas-previa-seta">
              <Icone nome="seta" tamanho={18} />
            </span>
            <span className={`rotas-previa-no${okDestino ? ' rotas-previa-ok' : ''}`}>
              <small>Destino</small>
              <span className="rotas-mono">{form.numeroDestino || '+ _ _ _'}</span>
            </span>
          </div>

          <div className="rotas-campo">
            <label htmlFor="rota-origem">Número A (origem)</label>
            <div className="rotas-entrada">
              <span className="rotas-entrada-icone">
                <Icone nome="telefone" />
              </span>
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
              {okOrigem && !erros.numeroOrigem && (
                <span className="rotas-visto" aria-hidden="true">
                  <Icone nome="check" tamanho={13} />
                </span>
              )}
            </div>
            {erros.numeroOrigem ? (
              <span className="rotas-erro-campo">{erros.numeroOrigem}</span>
            ) : (
              <span className="rotas-dica">Exatamente como o provedor envia: sem espaços, parênteses ou hífens.</span>
            )}
          </div>

          <div className="rotas-campo">
            <label htmlFor="rota-destino">Número B (destino)</label>
            <div className="rotas-entrada">
              <span className="rotas-entrada-icone">
                <Icone nome="telefone" />
              </span>
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
              {okDestino && !erros.numeroDestino && (
                <span className="rotas-visto" aria-hidden="true">
                  <Icone nome="check" tamanho={13} />
                </span>
              )}
            </div>
            {erros.numeroDestino && <span className="rotas-erro-campo">{erros.numeroDestino}</span>}
          </div>

          <div className="rotas-campo">
            <label htmlFor="rota-canal">Canal</label>
            <div className="rotas-entrada">
              <span className="rotas-entrada-icone">
                <Icone nome="canal" />
              </span>
              <select id="rota-canal" value={form.canalId} onChange={mudar('canalId')} disabled={guardando}>
                {canais.length === 0 && <option value="">Sem canais disponíveis</option>}
                {canais.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.provedor}){c.statusCanal === 'INATIVO' ? ' — inativo' : ''}
                  </option>
                ))}
              </select>
            </div>
            {erros.canalId && <span className="rotas-erro-campo">{erros.canalId}</span>}
          </div>

          <div className="rotas-campo">
            <span className="rotas-rotulo" id="rota-estado-rotulo">
              Estado
            </span>
            <div className="rotas-segmentos" role="radiogroup" aria-labelledby="rota-estado-rotulo">
              {ESTADOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={form.statusRota === s.id}
                  className={`rotas-segmento rotas-segmento-${s.tom}${form.statusRota === s.id ? ' rotas-segmento-ativo' : ''}`}
                  onClick={() => escolherEstado(s.id)}
                  disabled={guardando}
                >
                  <Icone nome={s.icone} tamanho={16} />
                  {s.id === 'ATIVA' ? 'Ativa' : 'Pausada'}
                </button>
              ))}
            </div>
            <span className="rotas-dica">Só pode haver uma rota ativa por número de origem.</span>
          </div>
        </div>

        <footer className="rotas-modal-rodape">
          <button type="button" className="rotas-btn" onClick={onFechar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="rotas-btn rotas-btn-primario" disabled={guardando}>
            {guardando ? (
              <>
                <span className="rotas-spinner" aria-hidden="true" />A guardar…
              </>
            ) : editar ? (
              'Guardar alterações'
            ) : (
              'Criar rota'
            )}
          </button>
        </footer>
      </form>
    </div>
  )
}

function ConfirmarExclusao({ rota, aConfirmar, onCancelar, onConfirmar }) {
  const botao = useRef(null)

  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && !aConfirmar && onCancelar()
    window.addEventListener('keydown', aoTeclar)
    botao.current?.focus()
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onCancelar, aConfirmar])

  return (
    <div className="rotas-overlay" onMouseDown={(e) => e.target === e.currentTarget && !aConfirmar && onCancelar()}>
      <div className="rotas-confirmar" role="alertdialog" aria-modal="true" aria-label="Confirmar exclusão">
        <span className="rotas-confirmar-icone" aria-hidden="true">
          <Icone nome="lixo" tamanho={26} />
        </span>
        <h2>Excluir esta rota?</h2>
        <p className="rotas-confirmar-rota">
          <span className="rotas-mono">{rota.numeroOrigem}</span>
          <Icone nome="seta" tamanho={14} />
          <span className="rotas-mono">{rota.numeroDestino}</span>
        </p>
        <p className="rotas-confirmar-texto">Deixa de reencaminhar mensagens por esta regra. Não é possível anular.</p>
        <div className="rotas-confirmar-acoes">
          <button ref={botao} type="button" className="rotas-btn" onClick={onCancelar} disabled={aConfirmar}>
            Cancelar
          </button>
          <button type="button" className="rotas-btn rotas-btn-perigo-cheio" onClick={onConfirmar} disabled={aConfirmar}>
            {aConfirmar ? 'A excluir…' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Rotas() {
  const rotas = useCarregar(() => rotasApi.listar(), [])
  const canais = useCarregar(() => canaisApi.listar(), [])
  const [filtro, setFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState(null) // null = fechado
  const [toast, setToast] = useState(null) // { texto, tipo }
  const [alternando, setAlternando] = useState(null)
  const [paraExcluir, setParaExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
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
    setToast({ texto: mensagem, tipo: 'ok' })
    rotas.recarregar()
  }

  const alternar = async (rota) => {
    setAlternando(rota.id)
    try {
      await rotasApi.atualizar(rota.id, { statusRota: rota.statusRota === 'ATIVA' ? 'PAUSADA' : 'ATIVA' })
      setToast({ texto: rota.statusRota === 'ATIVA' ? 'Rota pausada' : 'Rota ativada', tipo: 'ok' })
      rotas.recarregar()
    } catch (e) {
      setToast({ texto: e.message, tipo: 'erro' })
    } finally {
      setAlternando(null)
    }
  }

  const excluir = async () => {
    setExcluindo(true)
    try {
      await rotasApi.excluir(paraExcluir.id)
      setToast({ texto: 'Rota excluída', tipo: 'ok' })
      setParaExcluir(null)
      rotas.recarregar()
    } catch (e) {
      setToast({ texto: e.message, tipo: 'erro' })
      setParaExcluir(null)
    } finally {
      setExcluindo(false)
    }
  }

  const limpar = () => {
    setFiltro('')
    setBusca('')
  }

  return (
    <>
      <PageHead titulo="" descricao="">
        <button type="button" className="rotas-btn rotas-btn-primario" onClick={abrirNova}>
          <Icone nome="mais" tamanho={16} /> Nova rota
        </button>
      </PageHead>

      <div className="rotas">
        {/* Filtros em cartões */}
        <div className="rotas-filtros" role="group" aria-label="Filtrar por estado">
          <button
            type="button"
            className={`rotas-chip rotas-chip-azul${filtro === '' ? ' rotas-chip-ativo' : ''}`}
            onClick={() => setFiltro('')}
            aria-pressed={filtro === ''}
            style={{ '--i': 0 }}
          >
            <span className="rotas-chip-icone">
              <Icone nome="rota" tamanho={18} />
            </span>
            <span className="rotas-chip-texto">
              <span className="rotas-chip-num">{rotas.dados ? rotas.dados.length : '…'}</span>
              <span className="rotas-chip-rotulo">Todas</span>
            </span>
          </button>
          {ESTADOS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className={`rotas-chip rotas-chip-${e.tom}${filtro === e.id ? ' rotas-chip-ativo' : ''}`}
              onClick={() => setFiltro(filtro === e.id ? '' : e.id)}
              aria-pressed={filtro === e.id}
              style={{ '--i': i + 1 }}
            >
              <span className="rotas-chip-icone">
                <Icone nome={e.icone} tamanho={18} />
              </span>
              <span className="rotas-chip-texto">
                <span className="rotas-chip-num">{rotas.dados ? contagem(e.id) : '…'}</span>
                <span className="rotas-chip-rotulo">{e.rotulo}</span>
              </span>
            </button>
          ))}

          <label className="rotas-busca">
            <span className="rotas-busca-icone">
              <Icone nome="busca" tamanho={17} />
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por número…"
              aria-label="Pesquisar rotas por número"
            />
            {busca && (
              <button type="button" className="rotas-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar pesquisa">
                <Icone nome="fechar" tamanho={14} />
              </button>
            )}
          </label>
        </div>

        <div className="rotas-card">
          {rotas.erro && (
            <div className="rotas-vazio rotas-vazio-erro">
              <span className="rotas-vazio-icone">
                <Icone nome="alerta" tamanho={26} />
              </span>
              <p>{rotas.erro}</p>
              <button type="button" className="rotas-btn" onClick={rotas.recarregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {!rotas.erro && !rotas.dados && (
            <div className="rotas-esqueleto" role="status" aria-label="A carregar">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} style={{ '--i': i }} />
              ))}
            </div>
          )}

          {rotas.dados?.length === 0 && (
            <div className="rotas-vazio">
              <span className="rotas-vazio-icone">
                <Icone nome="caixa" tamanho={26} />
              </span>
              <p>Nenhuma rota criada.</p>
              <button type="button" className="rotas-btn rotas-btn-primario" onClick={abrirNova}>
                <Icone nome="mais" tamanho={16} /> Criar a primeira rota
              </button>
            </div>
          )}

          {rotas.dados?.length > 0 && visiveis.length === 0 && (
            <div className="rotas-vazio">
              <span className="rotas-vazio-icone">
                <Icone nome="busca" tamanho={26} />
              </span>
              <p>Nenhuma rota corresponde ao filtro.</p>
              <button type="button" className="rotas-btn" onClick={limpar}>
                Limpar filtros
              </button>
            </div>
          )}

          {visiveis.length > 0 && (
            <>
              {/* Tabela (ecrãs largos) */}
              <div className="rotas-tabela-wrap">
                <table className="rotas-tabela">
                  <thead>
                    <tr>
                      <th>Percurso</th>
                      <th>Canal</th>
                      <th>Estado</th>
                      <th>Criada em</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((r) => (
                      <tr key={r.id} data-estado={r.statusRota}>
                        <td>
                          <span className="rotas-percurso">
                            <span className="rotas-numero rotas-mono">{r.numeroOrigem}</span>
                            <span className="rotas-seta" aria-hidden="true">
                              <Icone nome="seta" tamanho={15} />
                            </span>
                            <span className="rotas-numero rotas-numero-destino rotas-mono">{r.numeroDestino}</span>
                          </span>
                        </td>
                        <td>
                          <span className="rotas-canal">
                            <Icone nome="canal" tamanho={14} />
                            {nomeCanal(r.canalId)}
                          </span>
                        </td>
                        <td>
                          <span className="rotas-estado">
                            <Interruptor
                              ativa={r.statusRota === 'ATIVA'}
                              aoAlternar={() => alternar(r)}
                              ocupado={alternando === r.id}
                            />
                            <Badge valor={r.statusRota} />
                          </span>
                        </td>
                        <td className="rotas-muted">{formatarData(r.criadoEm)}</td>
                        <td>
                          <div className="rotas-acoes">
                            <button type="button" className="rotas-icone-btn" onClick={() => setForm({ ...r })} title="Editar" aria-label="Editar rota">
                              <Icone nome="editar" tamanho={16} />
                            </button>
                            <button
                              type="button"
                              className="rotas-icone-btn rotas-icone-btn-perigo"
                              onClick={() => setParaExcluir(r)}
                              title="Excluir"
                              aria-label="Excluir rota"
                            >
                              <Icone nome="lixo" tamanho={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cartões (telemóvel) */}
              <ul className="rotas-lista">
                {visiveis.map((r) => (
                  <li key={r.id} className="rotas-item" data-estado={r.statusRota}>
                    <div className="rotas-item-topo">
                      <Badge valor={r.statusRota} />
                      <Interruptor
                        ativa={r.statusRota === 'ATIVA'}
                        aoAlternar={() => alternar(r)}
                        ocupado={alternando === r.id}
                      />
                    </div>
                    <div className="rotas-item-percurso">
                      <span className="rotas-numero rotas-mono">{r.numeroOrigem}</span>
                      <span className="rotas-seta rotas-seta-vertical" aria-hidden="true">
                        <Icone nome="seta" tamanho={15} />
                      </span>
                      <span className="rotas-numero rotas-numero-destino rotas-mono">{r.numeroDestino}</span>
                    </div>
                    <div className="rotas-item-rodape">
                      <span className="rotas-item-meta">
                        <span className="rotas-canal">
                          <Icone nome="canal" tamanho={14} />
                          {nomeCanal(r.canalId)}
                        </span>
                        <small>{formatarData(r.criadoEm)}</small>
                      </span>
                      <span className="rotas-acoes">
                        <button type="button" className="rotas-icone-btn" onClick={() => setForm({ ...r })} aria-label="Editar rota">
                          <Icone nome="editar" tamanho={16} />
                        </button>
                        <button
                          type="button"
                          className="rotas-icone-btn rotas-icone-btn-perigo"
                          onClick={() => setParaExcluir(r)}
                          aria-label="Excluir rota"
                        >
                          <Icone nome="lixo" tamanho={16} />
                        </button>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
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

      {paraExcluir && (
        <ConfirmarExclusao
          rota={paraExcluir}
          aConfirmar={excluindo}
          onCancelar={() => setParaExcluir(null)}
          onConfirmar={excluir}
        />
      )}

      {toast && (
        <div className={`rotas-toast rotas-toast-${toast.tipo}`} role="status">
          <span className="rotas-toast-icone">
            <Icone nome={toast.tipo === 'erro' ? 'alerta' : 'check'} tamanho={14} />
          </span>
          {toast.texto}
        </div>
      )}
    </>
  )
}
