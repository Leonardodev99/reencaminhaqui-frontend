import { useEffect, useRef, useState } from 'react'
import { anexosApi, formatarTexto, mensagensApi, reencaminhamentosApi, rotasApi } from '../api'
import { Badge, PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Mensagens.css'

const CAMINHOS = {
  msg: 'M4 5h16v11H9l-5 4V5z',
  busca: 'M11 18a7 7 0 100-14 7 7 0 000 14zm10 3l-4.5-4.5',
  fechar: 'M6 6l12 12M18 6L6 18',
  seta: 'M5 12h14m-6-6l6 6-6 6',
  clip: 'M21 11l-8.5 8.5a5 5 0 01-7-7L14 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L15 7',
  copiar: 'M9 9h11v11H9zM5 15V4h11',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  caixa: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6H2v-6z',
  olho: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  relogio: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
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

/** Cor estável por remetente, para os avatares */
function matiz(texto = '') {
  let h = 0
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 360
  return h
}

function Avatar({ remetente }) {
  const inicial = String(remetente ?? '?').replace(/[^\p{L}\p{N}]/gu, '')[0]?.toUpperCase() ?? '?'
  const h = matiz(String(remetente))
  return (
    <span
      className="msg-avatar"
      aria-hidden="true"
      style={{
        background: `linear-gradient(135deg, hsl(${h} 80% 62%), hsl(${(h + 40) % 360} 80% 52%))`,
      }}
    >
      {inicial}
    </span>
  )
}

function Copiar({ texto, rotulo = 'Copiar' }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(String(texto))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1400)
    } catch {
      /* sem permissão para a área de transferência */
    }
  }
  return (
    <button
      type="button"
      className={`msg-copiar${copiado ? ' msg-copiar-ok' : ''}`}
      onClick={copiar}
      aria-label={copiado ? 'Copiado' : rotulo}
      title={copiado ? 'Copiado!' : rotulo}
    >
      <Icone nome={copiado ? 'check' : 'copiar'} tamanho={14} />
    </button>
  )
}

function nomeDoFicheiro(url = '') {
  const limpo = String(url).split('?')[0]
  return limpo.split('/').filter(Boolean).pop() || limpo
}

function DetalheMensagem({ mensagem, rota, envio, onFechar }) {
  const anexos = useCarregar(() => anexosApi.listarPorMensagem(mensagem.id), [mensagem.id])
  const botaoFechar = useRef(null)

  // Fechar com Esc
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  // Bloqueia o scroll da página e foca o botão de fechar
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    botaoFechar.current?.focus()
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  return (
    <div className="msg-overlay" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="msg-modal" role="dialog" aria-modal="true" aria-label={`Mensagem ${mensagem.id}`}>
        <header className="msg-modal-topo">
          <Avatar remetente={mensagem.remetenteOriginal} />
          <div className="msg-modal-titulo">
            <h2>Mensagem #{mensagem.id}</h2>
            <span className="msg-mono">{mensagem.remetenteOriginal}</span>
          </div>
          <button ref={botaoFechar} className="msg-fechar" onClick={onFechar} aria-label="Fechar">
            <Icone nome="fechar" tamanho={18} />
          </button>
        </header>

        <div className="msg-modal-corpo">
          {/* Percurso */}
          <div className="msg-percurso">
            {rota ? (
              <>
                <span className="msg-numero">
                  <small>Origem</small>
                  <span className="msg-mono">{rota.numeroOrigem}</span>
                </span>
                <span className="msg-percurso-seta" aria-hidden="true">
                  <Icone nome="seta" tamanho={20} />
                </span>
                <span className="msg-numero msg-numero-destino">
                  <small>Destino</small>
                  <span className="msg-mono">{rota.numeroDestino}</span>
                </span>
              </>
            ) : (
              <span className="msg-numero">
                <small>Rota</small>
                <span className="msg-mono">#{mensagem.rotaId}</span>
              </span>
            )}
          </div>

          {/* Estado */}
          <ol className="msg-passos" aria-label="Percurso da mensagem">
            <li className="msg-passo msg-passo-feito">
              <span className="msg-passo-ponto">
                <Icone nome="check" tamanho={12} />
              </span>
              <span className="msg-passo-texto">
                <strong>Recebida</strong>
                <small>{formatarData(mensagem.recebidoEm)}</small>
              </span>
            </li>
            <li className={`msg-passo${envio ? ' msg-passo-feito' : ''}`}>
              <span className="msg-passo-ponto">{envio ? <Icone nome="check" tamanho={12} /> : null}</span>
              <span className="msg-passo-texto">
                <strong>Envio ao Número B</strong>
                {envio ? <Badge valor={envio.statusEnvio} /> : <small>Sem reencaminhamento</small>}
              </span>
            </li>
          </ol>

          {/* Texto */}
          <div className="msg-campo">
            <span className="msg-rotulo">Texto enviado ao Número B</span>
            <div className="msg-balao">{formatarTexto(mensagem.remetenteOriginal, mensagem.conteudoTexto)}</div>
          </div>

          {/* ID externo */}
          <div className="msg-campo">
            <span className="msg-rotulo">ID externo</span>
            <span className="msg-id">
              <span className="msg-mono">{mensagem.idExterno}</span>
              <Copiar texto={mensagem.idExterno} rotulo="Copiar ID externo" />
            </span>
          </div>

          {/* Anexos */}
          <div className="msg-campo">
            <span className="msg-rotulo">
              Anexos{anexos.dados?.length > 0 ? ` (${anexos.dados.length})` : ''}
            </span>
            {!anexos.dados && <span className="msg-muted">A carregar…</span>}
            {anexos.dados?.length === 0 && <span className="msg-muted">Sem anexos</span>}
            {anexos.dados?.length > 0 && (
              <ul className="msg-anexos">
                {anexos.dados.map((a) => {
                  const url = a.urlLocalS3 ?? a.urlOrigem
                  return (
                    <li key={a.id}>
                      <span className="msg-anexo-icone">
                        <Icone nome="clip" tamanho={16} />
                      </span>
                      <span className="msg-anexo-texto">
                        <span className="msg-mono" title={url}>
                          {nomeDoFicheiro(url)}
                        </span>
                        <small>{a.mimeType}</small>
                      </span>
                      <Copiar texto={url} rotulo="Copiar endereço" />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <footer className="msg-modal-rodape">
          <button className="msg-btn msg-btn-primario" onClick={onFechar}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  )
}

export default function Mensagens() {
  const msgs = useCarregar(() => mensagensApi.listar(), [])
  const rotas = useCarregar(() => rotasApi.listar(), [])
  const reenv = useCarregar(() => reencaminhamentosApi.listar(), [])

  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [aberta, setAberta] = useState(null)

  const rotaDe = (m) => rotas.dados?.find((r) => r.id === m.rotaId)
  const envioDe = (m) => reenv.dados?.find((r) => r.mensagemId === m.id)

  const termo = busca.trim().toLowerCase()
  const tipos = msgs.dados ? [...new Set(msgs.dados.map((m) => m.tipoConteudo))] : []
  const contagemTipo = (t) => (msgs.dados ? msgs.dados.filter((m) => m.tipoConteudo === t).length : 0)
  const visiveis = (msgs.dados ?? []).filter(
    (m) =>
      (!tipo || m.tipoConteudo === tipo) &&
      (!termo || m.remetenteOriginal.toLowerCase().includes(termo) || m.conteudoTexto.toLowerCase().includes(termo)),
  )

  const limpar = () => {
    setBusca('')
    setTipo('')
  }

  return (
    <>
      <PageHead titulo="" descricao="" />

      <div className="msg">
        {/* Pesquisa e filtros */}
        <div className="msg-barra">
          <label className="msg-busca">
            <span className="msg-busca-icone">
              <Icone nome="busca" tamanho={17} />
            </span>
            <input
              type="search"
              placeholder="Pesquisar por remetente ou texto…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Pesquisar mensagens"
            />
            {busca && (
              <button type="button" className="msg-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar pesquisa">
                <Icone nome="fechar" tamanho={14} />
              </button>
            )}
          </label>

          {msgs.dados && (
            <span className="msg-contagem" aria-live="polite">
              {visiveis.length} de {msgs.dados.length}
            </span>
          )}
        </div>

        {tipos.length > 0 && (
          <div className="msg-tipos" role="group" aria-label="Filtrar por tipo">
            <button
              className={`msg-tipo${tipo === '' ? ' msg-tipo-ativo' : ''}`}
              onClick={() => setTipo('')}
              aria-pressed={tipo === ''}
            >
              Todos <span>{msgs.dados.length}</span>
            </button>
            {tipos.map((t) => (
              <button
                key={t}
                className={`msg-tipo${tipo === t ? ' msg-tipo-ativo' : ''}`}
                onClick={() => setTipo(tipo === t ? '' : t)}
                aria-pressed={tipo === t}
              >
                {t} <span>{contagemTipo(t)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="msg-card">
          {msgs.erro && (
            <div className="msg-vazio msg-vazio-erro">
              <span className="msg-vazio-icone">
                <Icone nome="alerta" tamanho={26} />
              </span>
              <p>{msgs.erro}</p>
              <button className="msg-btn" onClick={msgs.recarregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {!msgs.erro && !msgs.dados && (
            <div className="msg-esqueleto" role="status" aria-label="A carregar">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} style={{ '--i': i }} />
              ))}
            </div>
          )}

          {msgs.dados?.length === 0 && (
            <div className="msg-vazio">
              <span className="msg-vazio-icone">
                <Icone nome="caixa" tamanho={26} />
              </span>
              <p>Ainda não foram recebidas mensagens.</p>
            </div>
          )}

          {msgs.dados?.length > 0 && visiveis.length === 0 && (
            <div className="msg-vazio">
              <span className="msg-vazio-icone">
                <Icone nome="busca" tamanho={26} />
              </span>
              <p>Nenhuma mensagem corresponde à pesquisa.</p>
              <button className="msg-btn" onClick={limpar}>
                Limpar filtros
              </button>
            </div>
          )}

          {visiveis.length > 0 && (
            <>
              {/* Tabela (ecrãs largos) */}
              <div className="msg-tabela-wrap">
                <table className="msg-tabela">
                  <thead>
                    <tr>
                      <th>Remetente</th>
                      <th>Conteúdo</th>
                      <th>Tipo</th>
                      <th>Envio</th>
                      <th>Recebida</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((m) => {
                      const envio = envioDe(m)
                      return (
                        <tr key={m.id} data-estado={envio?.statusEnvio ?? ''}>
                          <td>
                            <span className="msg-remetente">
                              <Avatar remetente={m.remetenteOriginal} />
                              <span className="msg-mono">{m.remetenteOriginal}</span>
                            </span>
                          </td>
                          <td className="msg-conteudo" title={m.conteudoTexto}>
                            {m.conteudoTexto}
                          </td>
                          <td>
                            <Badge valor={m.tipoConteudo} />
                          </td>
                          <td>{envio ? <Badge valor={envio.statusEnvio} /> : <span className="msg-muted">—</span>}</td>
                          <td className="msg-data">{formatarData(m.recebidoEm)}</td>
                          <td className="msg-acoes">
                            <button className="msg-btn msg-btn-sm" onClick={() => setAberta(m)}>
                              <Icone nome="olho" tamanho={14} /> Detalhes
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cartões (telemóvel) */}
              <ul className="msg-lista">
                {visiveis.map((m) => {
                  const envio = envioDe(m)
                  return (
                    <li key={m.id} className="msg-item" data-estado={envio?.statusEnvio ?? ''}>
                      <button className="msg-item-botao" onClick={() => setAberta(m)}>
                        <span className="msg-item-topo">
                          <span className="msg-remetente">
                            <Avatar remetente={m.remetenteOriginal} />
                            <span className="msg-item-quem">
                              <span className="msg-mono">{m.remetenteOriginal}</span>
                              <small>{formatarData(m.recebidoEm)}</small>
                            </span>
                          </span>
                          {envio && <Badge valor={envio.statusEnvio} />}
                        </span>
                        <span className="msg-item-texto">{m.conteudoTexto}</span>
                        <span className="msg-item-rodape">
                          <Badge valor={m.tipoConteudo} />
                          <span className="msg-item-ver">
                            Detalhes <Icone nome="seta" tamanho={14} />
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {aberta && (
        <DetalheMensagem
          mensagem={aberta}
          rota={rotaDe(aberta)}
          envio={envioDe(aberta)}
          onFechar={() => setAberta(null)}
        />
      )}
    </>
  )
}
