import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import logo from '../assets/logo.png'
import '../styles/RecuperarConta.css'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSOS = [
  { id: 'email', rotulo: 'E-mail', icone: 'mail' },
  { id: 'codigo', rotulo: 'Código', icone: 'key' },
  { id: 'nova', rotulo: 'Nova palavra-passe', icone: 'lock' },
]
const ESPERA_REENVIO = 30 // segundos

const FORCA = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte']

function calcularForca(s) {
  if (!s) return 0
  let pontos = 0
  if (s.length >= 8) pontos++
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) pontos++
  if (/\d/.test(s)) pontos++
  if (/[^A-Za-z0-9]/.test(s) || s.length >= 12) pontos++
  return pontos
}

function Icone({ nome, tamanho = 18 }) {
  const caminhos = {
    mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
    key: 'M15 7a4 4 0 11-3.6 5.7L4 20v-3h3v-2h2l2.3-2.3A4 4 0 0115 7zm1 1h.01',
    lock: 'M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    arrow: 'M5 12h14m-6-6l6 6-6 6',
    back: 'M19 12H5m6-6l-6 6 6 6',
  }
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
      <path d={caminhos[nome]} />
    </svg>
  )
}

// Campo de código com 6 caixas, suporta colar e backspace
function CampoCodigo({ valor, onChange, disabled }) {
  const refs = useRef([])
  const focar = (i) => refs.current[Math.max(0, Math.min(5, i))]?.focus()

  const alterar = (i, e) => {
    const d = e.target.value.replace(/\D/g, '')
    if (!d) {
      onChange(valor.slice(0, i) + valor.slice(i + 1))
      return
    }
    const novo = (valor.slice(0, i) + d + valor.slice(i + 1)).slice(0, 6)
    onChange(novo)
    focar(Math.min(i + d.length, novo.length, 5))
  }

  const tecla = (i, e) => {
    if (e.key === 'Backspace' && !valor[i] && i > 0) {
      e.preventDefault()
      onChange(valor.slice(0, i - 1) + valor.slice(i))
      focar(i - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focar(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focar(i + 1)
    }
  }

  const colar = (e) => {
    e.preventDefault()
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!d) return
    onChange(d)
    focar(Math.min(d.length, 5))
  }

  return (
    <div className="recup-otp" role="group" aria-labelledby="recup-codigo-rotulo">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`recup-otp-caixa${valor[i] ? ' recup-otp-cheia' : ''}`}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={i === 0}
          aria-label={`Dígito ${i + 1} de 6`}
          value={valor[i] ?? ''}
          onChange={(e) => alterar(i, e)}
          onKeyDown={(e) => tecla(i, e)}
          onPaste={colar}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

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
  const forca = calcularForca(nova)

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
      <div className="recup-fundo" aria-hidden="true">
        <span className="recup-aurora recup-aurora-1" />
        <span className="recup-aurora recup-aurora-2" />
        <span className="recup-aurora recup-aurora-3" />
        <span className="recup-pontos" />
      </div>

      <div className="recup-card">
        <img className="recup-logo" src={logo} alt="Reencaminhaqui" />

        {/* Ícone do passo atual */}
        <div className="recup-emblema" key={passo} aria-hidden="true">
          <span className="recup-emblema-anel" />
          <Icone nome={PASSOS[indice].icone} tamanho={28} />
        </div>

        <h1 className="recup-titulo">Recuperar conta</h1>

        <ol className="recup-passos" aria-label="Progresso">
          {PASSOS.map((p, i) => (
            <li
              key={p.id}
              className={`recup-passo${i < indice ? ' recup-passo-feito' : ''}${i === indice ? ' recup-passo-atual' : ''}`}
              aria-current={i === indice ? 'step' : undefined}
            >
              <span className="recup-passo-num">
                {i < indice ? <Icone nome="check" tamanho={14} /> : i + 1}
              </span>
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
          <form className="recup-form" key="email" onSubmit={enviarEmail} noValidate>
            <p className="recup-texto">Indique o e-mail da sua conta e enviamos-lhe um código de 6 dígitos.</p>
            <div className="recup-campo">
              <label htmlFor="recup-email">E-mail</label>
              <div className="recup-entrada">
                <span className="recup-entrada-icone">
                  <Icone nome="mail" />
                </span>
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
            </div>
            <button type="submit" className="recup-botao" disabled={ocupado}>
              {ocupado ? (
                <>
                  <span className="recup-spinner" aria-hidden="true" />A enviar…
                </>
              ) : (
                <>
                  Enviar código <Icone nome="arrow" />
                </>
              )}
            </button>
          </form>
        )}

        {passo === 'codigo' && (
          <form className="recup-form" key="codigo" onSubmit={confirmarCodigo} noValidate>
            <p className="recup-texto">
              Se existir uma conta com <strong>{email.trim()}</strong>, enviámos-lhe um código de 6 dígitos.
            </p>
            <div className="recup-campo">
              <span className="recup-rotulo" id="recup-codigo-rotulo">
                Código de verificação
              </span>
              <CampoCodigo valor={codigo} onChange={setCodigo} disabled={ocupado} />
            </div>
            <button type="submit" className="recup-botao" disabled={ocupado}>
              {ocupado ? (
                <>
                  <span className="recup-spinner" aria-hidden="true" />A verificar…
                </>
              ) : (
                <>
                  Verificar código <Icone nome="arrow" />
                </>
              )}
            </button>
            <div className="recup-linha">
              <button type="button" className="recup-link" onClick={() => voltar('email')} disabled={ocupado}>
                <Icone nome="back" tamanho={14} /> Alterar e-mail
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
          <form className="recup-form" key="nova" onSubmit={redefinir} noValidate>
            <p className="recup-texto">Código confirmado. Escolha a sua nova palavra-passe.</p>
            <div className="recup-campo">
              <label htmlFor="recup-nova">Nova palavra-passe</label>
              <div className="recup-entrada recup-senha">
                <span className="recup-entrada-icone">
                  <Icone nome="lock" />
                </span>
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

              <div className="recup-forca" data-nivel={forca} aria-live="polite">
                <div className="recup-forca-barras" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className="recup-forca-texto">
                  {nova ? `Segurança: ${FORCA[forca]}` : 'Mínimo de 8 caracteres.'}
                </span>
              </div>
            </div>
            <div className="recup-campo">
              <label htmlFor="recup-confirmar">Confirmar nova palavra-passe</label>
              <div className="recup-entrada">
                <span className="recup-entrada-icone">
                  <Icone nome="lock" />
                </span>
                <input
                  id="recup-confirmar"
                  type={tipoSenha}
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  disabled={ocupado}
                />
              </div>
            </div>
            <button type="submit" className="recup-botao" disabled={ocupado}>
              {ocupado ? (
                <>
                  <span className="recup-spinner" aria-hidden="true" />A guardar…
                </>
              ) : (
                <>
                  Redefinir palavra-passe <Icone nome="check" />
                </>
              )}
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
