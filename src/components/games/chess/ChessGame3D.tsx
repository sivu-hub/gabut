'use client'

import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Environment, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { Chess, Square, PieceSymbol, Color } from 'chess.js'

const PIECE_SHAPES: Record<PieceSymbol, { height: number; radius: number; segments: number }> = {
  p: { height: 0.6, radius: 0.2, segments: 8 },
  r: { height: 0.8, radius: 0.25, segments: 4 },
  n: { height: 0.9, radius: 0.22, segments: 6 },
  b: { height: 1.0, radius: 0.2, segments: 3 },
  q: { height: 1.2, radius: 0.28, segments: 16 },
  k: { height: 1.3, radius: 0.25, segments: 8 },
}

function ChessPiece({ type, color, position, selected, onClick }: {
  type: PieceSymbol
  color: Color
  position: [number, number, number]
  selected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const shape = PIECE_SHAPES[type]
  const isWhite = color === 'w'

  useFrame((_, delta) => {
    if (meshRef.current && selected) {
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.005) * 0.1 + 0.15
    } else if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1], delta * 10)
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={onClick} castShadow>
        {/* Base */}
        <cylinderGeometry args={[shape.radius, shape.radius * 1.2, 0.15, 32]} />
        <meshStandardMaterial
          color={isWhite ? '#f0e6d3' : '#2a1810'}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, shape.height / 2 + 0.075, 0]} onClick={onClick} castShadow>
        {type === 'k' ? (
          <cylinderGeometry args={[shape.radius * 0.6, shape.radius, shape.height, shape.segments]} />
        ) : type === 'q' ? (
          <sphereGeometry args={[shape.radius, shape.segments, shape.segments]} />
        ) : type === 'b' ? (
          <coneGeometry args={[shape.radius, shape.height, 16]} />
        ) : type === 'n' ? (
          <boxGeometry args={[shape.radius * 1.5, shape.height, shape.radius]} />
        ) : type === 'r' ? (
          <cylinderGeometry args={[shape.radius, shape.radius, shape.height, shape.segments]} />
        ) : (
          <sphereGeometry args={[shape.radius * 0.8, 16, 16]} />
        )}
        <meshStandardMaterial
          color={isWhite ? '#f5edd6' : '#1a0f08'}
          metalness={0.4}
          roughness={0.3}
          emissive={selected ? (isWhite ? '#ffcc00' : '#ff8800') : '#000000'}
          emissiveIntensity={selected ? 0.5 : 0}
        />
      </mesh>
      {/* Label */}
      <Text
        position={[0, shape.height + 0.3, 0]}
        fontSize={0.25}
        color={isWhite ? '#ffffff' : '#cccccc'}
        anchorX="center"
        anchorY="middle"
      >
        {type === 'k' ? '♚' : type === 'q' ? '♛' : type === 'r' ? '♜' : type === 'b' ? '♝' : type === 'n' ? '♞' : '♟'}
      </Text>
      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}

function BoardSquare({ position, isLight, isHighlighted, isValidMove, onClick }: {
  position: [number, number, number]
  isLight: boolean
  isHighlighted: boolean
  isValidMove: boolean
  onClick: () => void
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClick}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={isHighlighted ? '#ffd700' : isValidMove ? '#44ff44' : isLight ? '#e8d5b7' : '#6b4226'}
        metalness={0.1}
        roughness={0.8}
        transparent={isValidMove}
        opacity={isValidMove ? 0.7 : 1}
      />
    </mesh>
  )
}

function Board({ game, selectedSquare, validMoves, onSquareClick }: {
  game: Chess
  selectedSquare: string | null
  validMoves: string[]
  onSquareClick: (sq: string) => void
}) {
  const squares = []
  const pieces = []

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = `${String.fromCharCode(97 + col)}${8 - row}` as Square
      const x = col - 3.5
      const z = row - 3.5
      const isLight = (row + col) % 2 === 0

      squares.push(
        <BoardSquare
          key={`sq-${sq}`}
          position={[x, 0, z]}
          isLight={isLight}
          isHighlighted={selectedSquare === sq}
          isValidMove={validMoves.includes(sq)}
          onClick={() => onSquareClick(sq)}
        />
      )

      const piece = game.get(sq)
      if (piece) {
        pieces.push(
          <ChessPiece
            key={`pc-${sq}`}
            type={piece.type}
            color={piece.color}
            position={[x, 0.075, z]}
            selected={selectedSquare === sq}
            onClick={() => onSquareClick(sq)}
          />
        )
      }
    }
  }

  return (
    <group>
      {/* Board frame */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[9, 0.2, 9]} />
        <meshStandardMaterial color="#3d2817" metalness={0.2} roughness={0.6} />
      </mesh>
      {squares}
      {pieces}
    </group>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a0a0a"
        metalness={0.5}
        mirror={0.5}
      />
    </mesh>
  )
}

interface ChessGame3DProps {
  isBot: boolean
  onGameEnd?: (winner: string) => void
}

export default function ChessGame3D({ isBot, onGameEnd }: ChessGame3DProps) {
  const [game, setGame] = useState(new Chess())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [validMoves, setValidMoves] = useState<string[]>([])
  const [status, setStatus] = useState('Giliran Putih')
  const [gameOver, setGameOver] = useState(false)

  const updateStatus = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Hitam' : 'Putih'
      setStatus(`Skakmat! ${winner} menang!`)
      setGameOver(true)
      onGameEnd?.(winner)
    } else if (g.isDraw()) {
      setStatus('Seri!')
      setGameOver(true)
      onGameEnd?.('draw')
    } else if (g.isCheck()) {
      setStatus(`Skak! Giliran ${g.turn() === 'w' ? 'Putih' : 'Hitam'}`)
    } else {
      setStatus(`Giliran ${g.turn() === 'w' ? 'Putih' : 'Hitam'}`)
    }
  }, [onGameEnd])

  const makeBotMove = useCallback((g: Chess) => {
    if (g.isGameOver()) return
    const moves = g.moves()
    if (moves.length === 0) return

    setTimeout(() => {
      // Simple bot: prioritize captures, checks, then random
      const captures = moves.filter(m => m.includes('x'))
      const checks = moves.filter(m => m.includes('+'))
      const preferred = captures.length > 0 ? captures : checks.length > 0 ? checks : moves
      const move = preferred[Math.floor(Math.random() * preferred.length)]
      g.move(move)
      setGame(new Chess(g.fen()))
      updateStatus(g)
    }, 500)
  }, [updateStatus])

  const handleSquareClick = useCallback((sq: string) => {
    if (gameOver) return
    if (isBot && game.turn() === 'b') return

    const newGame = new Chess(game.fen())

    if (selectedSquare) {
      try {
        const move = newGame.move({ from: selectedSquare as Square, to: sq as Square, promotion: 'q' })
        if (move) {
          setGame(new Chess(newGame.fen()))
          setSelectedSquare(null)
          setValidMoves([])
          updateStatus(newGame)

          if (isBot && !newGame.isGameOver()) {
            makeBotMove(newGame)
          }
          return
        }
      } catch {
        // Invalid move, try selecting the clicked square
      }
    }

    const piece = newGame.get(sq as Square)
    if (piece && piece.color === newGame.turn()) {
      setSelectedSquare(sq)
      const moves = newGame.moves({ square: sq as Square, verbose: true })
      setValidMoves(moves.map(m => m.to))
    } else {
      setSelectedSquare(null)
      setValidMoves([])
    }
  }, [game, selectedSquare, gameOver, isBot, updateStatus, makeBotMove])

  const resetGame = () => {
    const g = new Chess()
    setGame(g)
    setSelectedSquare(null)
    setValidMoves([])
    setGameOver(false)
    setStatus('Giliran Putih')
  }

  const moveHistory = useMemo(() => {
    return game.history().slice(-10)
  }, [game])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Status bar */}
      <div className="bg-gray-900/90 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${game.turn() === 'w' ? 'bg-white' : 'bg-gray-800 border border-gray-600'}`} />
          <span className="text-white font-semibold">{status}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={resetGame} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 3D Board */}
        <div className="flex-1">
          <Canvas
            camera={{ position: [0, 8, 8], fov: 50 }}
            shadows
            gl={{ antialias: true }}
          >
            <color attach="background" args={['#0a0a0a']} />
            <fog attach="fog" args={['#0a0a0a', 15, 30]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow shadow-mapSize={2048} />
            <pointLight position={[-5, 5, -5]} intensity={0.5} color="#a78bfa" />
            <Board
              game={game}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              onSquareClick={handleSquareClick}
            />
            <Floor />
            <Environment preset="city" />
            <OrbitControls
              minPolarAngle={0.3}
              maxPolarAngle={Math.PI / 2.2}
              minDistance={6}
              maxDistance={15}
              enablePan={false}
            />
          </Canvas>
        </div>

        {/* Move history sidebar */}
        <div className="w-48 bg-gray-900/90 border-l border-gray-700 p-3 hidden md:block">
          <h4 className="text-sm font-bold text-gray-400 mb-2">Riwayat</h4>
          <div className="space-y-1">
            {moveHistory.map((move, i) => (
              <div key={i} className="text-sm text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded">
                {move}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
