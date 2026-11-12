import { useState } from 'react'
import { perfilApi } from '../api'
import { PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Perfil.css'

const iniciais = (nome = '') =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?'

function DadosPessoais({ perfil, onGuardado }) {
  const [nome, setNome] = useState(perfil.nome)
  const [email, setEmail] = useState(perfil.email)
  const [msg, setMsg] = useState(null) // { tipo: 'ok' | 'erro', texto }
  const [guardando, setGuardando] = useState(false)

  const alterado = nome.trim() !== perfil.nome || email.trim() !== perfil.email

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
    <form className="perfil-card" onSubmit={guardar} noValidate>
      <h2 className="perfil-card-titulo">Dados pessoais</h2>

      {msg && (
        <div className={`perfil-aviso perfil-aviso-${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>
          {msg.texto}
        </div>
      )}

      <div className="perfil-campo">
        <label htmlFor="perfil-nome">Nome</label>
        <input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={guardando} />
      </div>

      <div className="perfil-campo">
        <label htmlFor="perfil-email">E-mail</label>
        <input
          id="perfil-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={guardando}
        />
      </div>

      <div className="perfil-campo">
        <label htmlFor="perfil-usuario">Utilizador</label>
        <input id="perfil-usuario" value={perfil.usuario} disabled readOnly />
        <span className="perfil-dica">O nome de utilizador não pode ser alterado.</span>
      </div>

      <div className="perfil-acoes">
        <button type="submit" className="perfil-btn perfil-btn-primario" disabled={guardando || !alterado}>
          {guardando ? 'A guardar…' : 'Guardar alterações'}
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

  return (
    <form className="perfil-card" onSubmit={guardar} noValidate>
      <h2 className="perfil-card-titulo">Alterar palavra-passe</h2>

      {msg && (
        <div className={`perfil-aviso perfil-aviso-${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>
          {msg.texto}
        </div>
      )}

      <div className="perfil-campo">
        <label htmlFor="senha-atual">Palavra-passe atual</label>
        <input
          id="senha-atual"
          type={tipo}
          autoComplete="current-password"
          value={campos.atual}
          onChange={mudar('atual')}
          disabled={guardando}
        />
      </div>

      <div className="perfil-campo">
        <label htmlFor="senha-nova">Nova palavra-passe</label>
        <input
          id="senha-nova"
          type={tipo}
          autoComplete="new-password"
          value={campos.nova}
          onChange={mudar('nova')}
          disabled={guardando}
        />
        <span className="perfil-dica">Mínimo de 8 caracteres.</span>
      </div>

      <div className="perfil-campo">
        <label htmlFor="senha-confirmar">Confirmar nova palavra-passe</label>
        <input
          id="senha-confirmar"
          type={tipo}
          autoComplete="new-password"
          value={campos.confirmar}
          onChange={mudar('confirmar')}
          disabled={guardando}
        />
      </div>

      <label className="perfil-check">
        <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} />
        Mostrar palavras-passe
      </label>

      <div className="perfil-acoes">
        <button type="submit" className="perfil-btn perfil-btn-primario" disabled={guardando}>
          {guardando ? 'A alterar…' : 'Alterar palavra-passe'}
        </button>
      </div>
    </form>
  )
}

export default function Perfil() {
  const { dados: perfil, erro, recarregar } = useCarregar(() => perfilApi.obter(), [])

  return (
    <>
      <PageHead titulo="Perfil" descricao="Gerencie os dados da sua conta e a sua palavra-passe." />

      {erro && <div className="perfil-card perfil-vazio">{erro}</div>}
      {!erro && !perfil && <div className="perfil-card perfil-vazio">A carregar…</div>}

      {perfil && (
        <>
          <section className="perfil-resumo">
            <div className="perfil-avatar" aria-hidden="true">
              {iniciais(perfil.nome)}
            </div>
            <div className="perfil-resumo-texto">
              <div className="perfil-nome">{perfil.nome}</div>
              <div className="perfil-email">{perfil.email}</div>
            </div>
            <div className="perfil-meta">
              <span className="perfil-funcao">{perfil.funcao}</span>
              <span className="perfil-desde">Conta criada em {formatarData(perfil.criadoEm)}</span>
            </div>
          </section>

          <div className="perfil-grid">
            <DadosPessoais key={perfil.nome + perfil.email} perfil={perfil} onGuardado={recarregar} />
            <AlterarSenha />
          </div>
        </>
      )}
    </>
  )
}
