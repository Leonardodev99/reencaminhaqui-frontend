import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { canaisApi, mensagensApi, perfilApi, reencaminhamentosApi, rotasApi } from '../api'
import { Badge, PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Dashboard.css'

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
            <span className="dash-menu-conta">Conta</span>
            <strong>{nome ?? '…'}</strong>
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
                <span className="dash-menu-item-rotulo">{item.rotulo}</span>
                {item.descricao && <span className="dash-menu-item-desc">{item.descricao}</span>}
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
    { rotulo: 'Minhas redes', descricao: '', acao: () => navigate('/minhas-redes') },
    { rotulo: 'Rotas', descricao: 'Número A → Número B', acao: () => navigate('/rotas') },
    { rotulo: 'Mensagens', descricao: 'Mensagens recebidas', acao: () => navigate('/mensagens') },
    { rotulo: 'Reencaminhamentos', descricao: 'Estado dos envios', acao: () => navigate('/reencaminhamentos') },
    { separador: true },
    { rotulo: atualizando ? 'A atualizar…' : 'Atualizar painel', descricao: 'Recarregar os números', acao: atualizarTudo },
    { rotulo: 'Perfil', descricao: 'Dados da conta e palavra-passe', acao: () => navigate('/perfil') },
    { separador: true },
    { rotulo: 'Sair', perigo: true, acao: sair },
  ]

  const conta = (lista, fn) => (lista ? lista.filter(fn).length : null)
  const mostrar = (n) => (n === null ? '…' : n)

  const enviados = conta(reenv.dados, (r) => r.statusEnvio === 'ENVIADO')
  const falhas = conta(reenv.dados, (r) => r.statusEnvio === 'FALHO')
  const emCurso = conta(reenv.dados, (r) => r.statusEnvio === 'PENDENTE' || r.statusEnvio === 'RETENTANDO')
  const total = reenv.dados ? reenv.dados.length : null

  // Taxa de sucesso sobre os envios já concluídos (enviados + falhas)
  const concluidos = enviados !== null && falhas !== null ? enviados + falhas : null
  const taxa = concluidos ? Math.round((enviados / concluidos) * 100) : null

  const stats = [
    { label: 'Canais ativos', value: conta(canais.dados, (c) => c.statusCanal === 'ATIVO'), tom: 'azul' },
    { label: 'Rotas ativas', value: conta(rotas.dados, (r) => r.statusRota === 'ATIVA'), tom: 'azul' },
    { label: 'Mensagens recebidas', value: msgs.dados ? msgs.dados.length : null, tom: 'azul' },
    { label: 'Enviadas', value: enviados, tom: 'verde' },
    { label: 'Pendentes / a repetir', value: emCurso, tom: 'ambar' },
    { label: 'Falhas', value: falhas, tom: 'vermelho' },
  ]

  return (
    <>
      <PageHead titulo="Painel" descricao="Visão geral do reencaminhamento de mensagens.">
        <MenuHamburguer nome={perfil.dados?.nome} itens={itensMenu} />
      </PageHead>

      <section className="dash-stats" aria-label="Resumo">
        {stats.map((s) => (
          <div key={s.label} className={`dash-stat dash-stat-${s.tom}`}>
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-valor">{mostrar(s.value)}</div>
          </div>
        ))}
      </section>

      <section className="dash-taxa">
        <div className="dash-taxa-topo">
          <strong>Taxa de sucesso dos envios</strong>
          <span className="dash-taxa-pct">{taxa === null ? '—' : `${taxa}%`}</span>
        </div>
        <div
          className="dash-taxa-barra"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={taxa ?? 0}
          aria-label="Taxa de sucesso"
        >
          <span style={{ width: `${taxa ?? 0}%` }} />
        </div>
        <p className="dash-taxa-nota">
          {total === null
            ? 'A carregar…'
            : `${enviados} enviado(s) e ${falhas} falha(s) em ${total} reencaminhamento(s); ${emCurso} ainda em curso.`}
        </p>
      </section>

      <div className="dash-grid">
        <section className="dash-painel">
          <header className="dash-painel-topo">
            <h2>Últimas mensagens</h2>
            <Link to="/mensagens">Ver todas →</Link>
          </header>
          {!msgs.dados && <div className="dash-vazio">A carregar…</div>}
          {msgs.dados?.length === 0 && <div className="dash-vazio">Ainda não foram recebidas mensagens.</div>}
          {msgs.dados?.length > 0 && (
            <ul className="dash-lista">
              {msgs.dados.slice(0, 5).map((m) => (
                <li key={m.id}>
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
            <h2>Últimos envios</h2>
            <Link to="/reencaminhamentos">Ver todos →</Link>
          </header>
          {!reenv.dados && <div className="dash-vazio">A carregar…</div>}
          {reenv.dados?.length === 0 && <div className="dash-vazio">Ainda não há envios.</div>}
          {reenv.dados?.length > 0 && (
            <ul className="dash-lista">
              {reenv.dados.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <div className="dash-item-principal">
                    <span>Mensagem #{r.mensagemId}</span>
                    <span className="dash-data">{r.tentativas} tentativa(s)</span>
                  </div>
                  <Badge valor={r.statusEnvio} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
