import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import logo from '../assets/logo.png'
import '../styles/Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
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
      <div className="login-card">
        <img className="login-logo" src={logo} alt="Reencaminhaqui" />

        <h1 className="login-titulo">Iniciar sessão</h1>
        <p className="login-sub">Aceda ao painel de reencaminhamento de mensagens.</p>

        <form className="login-form" onSubmit={entrar} noValidate>
          {erro && (
            <div className="login-erro" role="alert">
              {erro}
            </div>
          )}

          <div className="login-campo">
            <label htmlFor="login-usuario">Utilizador</label>
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

          <div className="login-campo">
            <label htmlFor="login-senha">Palavra-passe</label>
            <div className="login-senha">
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
          </div>

          <button type="submit" className="login-botao" disabled={entrando}>
            {entrando ? 'A entrar…' : 'Entrar'}
          </button>
        </form>

        <p className="login-demo">
          Modo de demonstração: utilizador <code>admin</code> e palavra-passe <code>admin123</code>.
        </p>
      </div>
    </div>
  )
}
