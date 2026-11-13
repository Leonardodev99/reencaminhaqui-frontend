import { useState } from 'react'
import { reencaminhamentosApi } from '../api'
import { Badge, PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Reencaminhamentos.css'

const MAX_TENTATIVAS = 5

const ESTADOS = [
  { id: 'PENDENTE', rotulo: 'Pendentes', icone: 'clock', tom: 'ambar' },
  { id: 'ENVIADO', rotulo: 'Enviados', icone: 'check', tom: 'verde' },
  { id: 'RETENTANDO', rotulo: 'A repetir', icone: 'refresh', tom: 'azul' },
  { id: 'FALHO', rotulo: 'Falhas', icone: 'alerta', tom: 'vermelho' },
]

const CAMINHOS = {
  clock: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  todos: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  busca: 'M11 18a7 7 0 100-14 7 7 0 000 14zm10 3l-4.5-4.5',
  copiar: 'M9 9h11v11H9zM5 15V4h11',
  caixa: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6H2v-6z',
  fechar: 'M6 6l12 12M18 6L6 18',
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

/** Mostra o ID do provedor com botão de copiar */
function IdProvedor({ valor }) {
  const [copiado, setCopiado] = useState(false)

  if (!valor) return <span className="reenv-muted">—</span>

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(String(valor))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1400)
    } catch {
      /* sem permissão para a área de transferência */
    }
  }

  return (
    <span className="reenv-id">
      <span className="reenv-mono" title={String(valor)}>
        {valor}
      </span>
      <button
        type="button"
        className={`reenv-copiar${copiado ? ' reenv-copiar-ok' : ''}`}
        onClick={copiar}
        aria-label={copiado ? 'Copiado' : 'Copiar ID do provedor'}
        title={copiado ? 'Copiado!' : 'Copiar'}
      >
        <Icone nome={copiado ? 'check' : 'copiar'} tamanho={13} />
      </button>
    </span>
  )
}

/** Pontinhos: um por tentativa possível */
function Tentativas({ n }) {
  const esgotadas = n >= MAX_TENTATIVAS
  return (
    <div className="reenv-tentativas" title={`${n} de ${MAX_TENTATIVAS}`}>
      <span className="reenv-pontos" aria-hidden="true">
        {Array.from({ length: MAX_TENTATIVAS }, (_, i) => (
          <i key={i} className={i < n ? (esgotadas ? 'reenv-ponto-erro' : 'reenv-ponto-on') : ''} />
        ))}
      </span>
      <span className="reenv-tentativas-num">
        {n}/{MAX_TENTATIVAS}
      </span>
    </div>
  )
}

export default function Reencaminhamentos() {
  const [filtro, setFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const { dados, erro, carregando, recarregar } = useCarregar(() => reencaminhamentosApi.listar(), [])

  const contagem = (estado) => (dados ? dados.filter((r) => r.statusEnvio === estado).length : 0)

  const termo = busca.trim().toLowerCase()
  const visiveis = dados
    ? dados.filter((r) => {
        if (filtro && r.statusEnvio !== filtro) return false
        if (!termo) return true
        return [r.id, r.mensagemId, r.idTransacaoProvedor, r.mensagemErro]
          .filter((v) => v !== null && v !== undefined)
          .some((v) => String(v).toLowerCase().includes(termo))
      })
    : []

  const limparFiltros = () => {
    setFiltro('')
    setBusca('')
  }

  const temFiltro = Boolean(filtro || termo)

  return (
    <>
      <PageHead
        titulo=""
        descricao={`Estado de cada envio ao Número B. Falhas temporárias são repetidas até ${MAX_TENTATIVAS} vezes.`}
      >
        <button
          className={`reenv-btn${carregando ? ' reenv-btn-ocupado' : ''}`}
          onClick={recarregar}
          disabled={carregando}
        >
          <Icone nome="refresh" tamanho={16} />
          {carregando ? 'A atualizar…' : 'Atualizar'}
        </button>
      </PageHead>

      <div className="reenv">
        {/* Filtros em cartões */}
        <div className="reenv-filtros" role="group" aria-label="Filtrar por estado">
          <button
            className={`reenv-chip reenv-chip-neutro${filtro === '' ? ' reenv-chip-ativo' : ''}`}
            onClick={() => setFiltro('')}
            aria-pressed={filtro === ''}
            style={{ '--i': 0 }}
          >
            <span className="reenv-chip-icone">
              <Icone nome="todos" tamanho={18} />
            </span>
            <span className="reenv-chip-texto">
              <span className="reenv-chip-num">{dados ? dados.length : '…'}</span>
              <span className="reenv-chip-rotulo">Todos</span>
            </span>
          </button>

          {ESTADOS.map((e, i) => (
            <button
              key={e.id}
              className={`reenv-chip reenv-chip-${e.tom}${filtro === e.id ? ' reenv-chip-ativo' : ''}`}
              onClick={() => setFiltro(filtro === e.id ? '' : e.id)}
              aria-pressed={filtro === e.id}
              style={{ '--i': i + 1 }}
            >
              <span className="reenv-chip-icone">
                <Icone nome={e.icone} tamanho={18} />
              </span>
              <span className="reenv-chip-texto">
                <span className="reenv-chip-num">{dados ? contagem(e.id) : '…'}</span>
                <span className="reenv-chip-rotulo">{e.rotulo}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Pesquisa */}
        <div className="reenv-barra">
          <label className="reenv-busca">
            <span className="reenv-busca-icone">
              <Icone nome="busca" tamanho={17} />
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por nº, mensagem, ID do provedor ou erro…"
              aria-label="Pesquisar reencaminhamentos"
            />
            {busca && (
              <button type="button" className="reenv-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar pesquisa">
                <Icone nome="fechar" tamanho={14} />
              </button>
            )}
          </label>
          {dados && (
            <span className="reenv-resultado" aria-live="polite">
              {visiveis.length} de {dados.length}
            </span>
          )}
        </div>

        <div className="reenv-card">
          {erro && (
            <div className="reenv-vazio reenv-vazio-erro">
              <span className="reenv-vazio-icone">
                <Icone nome="alerta" tamanho={26} />
              </span>
              <p>{erro}</p>
              <button type="button" className="reenv-btn" onClick={recarregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {!erro && !dados && (
            <div className="reenv-esqueleto" aria-label="A carregar" role="status">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} style={{ '--i': i }} />
              ))}
            </div>
          )}

          {dados && visiveis.length === 0 && (
            <div className="reenv-vazio">
              <span className="reenv-vazio-icone">
                <Icone nome="caixa" tamanho={26} />
              </span>
              <p>Nenhum reencaminhamento encontrado.</p>
              {temFiltro && (
                <button type="button" className="reenv-btn" onClick={limparFiltros}>
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {visiveis.length > 0 && (
            <>
              {/* Tabela (ecrãs largos) */}
              <div className="reenv-tabela-wrap">
                <table className="reenv-tabela">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mensagem</th>
                      <th>Estado</th>
                      <th>Tentativas</th>
                      <th>ID no provedor</th>
                      <th>Último processamento</th>
                      <th>Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((r) => (
                      <tr key={r.id} data-estado={r.statusEnvio}>
                        <td>{r.id}</td>
                        <td>
                          <span className="reenv-msg-id">#{r.mensagemId}</span>
                        </td>
                        <td>
                          <Badge valor={r.statusEnvio} />
                        </td>
                        <td>
                          <Tentativas n={r.tentativas} />
                        </td>
                        <td>
                          <IdProvedor valor={r.idTransacaoProvedor} />
                        </td>
                        <td className="reenv-muted">{formatarData(r.processadoEm)}</td>
                        <td className={r.mensagemErro ? 'reenv-erro' : 'reenv-muted'} title={r.mensagemErro ?? undefined}>
                          {r.mensagemErro ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cartões (telemóvel) */}
              <ul className="reenv-lista">
                {visiveis.map((r) => (
                  <li key={r.id} className="reenv-item" data-estado={r.statusEnvio}>
                    <div className="reenv-item-topo">
                      <span className="reenv-item-titulo">
                        Mensagem <strong>#{r.mensagemId}</strong>
                        <small>envio {r.id}</small>
                      </span>
                      <Badge valor={r.statusEnvio} />
                    </div>

                    <dl className="reenv-item-dados">
                      <div>
                        <dt>Tentativas</dt>
                        <dd>
                          <Tentativas n={r.tentativas} />
                        </dd>
                      </div>
                      <div>
                        <dt>Processado</dt>
                        <dd className="reenv-muted">{formatarData(r.processadoEm)}</dd>
                      </div>
                      <div className="reenv-item-largo">
                        <dt>ID no provedor</dt>
                        <dd>
                          <IdProvedor valor={r.idTransacaoProvedor} />
                        </dd>
                      </div>
                    </dl>

                    {r.mensagemErro && <p className="reenv-item-erro">{r.mensagemErro}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}
