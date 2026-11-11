import { useState } from 'react'
import { reencaminhamentosApi } from '../api'
import { Badge, PageHead, formatarData, useCarregar } from '../components/ui.jsx'
import '../styles/Reencaminhamentos.css'

const ESTADOS = ['PENDENTE', 'ENVIADO', 'RETENTANDO', 'FALHO']
const MAX_TENTATIVAS = 5

export default function Reencaminhamentos() {
  const [filtro, setFiltro] = useState('')
  const { dados, erro, carregando, recarregar } = useCarregar(() => reencaminhamentosApi.listar(), [])

  const contagem = (estado) => (dados ? dados.filter((r) => r.statusEnvio === estado).length : 0)
  const visiveis = dados ? dados.filter((r) => !filtro || r.statusEnvio === filtro) : []

  return (
    <>
      <PageHead
        titulo="Reencaminhamentos"
        descricao={`Estado de cada envio ao Número B. Falhas temporárias são repetidas até ${MAX_TENTATIVAS} vezes.`}
      >
        <button className="reenv-btn" onClick={recarregar} disabled={carregando}>
          {carregando ? 'A atualizar…' : 'Atualizar'}
        </button>
      </PageHead>

      <div className="reenv-filtros" role="group" aria-label="Filtrar por estado">
        <button
          className={`reenv-chip${filtro === '' ? ' reenv-chip-ativo' : ''}`}
          onClick={() => setFiltro('')}
          aria-pressed={filtro === ''}
        >
          Todos <span>{dados ? dados.length : '…'}</span>
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            className={`reenv-chip${filtro === e ? ' reenv-chip-ativo' : ''}`}
            onClick={() => setFiltro(filtro === e ? '' : e)}
            aria-pressed={filtro === e}
          >
            {e} <span>{dados ? contagem(e) : '…'}</span>
          </button>
        ))}
      </div>

      <div className="reenv-card">
        {erro && <div className="reenv-vazio">{erro}</div>}
        {!erro && !dados && <div className="reenv-vazio">A carregar…</div>}
        {dados && visiveis.length === 0 && (
          <div className="reenv-vazio">Nenhum reencaminhamento encontrado.</div>
        )}
        {visiveis.length > 0 && (
          <div className="reenv-tabela-wrap">
            <table className="reenv-tabela">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mensagem</th>
                  <th>Estado</th>
                  <th>Tentativas</th>
                  <th>ID no provedor</th>
                  <th>Último processamento</th>
                  <th>Erro</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>#{r.mensagemId}</td>
                    <td>
                      <Badge valor={r.statusEnvio} />
                    </td>
                    <td>
                      <div className="reenv-tentativas" title={`${r.tentativas} de ${MAX_TENTATIVAS}`}>
                        <div className="reenv-tentativas-barra">
                          <span
                            className={r.tentativas >= MAX_TENTATIVAS ? 'reenv-esgotadas' : ''}
                            style={{ width: `${Math.min(100, (r.tentativas / MAX_TENTATIVAS) * 100)}%` }}
                          />
                        </div>
                        <span className="reenv-tentativas-num">
                          {r.tentativas}/{MAX_TENTATIVAS}
                        </span>
                      </div>
                    </td>
                    <td className="reenv-mono">{r.idTransacaoProvedor ?? '—'}</td>
                    <td className="reenv-muted">{formatarData(r.processadoEm)}</td>
                    <td className={r.mensagemErro ? 'reenv-erro' : 'reenv-muted'}>{r.mensagemErro ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
