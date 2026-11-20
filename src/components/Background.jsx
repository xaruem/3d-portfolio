import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GLSL_SIMPLEX } from '../lib/glsl'
import { signals } from '../lib/signals'

const isMobile = () => window.matchMedia('(max-width: 760px)').matches
const ACCENT_A = '#ff5a2a'
const ACCENT_B = '#ffb347'
const COOL = '#4fd8ff'

/* ───────── Частицы: глубокий объём, камера «ныряет» сквозь него при скролле ─────────
   Шейдер адаптирован из Doomsday: simplex-дрейф + отталкивание от курсора. */
function ParticleField({ count }) {
  const mat = useRef()
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uScroll: { value: 0 },
    uVel: { value: 0 },
    uFade: { value: 0 },
    uPR: { value: 1 },
    uAspect: { value: 1 },
    uTanHalf: { value: Math.tan((55 * Math.PI) / 360) },
    uA: { value: new THREE.Color(ACCENT_A) },
    uB: { value: new THREE.Color(ACCENT_B) },
    uCool: { value: new THREE.Color(COOL) },
  }), [])
  const points = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const scale = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = -Math.random() * 120 + 14
      seed[i] = Math.random()
      scale[i] = 0.35 + Math.pow(Math.random(), 1.8) * 1.4
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    return g
  }, [count])

  useFrame((state) => {
    const u = uniforms
    u.uTime.value = signals.time
    u.uMouse.value.set(signals.mx, signals.my)
    u.uScroll.value = signals.scroll
    u.uVel.value = Math.min(1, Math.abs(signals.velocity) / 40)
    u.uFade.value = signals.reveal
    u.uPR.value = state.gl.getPixelRatio()
    u.uAspect.value = state.size.width / state.size.height
  })

  return (
    <points geometry={points} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          attribute float aSeed; attribute float aScale;
          uniform float uTime,uScroll,uVel,uFade,uPR,uAspect,uTanHalf;
          uniform vec2 uMouse;
          varying float vAlpha; varying float vMix;
          ${GLSL_SIMPLEX}
          void main(){
            vec3 p = position;
            float t = uTime*0.1;
            vec3 np = p*0.045 + vec3(aSeed*12.0, t, t*0.7);
            p += vec3(snoise(np), snoise(np+19.1), snoise(np+7.3)) * (1.2 + uVel*2.0);
            vec4 mv = modelViewMatrix * vec4(p,1.0);
            float depth = -mv.z;
            // отталкивание от курсора — радиус постоянный на экране
            float h = max(depth,0.5)*uTanHalf;
            vec2 m = uMouse*vec2(h*uAspect, h);
            vec2 d = mv.xy - m;
            float r = 0.22*h;
            float infl = 1.0 - smoothstep(0.0, r, length(d));
            mv.xy += normalize(d+1e-4)*infl*r*0.55;
            gl_Position = projectionMatrix*mv;
            float att = clamp(9.0/max(depth,0.5), 0.25, 6.0);
            gl_PointSize = 24.0*aScale*uPR*att*(0.8+uVel*0.6);
            float tw = 0.55+0.45*sin(uTime*(1.0+aSeed*2.0)+aSeed*30.0);
            float near = smoothstep(0.4, 3.0, depth);
            float far  = 1.0 - smoothstep(18.0, 75.0, depth);
            vAlpha = tw*near*far*uFade;
            vMix = aSeed;
          }`}
        fragmentShader={/* glsl */ `
          precision highp float;
          uniform vec3 uA,uB,uCool; uniform float uScroll;
          varying float vAlpha; varying float vMix;
          void main(){
            float d = length(gl_PointCoord-0.5);
            float mask = 1.0 - smoothstep(0.0,0.5,d);
            float core = 1.0 - smoothstep(0.0,0.15,d);
            vec3 warm = mix(uA,uB,vMix);
            vec3 col = mix(warm, uCool, smoothstep(0.55,1.0,uScroll)*0.75);
            col += core*0.8;
            float a = mask*vAlpha*0.9;
            if(a<0.004) discard;
            gl_FragColor = vec4(col,a);
          }`}
      />
    </points>
  )
}

/* ───────── Орб в герое: сфера из точек, дышит шумом и «выпирает» к курсору ───────── */
function Orb() {
  const group = useRef()
  const rings = useRef()
  const mat = useRef()
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPR: { value: 1 },
    uVel: { value: 0 },
    uA: { value: new THREE.Color(ACCENT_A) },
    uB: { value: new THREE.Color(ACCENT_B) },
  }), [])
  const { camera, size } = useThree()

  const geo = useMemo(() => {
    const n = isMobile() ? 5500 : 11000
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    const phi = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = phi * i
      pos[i * 3] = Math.cos(th) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(th) * r
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [])

  useFrame((state) => {
    const g = group.current
    const s = signals
    const wide = size.width / size.height > 1.15
    // орб «приклеен» к камере — при нырянии в частицы он уезжает вверх и гаснет
    const out = THREE.MathUtils.smoothstep(s.scroll, 0.0, 0.1)
    const ease = 1 - Math.pow(1 - s.reveal, 3)
    const sc = (wide ? 0.92 : 0.72) * ease * (1 - out)
    g.scale.setScalar(Math.max(sc, 0.0001))
    g.visible = sc > 0.002
    g.position.set(
      (wide ? 4.3 : 0) + s.mx * 0.35,
      (wide ? 0.1 : 2.0) + out * 3 + s.my * 0.25,
      camera.position.z - 10,
    )
    g.rotation.y = s.time * 0.12 + s.mx * 0.5
    g.rotation.x = s.my * -0.3 + out * 0.8
    rings.current.rotation.z = s.time * 0.18
    rings.current.rotation.x = 1.15 + Math.sin(s.time * 0.3) * 0.1
    const u = uniforms
    u.uTime.value = s.time
    u.uPR.value = state.gl.getPixelRatio()
    u.uVel.value = Math.min(1, Math.abs(s.velocity) / 40)
  })

  return (
    <group ref={group}>
      <points geometry={geo} frustumCulled={false}>
        <shaderMaterial
          ref={mat}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={/* glsl */ `
            attribute float aSeed;
            uniform float uTime,uPR,uVel;
            varying float vF; varying float vS;
            ${GLSL_SIMPLEX}
            void main(){
              vec3 n = normalize(position);
              float k = snoise(n*1.6 + uTime*0.25);
              float k2 = snoise(n*4.0 - uTime*0.4);
              float r = 1.75 + k*0.38 + k2*0.07 + uVel*0.5*aSeed;
              vec3 p = n*r;
              vec4 mv = modelViewMatrix*vec4(p,1.0);
              gl_Position = projectionMatrix*mv;
              vec3 vn = normalize(normalMatrix*n);
              vF = pow(1.0-abs(vn.z), 1.6);          // подсветка по краю
              vS = k*0.5+0.5;
              gl_PointSize = (2.2+aSeed*2.2+vF*2.5)*uPR*(9.0/-mv.z);
            }`}
          fragmentShader={/* glsl */ `
            precision highp float;
            uniform vec3 uA,uB;
            varying float vF; varying float vS;
            void main(){
              float d = length(gl_PointCoord-0.5);
              float m = 1.0 - smoothstep(0.1,0.5,d);
              vec3 col = mix(uA,uB,vS) * (0.5+vF*1.6);
              float a = m*(0.28+vF*0.8);
              if(a<0.01) discard;
              gl_FragColor = vec4(col,a);
            }`}
        />
      </points>
      <group ref={rings}>
        <mesh>
          <torusGeometry args={[2.9, 0.006, 8, 160]} />
          <meshBasicMaterial color={ACCENT_B} transparent opacity={0.45} />
        </mesh>
        <mesh rotation={[0.6, 0, 0]}>
          <torusGeometry args={[3.35, 0.004, 8, 160]} />
          <meshBasicMaterial color={ACCENT_A} transparent opacity={0.28} />
        </mesh>
      </group>
      <mesh>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color={ACCENT_A} wireframe transparent opacity={0.16} />
      </mesh>
    </group>
  )
}

/* ───────── Камера: скролл двигает её вглубь, мышь — параллакс ───────── */
function Rig() {
  useFrame((state, dt) => {
    const s = signals
    const d = Math.min(dt, 0.05)
    s.time += d
    s.mx += (s.mtx - s.mx) * Math.min(1, d * 4)
    s.my += (s.mty - s.my) * Math.min(1, d * 4)
    const cam = state.camera
    const z = 9 - s.scroll * 82
    cam.position.set(s.mx * 0.9, s.my * 0.55 - s.scroll * 1.2, z)
    cam.lookAt(s.mx * 0.4, s.my * 0.25, z - 10)
  })
  return null
}

function Pause() {
  // не рисуем, пока вкладка скрыта
  const set = useThree((s) => s.set)
  useEffect(() => {
    const on = () => set({ frameloop: document.hidden ? 'never' : 'always' })
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [set])
  return null
}

export default function Background() {
  const count = isMobile() ? 3800 : 9000
  return (
    <div className="bg-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 55, near: 0.1, far: 200, position: [0, 0, 9] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Rig />
        <Pause />
        <ParticleField count={count} />
        <Orb />
      </Canvas>
    </div>
  )
}
