/**
 * Verlet + PBD Cloth Simulation Engine
 * No physics libraries - pure math implementation
 */

// Reusable vectors to prevent GC
const _tmpVecA = { x: 0, y: 0, z: 0 }
const _tmpVecB = { x: 0, y: 0, z: 0 }
const _gravity = { x: 0, y: -9.8, z: 0 }

export class Particle {
  constructor(x, y, z, mass = 1) {
    this.x = x
    this.y = y
    this.z = z
    this.px = x
    this.py = y
    this.pz = z
    this.ox = x
    this.oy = y
    this.oz = z
    this.mass = mass
    this.invMass = mass > 0 ? 1 / mass : 0
    this.pinned = false
  }
}

export class Constraint {
  constructor(p1, p2, restLength, stiffness = 1) {
    this.p1 = p1
    this.p2 = p2
    this.restLength = restLength
    this.stiffness = stiffness
  }
}

export class ClothSimulation {
  constructor(config) {
    this.config = {
      width: config.width || 50,
      height: config.height || 30,
      segmentSize: config.segmentSize || 0.028,
      damping: config.damping ?? 0.985,
      iterations: config.iterations ?? 8,
      gravityScale: config.gravityScale ?? 0.5,
      windStrength: config.windStrength ?? 3.0,
      windSpeed: config.windSpeed ?? 1.5,
      floorY: config.floorY ?? 0,
      liftHeight: config.liftHeight ?? 0.15,
      ...config
    }

    this.particles = []
    this.constraints = []
    this.initialPositions = new Float32Array(this.config.width * this.config.height * 3)
    this.windActive = false
    this.dragParticle = null
    this.dragOffset = { x: 0, y: 0, z: 0 }
    this.time = 0

    this._init()
  }

  _init() {
    const { width, height, segmentSize, liftHeight } = this.config

    // Create particle grid
    const startX = -((width - 1) * segmentSize) / 2
    const startZ = -((height - 1) * segmentSize) / 2

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = startX + x * segmentSize
        const py = liftHeight
        const pz = startZ + y * segmentSize
        const p = new Particle(px, py, pz)

        // Store initial position
        const idx = (y * width + x) * 3
        this.initialPositions[idx] = px
        this.initialPositions[idx + 1] = py
        this.initialPositions[idx + 2] = pz

        this.particles.push(p)
      }
    }

    // Pin corners for initial stability
    this._getParticle(0, 0).pinned = true
    this._getParticle(width - 1, 0).pinned = true
    this._getParticle(0, height - 1).pinned = true
    this._getParticle(width - 1, height - 1).pinned = true

    this._buildConstraints()
  }

  _getParticle(x, y) {
    return this.particles[y * this.config.width + x]
  }

  _buildConstraints() {
    const { width, height, segmentSize } = this.config
    const diagLen = Math.sqrt(2) * segmentSize
    const bendLen = 2 * segmentSize
    const longBendLen = 3 * segmentSize

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Structural constraints (right)
        if (x < width - 1) {
          this.constraints.push(
            new Constraint(this._getParticle(x, y), this._getParticle(x + 1, y), segmentSize, 1.0)
          )
        }
        // Structural constraints (down)
        if (y < height - 1) {
          this.constraints.push(
            new Constraint(this._getParticle(x, y), this._getParticle(x, y + 1), segmentSize, 1.0)
          )
        }
        // Shear constraints (diagonal)
        if (x < width - 1 && y < height - 1) {
          this.constraints.push(
            new Constraint(this._getParticle(x, y), this._getParticle(x + 1, y + 1), diagLen, 0.95)
          )
          this.constraints.push(
            new Constraint(this._getParticle(x + 1, y), this._getParticle(x, y + 1), diagLen, 0.95)
          )
        }
        // Bending constraints (skip 1)
        if (x < width - 2) {
          this.constraints.push(
            new Constraint(this._getParticle(x, y), this._getParticle(x + 2, y), bendLen, 0.7)
          )
        }
        if (y < height - 2) {
          this.constraints.push(
            new Constraint(this._getParticle(x, y), this._getParticle(x, y + 2), bendLen, 0.7)
          )
        }
        // Long-range bending (skip 3)
        if (x < width - 3) {
          this.constraints.push(
            new Constraint(this._getParticle(x, y), this._getParticle(x + 3, y), longBendLen, 0.4)
          )
        }
        if (y < height - 3) {
          this.constraints.push(
            new Constraint(this._getParticle(x, y), this._getParticle(x, y + 3), longBendLen, 0.4)
          )
        }
      }
    }
  }

  setWind(active) {
    this.windActive = active
  }

  reset() {
    const { width, height } = this.config
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = this._getParticle(x, y)
        const idx = (y * width + x) * 3
        p.x = p.px = p.ox = this.initialPositions[idx]
        p.y = p.py = p.oy = this.initialPositions[idx + 1]
        p.z = p.pz = p.oz = this.initialPositions[idx + 2]
      }
    }
    this.time = 0
  }

  startDrag(particle, targetPos) {
    this.dragParticle = particle
    this.dragOffset.x = targetPos.x - particle.x
    this.dragOffset.y = targetPos.y - particle.y
    this.dragOffset.z = targetPos.z - particle.z
  }

  updateDrag(targetPos) {
    if (!this.dragParticle) return
    this.dragParticle.x = targetPos.x - this.dragOffset.x
    this.dragParticle.y = targetPos.y - this.dragOffset.y
    this.dragParticle.z = targetPos.z - this.dragOffset.z
    this.dragParticle.px = this.dragParticle.x
    this.dragParticle.py = this.dragParticle.y
    this.dragParticle.pz = this.dragParticle.z
  }

  endDrag() {
    this.dragParticle = null
  }

  // Simple noise for wind
  _noise(x, y, t) {
    return Math.sin(x * 0.5 + t * 1.7) * Math.cos(y * 0.7 + t * 1.3) +
           Math.sin(x * 0.3 - t * 2.1) * Math.cos(y * 0.4 + t * 0.9) * 0.5
  }

  update(dt) {
    this.time += dt
    const { damping, gravityScale, windStrength, windSpeed, floorY, iterations } = this.config

    // 1. Verlet integration
    const dt2 = dt * dt
    for (let i = 0, len = this.particles.length; i < len; i++) {
      const p = this.particles[i]
      if (p.pinned || p === this.dragParticle) continue

      // Forces
      let fx = _gravity.x * gravityScale
      let fy = _gravity.y * gravityScale
      let fz = _gravity.z * gravityScale

      // Wind (bottom-up floating effect)
      if (this.windActive) {
        const n = this._noise(p.x * 2.5, p.z * 2.5, this.time * windSpeed)
        const n2 = this._noise(p.x * 4 + 1.7, p.z * 4 + 2.3, this.time * windSpeed * 0.6)
        // Primary upward force (lift)
        fy += windStrength * 1.2 + n * windStrength * 0.2
        // Horizontal drift (gentle sway)
        fx += n * windStrength * 0.15
        fz += n2 * windStrength * 0.15
        // Vertical flutter
        fy += Math.sin(p.x * 8 + this.time * 3) * windStrength * 0.05
      }

      // Verlet
      const vx = (p.x - p.px) * damping
      const vy = (p.y - p.py) * damping
      const vz = (p.z - p.pz) * damping

      p.px = p.x
      p.py = p.y
      p.pz = p.z

      p.x += vx + fx * dt2
      p.y += vy + fy * dt2
      p.z += vz + fz * dt2
    }

    // 2. PBD constraint iterations
    for (let iter = 0; iter < iterations; iter++) {
      this._solveConstraints()
      this._solveBounds(floorY)
    }
  }

  _solveConstraints() {
    for (let i = 0, len = this.constraints.length; i < len; i++) {
      const c = this.constraints[i]
      const p1 = c.p1
      const p2 = c.p2

      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dz = p2.z - p1.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001
      const diff = (dist - c.restLength) / dist

      const w1 = p1.invMass
      const w2 = p2.invMass
      const wSum = w1 + w2
      if (wSum === 0) continue

      const correction = diff * c.stiffness
      const cx = dx * correction
      const cy = dy * correction
      const cz = dz * correction

      if (!p1.pinned && p1 !== this.dragParticle) {
        p1.x += cx * (w1 / wSum)
        p1.y += cy * (w1 / wSum)
        p1.z += cz * (w1 / wSum)
      }
      if (!p2.pinned && p2 !== this.dragParticle) {
        p2.x -= cx * (w2 / wSum)
        p2.y -= cy * (w2 / wSum)
        p2.z -= cz * (w2 / wSum)
      }
    }
  }

  _solveBounds(floorY) {
    const { width, height } = this.config
    for (let i = 0, len = this.particles.length; i < len; i++) {
      const p = this.particles[i]
      if (p.y < floorY) {
        p.y = floorY
        p.py = p.y + (p.py - p.y) * 0.3 // friction
      }
      // Boundary sphere
      const maxDist = 3.0
      const d = Math.sqrt(p.x * p.x + p.z * p.z)
      if (d > maxDist) {
        const scale = maxDist / d
        p.x *= scale
        p.z *= scale
      }
    }
  }

  // Get nearest particle to a world position
  getNearestParticle(x, y, z) {
    let minDist = Infinity
    let nearest = null
    for (let i = 0, len = this.particles.length; i < len; i++) {
      const p = this.particles[i]
      const dx = p.x - x
      const dy = p.y - y
      const dz = p.z - z
      const d = dx * dx + dy * dy + dz * dz
      if (d < minDist) {
        minDist = d
        nearest = p
      }
    }
    return nearest
  }

  // Export to BufferGeometry positions
  exportPositions(positions) {
    const { width, height } = this.config
    for (let i = 0, len = this.particles.length; i < len; i++) {
      const p = this.particles[i]
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
    }
  }

  // Compute normals for cloth
  computeNormals(positions, normals) {
    const { width, height } = this.config
    const count = width * height

    // Zero normals
    normals.fill(0)

    // Accumulate face normals
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const i00 = (y * width + x) * 3
        const i10 = (y * width + (x + 1)) * 3
        const i01 = ((y + 1) * width + x) * 3
        const i11 = ((y + 1) * width + (x + 1)) * 3

        // Triangle 1: i00, i10, i11
        this._addFaceNormal(
          normals, i00 / 3,
          positions[i00], positions[i00 + 1], positions[i00 + 2],
          positions[i10], positions[i10 + 1], positions[i10 + 2],
          positions[i11], positions[i11 + 1], positions[i11 + 2]
        )
        // Triangle 2: i00, i11, i01
        this._addFaceNormal(
          normals, i00 / 3,
          positions[i00], positions[i00 + 1], positions[i00 + 2],
          positions[i11], positions[i11 + 1], positions[i11 + 2],
          positions[i01], positions[i01 + 1], positions[i01 + 2]
        )
      }
    }

    // Normalize
    for (let i = 0; i < count; i++) {
      const nx = normals[i * 3]
      const ny = normals[i * 3 + 1]
      const nz = normals[i * 3 + 2]
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
      normals[i * 3] = nx / len
      normals[i * 3 + 1] = ny / len
      normals[i * 3 + 2] = nz / len
    }
  }

  _addFaceNormal(normals, idx, ax, ay, az, bx, by, bz, cx, cy, cz) {
    const abx = bx - ax, aby = by - ay, abz = bz - az
    const acx = cx - ax, acy = cy - ay, acz = cz - az
    const nx = aby * acz - abz * acy
    const ny = abz * acx - abx * acz
    const nz = abx * acy - aby * acx
    normals[idx * 3] += nx
    normals[idx * 3 + 1] += ny
    normals[idx * 3 + 2] += nz
  }

  dispose() {
    this.particles.length = 0
    this.constraints.length = 0
  }
}
