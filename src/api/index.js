// Serviços de API simulados.
// Cada função devolve uma Promise e lança ApiError com o mesmo formato do
// GlobalExceptionHandler (status, message), para trocar depois por fetch/axios
// sem alterar as páginas.
import { db, perfilDb, PROVEDORES } from './mockDb'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))
const NUMERO = /^\+\d{8,15}$/

async function resposta(valor) {
  await delay()
  return clone(valor)
}

// ---------- Canais ----------
export const canaisApi = {
  listar: ({ status } = {}) =>
    resposta(status ? db.canais.filter((c) => c.statusCanal === status) : db.canais),

  async criar(dados) {
    await delay()
    const nome = (dados.nome || '').trim().toUpperCase()
    const provedor = (dados.provedor || '').trim().toUpperCase()
    if (!nome) throw new ApiError(400, 'O nome é obrigatório')
    if (!provedor) throw new ApiError(400, 'O provedor é obrigatório')
    if (!PROVEDORES.includes(provedor)) throw new ApiError(400, `Provedor não suportado: ${provedor}`)
    if (db.canais.some((c) => c.nome === nome)) throw new ApiError(409, `Já existe um canal com o nome: ${nome}`)
    const canal = { id: ++db.seq.canal, nome, provedor, statusCanal: dados.statusCanal || 'ATIVO' }
    db.canais.push(canal)
    return clone(canal)
  },

  async atualizar(id, dados) {
    await delay()
    const canal = db.canais.find((c) => c.id === id)
    if (!canal) throw new ApiError(404, `Canal não encontrado: ${id}`)
    const nome = (dados.nome ?? canal.nome).trim().toUpperCase()
    const provedor = (dados.provedor ?? canal.provedor).trim().toUpperCase()
    if (!PROVEDORES.includes(provedor)) throw new ApiError(400, `Provedor não suportado: ${provedor}`)
    if (db.canais.some((c) => c.nome === nome && c.id !== id)) throw new ApiError(409, `Já existe um canal com o nome: ${nome}`)
    Object.assign(canal, { nome, provedor, statusCanal: dados.statusCanal ?? canal.statusCanal })
    return clone(canal)
  },

  async excluir(id) {
    await delay()
    const i = db.canais.findIndex((c) => c.id === id)
    if (i < 0) throw new ApiError(404, `Canal não encontrado: ${id}`)
    if (db.rotas.some((r) => r.canalId === id)) throw new ApiError(409, 'Não é possível excluir um canal que possui rotas')
    db.canais.splice(i, 1)
  },
}

// ---------- Rotas ----------
export const rotasApi = {
  listar: () => resposta(db.rotas),

  async criar(dados) {
    await delay()
    if (!NUMERO.test(dados.numeroOrigem || '')) throw new ApiError(400, 'Número de origem inválido (use + e dígitos, sem espaços)')
    if (!NUMERO.test(dados.numeroDestino || '')) throw new ApiError(400, 'Número de destino inválido (use + e dígitos, sem espaços)')
    if (!db.canais.some((c) => c.id === Number(dados.canalId))) throw new ApiError(404, 'Canal não encontrado')
    const statusRota = dados.statusRota || 'ATIVA'
    if (statusRota === 'ATIVA' && db.rotas.some((r) => r.numeroOrigem === dados.numeroOrigem && r.statusRota === 'ATIVA'))
      throw new ApiError(409, 'Já existe uma rota ativa com este número de origem')
    const rota = {
      id: ++db.seq.rota,
      numeroOrigem: dados.numeroOrigem,
      numeroDestino: dados.numeroDestino,
      statusRota,
      criadoEm: new Date().toISOString().slice(0, 19),
      canalId: Number(dados.canalId),
    }
    db.rotas.push(rota)
    return clone(rota)
  },

  async atualizar(id, dados) {
    await delay()
    const rota = db.rotas.find((r) => r.id === id)
    if (!rota) throw new ApiError(404, `Rota não encontrada: ${id}`)
    const novo = { ...rota, ...dados, canalId: Number(dados.canalId ?? rota.canalId) }
    if (!NUMERO.test(novo.numeroOrigem) || !NUMERO.test(novo.numeroDestino))
      throw new ApiError(400, 'Número inválido (use + e dígitos, sem espaços)')
    if (novo.statusRota === 'ATIVA' && db.rotas.some((r) => r.id !== id && r.numeroOrigem === novo.numeroOrigem && r.statusRota === 'ATIVA'))
      throw new ApiError(409, 'Já existe uma rota ativa com este número de origem')
    Object.assign(rota, novo)
    return clone(rota)
  },

  async excluir(id) {
    await delay()
    const i = db.rotas.findIndex((r) => r.id === id)
    if (i < 0) throw new ApiError(404, `Rota não encontrada: ${id}`)
    db.rotas.splice(i, 1)
  },
}

// ---------- Mensagens e reencaminhamentos (consulta) ----------
export const mensagensApi = {
  listar: () => resposta([...db.mensagens].sort((a, b) => b.id - a.id)),
}

export const reencaminhamentosApi = {
  listar: ({ status } = {}) =>
    resposta(
      [...db.reencaminhamentos]
        .filter((r) => !status || r.statusEnvio === status)
        .sort((a, b) => b.id - a.id),
    ),
}

export const anexosApi = {
  listarPorMensagem: (mensagemId) => resposta(db.anexos.filter((a) => a.mensagemId === mensagemId)),
}

// Texto que o dispatcher envia ao Número B (secção 7.2)
export const formatarTexto = (remetente, texto) => `[Mensagem de ${remetente}]: ${texto}`

// ---------- Autenticação (simulada) ----------

// Credenciais de demonstração: admin / admin123. Trocar por POST /api/auth/login.
const contas = [{ ...perfilDb }] // contas registadas (a primeira é a de demonstração)
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UTILIZADOR_VALIDO = /^[a-zA-Z0-9._-]{3,20}$/

// Mantém a lista de contas igual ao perfil ativo (nome, e-mail e palavra-passe podem mudar)
const sincronizarConta = () => {
  const conta = contas.find((c) => c.usuario === perfilDb.usuario)
  if (conta) Object.assign(conta, perfilDb)
}

const CODIGO_DEMO = '123456'

// Valida o par e-mail + código da recuperação e devolve a conta
const contaPorRecuperacao = (email, codigo) => {
  const conta = contas.find((c) => c.email.toLowerCase() === (email || '').trim().toLowerCase())
  if (!conta || codigo !== CODIGO_DEMO) throw new ApiError(400, 'Código inválido ou expirado.')
  return conta
}

export const authApi = {
  async entrar({ usuario, senha }) {
    await delay(600)
    const conta = contas.find((c) => c.usuario.toLowerCase() === usuario.toLowerCase() && c.senha === senha)
    if (!conta) throw new ApiError(401, 'Utilizador ou palavra-passe incorretos.')
    Object.assign(perfilDb, conta) // o perfil passa a mostrar esta conta
    return { usuario: conta.usuario, token: 'token-de-demonstracao' }
  },

  // Trocar por POST /api/auth/registar
  async registar({ nome, email, usuario, senha }) {
    await delay(700)
    if (!nome?.trim()) throw new ApiError(400, 'O nome é obrigatório')
    if (!EMAIL_VALIDO.test((email || '').trim())) throw new ApiError(400, 'E-mail inválido')
    if (!UTILIZADOR_VALIDO.test((usuario || '').trim())) throw new ApiError(400, 'Nome de utilizador inválido')
    if (!senha || senha.length < 8) throw new ApiError(400, 'A palavra-passe deve ter pelo menos 8 caracteres.')
    if (contas.some((c) => c.usuario.toLowerCase() === usuario.trim().toLowerCase()))
      throw new ApiError(409, 'Este nome de utilizador já está em uso.')
    if (contas.some((c) => c.email.toLowerCase() === email.trim().toLowerCase()))
      throw new ApiError(409, 'Já existe uma conta com este e-mail.')
    const conta = {
      usuario: usuario.trim(),
      senha,
      nome: nome.trim(),
      email: email.trim(),
      funcao: 'USER',
      criadoEm: new Date().toISOString().slice(0, 19),
    }
    contas.push(conta)
    return { usuario: conta.usuario }
  },

  
  // Responde sempre com sucesso, exista ou não a conta, para não revelar quais e-mails estão registados.
  async pedirRecuperacao({ email }) {
    await delay(700)
    if (!EMAIL_VALIDO.test((email || '').trim())) throw new ApiError(400, 'E-mail inválido')
    return { enviado: true }
  },

  async verificarCodigo({ email, codigo }) {
    await delay(500)
    contaPorRecuperacao(email, codigo)
    return { valido: true }
  },

  async redefinirSenha({ email, codigo, nova }) {
    await delay(700)
    const conta = contaPorRecuperacao(email, codigo)
    if (!nova || nova.length < 8) throw new ApiError(400, 'A palavra-passe deve ter pelo menos 8 caracteres.')
    conta.senha = nova
    if (perfilDb.usuario === conta.usuario) perfilDb.senha = nova
    return { redefinida: true }
  },
}

// ---------- Perfil (simulado) ----------
// Trocar por GET/PUT /api/perfil e PUT /api/perfil/senha quando existirem.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const semSenha = ({  ...perfil }) => perfil

export const perfilApi = {
  async obter() {
    await delay()
    return clone(semSenha(perfilDb))
  },

  async atualizar({ nome, email }) {
    await delay()
    if (!nome?.trim()) throw new ApiError(400, 'O nome é obrigatório')
    if (!EMAIL.test((email || '').trim())) throw new ApiError(400, 'E-mail inválido')
    perfilDb.nome = nome.trim()
    perfilDb.email = email.trim()
    sincronizarConta()
    return clone(semSenha(perfilDb))
  },

  async alterarSenha({ atual, nova }) {
    await delay(500)
    if (atual !== perfilDb.senha) throw new ApiError(400, 'A palavra-passe atual está incorreta.')
    if (!nova || nova.length < 8) throw new ApiError(400, 'A nova palavra-passe deve ter pelo menos 8 caracteres.')
    if (nova === atual) throw new ApiError(400, 'A nova palavra-passe deve ser diferente da atual.')
    perfilDb.senha = nova
    sincronizarConta()
  },
}

export { PROVEDORES }
