import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import logo from '../assets/logo.png'
import '../styles/Login.css'

const DESTAQUES = [
  { icone: 'zap', titulo: 'Um clique', texto: 'Reencaminhe mensagens sem complicações.' },
  { icone: 'layers', titulo: 'Tudo num painel', texto: 'Acompanhe e organize os seus envios.' },
  { icone: 'shield', titulo: 'Seguro', texto: 'Os seus dados protegidos em cada passo.' },
]

function Icone({ nome }) {
  const caminhos = {
    zap: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
    layers: 'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5M3 16l9 5 9-5',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
    user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0',
    lock: 'M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z',
    arrow: 'M5 12h14m-6-6l6 6-6 6',
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={caminhos[nome]} />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { state } = useLocation() // vem da página "Criar conta"
  const [usuario, setUsuario] = useState(state?.usuario ?? '')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState(null)
  const [entrando, setEntrando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setErro(null)

    if (!usuario.trim() || !senha) {
      setErro('Preencha o utilizador e a palavra-passe.')
      return
    }

    setEntrando(true)
    try {
      await authApi.entrar({ usuario: usuario.trim(), senha })
      navigate('/Dashboard', { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEntrando(false)
    }
  }

  return (
    <div className="login">
      <div className="login-fundo" aria-hidden="true">
        <span className="login-aurora login-aurora-1" />
        <span className="login-aurora login-aurora-2" />
        <span className="login-aurora login-aurora-3" />
        <span className="login-pontos" />
      </div>

      <div className="login-layout">
        {/* Painel de marca (desktop) */}
        <aside className="login-marca">
          <img className="login-marca-logo" src={logo} alt="Reencaminhaqui" />
          <h2 className="login-marca-titulo">
            Encaminhe mensagens <span>com um clique.</span>
          </h2>
          <p className="login-marca-texto">
            Entre no seu painel e comece a reencaminhar de forma rápida, simples e organizada.
          </p>

          <ul className="login-destaques">
            {DESTAQUES.map((d) => (
              <li key={d.icone}>
                <span className="login-destaque-icone">
                  <Icone nome={d.icone} />
                </span>
                <span>
                  <strong>{d.titulo}</strong>
                  <small>{d.texto}</small>
                </span>
              </li>
            ))}
          </ul>

          <div className="login-bolha login-bolha-1" aria-hidden="true">
            Reencaminhado ✓
          </div>
          <div className="login-bolha login-bolha-2" aria-hidden="true">
            Olá! 👋
          </div>
        </aside>

        {/* Cartão do formulário */}
        <div className="login-card">
          <img className="login-logo" src={logo} alt="Reencaminhaqui" />

          <h1 className="login-titulo">Bem-vindo de volta</h1>
          <p className="login-sub">Inicie sessão para aceder ao painel de reencaminhamento.</p>

          <form className="login-form" onSubmit={entrar} noValidate>
            {(state?.contaCriada || state?.senhaRedefinida) && !erro && (
              <div className="login-sucesso" role="status">
                {state.senhaRedefinida
                  ? 'Palavra-passe redefinida. Inicie sessão com a nova palavra-passe.'
                  : 'Conta criada com sucesso. Inicie sessão para continuar.'}
              </div>
            )}

            {erro && (
              <div className="login-erro" role="alert">
                {erro}
              </div>
            )}

            <div className="login-campo">
              <label htmlFor="login-usuario">Utilizador</label>
              <div className="login-entrada">
                <span className="login-entrada-icone">
                  <Icone nome="user" />
                </span>
                <input
                  id="login-usuario"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin"
                  disabled={entrando}
                />
              </div>
            </div>

            <div className="login-campo">
              <label htmlFor="login-senha">Palavra-passe</label>
              <div className="login-entrada login-senha">
                <span className="login-entrada-icone">
                  <Icone nome="lock" />
                </span>
                <input
                  id="login-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={entrando}
                />
                <button
                  type="button"
                  className="login-olho"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  aria-pressed={mostrarSenha}
                >
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <Link className="login-esqueci" to="/recuperar-conta">
                Esqueceu a palavra-passe?
              </Link>
            </div>

            <button type="submit" className="login-botao" disabled={entrando}>
              {entrando ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />A entrar…
                </>
              ) : (
                <>
                  Entrar <Icone nome="arrow" />
                </>
              )}
            </button>
          </form>

          <p className="login-alt">
            Ainda não tem conta? <Link to="/criar-conta">Criar conta</Link>
          </p>

          <p className="login-demo">
            Modo de demonstração: utilizador <code>admin</code> e palavra-passe{' '}
            <code>admin123</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
