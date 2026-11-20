import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Center, Bounds, useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/signals'

const ACCENT = '#ff5a2a'
const AMBER = '#ffc36b'

/* ───────── Процедурная модель жилого комплекса (пока нет настоящего .glb) ───────── */
function Complex() {
  const slabs = useRef([])
  const win = useRef()

  const wings = useMemo(
    () => [
      { pos: [0, 0, 0], size: [3.1, 1.55], floors: 9 },
      { pos: [-2.15, 0, 1.55], size: [1.4, 1.5], floors: 6 },
    ],
    [],
  )
  const H = 0.3
  const GAP = 0.035

  // окна — один InstancedMesh на весь комплекс
  const windows = useMemo(() => {
    const list = []
    wings.forEach((w, wi) => {
      const [W, D] = w.size
      for (let f = 0; f < w.floors; f++) {
        const y = f * (H + GAP) + H / 2
        const cols = Math.max(2, Math.round(W / 0.42))
        for (let c = 0; c < cols; c++) {
          const x = -W / 2 + (W / cols) * (c + 0.5)
          list.push({ p: [w.pos[0] + x, y, w.pos[2] + D / 2 + 0.006], r: 0, wi, f })
          list.push({ p: [w.pos[0] + x, y, w.pos[2] - D / 2 - 0.006], r: Math.PI, wi, f })
        }
        for (let c = 0; c < 3; c++) {
          const z = -D / 2 + (D / 3) * (c + 0.5)
          list.push({ p: [w.pos[0] + W / 2 + 0.006, y, w.pos[2] + z], r: Math.PI / 2, wi, f })
          list.push({ p: [w.pos[0] - W / 2 - 0.006, y, w.pos[2] + z], r: -Math.PI / 2, wi, f })
        }
      }
    })
    return list
  }, [wings])

  useEffect(() => {
    const m = win.current
    if (!m) return
    const d = new THREE.Object3D()
    const col = new THREE.Color()
    windows.forEach((w, i) => {
      d.position.set(...w.p)
      d.rotation.set(0, w.r, 0)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      const lit = Math.random() > 0.38
      col.set(lit ? AMBER : '#1c1d24').multiplyScalar(lit ? 0.7 + Math.random() * 0.9 : 1)
      m.setColorAt(i, col)
    })
    m.instanceMatrix.needsUpdate = true
    m.instanceColor.needsUpdate = true
  }, [windows])

  // «выбор этажа»: подсветка бежит вверх по зданию
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const active = Math.floor(t * 1.4) % 13
    slabs.current.forEach((m) => {
      if (!m) return
      const target = m.userData.f === active ? 1.6 : 0.05
      m.emissiveIntensity += (target - m.emissiveIntensity) * 0.16
    })
  })

  let k = 0
  return (
    <group position={[0.4, 0, -0.5]}>
      {wings.map((w, wi) =>
        Array.from({ length: w.floors }, (_, f) => (
          <mesh key={`${wi}-${f}`} position={[w.pos[0], f * (H + GAP) + H / 2, w.pos[2]]}>
            <boxGeometry args={[w.size[0], H, w.size[1]]} />
            <meshStandardMaterial
              ref={(m) => { if (m) { m.userData.f = f; slabs.current[k++ % 60] = m } }}
              color="#17181e"
              roughness={0.55}
              metalness={0.4}
              emissive={ACCENT}
              emissiveIntensity={0.05}
            />
          </mesh>
        )),
      )}
      {/* крыши */}
      <mesh position={[0, 9 * (H + GAP) + 0.04, 0]}>
        <boxGeometry args={[3.2, 0.08, 1.65]} />
        <meshStandardMaterial color="#0d0e12" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-2.15, 6 * (H + GAP) + 0.04, 1.55]}>
        <boxGeometry args={[1.5, 0.08, 1.6]} />
        <meshStandardMaterial color="#0d0e12" roughness={0.4} metalness={0.6} />
      </mesh>
      <instancedMesh ref={win} args={[null, null, windows.length]} frustumCulled={false}>
        <planeGeometry args={[0.24, 0.14]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      {/* площадка */}
      <mesh position={[-0.7, -0.03, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.6, 64]} />
        <meshStandardMaterial color="#0b0b0e" roughness={0.9} />
      </mesh>
      <mesh position={[-0.7, -0.015, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.45, 4.5, 96]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

/* ───────── Процедурный самолёт (пока нет настоящего .glb) ───────── */
function Plane() {
  const g = useRef()
  const seat = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    g.current.position.y = 1.5 + Math.sin(t * 0.9) * 0.08
    g.current.rotation.z = Math.sin(t * 0.6) * 0.04
    seat.current.material.opacity = 0.5 + Math.sin(t * 3) * 0.4
  })
  const body = { color: '#d9d6d0', metalness: 0.35, roughness: 0.4 }
  return (
    <group ref={g} rotation={[0, -0.5, 0]}>
      {/* фюзеляж */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.42, 4.2, 12, 28]} />
        <meshStandardMaterial {...body} />
      </mesh>
      {/* полоса и окна */}
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1.003, 1.003]}>
        <cylinderGeometry args={[0.425, 0.425, 3.6, 28, 1, true]} />
        <meshStandardMaterial color="#1b1c22" metalness={0.5} roughness={0.5} transparent opacity={0} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => (
        <group key={i}>
          <mesh position={[-1.7 + i * 0.22, 0.12, 0.4]}><boxGeometry args={[0.09, 0.11, 0.02]} /><meshBasicMaterial color="#ffc36b" toneMapped={false} /></mesh>
          <mesh position={[-1.7 + i * 0.22, 0.12, -0.4]}><boxGeometry args={[0.09, 0.11, 0.02]} /><meshBasicMaterial color="#ffc36b" toneMapped={false} /></mesh>
        </group>
      ))}
      {/* выбранное место 12A — мигающий маркер на модели */}
      <mesh ref={seat} position={[0.5, 0.12, 0.43]}>
        <boxGeometry args={[0.12, 0.14, 0.03]} />
        <meshBasicMaterial color={ACCENT} transparent toneMapped={false} />
      </mesh>
      {/* крылья */}
      {[1, -1].map((d) => (
        <group key={d}>
          <mesh position={[0.15, -0.18, d * 1.55]} rotation={[d * 0.08, d * -0.45, 0]}>
            <boxGeometry args={[1.5, 0.07, 2.9]} />
            <meshStandardMaterial {...body} />
          </mesh>
          <mesh position={[0.5, -0.42, d * 1.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.17, 0.85, 20]} />
            <meshStandardMaterial color="#8d8a85" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* стабилизатор */}
          <mesh position={[-2.1, 0.12, d * 0.6]} rotation={[0, d * -0.5, 0]}>
            <boxGeometry args={[0.7, 0.05, 1.2]} />
            <meshStandardMaterial {...body} />
          </mesh>
        </group>
      ))}
      {/* киль */}
      <mesh position={[-2.15, 0.62, 0]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.8, 0.95, 0.06]} />
        <meshStandardMaterial color={ACCENT} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* кабина */}
      <mesh position={[2.2, 0.1, 0]}><boxGeometry args={[0.12, 0.1, 0.5]} /><meshBasicMaterial color="#5db7ff" toneMapped={false} /></mesh>
      {/* орбита-подсветка */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <ringGeometry args={[3.1, 3.13, 96]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

/* ───────── Реальная модель .glb (когда положишь файл в public/models) ───────── */
function Glb({ url }) {
  const { scene } = useGLTF(url)
  return (
    <Bounds fit clip observe margin={1.25}>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 7, 4]} intensity={2.4} color="#ffe2c8" />
      <directionalLight position={[-6, 3, -4]} intensity={1.2} color="#5db7ff" />
      <pointLight position={[0, 3, 3]} intensity={18} color={ACCENT} distance={12} />
    </>
  )
}

// OrbitControls ставит touch-action:none — на телефоне это ломает вертикальный скролл страницы.
function TouchFix() {
  const el = useThree((s) => s.gl.domElement)
  useEffect(() => {
    const id = requestAnimationFrame(() => { el.style.touchAction = 'pan-y' })
    return () => cancelAnimationFrame(id)
  }, [el])
  return null
}

export default function ProjectScene({ scene, model }) {
  const holder = useRef(null)
  const [visible, setVisible] = useState(false)

  // рисуем только пока блок на экране
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' })
    io.observe(holder.current)
    return () => io.disconnect()
  }, [])

  const isHostel = scene === 'hostel'
  return (
    <div ref={holder} className="scene-holder" data-cursor="drag">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ position: isHostel ? [6.2, 4.3, 7.2] : [6.2, 3.2, 9], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Lights />
        <Suspense fallback={null}>
          {model ? <Glb url={asset(model.replace(/^\//, ''))} /> : isHostel ? <Complex /> : <Plane />}
        </Suspense>
        <ContactShadows position={[0, -0.02, 0]} opacity={0.5} scale={14} blur={2.6} far={5} color="#000" />
        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={isHostel ? 0.9 : 1.4}
          minPolarAngle={0.5}
          maxPolarAngle={1.5}
          target={isHostel ? [0, 1.5, 0.3] : [0, 1.4, 0]}
        />
        <TouchFix />
      </Canvas>
    </div>
  )
}
