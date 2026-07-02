import React, { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ClothSimulation } from '../physics/ClothSimulation'
import { createBillTextures } from '../utils/generateTextures'

// Reuse objects to prevent GC
const _raycaster = new THREE.Raycaster()
const _mouse = new THREE.Vector2()
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.15)
const _intersection = new THREE.Vector3()
const _dragPlane = new THREE.Plane()

const BILL_WIDTH = 50
const BILL_HEIGHT = 30
const SEGMENT_SIZE = 0.0238 // ~1.6 units total

export default function ClothBill({ windActive }) {
  const meshRef = useRef()
  const simRef = useRef()
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const windActiveRef = useRef(windActive)
  const isDraggingRef = useRef(false)
  const dragParticleRef = useRef(null)

  // Create textures with useMemo
  const textures = useMemo(() => createBillTextures(), [])

  // Create cloth simulation
  const sim = useMemo(() => {
    const s = new ClothSimulation({
      width: BILL_WIDTH,
      height: BILL_HEIGHT,
      segmentSize: SEGMENT_SIZE,
      damping: 0.987,
      iterations: 9,
      gravityScale: 0.4,
      windStrength: 2.8,
      windSpeed: 1.8,
      floorY: 0,
      liftHeight: 0.12
    })
    // Unpin corners after a settling period
    setTimeout(() => {
      if (s) {
        s.particles.forEach(p => { p.pinned = false })
      }
    }, 800)
    return s
  }, [])

  simRef.current = sim

  // Shared arrays for positions and normals
  const arrays = useMemo(() => {
    const count = BILL_WIDTH * BILL_HEIGHT
    return {
      positions: new Float32Array(count * 3),
      normals: new Float32Array(count * 3)
    }
  }, [])

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = arrays.positions
    const normals = arrays.normals

    // Initial positions on flat plane
    const w = BILL_WIDTH, h = BILL_HEIGHT
    const billW = (w - 1) * SEGMENT_SIZE
    const billH = (h - 1) * SEGMENT_SIZE
    const startX = -billW / 2
    const startZ = -billH / 2

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 3
        positions[idx] = startX + x * SEGMENT_SIZE
        positions[idx + 1] = 0.12
        positions[idx + 2] = startZ + y * SEGMENT_SIZE
        normals[idx] = 0
        normals[idx + 1] = 1
        normals[idx + 2] = 0
      }
    }

    // UVs - 1:2.6 ratio of $100 bill
    const uvs = new Float32Array(w * h * 2)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 2
        uvs[idx] = x / (w - 1)
        uvs[idx + 1] = y / (h - 1)
      }
    }

    // Indices (two triangles per quad)
    const indices = []
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w - 1; x++) {
        const a = y * w + x
        const b = a + 1
        const c = a + w
        const d = c + 1
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.attributes.position.usage = THREE.DynamicDrawUsage
    geo.attributes.normal.usage = THREE.DynamicDrawUsage

    return geo
  }, [])

  // Material with PBR
  const material = useMemo(() => {
    const mat = {
      map: textures.diffuse,
      normalMap: textures.normal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughnessMap: textures.roughness,
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.DoubleSide,
      envMapIntensity: 0.35,
    }

    // Subsheet rendering simulation via thickness map
    return new THREE.MeshStandardMaterial(mat)
  }, [textures])

  // Second side (back) material - slightly darker
  const backMaterial = useMemo(() => {
    const m = material.clone()
    m.map = textures.diffuseBack
    return m
  }, [material, textures])

  // Keep wind ref synced
  useEffect(() => {
    windActiveRef.current = windActive
    if (sim) sim.setWind(windActive)
  }, [windActive, sim])

  // Get plane intersection for dragging
  const _getPlaneIntersection = useCallback((mouse, planeNormal, planeOffset) => {
    _dragPlane.setFromNormalAndCoplanarPoint(planeNormal, new THREE.Vector3(0, planeOffset, 0))
    _raycaster.setFromCamera(mouse, camera)
    return _raycaster.ray.intersectPlane(_dragPlane, _intersection)
  }, [camera])

  // Mouse event handlers
  useEffect(() => {
    const dom = gl.domElement

    const onPointerDown = (e) => {
      if (e.button !== 0) return
      _mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      _mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

      _raycaster.setFromCamera(_mouse, camera)
      if (meshRef.current) {
        const hits = _raycaster.intersectObject(meshRef.current)
        if (hits.length > 0) {
          const hit = hits[0]
          isDraggingRef.current = true
          const p = sim.getNearestParticle(hit.point.x, hit.point.y, hit.point.z)
          if (p) {
            dragParticleRef.current = p
            sim.startDrag(p, hit.point)
          }
          // Compute drag plane (facing camera)
          const camDir = new THREE.Vector3()
          camera.getWorldDirection(camDir)
          _dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), hit.point)
          dom.style.cursor = 'grabbing'
        }
      }
    }

    const onPointerMove = (e) => {
      if (!isDraggingRef.current || !dragParticleRef.current) return
      _mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      _mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

      _raycaster.setFromCamera(_mouse, camera)
      const result = _raycaster.ray.intersectPlane(_dragPlane, _intersection)
      if (result) {
        sim.updateDrag(result)
      }
    }

    const onPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        dragParticleRef.current = null
        sim.endDrag()
        dom.style.cursor = 'grab'
      }
    }

    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('pointermove', onPointerMove)
    dom.addEventListener('pointerup', onPointerUp)
    dom.addEventListener('pointerleave', onPointerUp)

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('pointermove', onPointerMove)
      dom.removeEventListener('pointerup', onPointerUp)
      dom.removeEventListener('pointerleave', onPointerUp)
    }
  }, [gl, camera, sim])

  // Animation frame
  const frameCount = useRef(0)
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033) // Cap delta
    const s = simRef.current
    if (!s) return

    // Physics substeps
    const substeps = 2
    const subDt = dt / substeps
    for (let i = 0; i < substeps; i++) {
      s.update(subDt)
    }

    // Update geometry
    const geo = meshRef.current?.geometry
    if (geo && geo.attributes.position) {
      s.exportPositions(arrays.positions)
      s.computeNormals(arrays.positions, arrays.normals)

      geo.attributes.position.needsUpdate = true
      geo.attributes.normal.needsUpdate = true
      geo.computeBoundingSphere()
    }

    frameCount.current++
  })

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        renderOrder={1}
      />
      {/* Back side using same geometry */}
      <mesh
        geometry={geometry}
        material={backMaterial}
        castShadow
        receiveShadow
        renderOrder={2}
      />
    </group>
  )
}
