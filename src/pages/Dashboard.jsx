import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { canaisApi, mensagensApi, perfilApi, reencaminhamentosApi, rotasApi } from '../api'
import { Badge, PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Dashboard.css'

const CAMINHOS = {
  canal: 'M4.9 19.1a10 10 0 010-14.2M19.1 4.9a10 10 0 010 14.2M8 16a5 5 0 010-8M16 8a5 5 0 010 8M12 12h.01',
  rota: 'M5 12h14m-6-6l6 6-6 6',
  msg: 'M4 5h16v11H9l-5 4V5z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0',
  sair: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  seta: 'M5 12h14m-6-6l6 6-6 6',
  caixa: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6H2v-6z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
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

/** Número que "sobe" até ao valor final. Mostra … enquanto não há dados. */
function Numero({ valor }) {
  const [atual, setAtual] = useState(0)

  useEffect(() => {
    if (valor === null || valor === undefined) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setAtual(valor)
      return
    }
    let quadro
    const inicio = performance.now()
    const duracao = 800
    const passo = (agora) => {
      const p = Math.min(1, (agora - inicio) / duracao)
      setAtual(Math.round(valor * (1 - Math.pow(1 - p, 3))))
      if (p < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [valor])

  return <>{valor === null || valor === undefined ? '…' : atual}</>
}

function saudacaoDoDia() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 19) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Menu hambúrguer do painel.
 * Fecha ao clicar fora, ao carregar em Esc ou ao escolher uma opção.
 */
function MenuHamburguer({ nome, itens }) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef(null)
  const botao = useRef(null)

  useEffect(() => {
    if (!aberto) return
    const aoClicar = (e) => !raiz.current?.contains(e.target) && setAberto(false)
    const aoTeclar = (e) => {
      if (e.key === 'Escape') {
        setAberto(false)
        botao.current?.focus()
      }
    }
    document.addEventListener('mousedown', aoClicar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  const escolher = (item) => {
    setAberto(false)
    item.acao()
  }

  const inicial = nome?.trim()?.[0]?.toUpperCase() ?? '•'

  return (
    <div className="dash-menu" ref={raiz}>
      <button
        ref={botao}
        type="button"
        className={`dash-menu-botao${aberto ? ' dash-menu-botao-aberto' : ''}`}
        onClick={() => setAberto((v) => !v)}
        aria-label="Abrir menu"
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        <span className="dash-menu-barras" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {aberto && (
        <div className="dash-menu-lista" role="menu">
          <div className="dash-menu-cabecalho">
            <span className="dash-menu-avatar" aria-hidden="true">
              {inicial}
            </span>
            <span className="dash-menu-cabecalho-texto">
              <span className="dash-menu-conta">Conta</span>
              <strong>{nome ?? '…'}</strong>
            </span>
          </div>

          {itens.map((item, i) =>
            item.separador ? (
              <hr key={`sep-${i}`} className="dash-menu-sep" />
            ) : (
              <button
                key={item.rotulo}
                type="button"
                role="menuitem"
                className={`dash-menu-item${item.perigo ? ' dash-menu-item-perigo' : ''}`}
                onClick={() => escolher(item)}
              >
                <span className="dash-menu-item-icone">
                  <Icone nome={item.icone} tamanho={16} />
                </span>
                <span className="dash-menu-item-texto">
                  <span className="dash-menu-item-rotulo">{item.rotulo}</span>
                  {item.descricao && <span className="dash-menu-item-desc">{item.descricao}</span>}
                </span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const canais = useCarregar(() => canaisApi.listar(), [])
  const rotas = useCarregar(() => rotasApi.listar(), [])
  const msgs = useCarregar(() => mensagensApi.listar(), [])
  const reenv = useCarregar(() => reencaminhamentosApi.listar(), [])
  const perfil = useCarregar(() => perfilApi.obter(), [])

  const atualizando = canais.carregando || rotas.carregando || msgs.carregando || reenv.carregando

  const atualizarTudo = () => {
    canais.recarregar()
    rotas.recarregar()
    msgs.recarregar()
    reenv.recarregar()
  }

  const sair = () => {
    // Quando houver back-end: invalidar o token / sessão aqui.
    navigate('/login', { replace: true })
  }

  const itensMenu = [
    { rotulo: 'Minhas redes', icone: 'canal', descricao: '', acao: () => navigate('/minhas-redes') },
    { rotulo: 'Rotas', icone: 'rota', descricao: 'Número A → Número B', acao: () => navigate('/rotas') },
    { rotulo: 'Mensagens', icone: 'msg', descricao: 'Mensagens recebidas', acao: () => navigate('/mensagens') },
    {
      rotulo: 'Reencaminhamentos',
      icone: 'send',
      descricao: 'Estado dos envios',
      acao: () => navigate('/reencaminhamentos'),
    },
    { separador: true },
    {
      rotulo: atualizando ? 'A atualizar…' : 'Atualizar painel',
      icone: 'refresh',
      descricao: 'Recarregar os números',
      acao: atualizarTudo,
    },
    { rotulo: 'Perfil', icone: 'user', descricao: 'Dados da conta e palavra-passe', acao: () => navigate('/perfil') },
    { separador: true },
    { rotulo: 'Sair', icone: 'sair', perigo: true, acao: sair },
  ]

  const conta = (lista, fn) => (lista ? lista.filter(fn).length : null)

  const enviados = conta(reenv.dados, (r) => r.statusEnvio === 'ENVIADO')
  const falhas = conta(reenv.dados, (r) => r.statusEnvio === 'FALHO')
  const emCurso = conta(reenv.dados, (r) => r.statusEnvio === 'PENDENTE' || r.statusEnvio === 'RETENTANDO')
  const total = reenv.dados ? reenv.dados.length : null

  // Taxa de sucesso sobre os envios já concluídos (enviados + falhas)
  const concluidos = enviados !== null && falhas !== null ? enviados + falhas : null
  const taxa = concluidos ? Math.round((enviados / concluidos) * 100) : null

  const stats = [
    { label: 'Canais ativos', icone: 'canal', value: conta(canais.dados, (c) => c.statusCanal === 'ATIVO'), tom: 'azul' },
    { label: 'Rotas ativas', icone: 'rota', value: conta(rotas.dados, (r) => r.statusRota === 'ATIVA'), tom: 'azul' },
    { label: 'Mensagens recebidas', icone: 'msg', value: msgs.dados ? msgs.dados.length : null, tom: 'azul' },
    { label: 'Enviadas', icone: 'check', value: enviados, tom: 'verde' },
    { label: 'Pendentes / a repetir', icone: 'clock', value: emCurso, tom: 'ambar' },
    { label: 'Falhas', icone: 'alerta', value: falhas, tom: 'vermelho' },
  ]

  const atalhos = [
    { rotulo: 'Minhas redes', texto: 'Gerir canais', icone: 'canal', para: '/minhas-redes' },
    { rotulo: 'Rotas', texto: 'Origem → destino', icone: 'rota', para: '/rotas' },
    { rotulo: 'Mensagens', texto: 'Ver recebidas', icone: 'msg', para: '/mensagens' },
    { rotulo: 'Reencaminhamentos', texto: 'Estado dos envios', icone: 'send', para: '/reencaminhamentos' },
  ]

  const primeiroNome = perfil.dados?.nome?.trim().split(/\s+/)[0]

  // Medidor circular
  const RAIO = 52
  const CIRC = 2 * Math.PI * RAIO
  const deslocamento = CIRC * (1 - (taxa ?? 0) / 100)

  const parte = (n) => (total ? (n / total) * 100 : 0)

  return (
    <>
      <PageHead titulo="" descricao="">
        <MenuHamburguer nome={perfil.dados?.nome} itens={itensMenu} />
      </PageHead>

      <div className="dash">
        {/* Cabeçalho de boas-vindas */}
        <section className="dash-hero">
          <span className="dash-hero-orb dash-hero-orb-1" aria-hidden="true" />
          <span className="dash-hero-orb dash-hero-orb-2" aria-hidden="true" />

          <div className="dash-hero-texto">
            <span className="dash-hero-etiqueta">
              <span className="dash-hero-ponto" aria-hidden="true" />
              Painel em tempo real
            </span>
            <h2>
              {saudacaoDoDia()}
              {primeiroNome ? `, ${primeiroNome}` : ''} 👋
            </h2>
            <p>
              {msgs.dados && enviados !== null
                ? `Recebeu ${msgs.dados.length} mensagem(ns) e já foram enviados ${enviados} reencaminhamento(s) com sucesso.`
                : 'A preparar o seu resumo…'}
            </p>
            <div className="dash-hero-acoes">
              <button
                type="button"
                className={`dash-btn dash-btn-claro${atualizando ? ' dash-btn-ocupado' : ''}`}
                onClick={atualizarTudo}
                disabled={atualizando}
              >
                <Icone nome="refresh" tamanho={16} />
                {atualizando ? 'A atualizar…' : 'Atualizar painel'}
              </button>
              <Link to="/mensagens" className="dash-btn dash-btn-vidro">
                Ver mensagens <Icone nome="seta" tamanho={16} />
              </Link>
            </div>
          </div>

          <div className="dash-hero-bolhas" aria-hidden="true">
            <span className="dash-hero-bolha dash-hero-bolha-1">Olá! 👋</span>
            <span className="dash-hero-bolha dash-hero-bolha-2">
              <Icone nome="send" tamanho={14} /> Reencaminhado
            </span>
            <span className="dash-hero-bolha dash-hero-bolha-3">Feito ✓</span>
          </div>
        </section>

        {/* Atalhos */}
        <nav className="dash-atalhos" aria-label="Atalhos">
          {atalhos.map((a, i) => (
            <Link key={a.para} to={a.para} className="dash-atalho" style={{ '--i': i }}>
              <span className="dash-atalho-icone">
                <Icone nome={a.icone} tamanho={20} />
              </span>
              <span className="dash-atalho-texto">
                <strong>{a.rotulo}</strong>
                <small>{a.texto}</small>
              </span>
              <span className="dash-atalho-seta">
                <Icone nome="seta" tamanho={16} />
              </span>
            </Link>
          ))}
        </nav>

        {/* Números */}
        <section className="dash-stats" aria-label="Resumo">
          {stats.map((s, i) => (
            <div key={s.label} className={`dash-stat dash-stat-${s.tom}`} style={{ '--i': i }}>
              <div className="dash-stat-topo">
                <span className="dash-stat-icone">
                  <Icone nome={s.icone} tamanho={18} />
                </span>
                <span className="dash-stat-label">{s.label}</span>
              </div>
              <div className="dash-stat-valor">
                <Numero valor={s.value} />
              </div>
            </div>
          ))}
        </section>

        {/* Taxa de sucesso */}
        <section className="dash-taxa">
          <div
            className="dash-gauge"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={taxa ?? 0}
            aria-label="Taxa de sucesso"
          >
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <linearGradient id="dash-gauge-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <circle className="dash-gauge-fundo" cx="60" cy="60" r={RAIO} />
              <circle
                className="dash-gauge-valor"
                cx="60"
                cy="60"
                r={RAIO}
                strokeDasharray={CIRC}
                strokeDashoffset={deslocamento}
              />
            </svg>
            <div className="dash-gauge-centro">
              <span className="dash-gauge-pct">{taxa === null ? '—' : `${taxa}%`}</span>
              <span className="dash-gauge-rotulo">sucesso</span>
            </div>
          </div>

          <div className="dash-taxa-info">
            <strong className="dash-taxa-titulo">Taxa de sucesso dos envios</strong>
            <p className="dash-taxa-nota">
              {total === null
                ? 'A carregar…'
                : `${enviados} enviado(s) e ${falhas} falha(s) em ${total} reencaminhamento(s); ${emCurso} ainda em curso.`}
            </p>

            <div className="dash-dist" aria-hidden="true">
              <span className="dash-dist-verde" style={{ width: `${parte(enviados ?? 0)}%` }} />
              <span className="dash-dist-ambar" style={{ width: `${parte(emCurso ?? 0)}%` }} />
              <span className="dash-dist-vermelho" style={{ width: `${parte(falhas ?? 0)}%` }} />
            </div>

            <ul className="dash-legenda">
              <li>
                <span className="dash-legenda-ponto dash-dist-verde" />
                Enviados <strong>{enviados ?? '…'}</strong>
              </li>
              <li>
                <span className="dash-legenda-ponto dash-dist-ambar" />
                Em curso <strong>{emCurso ?? '…'}</strong>
              </li>
              <li>
                <span className="dash-legenda-ponto dash-dist-vermelho" />
                Falhas <strong>{falhas ?? '…'}</strong>
              </li>
            </ul>
          </div>
        </section>

        {/* Listas */}
        <div className="dash-grid">
          <section className="dash-painel">
            <header className="dash-painel-topo">
              <h2>
                <span className="dash-painel-icone">
                  <Icone nome="msg" tamanho={16} />
                </span>
                Últimas mensagens
              </h2>
              <Link to="/mensagens">Ver todas →</Link>
            </header>
            {!msgs.dados && <div className="dash-vazio">A carregar…</div>}
            {msgs.dados?.length === 0 && (
              <div className="dash-vazio">
                <span className="dash-vazio-icone">
                  <Icone nome="caixa" tamanho={26} />
                </span>
                Ainda não foram recebidas mensagens.
              </div>
            )}
            {msgs.dados?.length > 0 && (
              <ul className="dash-lista">
                {msgs.dados.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    <span className="dash-avatar" aria-hidden="true">
                      <Icone nome="msg" tamanho={16} />
                    </span>
                    <div className="dash-item-principal">
                      <span className="dash-mono">{m.remetenteOriginal}</span>
                      <span className="dash-texto">{m.conteudoTexto}</span>
                    </div>
                    <span className="dash-data">{formatarData(m.recebidoEm)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-painel">
            <header className="dash-painel-topo">
              <h2>
                <span className="dash-painel-icone dash-painel-icone-verde">
                  <Icone nome="send" tamanho={16} />
                </span>
                Últimos envios
              </h2>
              <Link to="/reencaminhamentos">Ver todos →</Link>
            </header>
            {!reenv.dados && <div className="dash-vazio">A carregar…</div>}
            {reenv.dados?.length === 0 && (
              <div className="dash-vazio">
                <span className="dash-vazio-icone">
                  <Icone nome="caixa" tamanho={26} />
                </span>
                Ainda não há envios.
              </div>
            )}
            {reenv.dados?.length > 0 && (
              <ul className="dash-lista">
                {reenv.dados.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <span className="dash-avatar dash-avatar-verde" aria-hidden="true">
                      <Icone nome="send" tamanho={16} />
                    </span>
                    <div className="dash-item-principal">
                      <span className="dash-item-titulo">Mensagem #{r.mensagemId}</span>
                      <span className="dash-data">{r.tentativas} tentativa(s)</span>
                    </div>
                    <Badge valor={r.statusEnvio} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
