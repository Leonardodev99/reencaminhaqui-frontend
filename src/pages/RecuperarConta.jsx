import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import logo from '../assets/logo.png'
import '../styles/RecuperarConta.css'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSOS = [
  { id: 'email', rotulo: 'E-mail' },
  { id: 'codigo', rotulo: 'Código' },
  { id: 'nova', rotulo: 'Nova palavra-passe' },
]
const ESPERA_REENVIO = 30 // segundos

export default function RecuperarConta() {
  const navigate = useNavigate()
  const [passo, setPasso] = useState('email')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [espera, setEspera] = useState(0)

  // Contagem decrescente para poder pedir novo código
  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  const indice = PASSOS.findIndex((p) => p.id === passo)

  // Corre uma ação da API com estado "ocupado" e mostra o erro, se houver
  const executar = async (acao) => {
    setErro(null)
    setOcupado(true)
    try {
      await acao()
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const enviarEmail = (e) => {
    e.preventDefault()
    if (!EMAIL.test(email.trim())) return setErro('Indique um e-mail válido.')
    return executar(async () => {
      await authApi.pedirRecuperacao({ email })
      setAviso(null)
      setCodigo('')
      setEspera(ESPERA_REENVIO)
      setPasso('codigo')
    })
  }

  const reenviar = () =>
    executar(async () => {
      await authApi.pedirRecuperacao({ email })
      setAviso('Enviámos um novo código.')
      setEspera(ESPERA_REENVIO)
    })

  const confirmarCodigo = (e) => {
    e.preventDefault()
    if (codigo.length !== 6) return setErro('O código tem 6 dígitos.')
    return executar(async () => {
      await authApi.verificarCodigo({ email, codigo })
      setAviso(null)
      setPasso('nova')
    })
  }

  const redefinir = (e) => {
    e.preventDefault()
    if (nova.length < 8) return setErro('A palavra-passe deve ter pelo menos 8 caracteres.')
    if (nova !== confirmar) return setErro('A confirmação não coincide com a nova palavra-passe.')
    return executar(async () => {
      await authApi.redefinirSenha({ email, codigo, nova })
      navigate('/login', { replace: true, state: { senhaRedefinida: true } })
    })
  }

  const voltar = (para) => {
    setErro(null)
    setAviso(null)
    setPasso(para)
  }

  const tipoSenha = mostrar ? 'text' : 'password'

  return (
    <div className="recup">
      <div className="recup-card">
        <img className="recup-logo" src={logo} alt="Reencaminhaqui" />

        <h1 className="recup-titulo">Recuperar conta</h1>

        <ol className="recup-passos" aria-label="Progresso">
          {PASSOS.map((p, i) => (
            <li
              key={p.id}
              className={`recup-passo${i < indice ? ' recup-passo-feito' : ''}${i === indice ? ' recup-passo-atual' : ''}`}
              aria-current={i === indice ? 'step' : undefined}
            >
              <span className="recup-passo-num">{i < indice ? '✓' : i + 1}</span>
              <span className="recup-passo-nome">{p.rotulo}</span>
            </li>
          ))}
        </ol>

        {erro && (
          <div className="recup-alerta recup-alerta-erro" role="alert">
            {erro}
          </div>
        )}
        {aviso && !erro && (
          <div className="recup-alerta recup-alerta-ok" role="status">
            {aviso}
          </div>
        )}

        {passo === 'email' && (
          <form className="recup-form" onSubmit={enviarEmail} noValidate>
            <p className="recup-texto">Indique o e-mail da sua conta e enviamos-lhe um código de 6 dígitos.</p>
            <div className="recup-campo">
              <label htmlFor="recup-email">E-mail</label>
              <input
                id="recup-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                disabled={ocupado}
              />
            </div>
            <button type="submit" className="recup-botao" disabled={ocupado}>
              {ocupado ? 'A enviar…' : 'Enviar código'}
            </button>
          </form>
        )}

        {passo === 'codigo' && (
          <form className="recup-form" onSubmit={confirmarCodigo} noValidate>
            <p className="recup-texto">
              Se existir uma conta com <strong>{email.trim()}</strong>, enviámos-lhe um código de 6 dígitos.
            </p>
            <div className="recup-campo">
              <label htmlFor="recup-codigo">Código de verificação</label>
              <input
                id="recup-codigo"
                className="recup-codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                disabled={ocupado}
              />
            </div>
            <button type="submit" className="recup-botao" disabled={ocupado}>
              {ocupado ? 'A verificar…' : 'Verificar código'}
            </button>
            <div className="recup-linha">
              <button type="button" className="recup-link" onClick={() => voltar('email')} disabled={ocupado}>
                Alterar e-mail
              </button>
              <button type="button" className="recup-link" onClick={reenviar} disabled={ocupado || espera > 0}>
                {espera > 0 ? `Reenviar código (${espera}s)` : 'Reenviar código'}
              </button>
            </div>
            <p className="recup-demo">
              Modo de demonstração: nenhum e-mail é enviado. Use o código <code>123456</code> com o e-mail{' '}
              <code>admin@reencaminhaqui.local</code> (ou o de uma conta que tenha criado).
            </p>
          </form>
        )}

        {passo === 'nova' && (
          <form className="recup-form" onSubmit={redefinir} noValidate>
            <p className="recup-texto">Código confirmado. Escolha a sua nova palavra-passe.</p>
            <div className="recup-campo">
              <label htmlFor="recup-nova">Nova palavra-passe</label>
              <div className="recup-senha">
                <input
                  id="recup-nova"
                  type={tipoSenha}
                  autoComplete="new-password"
                  autoFocus
                  value={nova}
                  onChange={(e) => setNova(e.target.value)}
                  disabled={ocupado}
                />
                <button
                  type="button"
                  className="recup-olho"
                  onClick={() => setMostrar((v) => !v)}
                  aria-label={mostrar ? 'Ocultar palavras-passe' : 'Mostrar palavras-passe'}
                  aria-pressed={mostrar}
                >
                  {mostrar ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <span className="recup-dica">Mínimo de 8 caracteres.</span>
            </div>
            <div className="recup-campo">
              <label htmlFor="recup-confirmar">Confirmar nova palavra-passe</label>
              <input
                id="recup-confirmar"
                type={tipoSenha}
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                disabled={ocupado}
              />
            </div>
            <button type="submit" className="recup-botao" disabled={ocupado}>
              {ocupado ? 'A guardar…' : 'Redefinir palavra-passe'}
            </button>
          </form>
        )}

        <p className="recup-alt">
          Lembrou-se da palavra-passe? <Link to="/login">Iniciar sessão</Link>
        </p>
      </div>
    </div>
  )
}
