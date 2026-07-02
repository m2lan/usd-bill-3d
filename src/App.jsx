import React, { useState, useCallback, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, SSAO } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import ClothBill from './components/ClothBill'

export default function App() {
  const [windActive, setWindActive] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const handleReset = useCallback(() => {
    setResetKey(k => k + 1)
  }, [])

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas
          key={resetKey}
          camera={{ position: [0, 1.2, 2.2], fov: 45, near: 0.01, far: 100 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          shadows
        >
          <color attach="background" args={['#1a1a1a']} />
          <fog attach="fog" args={['#1a1a1a', 6, 20]} />

          {/* Large backdrop wall behind the bill to fill upper area */}
          <mesh position={[0, 4, -5]} scale={[20, 12, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial color="#262626" roughness={1} metalness={0} side={2} />
          </mesh>

          {/* Subtle gradient sphere */}
          <mesh scale={100}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#1e1e1e" side={1} />
          </mesh>

          {/* Key light - window light simulation */}
          <directionalLight
            position={[3, 5, 2]}
            intensity={1.8}
            color="#fff5e6"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          {/* Fill light */}
          <directionalLight position={[-2, 3, -1]} intensity={0.35} color="#e6f0ff" />
          {/* Rim */}
          <pointLight position={[0, 1, -2]} intensity={0.5} color="#ffffff" distance={6} />

          {/* Ambient */}
          <ambientLight intensity={0.4} />

          <Suspense fallback={null}>
            <ClothBill windActive={windActive} />
            <Environment environmentIntensity={0.5}>
              <Lightformer
                form="ring"
                intensity={2}
                color="#fff"
                position={[0, 5, 0]}
                scale={[10, 10, 1]}
              />
              <Lightformer
                form="rect"
                intensity={1}
                color="#aaa"
                position={[-5, 3, 1]}
                scale={[5, 5, 1]}
              />
              <Lightformer
                form="rect"
                intensity={1}
                color="#aaa"
                position={[5, 3, -1]}
                scale={[5, 5, 1]}
              />
            </Environment>
          </Suspense>

          {/* Floor plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} metalness={0} />
          </mesh>

          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            minDistance={0.8}
            maxDistance={6}
            minPolarAngle={0.3}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 0.2, 0]}
          />

          <EffectComposer>
            <SSAO
              blendFunction={BlendFunction.MULTIPLY}
              samples={21}
              radius={0.1}
              intensity={15}
              luminanceInfluence={0.6}
              color="black"
              worldDistanceThreshold={1}
              worldDistanceFalloff={1}
              worldProximityThreshold={0.3}
              worldProximityFalloff={0.3}
            />
            <Bloom
              intensity={0.12}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={[0.0003, 0.0003]}
              radialModulation={false}
              modulationOffset={0}
            />
            <Vignette
              offset={0.35}
              darkness={0.5}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Top hint */}
      <div className="top-hint">
        <span>拖拽纸币进行交互 · WASD 旋转视角 · 滚轮缩放</span>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button
          className={`toolbar-btn ${windActive ? 'active' : ''}`}
          onClick={() => setWindActive(!windActive)}
        >
          <span className="icon">{windActive ? '🌬️' : '💨'}</span>
          <span>{windActive ? '风力开启' : '吹风模式'}</span>
        </button>
        <button className="toolbar-btn" onClick={handleReset}>
          <span className="icon">↻</span>
          <span>重置</span>
        </button>
      </div>
    </div>
  )
}
