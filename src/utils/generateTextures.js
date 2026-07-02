import * as THREE from 'three'

// Procedurally generate $100 bill textures at ultra-high resolution
export function createBillTextures() {
  const w = 1800  // width px (2.6 ratio)
  const h = 692   // height px

  const diffuse = generateBillFront(w, h)
  const diffuseBack = generateBillBack(w, h)
  const normal = generateNormalMap(w, h)
  const roughness = generateRoughnessMap(w, h)

  const texSettings = {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.LinearMipMapLinearFilter,
    magFilter: THREE.LinearFilter,
    anisotropy: 16
  }

  Object.assign(diffuse, texSettings)
  Object.assign(diffuseBack, texSettings)
  Object.assign(normal, { ...texSettings, format: THREE.RGBAFormat })
  Object.assign(roughness, texSettings)

  diffuse.colorSpace = THREE.SRGBColorSpace
  diffuseBack.colorSpace = THREE.SRGBColorSpace
  normal.colorSpace = THREE.NoColorSpace
  roughness.colorSpace = THREE.NoColorSpace

  return {
    diffuse,
    diffuseBack,
    normal,
    roughness
  }
}

// -- FRONT of $100 bill --
function generateBillFront(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Background - base paper color gradient
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#f0ebe0')
  bg.addColorStop(0.3, '#ece5d3')
  bg.addColorStop(0.7, '#e8dfc8')
  bg.addColorStop(1, '#ede6d2')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Rice paper fiber texture
  drawFiberTexture(ctx, w, h)

  // Green border pattern
  ctx.strokeStyle = '#2d5e2d'
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, w - 40, h - 40)
  ctx.strokeStyle = '#3d7a3d'
  ctx.lineWidth = 2
  ctx.strokeRect(28, 28, w - 56, h - 56)

  // Corner decorations
  drawCornerOrnaments(ctx, w, h)

  // "100" text at corners
  drawNumberHundred(ctx, 85, 75, 1.0)
  drawNumberHundred(ctx, w - 85, h - 75, -1.0)

  // "ONE HUNDRED" text
  ctx.font = 'bold 36px "Times New Roman", serif'
  ctx.fillStyle = '#2d5e2d'
  ctx.textAlign = 'center'
  ctx.fillText('ONE HUNDRED', w / 2, 68)

  // "UNITED STATES OF AMERICA" banner
  ctx.font = 'bold 30px Georgia, serif'
  ctx.fillStyle = '#2d5e2d'
  ctx.fillText('UNITED STATES OF AMERICA', w / 2, 118)

  // "THE UNITED STATES OF AMERICA" ribbon under portrait area
  ctx.font = 'bold 24px Georgia, serif'
  ctx.fillStyle = '#2d5e2d'
  ctx.fillText('THE UNITED STATES OF AMERICA', w / 2, 175)

  // Portrait area - Benjamin Franklin silhouette
  const portX = w * 0.22
  const portY = h * 0.38
  const portR = 140
  drawPortrait(ctx, portX, portY, portR)

  // Frame around portrait
  ctx.strokeStyle = '#2d5e2d'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(portX, portY, portR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#a8c090'
  ctx.beginPath()
  ctx.arc(portX, portY, portR + 5, 0, Math.PI * 2)
  ctx.stroke()

  // Reserve Bank seal (left side)
  const sealX = 130
  const sealY = h / 2 + 40
  drawTreasurySeal(ctx, sealX, sealY, 85, '#1a7a2e')

  // Federal Reserve Bank seal (right side)
  drawReserveSeal(ctx, w - 110, h / 2 + 40, 75, '#1a7a2e')

  // Green treasury seal in center
  drawTreasurySeal(ctx, w / 2 - 55, h - 170, 55, '#2d5e2d')

  // Serial number
  ctx.font = 'bold 28px "Courier New", monospace'
  ctx.fillStyle = '#1a7a2e'
  ctx.textAlign = 'left'
  ctx.fillText('LB100000000L', w / 2 - 120, h - 45)

  // "FEDERAL RESERVE NOTE"
  ctx.font = 'bold 22px Georgia, serif'
  ctx.fillStyle = '#2d5e2d'
  ctx.textAlign = 'left'
  ctx.fillText('FEDERAL RESERVE NOTE', 60, h - 50)

  // Gold "100" bottom center
  ctx.font = 'bold 180px Georgia, serif'
  const goldGrad = ctx.createLinearGradient(w / 2 - 200, h - 230, w / 2 + 200, h - 40)
  goldGrad.addColorStop(0, '#b8962e')
  goldGrad.addColorStop(0.3, '#e8c547')
  goldGrad.addColorStop(0.5, '#f5e063')
  goldGrad.addColorStop(0.7, '#e8c547')
  goldGrad.addColorStop(1, '#b8962e')
  ctx.fillStyle = goldGrad
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('100', w / 2, h - 140)

  // Background guilloché patterns
  drawGuillocheBackground(ctx, w, h)

  // Corner "100" text (large)
  ctx.font = 'bold 80px Georgia, serif'
  ctx.fillStyle = '#2d5e2d'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('100', w / 2, h / 2 - 60)

  // Microprint lines
  drawMicroprint(ctx, w, h)

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

// -- BACK of $100 bill --
function generateBillBack(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Background
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#ede6d2')
  bg.addColorStop(0.5, '#e8dfc8')
  bg.addColorStop(1, '#ede6d2')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  drawFiberTexture(ctx, w, h)

  // Border
  ctx.strokeStyle = '#2d5e2d'
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, w - 40, h - 40)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#3d7a3d'
  ctx.strokeRect(28, 28, w - 56, h - 56)

  // "ONE HUNDRED" prominent
  ctx.font = 'bold 64px Georgia, serif'
  ctx.fillStyle = '#2d5e2d'
  ctx.textAlign = 'center'
  ctx.fillText('ONE HUNDRED', w / 2, 90)

  // Independence Hall drawing
  drawIndependenceHall(ctx, w / 2, h / 2, 280)

  // Additional seals
  ctx.strokeStyle = '#2d5e2d'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(85, 85, 50, 0, Math.PI * 2) // Top-left
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(w - 85, 85, 50, 0, Math.PI * 2) // Top-right
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(85, h - 85, 50, 0, Math.PI * 2) // Bottom-left
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(w - 85, h - 85, 50, 0, Math.PI * 2) // Bottom-right
  ctx.stroke()

  // Corner numbers
  ctx.font = 'bold 48px Georgia, serif'
  ctx.fillStyle = '#2d5e2d'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('100', 90, 90)
  ctx.fillText('100', w - 90, 90)
  ctx.fillText('100', 90, h - 90)
  ctx.fillText('100', w - 90, h - 90)

  // Background guilloché back
  drawGuillocheBack(ctx, w, h)

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

// -- Normal map (paper fiber structure) --
function generateNormalMap(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Base
  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, w, h)

  // Paper fibers
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % w
    const y = Math.floor(i / 4 / w)

    // Fiber noise
    const fiber = Math.sin(x * 0.3 + Math.sin(y * 0.2) * 5) * 8
    const fiber2 = Math.cos(y * 0.25 + Math.sin(x * 0.15) * 4) * 6
    const noise = (Math.random() - 0.5) * 12

    data[i] = Math.max(0, Math.min(255, 128 + fiber + noise))
    data[i + 1] = Math.max(0, Math.min(255, 128 + fiber2 + noise * 0.8))
    data[i + 2] = 255
    data[i + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)

  // Add some directional fiber lines
  ctx.globalAlpha = 0.15
  ctx.strokeStyle = '#00f0ff'
  ctx.lineWidth = 1
  for (let i = 0; i < 200; i++) {
    ctx.beginPath()
    const x = Math.random() * w
    const y = Math.random() * h
    const angle = (Math.random() - 0.5) * 0.3
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30)
    ctx.stroke()
  }
  ctx.globalAlpha = 1.0

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

// -- Roughness map (non-uniform paper) --
function generateRoughnessMap(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Paper base roughness
  ctx.fillStyle = '#cccccc'
  ctx.fillRect(0, 0, w, h)

  // Add non-uniform variation
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % w
    const y = Math.floor(i / 4 / w)
    const noise = (Math.random() - 0.5) * 60
    const v = Math.max(120, Math.min(220, 180 + noise))
    data[i] = data[i + 1] = data[i + 2] = v
    data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)

  // Ink areas = smoother (lower roughness)
  ctx.fillStyle = 'rgba(150, 150, 150, 0.5)'
  // Portrait area
  ctx.beginPath()
  ctx.arc(w * 0.22, h * 0.38, 150, 0, Math.PI * 2)
  ctx.fill()
  // Seals
  ctx.beginPath()
  ctx.arc(130, h / 2 + 40, 90, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w - 110, h / 2 + 40, 80, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w / 2 - 55, h - 170, 58, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

// -- Helper drawing functions --

function drawFiberTexture(ctx, w, h) {
  // Subtle paper grain using noise
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % w
    const y = Math.floor(i / 4 / w)
    const grain = (Math.random() - 0.5) * 4
    // Vertical fibers pattern
    const fiber = Math.sin(y * 0.8 + Math.sin(x * 0.1) * 3) * 2
    const add = grain + fiber
    data[i] = Math.max(0, Math.min(255, data[i] + add))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + add))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + add))
  }
  ctx.putImageData(imageData, 0, 0)
}

function drawCornerOrnaments(ctx, w, h) {
  const drawCorner = (x, y, flipX, flipY) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)
    ctx.strokeStyle = '#2d5e2d'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI + Math.PI
      const r = 40 + (i % 2) * 15
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  drawCorner(50, 50, false, false)
  drawCorner(w - 50, 50, true, false)
  drawCorner(50, h - 50, false, true)
  drawCorner(w - 50, h - 50, true, true)
}

function drawNumberHundred(ctx, x, y, dir) {
  ctx.save()
  ctx.translate(x, y)
  ctx.font = 'bold 52px Georgia, serif'
  ctx.fillStyle = '#2d5e2d'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('100', 0, 0)
  ctx.restore()
}

function drawPortrait(ctx, cx, cy, r) {
  // Gradient background in circle
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
  grad.addColorStop(0, '#b8a88a')
  grad.addColorStop(0.5, '#9a8d70')
  grad.addColorStop(1, '#7a6d55')

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  ctx.fillStyle = grad
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

  // Stylized Franklin portrait (abstract representation)
  // Head shape
  ctx.beginPath()
  ctx.ellipse(cx + 10, cy - 30, 45, 55, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#c4b896'
  ctx.fill()

  // Shoulders
  ctx.beginPath()
  ctx.ellipse(cx + 5, cy + r * 0.6, r * 0.8, r * 0.4, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#5a4a3a'
  ctx.fill()

  // Hair (white)
  ctx.beginPath()
  ctx.ellipse(cx + 10, cy - 55, 40, 30, 0, Math.PI, Math.PI * 2)
  ctx.fillStyle = '#e8dcc8'
  ctx.fill()

  // Eyes
  ctx.beginPath()
  ctx.arc(cx - 10, cy - 35, 5, 0, Math.PI * 2)
  ctx.arc(cx + 25, cy - 35, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#4a3a2a'
  ctx.fill()

  // Breeches detail
  ctx.beginPath()
  ctx.moveTo(cx - 30, cy + 60)
  ctx.lineTo(cx + 40, cy + 60)
  ctx.lineTo(cx + 35, cy + 80)
  ctx.lineTo(cx - 25, cy + 80)
  ctx.closePath()
  ctx.fillStyle = '#4a5a3a'
  ctx.fill()

  ctx.restore()
}

function drawTreasurySeal(ctx, cx, cy, r, color) {
  ctx.save()
  ctx.translate(cx, cy)

  // Outer ring
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.stroke()

  // Inner ring
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2)
  ctx.lineWidth = 2
  ctx.stroke()

  // Scalloped edge
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2
    const strokeR = r * 0.95
    ctx.beginPath()
    ctx.arc(Math.cos(angle) * strokeR, Math.sin(angle) * strokeR, 6, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Center triangle
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.5)
  ctx.lineTo(r * 0.45, r * 0.35)
  ctx.lineTo(-r * 0.45, r * 0.35)
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()

  // Key
  ctx.beginPath()
  ctx.moveTo(0, r * 0.2)
  ctx.lineTo(0, r * 0.55)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, r * 0.2, 8, 0, Math.PI * 2)
  ctx.stroke()

  // Text
  ctx.font = `bold ${Math.floor(r * 0.16)}px serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.restore()
}

function drawReserveSeal(ctx, cx, cy, r, color) {
  ctx.save()
  ctx.translate(cx, cy)

  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.stroke()

  // Star points
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
    const innerR = r * 0.7
    const outerR = r * 0.9
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR)
    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Center circle
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()

  // "100"
  ctx.font = `bold ${Math.floor(r * 0.3)}px serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('100', 0, 0)

  ctx.restore()
}

function drawGuillocheBackground(ctx, w, h) {
  ctx.save()
  ctx.strokeStyle = 'rgba(45, 94, 45, 0.12)'
  ctx.lineWidth = 0.5

  // Concentric wave patterns
  for (let j = 0; j < 8; j++) {
    const offset = j * 15
    ctx.beginPath()
    for (let x = 0; x < w; x += 2) {
      const y = Math.sin((x + offset) * 0.02) * 30 + h / 2 + offset
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Radial patterns
  ctx.strokeStyle = 'rgba(45, 94, 45, 0.08)'
  for (let i = 0; i < 12; i++) {
    const cx = Math.random() * w
    const cy = Math.random() * h
    for (let j = 5; j < 80; j += 5) {
      ctx.beginPath()
      for (let a = 0; a <= Math.PI * 2; a += 0.1) {
        const r = j + Math.sin(a * 12 + i) * 3
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        if (a === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }
  }

  ctx.restore()
}

function drawGuillocheBack(ctx, w, h) {
  ctx.save()
  ctx.strokeStyle = 'rgba(45, 94, 45, 0.1)'
  ctx.lineWidth = 0.5

  for (let i = 0; i < 30; i++) {
    const cx = w / 2
    const cy = h / 2
    const offset = i * 8
    ctx.beginPath()
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const r = offset + Math.sin(a * 6 + i * 0.5) * 5
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r
      if (a === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  ctx.restore()
}

function drawMicroprint(ctx, w, h) {
  ctx.save()
  ctx.font = '6px serif'
  ctx.fillStyle = 'rgba(45, 94, 45, 0.4)'
  ctx.textAlign = 'left'

  // Print micro lines along edges
  const text = 'THE UNITED STATES OF AMERICA 100 100 100 100 ONE HUNDRED '
  for (let row = 0; row < 30; row++) {
    const y = 150 + row * 14
    ctx.fillText(text.repeat(20), 250, y)
    ctx.fillText(text.repeat(20), 650, y)
  }

  for (let row = 0; row < 20; row++) {
    const y = 200 + row * 20
    ctx.save()
    ctx.translate(160, y)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(text.repeat(10), 0, 0)
    ctx.restore()
  }

  ctx.restore()
}

function drawIndependenceHall(ctx, cx, cy, s) {
  ctx.save()
  ctx.translate(cx, cy)

  // Building silhouette (stylized)
  // Main building body
  ctx.fillStyle = '#8a8a7a'
  ctx.strokeStyle = '#5a5a4a'
  ctx.lineWidth = 2

  // Left section
  ctx.fillRect(-s * 0.7, -s * 0.3, s * 0.4, s * 0.8)
  ctx.strokeRect(-s * 0.7, -s * 0.3, s * 0.4, s * 0.8)

  // Center section (taller)
  ctx.fillRect(-s * 0.3, -s * 0.5, s * 0.6, s * 1.1)
  ctx.strokeRect(-s * 0.3, -s * 0.5, s * 0.6, s * 1.1)

  // Right section
  ctx.fillRect(s * 0.3, -s * 0.3, s * 0.4, s * 0.8)
  ctx.strokeRect(s * 0.3, -s * 0.3, s * 0.4, s * 0.8)

  // Clock tower
  ctx.fillRect(-s * 0.1, -s * 0.75, s * 0.2, s * 0.3)
  ctx.strokeRect(-s * 0.1, -s * 0.75, s * 0.2, s * 0.3)

  // Clock face
  ctx.fillStyle = '#e8e0d0'
  ctx.beginPath()
  ctx.arc(0, -s * 0.65, s * 0.08, 0, Math.PI * 2)
  ctx.fill()

  // Windows
  ctx.fillStyle = '#4a4a3a'
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const wx = -s * 0.25 + col * s * 0.12
      const wy = -s * 0.25 + row * s * 0.18
      ctx.fillRect(wx, wy, s * 0.06, s * 0.1)
    }
  }

  // Steps
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#6a6a5a'
    ctx.fillRect(-s * (0.5 + i * 0.1), s * 0.5, s * (1 + i * 0.2), 8)
  }

  ctx.restore()
}
