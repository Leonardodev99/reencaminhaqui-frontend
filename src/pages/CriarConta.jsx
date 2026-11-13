import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import logo from '../assets/logo.png'
import '../styles/CriarConta.css'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UTILIZADOR = /^[a-zA-Z0-9._-]{3,20}$/

const VAZIO = { nome: '', email: '', usuario: '', senha: '', confirmar: '', termos: false }

const BENEFICIOS = [
  { titulo: 'Pronto em segundos', texto: 'Crie a conta e comece a reencaminhar já.' },
  { titulo: 'Tudo num só lugar', texto: 'Junte as suas redes num painel simples.' },
  { titulo: 'Os seus dados protegidos', texto: 'Segurança em cada passo do caminho.' },
]

// 0 a 3 (fraca, média, forte)
function forcaDaSenha(senha) {
  if (!senha) return { nivel: 0, rotulo: '' }
  let pontos = 0
  if (senha.length >= 8) pontos++
  if (senha.length >= 12) pontos++
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++
  if (/\d/.test(senha)) pontos++
  if (/[^A-Za-z0-9]/.test(senha)) pontos++
  if (pontos <= 2) return { nivel: 1, rotulo: 'Fraca' }
  if (pontos <= 3) return { nivel: 2, rotulo: 'Média' }
  return { nivel: 3, rotulo: 'Forte' }
}

function validar(f) {
  const erros = {}
  if (f.nome.trim().length < 2) erros.nome = 'Indique o seu nome.'
  if (!EMAIL.test(f.email.trim())) erros.email = 'E-mail inválido.'
  if (!UTILIZADOR.test(f.usuario.trim()))
    erros.usuario = 'Use 3 a 20 caracteres: letras, números, ponto, hífen ou sublinhado.'
  if (f.senha.length < 8) erros.senha = 'A palavra-passe deve ter pelo menos 8 caracteres.'
  if (f.confirmar !== f.senha) erros.confirmar = 'A confirmação não coincide.'
  if (!f.termos) erros.termos = 'Tem de aceitar os termos para continuar.'
  return erros
}

function Icone({ nome, tamanho = 18 }) {
  const caminhos = {
    user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0',
    mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
    at: 'M16 12a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1',
    lock: 'M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    arrow: 'M5 12h14m-6-6l6 6-6 6',
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

export default function CriarConta() {
  const navigate = useNavigate()
  const [form, setForm] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroApi, setErroApi] = useState(null)
  const [mostrar, setMostrar] = useState(false)
  const [criando, setCriando] = useState(false)

  const forca = forcaDaSenha(form.senha)
  const ao_vivo = validar(form)
  // Campo preenchido e válido: mostra o visto verde
  const valido = (campo) => Boolean(form[campo]) && !ao_vivo[campo] && !erros[campo]

  const mudar = (campo) => (e) => {
    const valor = campo === 'termos' ? e.target.checked : e.target.value
    setForm({ ...form, [campo]: valor })
    if (erros[campo]) setErros({ ...erros, [campo]: undefined })
  }

  const criar = async (e) => {
    e.preventDefault()
    setErroApi(null)
    const encontrados = validar(form)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setCriando(true)
    try {
      const conta = await authApi.registar({
        nome: form.nome,
        email: form.email,
        usuario: form.usuario,
        senha: form.senha,
      })
      navigate('/login', { replace: true, state: { contaCriada: true, usuario: conta.usuario } })
    } catch (err) {
      setErroApi(err.message)
      setCriando(false)
    }
  }

  const tipoSenha = mostrar ? 'text' : 'password'

  const Visto = ({ campo }) =>
    valido(campo) ? (
      <span className="conta-visto" aria-hidden="true">
        <Icone nome="check" tamanho={14} />
      </span>
    ) : null

  return (
    <div className="conta">
      <div className="conta-fundo" aria-hidden="true">
        <span className="conta-aurora conta-aurora-1" />
        <span className="conta-aurora conta-aurora-2" />
        <span className="conta-aurora conta-aurora-3" />
        <span className="conta-pontos" />
      </div>

      <div className="conta-layout">
        {/* Painel de marca (desktop) */}
        <aside className="conta-marca">
          <img className="conta-marca-logo" src={logo} alt="Reencaminhaqui" />
          <h2 className="conta-marca-titulo">
            Comece a reencaminhar <span>em poucos segundos.</span>
          </h2>
          <p className="conta-marca-texto">
            Crie a sua conta gratuita e junte as suas redes num só lugar, de forma simples e organizada.
          </p>

          <ul className="conta-beneficios">
            {BENEFICIOS.map((b) => (
              <li key={b.titulo}>
                <span className="conta-beneficio-icone">
                  <Icone nome="check" tamanho={16} />
                </span>
                <span>
                  <strong>{b.titulo}</strong>
                  <small>{b.texto}</small>
                </span>
              </li>
            ))}
          </ul>

          <div className="conta-bolha conta-bolha-1" aria-hidden="true">
            Conta criada 🎉
          </div>
          <div className="conta-bolha conta-bolha-2" aria-hidden="true">
            Bem-vindo! 👋
          </div>
        </aside>

        {/* Cartão do formulário */}
        <div className="conta-card">
          <img className="conta-logo" src={logo} alt="Reencaminhaqui" />

          <h1 className="conta-titulo">Criar conta</h1>
          <p className="conta-sub">Junte as suas redes num só lugar.</p>

          <form className="conta-form" onSubmit={criar} noValidate>
            {erroApi && (
              <div className="conta-alerta" role="alert">
                {erroApi}
              </div>
            )}

            <div className="conta-campo">
              <label htmlFor="conta-nome">Nome completo</label>
              <div className="conta-entrada">
                <span className="conta-entrada-icone">
                  <Icone nome="user" />
                </span>
                <input
                  id="conta-nome"
                  autoComplete="name"
                  autoFocus
                  value={form.nome}
                  onChange={mudar('nome')}
                  disabled={criando}
                  className={erros.nome ? 'conta-invalido' : ''}
                  aria-invalid={Boolean(erros.nome)}
                />
                <Visto campo="nome" />
              </div>
              {erros.nome && <span className="conta-erro">{erros.nome}</span>}
            </div>

            <div className="conta-campo">
              <label htmlFor="conta-email">E-mail</label>
              <div className="conta-entrada">
                <span className="conta-entrada-icone">
                  <Icone nome="mail" />
                </span>
                <input
                  id="conta-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={mudar('email')}
                  disabled={criando}
                  placeholder="nome@exemplo.com"
                  className={erros.email ? 'conta-invalido' : ''}
                  aria-invalid={Boolean(erros.email)}
                />
                <Visto campo="email" />
              </div>
              {erros.email && <span className="conta-erro">{erros.email}</span>}
            </div>

            <div className="conta-campo">
              <label htmlFor="conta-usuario">Utilizador</label>
              <div className="conta-entrada">
                <span className="conta-entrada-icone">
                  <Icone nome="at" />
                </span>
                <input
                  id="conta-usuario"
                  autoComplete="username"
                  value={form.usuario}
                  onChange={mudar('usuario')}
                  disabled={criando}
                  className={erros.usuario ? 'conta-invalido' : ''}
                  aria-invalid={Boolean(erros.usuario)}
                />
                <Visto campo="usuario" />
              </div>
              {erros.usuario && <span className="conta-erro">{erros.usuario}</span>}
            </div>

            <div className="conta-campo">
              <label htmlFor="conta-senha">Palavra-passe</label>
              <div className="conta-entrada conta-senha">
                <span className="conta-entrada-icone">
                  <Icone nome="lock" />
                </span>
                <input
                  id="conta-senha"
                  type={tipoSenha}
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={mudar('senha')}
                  disabled={criando}
                  className={erros.senha ? 'conta-invalido' : ''}
                  aria-invalid={Boolean(erros.senha)}
                />
                <button
                  type="button"
                  className="conta-olho"
                  onClick={() => setMostrar((v) => !v)}
                  aria-label={mostrar ? 'Ocultar palavras-passe' : 'Mostrar palavras-passe'}
                  aria-pressed={mostrar}
                >
                  {mostrar ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {form.senha && (
                <div className="conta-forca" aria-live="polite">
                  <div className={`conta-forca-barras conta-forca-${forca.nivel}`} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className={`conta-forca-rotulo conta-forca-rotulo-${forca.nivel}`}>
                    Força: {forca.rotulo}
                  </span>
                </div>
              )}
              {erros.senha ? (
                <span className="conta-erro">{erros.senha}</span>
              ) : (
                <span className="conta-dica">Mínimo de 8 caracteres. Misture maiúsculas, números e símbolos.</span>
              )}
            </div>

            <div className="conta-campo">
              <label htmlFor="conta-confirmar">Confirmar palavra-passe</label>
              <div className="conta-entrada">
                <span className="conta-entrada-icone">
                  <Icone nome="lock" />
                </span>
                <input
                  id="conta-confirmar"
                  type={tipoSenha}
                  autoComplete="new-password"
                  value={form.confirmar}
                  onChange={mudar('confirmar')}
                  disabled={criando}
                  className={erros.confirmar ? 'conta-invalido' : ''}
                  aria-invalid={Boolean(erros.confirmar)}
                />
                <Visto campo="confirmar" />
              </div>
              {erros.confirmar && <span className="conta-erro">{erros.confirmar}</span>}
            </div>

            <div className="conta-campo">
              <label className="conta-check">
                <input type="checkbox" checked={form.termos} onChange={mudar('termos')} disabled={criando} />
                <span>Aceito os termos de utilização e a política de privacidade.</span>
              </label>
              {erros.termos && <span className="conta-erro">{erros.termos}</span>}
            </div>

            <button type="submit" className="conta-botao" disabled={criando}>
              {criando ? (
                <>
                  <span className="conta-spinner" aria-hidden="true" />A criar conta…
                </>
              ) : (
                <>
                  Criar conta <Icone nome="arrow" />
                </>
              )}
            </button>
          </form>

          <p className="conta-alt">
            Já tem conta? <Link to="/login">Iniciar sessão</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
