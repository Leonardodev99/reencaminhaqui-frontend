import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import logo from '../assets/logo.png'
import '../styles/CriarConta.css'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UTILIZADOR = /^[a-zA-Z0-9._-]{3,20}$/

const VAZIO = { nome: '', email: '', usuario: '', senha: '', confirmar: '', termos: false }

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

export default function CriarConta() {
  const navigate = useNavigate()
  const [form, setForm] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroApi, setErroApi] = useState(null)
  const [mostrar, setMostrar] = useState(false)
  const [criando, setCriando] = useState(false)

  const forca = forcaDaSenha(form.senha)

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

  return (
    <div className="conta">
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
            {erros.nome && <span className="conta-erro">{erros.nome}</span>}
          </div>

          <div className="conta-campo">
            <label htmlFor="conta-email">E-mail</label>
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
            {erros.email && <span className="conta-erro">{erros.email}</span>}
          </div>

          <div className="conta-campo">
            <label htmlFor="conta-usuario">Utilizador</label>
            <input
              id="conta-usuario"
              autoComplete="username"
              value={form.usuario}
              onChange={mudar('usuario')}
              disabled={criando}
              className={erros.usuario ? 'conta-invalido' : ''}
              aria-invalid={Boolean(erros.usuario)}
            />
            {erros.usuario && <span className="conta-erro">{erros.usuario}</span>}
          </div>

          <div className="conta-campo">
            <label htmlFor="conta-senha">Palavra-passe</label>
            <div className="conta-senha">
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
                <span className="conta-forca-rotulo">Força: {forca.rotulo}</span>
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
            {criando ? 'A criar conta…' : 'Criar conta'}
          </button>
        </form>

        <p className="conta-alt">
          Já tem conta? <Link to="/login">Iniciar sessão</Link>
        </p>
      </div>
    </div>
  )
}
