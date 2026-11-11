import { useCallback, useEffect, useState } from 'react'

const BADGES = {
  ATIVO: 'ok', ATIVA: 'ok', ENVIADO: 'ok',
  INATIVO: 'neutral', PAUSADA: 'warn',
  PENDENTE: 'info', RETENTANDO: 'warn', FALHO: 'err',
}

export function Badge({ valor }) {
  return <span className={`badge badge-${BADGES[valor] || 'neutral'}`}>{valor}</span>
}

export function PageHead({ titulo, descricao, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function Modal({ titulo, onClose, onSubmit, submitLabel = 'Guardar', saving, children }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className="modal-head">
          <h2>{titulo}</h2>
          <button type="button" className="close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'A guardar…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export function Toast({ mensagem, onDone }) {
  useEffect(() => {
    if (!mensagem) return
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [mensagem, onDone])
  return mensagem ? <div className="toast">{mensagem}</div> : null
}

// Carrega dados de uma função assíncrona e permite recarregar
export function useCarregar(fn, deps = []) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(fn, deps)

  const recarregar = useCallback(() => {
    setCarregando(true)
    return executar()
      .then((d) => { setDados(d); setErro(null) })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [executar])

  useEffect(() => { recarregar() }, [recarregar])

  return { dados, erro, carregando, recarregar }
}

export const formatarData = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—'
