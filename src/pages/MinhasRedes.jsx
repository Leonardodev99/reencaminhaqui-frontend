import { useEffect, useRef, useState } from 'react'
import { MAX_ANEXOS, MAX_TAMANHO, redesApi } from '../api/redes.js'
import { PageHead, useCarregar } from '../components/ui.jsx'
import '../styles/MinhasRedes.css'

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

// Hoje → hora; outro dia → data curta
const quando = (iso) => {
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString()
    ? hora(iso)
    : d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
}

const diaExtenso = (iso) =>
  new Date(iso).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })

function Selo({ rede, grande }) {
  return (
    <span className={`redes-selo${grande ? ' redes-selo-grande' : ''}`} style={{ background: rede?.cor ?? '#6b7686' }} aria-hidden="true">
      {rede?.sigla ?? '•'}
    </span>
  )
}

function formatarTamanho(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const extensao = (nome = '') => (nome.includes('.') ? nome.split('.').pop().slice(0, 4).toUpperCase() : 'FICH')
const ehImagem = (a) => Boolean(a.url) && a.tipo?.startsWith('image/')

// Anexo dentro de uma mensagem: miniatura se for imagem, cartão de ficheiro nos restantes
function Anexo({ anexo }) {
  if (ehImagem(anexo)) {
    return (
      <a className="redes-anexo-img-link" href={anexo.url} target="_blank" rel="noreferrer" title={anexo.nome}>
        <img className="redes-anexo-img" src={anexo.url} alt={anexo.nome} />
      </a>
    )
  }
  const conteudo = (
    <>
      <span className="redes-anexo-ext">{extensao(anexo.nome)}</span>
      <span className="redes-anexo-info">
        <strong>{anexo.nome}</strong>
        <small>{formatarTamanho(anexo.tamanho)}</small>
      </span>
    </>
  )
  return anexo.url ? (
    <a className="redes-anexo-arquivo" href={anexo.url} download={anexo.nome}>
      {conteudo}
    </a>
  ) : (
    <div className="redes-anexo-arquivo">{conteudo}</div>
  )
}

function Conversa({ conversa, rede, onVoltar, onEnviado }) {
  const [texto, setTexto] = useState('')
  const [anexos, setAnexos] = useState([]) // pendentes: { id, nome, tamanho, tipo, url }
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const fim = useRef(null)
  const inputFicheiro = useRef(null)
  const pendentes = useRef([])
  const email = rede?.tipo === 'email'
  const podeEnviar = !enviando && (texto.trim() !== '' || anexos.length > 0)

  // Ao sair da conversa, liberta as pré-visualizações dos anexos que ficaram por enviar
  useEffect(() => {
    pendentes.current = anexos
  }, [anexos])
  useEffect(() => () => pendentes.current.forEach((a) => URL.revokeObjectURL(a.url)), [])

  // Desce até à última mensagem ao abrir a conversa ou receber/enviar mensagens
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [conversa.id, conversa.mensagens.length])

  const enviar = async (e) => {
    e?.preventDefault()
    if (!podeEnviar) return
    setErro(null)
    setEnviando(true)
    try {
      await redesApi.enviar(
        conversa.id,
        texto,
        anexos.map(({ nome, tamanho, tipo, url }) => ({ nome, tamanho, tipo, url })),
      )
      setTexto('')
      setAnexos([]) // os URLs seguem na mensagem enviada, por isso não se libertam aqui
      onEnviado()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const adicionar = (ficheiros) => {
    setErro(null)
    const novos = []
    let aviso = null
    for (const f of Array.from(ficheiros)) {
      if (anexos.length + novos.length >= MAX_ANEXOS) {
        aviso = `Máximo de ${MAX_ANEXOS} anexos por mensagem.`
        break
      }
      if (f.size > MAX_TAMANHO) {
        aviso = `"${f.name}" excede o limite de ${formatarTamanho(MAX_TAMANHO)}.`
        continue
      }
      novos.push({
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
        nome: f.name,
        tamanho: f.size,
        tipo: f.type,
        url: URL.createObjectURL(f),
      })
    }
    if (novos.length) setAnexos((atuais) => [...atuais, ...novos])
    if (aviso) setErro(aviso)
  }

  const remover = (id) => {
    const alvo = anexos.find((a) => a.id === id)
    if (alvo) URL.revokeObjectURL(alvo.url)
    setAnexos((atuais) => atuais.filter((a) => a.id !== id))
  }

  const aoTeclar = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !email) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <section className="redes-conversa" aria-label={`Conversa com ${conversa.contato}`}>
      <header className="redes-conversa-topo">
        <button type="button" className="redes-voltar" onClick={onVoltar} aria-label="Voltar à lista">
          ←
        </button>
        <Selo rede={rede} />
        <div className="redes-conversa-titulo">
          <strong>{conversa.contato}</strong>
          <span>{conversa.assunto ?? rede?.nome}</span>
        </div>
      </header>

      <div className="redes-mensagens">
        {conversa.mensagens.map((msg, i) => {
          const novoDia =
            i === 0 || new Date(msg.em).toDateString() !== new Date(conversa.mensagens[i - 1].em).toDateString()
          return (
            <div key={msg.id} className="redes-mensagem-bloco">
              {novoDia && <div className="redes-dia">{diaExtenso(msg.em)}</div>}
              <div className={`redes-balao redes-balao-${msg.de === 'eu' ? 'eu' : 'contato'}`}>
                {msg.texto && <p>{msg.texto}</p>}
                {msg.anexos?.length > 0 && (
                  <div className="redes-anexos">
                    {msg.anexos.map((a, i) => (
                      <Anexo key={`${a.nome}-${i}`} anexo={a} />
                    ))}
                  </div>
                )}
                <time dateTime={msg.em}>{hora(msg.em)}</time>
              </div>
            </div>
          )
        })}
        <div ref={fim} />
      </div>

      <form className="redes-resposta" onSubmit={enviar}>
        {erro && (
          <div className="redes-erro" role="alert">
            {erro}
          </div>
        )}
        {anexos.length > 0 && (
          <ul className="redes-pendentes" aria-label="Anexos por enviar">
            {anexos.map((a) => (
              <li key={a.id} className="redes-pendente">
                {ehImagem(a) ? (
                  <img src={a.url} alt="" className="redes-pendente-miniatura" />
                ) : (
                  <span className="redes-anexo-ext">{extensao(a.nome)}</span>
                )}
                <span className="redes-anexo-info">
                  <strong>{a.nome}</strong>
                  <small>{formatarTamanho(a.tamanho)}</small>
                </span>
                <button
                  type="button"
                  className="redes-pendente-remover"
                  onClick={() => remover(a.id)}
                  disabled={enviando}
                  aria-label={`Remover ${a.nome}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="redes-resposta-linha">
          <input
            ref={inputFicheiro}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              adicionar(e.target.files)
              e.target.value = '' // permite voltar a escolher o mesmo ficheiro
            }}
          />
          <button
            type="button"
            className="redes-anexar"
            onClick={() => inputFicheiro.current?.click()}
            disabled={enviando || anexos.length >= MAX_ANEXOS}
            aria-label="Anexar ficheiro"
            title={anexos.length >= MAX_ANEXOS ? `Máximo de ${MAX_ANEXOS} anexos` : 'Anexar ficheiro'}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
            </svg>
          </button>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            rows={email ? 3 : 1}
            placeholder={email ? 'Escreva a sua resposta por e-mail…' : `Responder em ${rede?.nome ?? 'rede'}…`}
            aria-label="Mensagem de resposta"
            disabled={enviando}
          />
          <button type="submit" className="redes-enviar" disabled={!podeEnviar}>
            {enviando ? 'A enviar…' : 'Enviar'}
          </button>
        </div>
        <span className="redes-dica">
          {email ? '' : 'Enter envia · Shift+Enter muda de linha · '}
          Até {MAX_ANEXOS} anexos de {formatarTamanho(MAX_TAMANHO)}
        </span>
      </form>
    </section>
  )
}

export default function MinhasRedes() {
  const [redeAtiva, setRedeAtiva] = useState('todas')
  const [conversaId, setConversaId] = useState(null)
  const [busca, setBusca] = useState('')

  const redes = useCarregar(() => redesApi.listar(), [])
  const conversas = useCarregar(() => redesApi.conversas(redeAtiva), [redeAtiva])

  const redePorId = (id) => redes.dados?.find((r) => r.id === id)
  const totalNaoLidas = redes.dados ? redes.dados.reduce((s, r) => s + r.naoLidas, 0) : null
  const atual = conversas.dados?.find((c) => c.id === conversaId) ?? null

  const termo = busca.trim().toLowerCase()
  const visiveis = (conversas.dados ?? []).filter(
    (c) =>
      !termo ||
      c.contato.toLowerCase().includes(termo) ||
      c.ultimaMensagem.toLowerCase().includes(termo) ||
      (c.assunto ?? '').toLowerCase().includes(termo),
  )

  const recarregarTudo = () => {
    redes.recarregar()
    conversas.recarregar()
  }

  const escolherRede = (id) => {
    setRedeAtiva(id)
    setConversaId(null)
    setBusca('')
  }

  const abrirConversa = (c) => {
    setConversaId(c.id)
    if (c.naoLidas > 0) redesApi.marcarLida(c.id).then(recarregarTudo)
  }

  const nomeRedeAtiva = redeAtiva === 'todas' ? 'Todas as redes' : redePorId(redeAtiva)?.nome

  return (
    <>
      <PageHead titulo="Minhas redes" descricao="Leia e responda às mensagens de todas as suas redes num só lugar.">
        <button type="button" className="redes-btn" onClick={recarregarTudo} disabled={conversas.carregando}>
          {conversas.carregando ? 'A atualizar…' : 'Atualizar'}
        </button>
      </PageHead>

      <div className="redes-layout" data-vista={atual ? 'conversa' : 'lista'}>
        {/* Menu lateral com as redes */}
        <nav className="redes-menu" aria-label="Redes">
          <button
            type="button"
            className={`redes-menu-item${redeAtiva === 'todas' ? ' redes-menu-item-ativo' : ''}`}
            onClick={() => escolherRede('todas')}
            aria-current={redeAtiva === 'todas' ? 'page' : undefined}
          >
            <Selo rede={{ sigla: '★', cor: '#3a74c4' }} />
            <span className="redes-menu-nome">Todas as redes</span>
            {totalNaoLidas > 0 && <span className="redes-contador">{totalNaoLidas}</span>}
          </button>

          {!redes.dados && <div className="redes-menu-carregando">A carregar…</div>}
          {redes.dados?.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`redes-menu-item${redeAtiva === r.id ? ' redes-menu-item-ativo' : ''}`}
              onClick={() => escolherRede(r.id)}
              aria-current={redeAtiva === r.id ? 'page' : undefined}
            >
              <Selo rede={r} />
              <span className="redes-menu-nome">{r.nome}</span>
              {r.naoLidas > 0 && <span className="redes-contador">{r.naoLidas}</span>}
            </button>
          ))}
        </nav>

        {/* Lista de conversas da rede escolhida */}
        <section className="redes-lista" aria-label={`Conversas — ${nomeRedeAtiva ?? ''}`}>
          <header className="redes-lista-topo">
            <h2>{nomeRedeAtiva ?? '…'}</h2>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar conversas…"
              aria-label="Pesquisar conversas"
            />
          </header>

          <div className="redes-lista-corpo">
            {conversas.erro && <div className="redes-vazio">{conversas.erro}</div>}
            {!conversas.erro && !conversas.dados && <div className="redes-vazio">A carregar…</div>}
            {conversas.dados?.length === 0 && <div className="redes-vazio">Sem conversas nesta rede.</div>}
            {conversas.dados?.length > 0 && visiveis.length === 0 && (
              <div className="redes-vazio">Nenhuma conversa corresponde à pesquisa.</div>
            )}

            {visiveis.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`redes-conv${c.id === conversaId ? ' redes-conv-ativa' : ''}${c.naoLidas > 0 ? ' redes-conv-nova' : ''}`}
                onClick={() => abrirConversa(c)}
              >
                <Selo rede={redePorId(c.redeId)} />
                <span className="redes-conv-corpo">
                  <span className="redes-conv-linha">
                    <strong>{c.contato}</strong>
                    <time dateTime={c.ultimaEm}>{quando(c.ultimaEm)}</time>
                  </span>
                  {c.assunto && <span className="redes-conv-assunto">{c.assunto}</span>}
                  <span className="redes-conv-linha">
                    <span className="redes-conv-previa">
                      {c.ultimaDe === 'eu' && 'Você: '}
                      {c.ultimaMensagem}
                    </span>
                    {c.naoLidas > 0 && <span className="redes-contador">{c.naoLidas}</span>}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Leitura e resposta */}
        {atual ? (
          <Conversa
            key={atual.id}
            conversa={atual}
            rede={redePorId(atual.redeId)}
            onVoltar={() => setConversaId(null)}
            onEnviado={recarregarTudo}
          />
        ) : (
          <section className="redes-conversa redes-conversa-vazia">
            <p>Escolha uma conversa para ler e responder.</p>
          </section>
        )}
      </div>
    </>
  )
}
