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

const CAMINHOS = {
  busca: 'M11 18a7 7 0 100-14 7 7 0 000 14zm10 3l-4.5-4.5',
  fechar: 'M6 6l12 12M18 6L6 18',
  voltar: 'M19 12H5m6-6l-6 6 6 6',
  clip: 'M21.4 11.1l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 015.7 5.7l-9.2 9.2a2 2 0 01-2.8-2.8l8.5-8.5',
  enviar: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  estrela: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  chat: 'M4 5h16v11H9l-5 4V5z',
  baixar: 'M12 4v11m-4-4l4 4 4-4M5 20h14',
  caixa: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6H2v-6z',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
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

function Selo({ rede, grande, mini }) {
  const classe = `redes-selo${grande ? ' redes-selo-grande' : ''}${mini ? ' redes-selo-mini' : ''}`
  return (
    <span className={classe} style={{ background: rede?.cor ?? '#6b7686' }} aria-hidden="true">
      {rede?.sigla ?? '•'}
    </span>
  )
}

/** Cor estável por contacto */
function matiz(texto = '') {
  let h = 0
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 360
  return h
}

/** Avatar do contacto, com o selo da rede por cima (opcional) */
function AvatarContato({ contato, rede, grande }) {
  const inicial = String(contato ?? '?').replace(/[^\p{L}\p{N}]/gu, '')[0]?.toUpperCase() ?? '?'
  const h = matiz(String(contato))
  return (
    <span className={`redes-avatar${grande ? ' redes-avatar-grande' : ''}`} aria-hidden="true">
      <span
        className="redes-avatar-letra"
        style={{ background: `linear-gradient(135deg, hsl(${h} 80% 62%), hsl(${(h + 40) % 360} 80% 52%))` }}
      >
        {inicial}
      </span>
      {rede && <Selo rede={rede} mini />}
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
      {anexo.url && (
        <span className="redes-anexo-baixar" aria-hidden="true">
          <Icone nome="baixar" tamanho={16} />
        </span>
      )}
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
  const [arrastando, setArrastando] = useState(false)
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

  // Arrastar e largar ficheiros para anexar
  const aoArrastar = (e) => {
    if (!e.dataTransfer?.types?.includes('Files')) return
    e.preventDefault()
    if (!arrastando) setArrastando(true)
  }
  const aoSairArrasto = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setArrastando(false)
  }
  const aoLargar = (e) => {
    if (!e.dataTransfer?.files?.length) return
    e.preventDefault()
    setArrastando(false)
    if (!enviando) adicionar(e.dataTransfer.files)
  }

  return (
    <section
      className={`redes-conversa${arrastando ? ' redes-conversa-arrasto' : ''}`}
      aria-label={`Conversa com ${conversa.contato}`}
      onDragOver={aoArrastar}
      onDragLeave={aoSairArrasto}
      onDrop={aoLargar}
    >
      <header className="redes-conversa-topo">
        <button type="button" className="redes-voltar" onClick={onVoltar} aria-label="Voltar à lista">
          <Icone nome="voltar" tamanho={20} />
        </button>
        <AvatarContato contato={conversa.contato} rede={rede} grande />
        <div className="redes-conversa-titulo">
          <strong>{conversa.contato}</strong>
          <span>{conversa.assunto ?? rede?.nome}</span>
        </div>
        {rede && (
          <span className="redes-conversa-rede" style={{ '--cor-rede': rede.cor }}>
            {rede.nome}
          </span>
        )}
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
                    {msg.anexos.map((a, j) => (
                      <Anexo key={`${a.nome}-${j}`} anexo={a} />
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

      {arrastando && (
        <div className="redes-arrasto" aria-hidden="true">
          <span className="redes-arrasto-icone">
            <Icone nome="clip" tamanho={28} />
          </span>
          <strong>Largue os ficheiros para anexar</strong>
          <small>
            Até {MAX_ANEXOS} anexos de {formatarTamanho(MAX_TAMANHO)}
          </small>
        </div>
      )}

      <form className="redes-resposta" onSubmit={enviar}>
        {erro && (
          <div className="redes-erro" role="alert">
            <Icone nome="alerta" tamanho={15} />
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
                  <Icone nome="fechar" tamanho={13} />
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
            <Icone nome="clip" tamanho={20} />
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
          <button type="submit" className="redes-enviar" disabled={!podeEnviar} aria-label="Enviar mensagem">
            {enviando ? (
              <>
                <span className="redes-spinner" aria-hidden="true" />
                <span className="redes-enviar-texto">A enviar…</span>
              </>
            ) : (
              <>
                <span className="redes-enviar-texto">Enviar</span>
                <Icone nome="enviar" tamanho={17} />
              </>
            )}
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
  const [soNaoLidas, setSoNaoLidas] = useState(false)

  const redes = useCarregar(() => redesApi.listar(), [])
  const conversas = useCarregar(() => redesApi.conversas(redeAtiva), [redeAtiva])

  const redePorId = (id) => redes.dados?.find((r) => r.id === id)
  const totalNaoLidas = redes.dados ? redes.dados.reduce((s, r) => s + r.naoLidas, 0) : null
  const atual = conversas.dados?.find((c) => c.id === conversaId) ?? null
  const naoLidasAqui = conversas.dados ? conversas.dados.filter((c) => c.naoLidas > 0).length : 0

  const termo = busca.trim().toLowerCase()
  const visiveis = (conversas.dados ?? []).filter(
    (c) =>
      (!soNaoLidas || c.naoLidas > 0) &&
      (!termo ||
        c.contato.toLowerCase().includes(termo) ||
        c.ultimaMensagem.toLowerCase().includes(termo) ||
        (c.assunto ?? '').toLowerCase().includes(termo)),
  )

  const recarregarTudo = () => {
    redes.recarregar()
    conversas.recarregar()
  }

  const escolherRede = (id) => {
    setRedeAtiva(id)
    setConversaId(null)
    setBusca('')
    setSoNaoLidas(false)
  }

  const abrirConversa = (c) => {
    setConversaId(c.id)
    if (c.naoLidas > 0) redesApi.marcarLida(c.id).then(recarregarTudo)
  }

  const nomeRedeAtiva = redeAtiva === 'todas' ? 'Todas as redes' : redePorId(redeAtiva)?.nome

  return (
    <>
      <PageHead titulo="" descricao="">
        <button
          type="button"
          className={`redes-btn${conversas.carregando ? ' redes-btn-ocupado' : ''}`}
          onClick={recarregarTudo}
          disabled={conversas.carregando}
        >
          <Icone nome="refresh" tamanho={16} />
          {conversas.carregando ? 'A atualizar…' : 'Atualizar'}
        </button>
      </PageHead>

      <div className="redes-layout" data-vista={atual ? 'conversa' : 'lista'}>
        {/* Menu lateral com as redes */}
        <nav className="redes-menu" aria-label="Redes">
          <span className="redes-menu-titulo">Redes</span>
          <button
            type="button"
            className={`redes-menu-item${redeAtiva === 'todas' ? ' redes-menu-item-ativo' : ''}`}
            onClick={() => escolherRede('todas')}
            aria-current={redeAtiva === 'todas' ? 'page' : undefined}
          >
            <Selo rede={{ sigla: '★', cor: '#3b82f6' }} />
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
            <label className="redes-busca">
              <span className="redes-busca-icone">
                <Icone nome="busca" tamanho={16} />
              </span>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar conversas…"
                aria-label="Pesquisar conversas"
              />
              {busca && (
                <button type="button" className="redes-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar pesquisa">
                  <Icone nome="fechar" tamanho={13} />
                </button>
              )}
            </label>

            <div className="redes-abas" role="group" aria-label="Filtrar conversas">
              <button
                type="button"
                className={`redes-aba${!soNaoLidas ? ' redes-aba-ativa' : ''}`}
                onClick={() => setSoNaoLidas(false)}
                aria-pressed={!soNaoLidas}
              >
                Todas
              </button>
              <button
                type="button"
                className={`redes-aba${soNaoLidas ? ' redes-aba-ativa' : ''}`}
                onClick={() => setSoNaoLidas(true)}
                aria-pressed={soNaoLidas}
              >
                Não lidas {naoLidasAqui > 0 && <span>{naoLidasAqui}</span>}
              </button>
            </div>
          </header>

          <div className="redes-lista-corpo">
            {conversas.erro && (
              <div className="redes-vazio redes-vazio-erro">
                <span className="redes-vazio-icone">
                  <Icone nome="alerta" tamanho={24} />
                </span>
                <p>{conversas.erro}</p>
              </div>
            )}

            {!conversas.erro && !conversas.dados && (
              <div className="redes-esqueleto" role="status" aria-label="A carregar">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} style={{ '--i': i }} />
                ))}
              </div>
            )}

            {conversas.dados?.length === 0 && (
              <div className="redes-vazio">
                <span className="redes-vazio-icone">
                  <Icone nome="caixa" tamanho={24} />
                </span>
                <p>Sem conversas nesta rede.</p>
              </div>
            )}

            {conversas.dados?.length > 0 && visiveis.length === 0 && (
              <div className="redes-vazio">
                <span className="redes-vazio-icone">
                  <Icone nome="busca" tamanho={24} />
                </span>
                <p>{soNaoLidas && !termo ? 'Não tem conversas por ler.' : 'Nenhuma conversa corresponde à pesquisa.'}</p>
              </div>
            )}

            {visiveis.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`redes-conv${c.id === conversaId ? ' redes-conv-ativa' : ''}${c.naoLidas > 0 ? ' redes-conv-nova' : ''}`}
                onClick={() => abrirConversa(c)}
              >
                <AvatarContato contato={c.contato} rede={redePorId(c.redeId)} />
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
            <div className="redes-vazio-central">
              <span className="redes-vazio-emblema" aria-hidden="true">
                <Icone nome="chat" tamanho={34} />
                <i className="redes-vazio-bolha redes-vazio-bolha-1" />
                <i className="redes-vazio-bolha redes-vazio-bolha-2" />
              </span>
              <h3>As suas conversas, num só lugar</h3>
              <p>Escolha uma conversa na lista para ler e responder.</p>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
