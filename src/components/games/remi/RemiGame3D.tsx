'use client'

import { useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Environment, MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface Card {
  suit: Suit
  rank: Rank
  id: string
}

interface Player {
  id: number
  name: string
  hand: Card[]
  isBot: boolean
  score: number
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
}

const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#ff2244', diamonds: '#ff2244', clubs: '#1a1a2e', spades: '#1a1a2e',
}

function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}_${suit}` })
    }
  }
  return deck
}

function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

function getCardValue(rank: Rank): number {
  if (rank === 'A') return 1
  if (['J', 'Q', 'K'].includes(rank)) return 10
  return parseInt(rank)
}

function Card3D({ card, position, rotation, selected, faceDown, onClick }: {
  card: Card
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  faceDown: boolean
  onClick?: () => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const targetY = selected ? position[1] + 0.3 : position[1]

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 10)
    }
  })

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'

  return (
    <group ref={meshRef} position={position} rotation={rotation} onClick={onClick}>
      {/* Card body */}
      <RoundedBox args={[0.7, 0.02, 1]} radius={0.04} castShadow>
        <meshStandardMaterial color={faceDown ? '#1a3a6e' : '#f5f5f0'} metalness={0.1} roughness={0.3} />
      </RoundedBox>

      {faceDown ? (
        <>
          {/* Card back pattern */}
          <RoundedBox args={[0.6, 0.001, 0.9]} radius={0.03} position={[0, 0.011, 0]}>
            <meshStandardMaterial color="#1e4d8c" metalness={0.2} roughness={0.4} />
          </RoundedBox>
          <Text position={[0, 0.015, 0]} fontSize={0.25} color="#ffd700" anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>
            G
          </Text>
        </>
      ) : (
        <>
          {/* Rank top-left */}
          <Text
            position={[-0.22, 0.015, -0.35]}
            fontSize={0.15}
            color={isRed ? '#ff2244' : '#1a1a2e'}
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
            fontWeight="bold"
          >
            {card.rank}
          </Text>
          {/* Suit top-left */}
          <Text
            position={[-0.22, 0.015, -0.2]}
            fontSize={0.12}
            color={isRed ? '#ff2244' : '#1a1a2e'}
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {SUIT_SYMBOLS[card.suit]}
          </Text>
          {/* Center suit */}
          <Text
            position={[0, 0.015, 0]}
            fontSize={0.35}
            color={isRed ? '#ff2244' : '#1a1a2e'}
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {SUIT_SYMBOLS[card.suit]}
          </Text>
        </>
      )}

      {selected && (
        <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.75, 1.05]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

function TableSurface() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5, 64]} />
        <meshStandardMaterial color="#1a5c32" metalness={0} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.95, 5.2, 64]} />
        <meshStandardMaterial color="#5a2d0c" metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  )
}

function DeckPile({ position, cardsLeft, onClick }: {
  position: [number, number, number]
  cardsLeft: number
  onClick: () => void
}) {
  const layers = Math.min(cardsLeft, 10)
  return (
    <group position={position} onClick={onClick}>
      {Array.from({ length: layers }).map((_, i) => (
        <RoundedBox key={i} args={[0.7, 0.02, 1]} radius={0.04} position={[0, i * 0.025, 0]} castShadow>
          <meshStandardMaterial color="#1a3a6e" metalness={0.1} roughness={0.3} />
        </RoundedBox>
      ))}
      <Text
        position={[0, layers * 0.025 + 0.05, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {cardsLeft.toString()}
      </Text>
    </group>
  )
}

interface RemiGame3DProps {
  isBot: boolean
  playerCount: number
  onGameEnd?: (winner: string) => void
}

export default function RemiGame3D({ isBot, playerCount, onGameEnd }: RemiGame3DProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [deck, setDeck] = useState<Card[]>([])
  const [discardPile, setDiscardPile] = useState<Card[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [gameStarted, setGameStarted] = useState(false)
  const [message, setMessage] = useState('Tekan "Mulai" untuk bermain')
  const [gameOver, setGameOver] = useState(false)
  const [phase, setPhase] = useState<'draw' | 'discard'>('draw')

  const startGame = useCallback(() => {
    let d = shuffleDeck(createDeck())
    const newPlayers: Player[] = []

    for (let i = 0; i < playerCount; i++) {
      const hand = d.slice(0, 7)
      d = d.slice(7)
      newPlayers.push({
        id: i,
        name: i === 0 ? 'Kamu' : `Bot ${i}`,
        hand,
        isBot: i !== 0 && isBot,
        score: 0,
      })
    }

    const topCard = d[0]
    d = d.slice(1)

    setPlayers(newPlayers)
    setDeck(d)
    setDiscardPile([topCard])
    setCurrentPlayerIndex(0)
    setGameStarted(true)
    setGameOver(false)
    setPhase('draw')
    setSelectedCards(new Set())
    setMessage('Ambil kartu dari deck atau buangan')
  }, [playerCount, isBot])

  const drawFromDeck = useCallback(() => {
    if (currentPlayerIndex !== 0 || phase !== 'draw' || deck.length === 0) return
    const card = deck[0]
    setDeck(prev => prev.slice(1))
    setPlayers(prev => prev.map((p, i) =>
      i === 0 ? { ...p, hand: [...p.hand, card] } : p
    ))
    setPhase('discard')
    setMessage('Buang 1 kartu')
  }, [currentPlayerIndex, phase, deck])

  const drawFromDiscard = useCallback(() => {
    if (currentPlayerIndex !== 0 || phase !== 'draw' || discardPile.length === 0) return
    const card = discardPile[discardPile.length - 1]
    setDiscardPile(prev => prev.slice(0, -1))
    setPlayers(prev => prev.map((p, i) =>
      i === 0 ? { ...p, hand: [...p.hand, card] } : p
    ))
    setPhase('discard')
    setMessage('Buang 1 kartu')
  }, [currentPlayerIndex, phase, discardPile])

  const discardCard = useCallback((cardId: string) => {
    if (currentPlayerIndex !== 0 || phase !== 'discard') return
    const player = players[0]
    const card = player.hand.find(c => c.id === cardId)
    if (!card) return

    const newHand = player.hand.filter(c => c.id !== cardId)
    setPlayers(prev => prev.map((p, i) =>
      i === 0 ? { ...p, hand: newHand } : p
    ))
    setDiscardPile(prev => [...prev, card])
    setSelectedCards(new Set())

    if (newHand.length === 0) {
      setMessage('Kamu menang!')
      setGameOver(true)
      onGameEnd?.('Kamu')
      return
    }

    nextTurn()
  }, [currentPlayerIndex, phase, players, onGameEnd])

  const nextTurn = useCallback(() => {
    const next = (currentPlayerIndex + 1) % playerCount
    setCurrentPlayerIndex(next)
    setPhase('draw')

    if (players[next]?.isBot) {
      setMessage(`${players[next].name} sedang bermain...`)
      setTimeout(() => botPlay(next), 1000)
    } else {
      setMessage('Ambil kartu dari deck atau buangan')
    }
  }, [currentPlayerIndex, playerCount, players])

  const botPlay = useCallback((botIndex: number) => {
    setPlayers(prev => {
      const newPlayers = [...prev]
      const bot = { ...newPlayers[botIndex], hand: [...newPlayers[botIndex].hand] }

      // Draw from deck
      if (deck.length > 0) {
        const card = deck[0]
        setDeck(d => d.slice(1))
        bot.hand.push(card)
      }

      // Discard highest value card
      if (bot.hand.length > 0) {
        let maxIdx = 0
        let maxVal = 0
        bot.hand.forEach((c, i) => {
          const v = getCardValue(c.rank)
          if (v > maxVal) { maxVal = v; maxIdx = i }
        })
        const discarded = bot.hand.splice(maxIdx, 1)[0]
        setDiscardPile(dp => [...dp, discarded])
      }

      if (bot.hand.length === 0) {
        setMessage(`${bot.name} menang!`)
        setGameOver(true)
        onGameEnd?.(bot.name)
      }

      newPlayers[botIndex] = bot
      return newPlayers
    })

    if (!gameOver) {
      const next = (botIndex + 1) % playerCount
      setCurrentPlayerIndex(next)
      setPhase('draw')
      if (players[next]?.isBot) {
        setTimeout(() => botPlay(next), 1000)
      } else {
        setMessage('Ambil kartu dari deck atau buangan')
      }
    }
  }, [deck, playerCount, players, gameOver, onGameEnd])

  const toggleCardSelection = (cardId: string) => {
    if (phase === 'discard' && currentPlayerIndex === 0) {
      discardCard(cardId)
    }
  }

  const myHand = players[0]?.hand || []
  const topDiscard = discardPile[discardPile.length - 1]

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-900/90 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold">{message}</span>
          {players.map((p, i) => (
            <span key={i} className={`text-sm ${i === currentPlayerIndex ? 'text-yellow-400 font-bold' : 'text-gray-400'}`}>
              {p.name}: {p.hand.length} kartu
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          {!gameStarted || gameOver ? (
            <button onClick={startGame} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold">
              {gameOver ? 'Main Lagi' : 'Mulai'}
            </button>
          ) : (
            <button onClick={startGame} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Phase hint */}
      {gameStarted && !gameOver && currentPlayerIndex === 0 && (
        <div className="bg-gray-900/90 border-b border-gray-700 px-4 py-2 flex items-center gap-4">
          {phase === 'draw' && (
            <>
              <button onClick={drawFromDeck} className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                Ambil dari Deck ({deck.length})
              </button>
              {topDiscard && (
                <button onClick={drawFromDiscard} className="px-4 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm">
                  Ambil {topDiscard.rank}{SUIT_SYMBOLS[topDiscard.suit]}
                </button>
              )}
            </>
          )}
          {phase === 'discard' && (
            <span className="text-yellow-400 text-sm">Klik kartu untuk dibuang</span>
          )}
        </div>
      )}

      <div className="flex-1">
        <Canvas camera={{ position: [0, 6, 5], fov: 45 }} shadows>
          <color attach="background" args={['#0a0a0a']} />
          <fog attach="fog" args={['#0a0a0a', 10, 25]} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 8, 3]} intensity={1.2} castShadow shadow-mapSize={2048} />
          <spotLight position={[0, 6, 0]} intensity={2} angle={0.5} penumbra={0.5} castShadow color="#fff8e7" />

          <TableSurface />

          {/* Deck pile */}
          {deck.length > 0 && (
            <DeckPile
              position={[-0.6, 0, 0]}
              cardsLeft={deck.length}
              onClick={phase === 'draw' && currentPlayerIndex === 0 ? drawFromDeck : () => {}}
            />
          )}

          {/* Discard pile */}
          {topDiscard && (
            <group position={[0.6, 0, 0]} onClick={phase === 'draw' && currentPlayerIndex === 0 ? drawFromDiscard : () => {}}>
              <Card3D
                card={topDiscard}
                position={[0, 0.02, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                selected={false}
                faceDown={false}
              />
            </group>
          )}

          {/* Player's hand (bottom) */}
          {myHand.map((card, i) => {
            const spread = Math.min(myHand.length * 0.8, 6)
            const x = (i - (myHand.length - 1) / 2) * (spread / myHand.length)
            return (
              <Card3D
                key={card.id}
                card={card}
                position={[x, 0.05, 3]}
                rotation={[-Math.PI / 2.5, 0, 0]}
                selected={selectedCards.has(card.id)}
                faceDown={false}
                onClick={() => toggleCardSelection(card.id)}
              />
            )
          })}

          {/* Other players' hands (face down) */}
          {players.slice(1).map((player, pIdx) => {
            const angles = playerCount === 2 ? [Math.PI] : playerCount === 3 ? [Math.PI * 2 / 3, Math.PI * 4 / 3] : [Math.PI / 2, Math.PI, Math.PI * 3 / 2]
            const ang = angles[pIdx] || 0
            const dist = 3.5

            return player.hand.map((card, i) => {
              const spread = Math.min(player.hand.length * 0.6, 4)
              const offset = (i - (player.hand.length - 1) / 2) * (spread / player.hand.length)
              const x = Math.sin(ang) * dist + Math.cos(ang) * offset
              const z = -Math.cos(ang) * dist + Math.sin(ang) * offset
              return (
                <Card3D
                  key={card.id}
                  card={card}
                  position={[x, 0.05, z]}
                  rotation={[-Math.PI / 2.5, ang, 0]}
                  selected={false}
                  faceDown={true}
                />
              )
            })
          })}

          {/* Player labels */}
          {players.map((player, pIdx) => {
            if (pIdx === 0) return null
            const angles = playerCount === 2 ? [Math.PI] : playerCount === 3 ? [Math.PI * 2 / 3, Math.PI * 4 / 3] : [Math.PI / 2, Math.PI, Math.PI * 3 / 2]
            const ang = angles[pIdx - 1] || 0
            const dist = 4.2
            return (
              <Text
                key={`label-${pIdx}`}
                position={[Math.sin(ang) * dist, 0.5, -Math.cos(ang) * dist]}
                fontSize={0.25}
                color={pIdx - 1 + 1 === currentPlayerIndex ? '#ffd700' : '#ffffff'}
                anchorX="center"
                anchorY="middle"
              >
                {player.name}
              </Text>
            )
          })}

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
              blur={[300, 100]}
              resolution={1024}
              mixBlur={1}
              mixStrength={30}
              roughness={1}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#0a0a0a"
              metalness={0.5}
              mirror={0.3}
            />
          </mesh>

          <Environment preset="apartment" />
          <OrbitControls
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={4}
            maxDistance={10}
            enablePan={false}
          />
        </Canvas>
      </div>
    </div>
  )
}
