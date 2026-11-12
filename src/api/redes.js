// API simulada do concentrador de redes ("Minhas redes").


const agora = (minutosAtras = 0) => new Date(Date.now() - minutosAtras * 60_000).toISOString()
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))

export const REDES = [
  { id: 'whatsapp', nome: 'WhatsApp', sigla: 'WA', cor: '#25a244', tipo: 'chat' },
  { id: 'whatsapp-business', nome: 'WhatsApp Business', sigla: 'WB', cor: '#0f766e', tipo: 'chat' },
  { id: 'messenger', nome: 'Messenger', sigla: 'MS', cor: '#0084ff', tipo: 'chat' },
  { id: 'email', nome: 'E-mail', sigla: '@', cor: '#d97706', tipo: 'email' },
  { id: 'instagram', nome: 'Instagram', sigla: 'IG', cor: '#e1306c', tipo: 'chat' },
  { id: 'telegram', nome: 'Telegram', sigla: 'TG', cor: '#229ed9', tipo: 'chat' },
  { id: 'linkedin', nome: 'LinkedIn', sigla: 'in', cor: '#0a66c2', tipo: 'chat' },
  { id: 'sms', nome: 'Mensagem normal', sigla: 'SMS', cor: '#6366f1', tipo: 'chat' },
]

// Limites dos anexos de uma resposta
export const MAX_ANEXOS = 5
export const MAX_TAMANHO = 10 * 1024 * 1024 // 10 MB por ficheiro

let seqMsg = 100
// anexos: [{ nome, tamanho (bytes), tipo (mime), url? }]
const m = (de, texto, minutosAtras, anexos = []) => ({ id: ++seqMsg, de, texto, em: agora(minutosAtras), anexos })

const conversas = [
  {
    id: 1, redeId: 'whatsapp', contato: 'Maria Fernandes', naoLidas: 2,
    mensagens: [
      m('contato', 'Olá! Viste o que combinámos para sábado?', 95),
      m('eu', 'Vi sim, às 10h está bom.', 80),
      m('contato', 'Perfeito. Levo o bolo.', 12),
      m('contato', 'Podes trazer as cadeiras?', 11),
    ],
  },
  {
    id: 2, redeId: 'whatsapp', contato: 'João Pedro', naoLidas: 0,
    mensagens: [m('eu', 'Obrigado pela ajuda ontem!', 600), m('contato', 'De nada, qualquer coisa avisa.', 590)],
  },
  {
    id: 3, redeId: 'whatsapp', contato: 'Grupo Família', naoLidas: 5,
    mensagens: [
      m('contato', 'Quem vai ao almoço de domingo?', 40),
      m('contato', 'Eu vou!', 35),
      m('contato', 'Eu também.', 30),
      m('contato', 'A que horas?', 22),
      m('contato', 'Pelas 13h.', 20),
    ],
  },
  {
    id: 4, redeId: 'whatsapp-business', contato: 'Cliente · Ana Gomes', naoLidas: 2,
    mensagens: [
      m('contato', 'Boa tarde, ainda tem o modelo azul em stock?', 25),
      m('contato', 'Segue o catálogo onde vi o modelo.', 24, [{ nome: 'catalogo-outono.pdf', tamanho: 1_240_000, tipo: 'application/pdf' }]),
    ],
  },
  {
    id: 5, redeId: 'whatsapp-business', contato: 'Cliente · Carlos Neto', naoLidas: 0,
    mensagens: [
      m('contato', 'Qual o prazo de entrega para Benguela?', 300),
      m('eu', 'Entre 2 a 3 dias úteis.', 290),
      m('contato', 'Obrigado!', 288),
    ],
  },
  {
    id: 6, redeId: 'messenger', contato: 'Sofia Lima', naoLidas: 1,
    mensagens: [m('contato', 'Viste as fotografias do evento?', 150)],
  },
  {
    id: 7, redeId: 'messenger', contato: 'Equipa Design', naoLidas: 0,
    mensagens: [m('contato', 'Enviei a nova versão do logo.', 1500), m('eu', 'Recebi, está ótima!', 1490)],
  },
  {
    id: 8, redeId: 'email', contato: 'rh@empresa.co.ao', assunto: 'Confirmação de entrevista', naoLidas: 1,
    mensagens: [
      m('contato', 'Prezado(a), confirmamos a entrevista para quinta-feira às 14h30. Por favor, confirme a sua presença.', 200, [
        { nome: 'convite-entrevista.pdf', tamanho: 184_320, tipo: 'application/pdf' },
      ]),
    ],
  },
  {
    id: 9, redeId: 'email', contato: 'faturas@servicos.com', assunto: 'Fatura de novembro disponível', naoLidas: 0,
    mensagens: [m('contato', 'A sua fatura de novembro já está disponível na área de cliente.', 2000)],
  },
  {
    id: 10, redeId: 'sms', contato: '+244 921 687 594', naoLidas: 1,
    mensagens: [m('contato', 'O seu código de verificação é 482 913.', 5)],
  },
  {
    id: 11, redeId: 'sms', contato: 'Mãe', naoLidas: 0,
    mensagens: [m('contato', 'Liga-me quando puderes.', 700), m('eu', 'Ligo ao fim da tarde.', 690)],
  },
  {
    id: 12, redeId: 'instagram', contato: 'loja.criativa', naoLidas: 1,
    mensagens: [m('contato', 'Adorámos o seu último post! Podemos falar sobre uma parceria?', 55)],
  },
  {
    id: 13, redeId: 'instagram', contato: 'bruna.fotografia', naoLidas: 0,
    mensagens: [m('contato', 'Obrigada por partilhares as fotos!', 1100), m('eu', 'Ficaram incríveis, parabéns.', 1090)],
  },
  {
    id: 14, redeId: 'telegram', contato: 'Comunidade Dev Angola', naoLidas: 3,
    mensagens: [
      m('contato', 'Alguém conhece uma boa lib para gráficos em React?', 70),
      m('contato', 'Eu uso a Recharts.', 66),
      m('contato', 'Também recomendo.', 60),
    ],
  },
  {
    id: 15, redeId: 'telegram', contato: 'Rui Matos', naoLidas: 0,
    mensagens: [m('eu', 'Já te enviei o relatório.', 400), m('contato', 'Recebido, obrigado!', 395)],
  },
  {
    id: 16, redeId: 'linkedin', contato: 'Teresa Dias · Recrutadora', naoLidas: 1,
    mensagens: [
      m('contato', 'Olá! Temos uma vaga de Frontend que combina com o seu perfil. Tem disponibilidade para uma conversa?', 180),
    ],
  },
  {
    id: 17, redeId: 'linkedin', contato: 'Paulo Costa', naoLidas: 0,
    mensagens: [m('eu', 'Foi um prazer conhecer-te no evento.', 3000), m('contato', 'Igualmente! Vamos manter contacto.', 2990)],
  },
]

const ultima = (c) => c.mensagens[c.mensagens.length - 1]

// Pré-visualização de uma mensagem que só tem anexos
const descreverAnexos = (anexos = []) =>
  anexos.length === 0 ? '' : anexos.length === 1 ? `Anexo: ${anexos[0].nome}` : `${anexos.length} anexos`

const resumo = (c) => ({
  id: c.id,
  redeId: c.redeId,
  contato: c.contato,
  assunto: c.assunto ?? null,
  naoLidas: c.naoLidas,
  ultimaMensagem: ultima(c).texto || descreverAnexos(ultima(c).anexos),
  ultimaDe: ultima(c).de,
  ultimaEm: ultima(c).em,
  mensagens: c.mensagens,
})

export const redesApi = {
  // Redes com o total de mensagens por ler
  async listar() {
    await delay()
    return clone(
      REDES.map((r) => ({
        ...r,
        naoLidas: conversas.filter((c) => c.redeId === r.id).reduce((s, c) => s + c.naoLidas, 0),
      })),
    )
  },

  // Conversas de uma rede (ou de todas, com redeId = 'todas'), mais recentes primeiro
  async conversas(redeId = 'todas') {
    await delay()
    return clone(
      conversas
        .filter((c) => redeId === 'todas' || c.redeId === redeId)
        .map(resumo)
        .sort((a, b) => new Date(b.ultimaEm) - new Date(a.ultimaEm)),
    )
  },

  async marcarLida(conversaId) {
    await delay(80)
    const c = conversas.find((x) => x.id === conversaId)
    if (c) c.naoLidas = 0
  },

  // Envia uma resposta com texto e/ou anexos.
  // Com back-end real, os anexos seguem como multipart/form-data.
  async enviar(conversaId, texto, anexos = []) {
    await delay(350)
    const limpo = (texto || '').trim()
    if (!limpo && anexos.length === 0) throw new Error('Escreva uma mensagem ou anexe um ficheiro.')
    if (anexos.length > MAX_ANEXOS) throw new Error(`Máximo de ${MAX_ANEXOS} anexos por mensagem.`)
    if (anexos.some((a) => a.tamanho > MAX_TAMANHO)) throw new Error('Um dos ficheiros excede o tamanho máximo (10 MB).')
    const c = conversas.find((x) => x.id === conversaId)
    if (!c) throw new Error('Conversa não encontrada.')
    c.mensagens.push({ id: ++seqMsg, de: 'eu', texto: limpo, em: agora(), anexos: clone(anexos) })
    c.naoLidas = 0
    return clone(resumo(c))
  },
}
