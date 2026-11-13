import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'
import Login from '../pages/Login'
import '../styles/SplashScreen.css'

const DURACAO_ANIMACAO_SAIDA = 100

const FRASES = [
  'A preparar as tuas conversas…',
  'A afinar o reencaminhamento…',
  'Quase a chegar…',
]

const BOLHAS = [
  { id: 'a', texto: 'Olá! 👋', classe: 'splash-bolha-a' },
  { id: 'b', texto: 'Reencaminhado', classe: 'splash-bolha-b', seta: true },
  { id: 'c', texto: 'Com um clique', classe: 'splash-bolha-c', seta: true },
  { id: 'd', texto: 'Feito ✓', classe: 'splash-bolha-d' },
]

function SetaReencaminhar() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M14 5l7 7-7 7v-4.2c-5.2 0-8.7 1.5-11 5.2.7-5.6 3.9-9.6 11-10.8V5z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function SplashScreen({
  pronto = true,
  minimoMs = 5000,
  onTerminar,
}) {
  const [minimoPassou, setMinimoPassou] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [fraseAtual, setFraseAtual] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setMinimoPassou(true), minimoMs)
    return () => clearTimeout(t)
  }, [minimoMs])

  useEffect(() => {
    const t = setInterval(
      () => setFraseAtual((i) => (i + 1) % FRASES.length),
      1300,
    )
    return () => clearInterval(t)
  }, [])

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
      {/* Fundo: aurora + pontos */}
      <div className="splash-fundo" aria-hidden="true">
        <span className="splash-aurora splash-aurora-1" />
        <span className="splash-aurora splash-aurora-2" />
        <span className="splash-aurora splash-aurora-3" />
        <span className="splash-pontos" />
      </div>

      {/* Bolhas de mensagem a flutuar */}
      <div className="splash-bolhas" aria-hidden="true">
        {BOLHAS.map((b) => (
          <span key={b.id} className={`splash-bolha ${b.classe}`}>
            {b.seta && <SetaReencaminhar />}
            {b.texto}
          </span>
        ))}
      </div>

      {/* Conteúdo central */}
      <main className="splash-centro">
        <div className="splash-cartao">
          <div className="splash-halo" aria-hidden="true">
            <span className="splash-anel splash-anel-1" />
            <span className="splash-anel splash-anel-2" />
            <span className="splash-anel splash-anel-3" />
          </div>

          <img
            className="splash-logo"
            src={logo}
            alt="Reencaminhaqui — encaminhe mensagens com um clique"
          />

          <p className="splash-slogan">Encaminhe mensagens com um clique</p>

          <div className="splash-barra" aria-hidden="true">
            <span />
          </div>

          <p className="splash-texto" key={fraseAtual}>
            {FRASES[fraseAtual]}
          </p>
        </div>
      </main>
    </div>
  )
}
