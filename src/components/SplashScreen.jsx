import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'
import Login from '../pages/Login'
import '../styles/SplashScreen.css'

const DURACAO_ANIMACAO_SAIDA = 450

export default function SplashScreen({
  pronto = true,
  minimoMs = 1600,
  onTerminar,
}) {
  const [minimoPassou, setMinimoPassou] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinimoPassou(true), minimoMs)
    return () => clearTimeout(t)
  }, [minimoMs])

  useEffect(() => {
    if (!pronto || !minimoPassou) return

    setSaindo(true)

    const t = setTimeout(() => {
      setMostrarLogin(true)
      onTerminar?.()
    }, DURACAO_ANIMACAO_SAIDA)

    return () => clearTimeout(t)
  }, [pronto, minimoPassou, onTerminar])

  if (mostrarLogin) {
    return <Login />
  }

  return (
    <div
      className={`splash${saindo ? ' splash-saindo' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="A carregar o Reencaminhaqui"
    >
      <img
        className="splash-logo"
        src={logo}
        alt="Reencaminhaqui — encaminhe mensagens com um clique"
      />
      <div className="splash-barra" aria-hidden="true">
        <span />
      </div>
      <p className="splash-texto">A carregar…</p>
    </div>
  )
}