// Base de dados em memória que imita o back-end (secção 4 da documentação técnica).
// Quando o back-end for integrado, este ficheiro deixa de ser usado.

const agora = (minutosAtras = 0) =>
  new Date(Date.now() - minutosAtras * 60_000).toISOString().slice(0, 19)

export const db = {
  seq: { canal: 3, rota: 4, mensagem: 6, reencaminhamento: 6 },

  canais: [
    { id: 1, nome: 'SMS', provedor: 'TWILIO', statusCanal: 'ATIVO' },
    { id: 2, nome: 'WHATSAPP', provedor: 'ZAPI', statusCanal: 'ATIVO' },
    { id: 3, nome: 'TESTES', provedor: 'SIMULADO', statusCanal: 'INATIVO' },
  ],

  rotas: [
    { id: 1, numeroOrigem: '+17372508034', numeroDestino: '+244921687594', statusRota: 'ATIVA', criadoEm: agora(3000), canalId: 1 },
    { id: 2, numeroOrigem: '+244911111111', numeroDestino: '+244922222222', statusRota: 'ATIVA', criadoEm: agora(2000), canalId: 2 },
    { id: 3, numeroOrigem: '+244933333333', numeroDestino: '+244944444444', statusRota: 'PAUSADA', criadoEm: agora(1000), canalId: 2 },
    { id: 4, numeroOrigem: '+244955555555', numeroDestino: '+244966666666', statusRota: 'ATIVA', criadoEm: agora(500), canalId: 3 },
  ],

  mensagens: [
    { id: 1, idExterno: 'SM001', remetenteOriginal: '+244912345678', conteudoTexto: 'Olá, tudo bem?', recebidoEm: agora(300), tipoConteudo: 'TEXTO', rotaId: 1, anexoIds: [], reencaminhamentoIds: [1] },
    { id: 2, idExterno: 'SM002', remetenteOriginal: '+244923456789', conteudoTexto: 'Preciso de informações sobre o serviço.', recebidoEm: agora(240), tipoConteudo: 'TEXTO', rotaId: 2, anexoIds: [], reencaminhamentoIds: [2] },
    { id: 3, idExterno: 'SM003', remetenteOriginal: '+244934567890', conteudoTexto: 'Segue a fotografia do documento.', recebidoEm: agora(120), tipoConteudo: 'IMAGEM', rotaId: 2, anexoIds: [1], reencaminhamentoIds: [3] },
    { id: 4, idExterno: 'SM004', remetenteOriginal: '+244945678901', conteudoTexto: 'A entrega chega amanhã?', recebidoEm: agora(45), tipoConteudo: 'TEXTO', rotaId: 1, anexoIds: [], reencaminhamentoIds: [4] },
    { id: 5, idExterno: 'SM005', remetenteOriginal: '+244956789012', conteudoTexto: 'Obrigado pelo atendimento.', recebidoEm: agora(10), tipoConteudo: 'TEXTO', rotaId: 2, anexoIds: [], reencaminhamentoIds: [5] },
    { id: 6, idExterno: 'SM006', remetenteOriginal: '+244967890123', conteudoTexto: 'Pode ligar-me quando puder?', recebidoEm: agora(2), tipoConteudo: 'TEXTO', rotaId: 1, anexoIds: [], reencaminhamentoIds: [6] },
  ],

  reencaminhamentos: [
    { id: 1, mensagemId: 1, statusEnvio: 'ENVIADO', tentativas: 1, idTransacaoProvedor: 'SM8f3a91c0', mensagemErro: null, processadoEm: agora(299) },
    { id: 2, mensagemId: 2, statusEnvio: 'ENVIADO', tentativas: 1, idTransacaoProvedor: '3EB0A1B2C3', mensagemErro: null, processadoEm: agora(239) },
    { id: 3, mensagemId: 3, statusEnvio: 'FALHO', tentativas: 5, idTransacaoProvedor: null, mensagemErro: 'Anexos ainda não são suportados no fluxo automático.', processadoEm: agora(115) },
    { id: 4, mensagemId: 4, statusEnvio: 'ENVIADO', tentativas: 1, idTransacaoProvedor: 'SM1d2e3f40', mensagemErro: null, processadoEm: agora(44) },
    { id: 5, mensagemId: 5, statusEnvio: 'RETENTANDO', tentativas: 2, idTransacaoProvedor: null, mensagemErro: 'Timeout ao contactar o provedor (HTTP 503).', processadoEm: agora(5) },
    { id: 6, mensagemId: 6, statusEnvio: 'PENDENTE', tentativas: 0, idTransacaoProvedor: null, mensagemErro: null, processadoEm: null },
  ],

  anexos: [
    { id: 1, mensagemId: 3, mimeType: 'image/jpeg', urlOrigem: 'https://exemplo.com/foto.jpg', urlLocalS3: 'foto.jpg' },
  ],
}

// Conta do utilizador autenticado (simulada; o back-end ainda não tem login).
export const perfilDb = {
  usuario: 'admin',
  senha: 'admin123',
  nome: 'Leonardo Tiago',
  email: 'admin@reencaminhaqui.local',
  funcao: 'ADMIN',
  criadoEm: agora(60 * 24 * 30),
}

// Provedores aceites (equivale ao ProvedorRegistry do back-end)
export const PROVEDORES = ['SIMULADO', 'TWILIO', 'ZAPI', 'META']
