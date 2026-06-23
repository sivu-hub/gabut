'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Environment, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface Ball {
  id: number
  position: [number, number, number]
  velocity: [number, number, number]
  color: string
  pocketed: boolean
  type: 'solid' | 'stripe' | 'cue' | 'eight'
}

const BALL_RADIUS = 0.15
const TABLE_WIDTH = 6
const TABLE_HEIGHT = 3
const FRICTION = 0.985
const POCKET_RADIUS = 0.28
const CUSHION_BOUNCE = 0.7

const POCKET_POSITIONS: [number, number][] = [
  [-TABLE_WIDTH / 2 + 0.1, -TABLE_HEIGHT / 2 + 0.1],
  [0, -TABLE_HEIGHT / 2 + 0.05],
  [TABLE_WIDTH / 2 - 0.1, -TABLE_HEIGHT / 2 + 0.1],
  [-TABLE_WIDTH / 2 + 0.1, TABLE_HEIGHT / 2 - 0.1],
  [0, TABLE_HEIGHT / 2 - 0.05],
  [TABLE_WIDTH / 2 - 0.1, TABLE_HEIGHT / 2 - 0.1],
]

const BALL_COLORS = [
  '#FFD700', '#0000FF', '#FF0000', '#800080',
  '#FF8C00', '#006400', '#800000', '#000000',
  '#FFD700', '#0000FF', '#FF0000', '#800080',
  '#FF8C00', '#006400', '#800000',
]

function createInitialBalls(): Ball[] {
  const balls: Ball[] = []
  balls.push({
    id: 0, position: [-1.5, BALL_RADIUS, 0], velocity: [0, 0, 0],
    color: '#FFFFFF', pocketed: false, type: 'cue',
  })

  const rackX = 1.5
  let id = 1
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = rackX + row * (BALL_RADIUS * 2 * 0.866)
      const z = (col - row / 2) * (BALL_RADIUS * 2.05)
      const type = id === 8 ? 'eight' : id <= 7 ? 'solid' : 'stripe'
      balls.push({
        id, position: [x, BALL_RADIUS, z], velocity: [0, 0, 0],
        color: BALL_COLORS[id - 1], pocketed: false, type,
      })
      id++
    }
  }
  return balls
}

function BallMesh({ ball }: { ball: Ball }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current && !ball.pocketed) {
      meshRef.current.position.set(...ball.position)
    }
  })

  if (ball.pocketed) return null

  return (
    <mesh ref={meshRef} position={ball.position} castShadow>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial
        color={ball.color}
        metalness={0.1}
        roughness={0.2}
        envMapIntensity={0.8}
      />
      {ball.type === 'stripe' && (
        <mesh>
          <torusGeometry args={[BALL_RADIUS * 0.85, BALL_RADIUS * 0.15, 8, 32]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.3} />
        </mesh>
      )}
      {ball.id > 0 && (
        <Text
          position={[0, BALL_RADIUS + 0.02, 0]}
          fontSize={0.08}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {ball.id.toString()}
        </Text>
      )}
    </mesh>
  )
}

function CueStick({ cueBall, power, angle, visible }: {
  cueBall: [number, number, number]
  power: number
  angle: number
  visible: boolean
}) {
  if (!visible) return null

  const cueLength = 3
  const offset = BALL_RADIUS + 0.1 + (1 - power) * 1.5
  const x = cueBall[0] - Math.cos(angle) * (offset + cueLength / 2)
  const z = cueBall[2] - Math.sin(angle) * (offset + cueLength / 2)

  return (
    <group position={[x, BALL_RADIUS, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.035, cueLength, 16]} />
        <meshStandardMaterial color="#8B4513" metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh position={[0, -cueLength / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.2, 16]} />
        <meshStandardMaterial color="#F5DEB3" metalness={0.1} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Table() {
  return (
    <group>
      {/* Felt surface */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TABLE_WIDTH, TABLE_HEIGHT]} />
        <meshStandardMaterial color="#0a6e3a" metalness={0} roughness={0.9} />
      </mesh>

      {/* Rails */}
      {[
        { pos: [0, 0.15, -TABLE_HEIGHT / 2 - 0.1] as [number, number, number], size: [TABLE_WIDTH + 0.4, 0.3, 0.2] as [number, number, number] },
        { pos: [0, 0.15, TABLE_HEIGHT / 2 + 0.1] as [number, number, number], size: [TABLE_WIDTH + 0.4, 0.3, 0.2] as [number, number, number] },
        { pos: [-TABLE_WIDTH / 2 - 0.1, 0.15, 0] as [number, number, number], size: [0.2, 0.3, TABLE_HEIGHT + 0.4] as [number, number, number] },
        { pos: [TABLE_WIDTH / 2 + 0.1, 0.15, 0] as [number, number, number], size: [0.2, 0.3, TABLE_HEIGHT + 0.4] as [number, number, number] },
      ].map((rail, i) => (
        <mesh key={i} position={rail.pos} castShadow>
          <boxGeometry args={rail.size} />
          <meshStandardMaterial color="#5a2d0c" metalness={0.2} roughness={0.5} />
        </mesh>
      ))}

      {/* Cushion surfaces (green inner edges) */}
      {[
        { pos: [0, 0.08, -TABLE_HEIGHT / 2 + 0.02] as [number, number, number], size: [TABLE_WIDTH - 0.6, 0.08, 0.04] as [number, number, number] },
        { pos: [0, 0.08, TABLE_HEIGHT / 2 - 0.02] as [number, number, number], size: [TABLE_WIDTH - 0.6, 0.08, 0.04] as [number, number, number] },
        { pos: [-TABLE_WIDTH / 2 + 0.02, 0.08, 0] as [number, number, number], size: [0.04, 0.08, TABLE_HEIGHT - 0.6] as [number, number, number] },
        { pos: [TABLE_WIDTH / 2 - 0.02, 0.08, 0] as [number, number, number], size: [0.04, 0.08, TABLE_HEIGHT - 0.6] as [number, number, number] },
      ].map((c, i) => (
        <mesh key={`cushion-${i}`} position={c.pos}>
          <boxGeometry args={c.size} />
          <meshStandardMaterial color="#0d8a47" metalness={0} roughness={0.7} />
        </mesh>
      ))}

      {/* Pockets */}
      {POCKET_POSITIONS.map((p, i) => (
        <mesh key={`pocket-${i}`} position={[p[0], -0.05, p[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[POCKET_RADIUS, 32]} />
          <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* Legs */}
      {[[-2.5, -1], [2.5, -1], [-2.5, 1], [2.5, 1]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, -0.6, z]}>
          <cylinderGeometry args={[0.08, 0.1, 1.2, 16]} />
          <meshStandardMaterial color="#3d1a00" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
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
  )
}

interface BilliardsGame3DProps {
  isBot: boolean
  onGameEnd?: (winner: string) => void
}

export default function BilliardsGame3D({ isBot, onGameEnd }: BilliardsGame3DProps) {
  const [balls, setBalls] = useState<Ball[]>(createInitialBalls)
  const [shooting, setShooting] = useState(false)
  const [power, setPower] = useState(0)
  const [angle, setAngle] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [scores, setScores] = useState([0, 0])
  const [message, setMessage] = useState('Player 1: Arahkan dan tembak!')
  const animationRef = useRef<number>(null)

  const allBallsStopped = useCallback((b: Ball[]) => {
    return b.every(ball => ball.pocketed ||
      (Math.abs(ball.velocity[0]) < 0.001 && Math.abs(ball.velocity[2]) < 0.001))
  }, [])

  const simulate = useCallback(() => {
    setBalls(prevBalls => {
      const newBalls = prevBalls.map(b => ({ ...b, position: [...b.position] as [number, number, number], velocity: [...b.velocity] as [number, number, number] }))
      let anyMoving = false
      const newScores = [...scores]

      for (const ball of newBalls) {
        if (ball.pocketed) continue

        ball.position[0] += ball.velocity[0]
        ball.position[2] += ball.velocity[2]
        ball.velocity[0] *= FRICTION
        ball.velocity[2] *= FRICTION

        if (Math.abs(ball.velocity[0]) < 0.0005) ball.velocity[0] = 0
        if (Math.abs(ball.velocity[2]) < 0.0005) ball.velocity[2] = 0

        if (Math.abs(ball.velocity[0]) > 0.001 || Math.abs(ball.velocity[2]) > 0.001) {
          anyMoving = true
        }

        // Cushion bounces
        const halfW = TABLE_WIDTH / 2 - BALL_RADIUS - 0.04
        const halfH = TABLE_HEIGHT / 2 - BALL_RADIUS - 0.04
        if (ball.position[0] < -halfW) { ball.position[0] = -halfW; ball.velocity[0] *= -CUSHION_BOUNCE }
        if (ball.position[0] > halfW) { ball.position[0] = halfW; ball.velocity[0] *= -CUSHION_BOUNCE }
        if (ball.position[2] < -halfH) { ball.position[2] = -halfH; ball.velocity[2] *= -CUSHION_BOUNCE }
        if (ball.position[2] > halfH) { ball.position[2] = halfH; ball.velocity[2] *= -CUSHION_BOUNCE }

        // Pocket check
        for (const pocket of POCKET_POSITIONS) {
          const dx = ball.position[0] - pocket[0]
          const dz = ball.position[2] - pocket[1]
          if (Math.sqrt(dx * dx + dz * dz) < POCKET_RADIUS) {
            ball.pocketed = true
            ball.velocity = [0, 0, 0]
            if (ball.type !== 'cue') {
              newScores[currentPlayer - 1]++
            }
            break
          }
        }
      }

      // Ball-ball collision
      for (let i = 0; i < newBalls.length; i++) {
        for (let j = i + 1; j < newBalls.length; j++) {
          if (newBalls[i].pocketed || newBalls[j].pocketed) continue
          const dx = newBalls[j].position[0] - newBalls[i].position[0]
          const dz = newBalls[j].position[2] - newBalls[i].position[2]
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist < BALL_RADIUS * 2) {
            const nx = dx / dist
            const nz = dz / dist
            const relVx = newBalls[i].velocity[0] - newBalls[j].velocity[0]
            const relVz = newBalls[i].velocity[2] - newBalls[j].velocity[2]
            const dot = relVx * nx + relVz * nz
            if (dot > 0) {
              newBalls[i].velocity[0] -= dot * nx
              newBalls[i].velocity[2] -= dot * nz
              newBalls[j].velocity[0] += dot * nx
              newBalls[j].velocity[2] += dot * nz
            }
            const overlap = BALL_RADIUS * 2 - dist
            newBalls[i].position[0] -= overlap * nx * 0.5
            newBalls[i].position[2] -= overlap * nz * 0.5
            newBalls[j].position[0] += overlap * nx * 0.5
            newBalls[j].position[2] += overlap * nz * 0.5
            anyMoving = true
          }
        }
      }

      if (!anyMoving) {
        setIsMoving(false)
        setScores(newScores)

        // Reset cue ball if pocketed
        const cueBall = newBalls.find(b => b.id === 0)
        if (cueBall?.pocketed) {
          cueBall.pocketed = false
          cueBall.position = [-1.5, BALL_RADIUS, 0]
          cueBall.velocity = [0, 0, 0]
        }

        // Check eight ball
        const eightBall = newBalls.find(b => b.id === 8)
        if (eightBall?.pocketed) {
          setMessage(`Player ${currentPlayer} menang!`)
          onGameEnd?.(`Player ${currentPlayer}`)
        } else {
          const nextPlayer = currentPlayer === 1 ? 2 : 1
          setCurrentPlayer(nextPlayer)
          if (isBot && nextPlayer === 2) {
            setTimeout(() => botShoot(newBalls), 1000)
          } else {
            setMessage(`Player ${nextPlayer}: Arahkan dan tembak!`)
          }
        }
      }

      return newBalls
    })
  }, [currentPlayer, isBot, scores, onGameEnd])

  useEffect(() => {
    if (isMoving) {
      const loop = () => {
        simulate()
        animationRef.current = requestAnimationFrame(loop)
      }
      animationRef.current = requestAnimationFrame(loop)
      return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
    }
  }, [isMoving, simulate])

  const shoot = useCallback((shootAngle: number, shootPower: number) => {
    const cueBall = balls.find(b => b.id === 0)
    if (!cueBall || cueBall.pocketed || isMoving) return

    const speed = shootPower * 0.15
    setBalls(prev => prev.map(b =>
      b.id === 0
        ? { ...b, velocity: [Math.cos(shootAngle) * speed, 0, Math.sin(shootAngle) * speed] }
        : b
    ))
    setIsMoving(true)
    setMessage('...')
  }, [balls, isMoving])

  const botShoot = useCallback((currentBalls: Ball[]) => {
    const cueBall = currentBalls.find(b => b.id === 0)
    if (!cueBall || cueBall.pocketed) return

    const targets = currentBalls.filter(b => !b.pocketed && b.id !== 0)
    if (targets.length === 0) return

    const target = targets[Math.floor(Math.random() * targets.length)]
    const dx = target.position[0] - cueBall.position[0]
    const dz = target.position[2] - cueBall.position[2]
    const botAngle = Math.atan2(dz, dx)
    const botPower = 0.4 + Math.random() * 0.4

    setMessage('Bot sedang menembak...')
    setTimeout(() => shoot(botAngle, botPower), 500)
  }, [shoot])

  const handleShoot = () => {
    if (isMoving || (isBot && currentPlayer === 2)) return
    shoot(angle, power)
    setPower(0)
    setShooting(false)
  }

  const resetGame = () => {
    setBalls(createInitialBalls())
    setScores([0, 0])
    setCurrentPlayer(1)
    setIsMoving(false)
    setMessage('Player 1: Arahkan dan tembak!')
  }

  const cueBall = balls.find(b => b.id === 0)

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-900/90 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold">{message}</span>
          <span className="text-green-400 text-sm">P1: {scores[0]}</span>
          <span className="text-blue-400 text-sm">P2: {scores[1]}</span>
        </div>
        <button onClick={resetGame} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm">
          Reset
        </button>
      </div>

      {/* Controls */}
      {!isMoving && !(isBot && currentPlayer === 2) && (
        <div className="bg-gray-900/90 border-b border-gray-700 px-4 py-2 flex items-center gap-4">
          <label className="text-gray-400 text-sm">Arah:</label>
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            className="flex-1 accent-purple-500"
          />
          <label className="text-gray-400 text-sm">Power:</label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={power}
            onChange={(e) => { setPower(parseFloat(e.target.value)); setShooting(true) }}
            className="w-32 accent-red-500"
          />
          <button
            onClick={handleShoot}
            className="px-6 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold"
          >
            Tembak!
          </button>
        </div>
      )}

      <div className="flex-1">
        <Canvas camera={{ position: [0, 6, 5], fov: 45 }} shadows>
          <color attach="background" args={['#0a0a0a']} />
          <fog attach="fog" args={['#0a0a0a', 10, 25]} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[0, 8, 0]} intensity={1.5} castShadow shadow-mapSize={2048} />
          <spotLight position={[0, 5, 0]} intensity={2} angle={0.6} penumbra={0.5} castShadow color="#fff8e7" />
          <Table />
          {balls.map(ball => <BallMesh key={ball.id} ball={ball} />)}
          {cueBall && !cueBall.pocketed && (
            <CueStick
              cueBall={cueBall.position}
              power={power}
              angle={angle}
              visible={!isMoving && !(isBot && currentPlayer === 2)}
            />
          )}
          <Floor />
          <Environment preset="warehouse" />
          <OrbitControls
            minPolarAngle={0.3}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={4}
            maxDistance={12}
            enablePan={false}
          />
        </Canvas>
      </div>
    </div>
  )
}
