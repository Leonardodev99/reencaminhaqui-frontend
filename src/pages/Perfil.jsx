import { useState } from 'react'
import { perfilApi } from '../api'
import { PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Perfil.css'

const CAMINHOS = {
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  arroba: 'M16 12a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1',
  lock: 'M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z',
  chave: 'M15 7a4 4 0 11-3.6 5.7L4 20v-3h3v-2h2l2.3-2.3A4 4 0 0115 7zm1 1h.01',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  desfazer: 'M3 7v6h6M3 13a9 9 0 105-8',
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

const iniciais = (nome = '') =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?'

const FORCA = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']

function calcularForca(s) {
  if (!s) return 0
  let pontos = 0
  if (s.length >= 8) pontos++
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) pontos++
  if (/\d/.test(s)) pontos++
  if (/[^A-Za-z0-9]/.test(s) || s.length >= 12) pontos++
  return Math.max(1, pontos)
}

function Aviso({ msg }) {
  if (!msg) return null
  return (
    <div className={`perfil-aviso perfil-aviso-${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>
      <span className="perfil-aviso-icone">
        <Icone nome={msg.tipo === 'erro' ? 'alerta' : 'check'} tamanho={14} />
      </span>
      {msg.texto}
    </div>
  )
}

function DadosPessoais({ perfil, onGuardado }) {
  const [nome, setNome] = useState(perfil.nome)
  const [email, setEmail] = useState(perfil.email)
  const [msg, setMsg] = useState(null) // { tipo: 'ok' | 'erro', texto }
  const [guardando, setGuardando] = useState(false)

  const alterado = nome.trim() !== perfil.nome || email.trim() !== perfil.email

  const descartar = () => {
    setNome(perfil.nome)
    setEmail(perfil.email)
    setMsg(null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setMsg(null)
    setGuardando(true)
    try {
      const atualizado = await perfilApi.atualizar({ nome, email })
      onGuardado(atualizado)
      setMsg({ tipo: 'ok', texto: 'Dados atualizados.' })
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="perfil-card" onSubmit={guardar} noValidate style={{ '--i': 0 }}>
      <header className="perfil-card-topo">
        <span className="perfil-card-icone">
          <Icone nome="user" tamanho={20} />
        </span>
        <div>
          <h2 className="perfil-card-titulo">Dados pessoais</h2>
          <p className="perfil-card-sub">Como o seu nome e e-mail aparecem na conta.</p>
        </div>
      </header>

      <Aviso msg={msg} />

      <div className="perfil-campo">
        <label htmlFor="perfil-nome">Nome</label>
        <div className="perfil-entrada">
          <span className="perfil-entrada-icone">
            <Icone nome="user" />
          </span>
          <input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={guardando} />
        </div>
      </div>

      <div className="perfil-campo">
        <label htmlFor="perfil-email">E-mail</label>
        <div className="perfil-entrada">
          <span className="perfil-entrada-icone">
            <Icone nome="mail" />
          </span>
          <input
            id="perfil-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={guardando}
          />
        </div>
      </div>

      <div className="perfil-campo">
        <label htmlFor="perfil-usuario">Utilizador</label>
        <div className="perfil-entrada">
          <span className="perfil-entrada-icone">
            <Icone nome="arroba" />
          </span>
          <input id="perfil-usuario" value={perfil.usuario} disabled readOnly />
          <span className="perfil-cadeado" title="Não pode ser alterado" aria-hidden="true">
            <Icone nome="lock" tamanho={14} />
          </span>
        </div>
        <span className="perfil-dica">O nome de utilizador não pode ser alterado.</span>
      </div>

      <div className="perfil-acoes">
        {alterado && !guardando && (
          <button type="button" className="perfil-btn perfil-btn-texto" onClick={descartar}>
            <Icone nome="desfazer" tamanho={15} /> Descartar
          </button>
        )}
        <button type="submit" className="perfil-btn perfil-btn-primario" disabled={guardando || !alterado}>
          {guardando ? (
            <>
              <span className="perfil-spinner" aria-hidden="true" />A guardar…
            </>
          ) : (
            'Guardar alterações'
          )}
        </button>
      </div>
    </form>
  )
}

function AlterarSenha() {
  const VAZIO = { atual: '', nova: '', confirmar: '' }
  const [campos, setCampos] = useState(VAZIO)
  const [mostrar, setMostrar] = useState(false)
  const [msg, setMsg] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const mudar = (campo) => (e) => setCampos({ ...campos, [campo]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    setMsg(null)

    if (!campos.atual || !campos.nova || !campos.confirmar) {
      setMsg({ tipo: 'erro', texto: 'Preencha todos os campos.' })
      return
    }
    if (campos.nova.length < 8) {
      setMsg({ tipo: 'erro', texto: 'A nova palavra-passe deve ter pelo menos 8 caracteres.' })
      return
    }
    if (campos.nova !== campos.confirmar) {
      setMsg({ tipo: 'erro', texto: 'A confirmação não coincide com a nova palavra-passe.' })
      return
    }

    setGuardando(true)
    try {
      await perfilApi.alterarSenha({ atual: campos.atual, nova: campos.nova })
      setCampos(VAZIO)
      setMsg({ tipo: 'ok', texto: 'Palavra-passe alterada com sucesso.' })
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const tipo = mostrar ? 'text' : 'password'
  const forca = calcularForca(campos.nova)
  const requisitos = [
    { ok: campos.nova.length >= 8, texto: '8+ caracteres' },
    { ok: /[a-z]/.test(campos.nova) && /[A-Z]/.test(campos.nova), texto: 'Maiúsculas e minúsculas' },
    { ok: /\d/.test(campos.nova), texto: 'Um número' },
    { ok: /[^A-Za-z0-9]/.test(campos.nova), texto: 'Um símbolo' },
  ]
  const confirmarOk = Boolean(campos.confirmar) && campos.confirmar === campos.nova

  return (
    <form className="perfil-card" onSubmit={guardar} noValidate style={{ '--i': 1 }}>
      <header className="perfil-card-topo">
        <span className="perfil-card-icone perfil-card-icone-ciano">
          <Icone nome="escudo" tamanho={20} />
        </span>
        <div>
          <h2 className="perfil-card-titulo">Alterar palavra-passe</h2>
          <p className="perfil-card-sub">Use uma palavra-passe forte e única.</p>
        </div>
      </header>

      <Aviso msg={msg} />

      <div className="perfil-campo">
        <label htmlFor="senha-atual">Palavra-passe atual</label>
        <div className="perfil-entrada">
          <span className="perfil-entrada-icone">
            <Icone nome="lock" />
          </span>
          <input
            id="senha-atual"
            type={tipo}
            autoComplete="current-password"
            value={campos.atual}
            onChange={mudar('atual')}
            disabled={guardando}
          />
        </div>
      </div>

      <div className="perfil-campo">
        <label htmlFor="senha-nova">Nova palavra-passe</label>
        <div className="perfil-entrada">
          <span className="perfil-entrada-icone">
            <Icone nome="chave" />
          </span>
          <input
            id="senha-nova"
            type={tipo}
            autoComplete="new-password"
            value={campos.nova}
            onChange={mudar('nova')}
            disabled={guardando}
          />
        </div>

        <div className="perfil-forca" data-nivel={forca} aria-live="polite">
          <div className="perfil-forca-barras" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className="perfil-forca-texto">
            {campos.nova ? `Segurança: ${FORCA[forca]}` : 'Mínimo de 8 caracteres.'}
          </span>
        </div>

        {campos.nova && (
          <ul className="perfil-requisitos">
            {requisitos.map((r) => (
              <li key={r.texto} className={r.ok ? 'perfil-requisito-ok' : ''}>
                <span className="perfil-requisito-ponto">{r.ok && <Icone nome="check" tamanho={10} />}</span>
                {r.texto}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="perfil-campo">
        <label htmlFor="senha-confirmar">Confirmar nova palavra-passe</label>
        <div className="perfil-entrada">
          <span className="perfil-entrada-icone">
            <Icone nome="lock" />
          </span>
          <input
            id="senha-confirmar"
            type={tipo}
            autoComplete="new-password"
            value={campos.confirmar}
            onChange={mudar('confirmar')}
            disabled={guardando}
          />
          {confirmarOk && (
            <span className="perfil-visto" aria-hidden="true">
              <Icone nome="check" tamanho={13} />
            </span>
          )}
        </div>
      </div>

      <label className="perfil-switch-linha">
        <input
          type="checkbox"
          className="perfil-switch"
          checked={mostrar}
          onChange={(e) => setMostrar(e.target.checked)}
        />
        <span>Mostrar palavras-passe</span>
      </label>

      <div className="perfil-acoes">
        <button type="submit" className="perfil-btn perfil-btn-primario" disabled={guardando}>
          {guardando ? (
            <>
              <span className="perfil-spinner" aria-hidden="true" />A alterar…
            </>
          ) : (
            'Alterar palavra-passe'
          )}
        </button>
      </div>
    </form>
  )
}

export default function Perfil() {
  const { dados: perfil, erro, recarregar } = useCarregar(() => perfilApi.obter(), [])

  return (
    <>
      <PageHead titulo="" descricao="" />

      <div className="perfil">
        {erro && (
          <div className="perfil-vazio perfil-vazio-erro">
            <span className="perfil-vazio-icone">
              <Icone nome="alerta" tamanho={26} />
            </span>
            <p>{erro}</p>
            <button type="button" className="perfil-btn" onClick={recarregar}>
              Tentar novamente
            </button>
          </div>
        )}

        {!erro && !perfil && (
          <div className="perfil-esqueleto" role="status" aria-label="A carregar">
            <span className="perfil-esqueleto-hero" />
            <div className="perfil-esqueleto-grid">
              <span />
              <span />
            </div>
          </div>
        )}

        {perfil && (
          <>
            <section className="perfil-resumo">
              <div className="perfil-capa" aria-hidden="true">
                <span className="perfil-capa-orb perfil-capa-orb-1" />
                <span className="perfil-capa-orb perfil-capa-orb-2" />
                <span className="perfil-capa-pontos" />
              </div>

              <div className="perfil-resumo-corpo">
                <div className="perfil-avatar" aria-hidden="true">
                  <span>{iniciais(perfil.nome)}</span>
                </div>

                <div className="perfil-resumo-texto">
                  <div className="perfil-nome">{perfil.nome}</div>
                  <div className="perfil-email">{perfil.email}</div>
                </div>

                <div className="perfil-meta">
                  <span className="perfil-funcao">
                    <Icone nome="escudo" tamanho={13} />
                    {perfil.funcao}
                  </span>
                  <span className="perfil-desde">
                    <Icone nome="calendario" tamanho={14} />
                    Conta criada em {formatarData(perfil.criadoEm)}
                  </span>
                </div>
              </div>
            </section>

            <div className="perfil-grid">
              <DadosPessoais key={perfil.nome + perfil.email} perfil={perfil} onGuardado={recarregar} />
              <AlterarSenha />
            </div>
          </>
        )}
      </div>
    </>
  )
}
