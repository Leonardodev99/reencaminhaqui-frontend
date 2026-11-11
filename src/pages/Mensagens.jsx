import { useEffect, useState } from 'react'
import { anexosApi, formatarTexto, mensagensApi, reencaminhamentosApi, rotasApi } from '../api'
import { Badge, PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Mensagens.css'

function DetalheMensagem({ mensagem, rota, envio, onFechar }) {
  const anexos = useCarregar(() => anexosApi.listarPorMensagem(mensagem.id), [mensagem.id])

  // Fechar com Esc
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <div className="msg-overlay" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="msg-modal" role="dialog" aria-modal="true" aria-label={`Mensagem ${mensagem.id}`}>
        <header className="msg-modal-topo">
          <h2>Mensagem #{mensagem.id}</h2>
          <button className="msg-fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="msg-modal-corpo">
          <div className="msg-campo">
            <span className="msg-rotulo">Rota</span>
            <span className="msg-mono">
              {rota ? `${rota.numeroOrigem} → ${rota.numeroDestino}` : `#${mensagem.rotaId}`}
            </span>
          </div>

          <div className="msg-campo">
            <span className="msg-rotulo">Recebida em</span>
            <span>{formatarData(mensagem.recebidoEm)}</span>
          </div>

          <div className="msg-campo">
            <span className="msg-rotulo">Texto enviado ao Número B</span>
            <div className="msg-previa">{formatarTexto(mensagem.remetenteOriginal, mensagem.conteudoTexto)}</div>
          </div>

          <div className="msg-campo">
            <span className="msg-rotulo">Estado do envio</span>
            {envio ? <Badge valor={envio.statusEnvio} /> : <span className="msg-muted">Sem reencaminhamento</span>}
          </div>

          <div className="msg-campo">
            <span className="msg-rotulo">ID externo</span>
            <span className="msg-mono">{mensagem.idExterno}</span>
          </div>

          <div className="msg-campo">
            <span className="msg-rotulo">Anexos</span>
            {!anexos.dados && <span className="msg-muted">A carregar…</span>}
            {anexos.dados?.length === 0 && <span className="msg-muted">Sem anexos</span>}
            {anexos.dados?.length > 0 && (
              <ul className="msg-anexos">
                {anexos.dados.map((a) => (
                  <li key={a.id}>
                    <span className="msg-mono">{a.urlLocalS3 ?? a.urlOrigem}</span>
                    <span className="msg-muted">{a.mimeType}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="msg-modal-rodape">
          <button className="msg-btn" onClick={onFechar}>
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
  const visiveis = (msgs.dados ?? []).filter(
    (m) =>
      (!tipo || m.tipoConteudo === tipo) &&
      (!termo || m.remetenteOriginal.toLowerCase().includes(termo) || m.conteudoTexto.toLowerCase().includes(termo)),
  )

  return (
    <>
      <PageHead titulo="Mensagens" descricao="Mensagens recebidas nos números de origem (somente leitura)." />

      <div className="msg-card">
        <div className="msg-barra">
          <input
            type="search"
            className="msg-busca"
            placeholder="Pesquisar por remetente ou texto…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Pesquisar mensagens"
          />
          <select className="msg-select" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
            <option value="">Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {msgs.dados && (
            <span className="msg-contagem">
              {visiveis.length} de {msgs.dados.length}
            </span>
          )}
        </div>

        {msgs.erro && <div className="msg-vazio">{msgs.erro}</div>}
        {!msgs.erro && !msgs.dados && <div className="msg-vazio">A carregar…</div>}
        {msgs.dados?.length === 0 && <div className="msg-vazio">Ainda não foram recebidas mensagens.</div>}
        {msgs.dados?.length > 0 && visiveis.length === 0 && (
          <div className="msg-vazio">Nenhuma mensagem corresponde à pesquisa.</div>
        )}
        {visiveis.length > 0 && (
          <div className="msg-tabela-wrap">
            <table className="msg-tabela">
              <thead>
                <tr>
                  <th>Recebida</th>
                  <th>Remetente</th>
                  <th>Conteúdo</th>
                  <th>Tipo</th>
                  <th>Envio</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visiveis.map((m) => {
                  const envio = envioDe(m)
                  return (
                    <tr key={m.id}>
                      <td className="msg-muted">{formatarData(m.recebidoEm)}</td>
                      <td className="msg-mono">{m.remetenteOriginal}</td>
                      <td className="msg-conteudo">{m.conteudoTexto}</td>
                      <td>
                        <Badge valor={m.tipoConteudo} />
                      </td>
                      <td>{envio ? <Badge valor={envio.statusEnvio} /> : '—'}</td>
                      <td className="msg-acoes">
                        <button className="msg-btn msg-btn-sm" onClick={() => setAberta(m)}>
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
