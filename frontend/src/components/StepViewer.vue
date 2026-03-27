<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import occtImportJs from 'occt-import-js'

const props = defineProps<{
  fileUrl: string
}>()

const container = ref<HTMLDivElement>()
const loading = ref(true)
const error = ref('')
const progress = ref('Initializing engine...')

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let animFrameId: number = 0
let isLoadingModel = false

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ])
}

function onResize() {
  if (!container.value || !camera || !renderer) return
  const w = container.value.clientWidth
  const h = container.value.clientHeight
  if (w === 0 || h === 0) return
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

async function loadModel(url: string) {
  if (!container.value || isLoadingModel) return
  isLoadingModel = true

  loading.value = true
  error.value = ''

  try {
    // Setup scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x12131b)

    const w = container.value.clientWidth
    const h = container.value.clientHeight || 300

    camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100000)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    container.value.innerHTML = ''
    container.value.appendChild(renderer.domElement)

    // Touch-friendly orbit controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.8
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }

    // Lighting — studio setup
    scene.add(new THREE.AmbientLight(0x404050, 1.5))

    const keyLight = new THREE.DirectionalLight(0xffffff, 2)
    keyLight.position.set(5, 8, 5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x8090a0, 0.8)
    fillLight.position.set(-3, 2, -3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x00E5FF, 0.3)
    rimLight.position.set(0, -5, -5)
    scene.add(rimLight)

    // Grid
    const gridHelper = new THREE.GridHelper(200, 40, 0x282932, 0x1a1b23)
    scene.add(gridHelper)

    // Load OCCT WASM with timeout
    progress.value = 'Loading 3D engine...'
    const occt = await withTimeout(
      occtImportJs({ locateFile: () => '/occt-import-js.wasm' }),
      30000,
      'Loading 3D engine'
    )

    // Fetch STEP file with timeout
    progress.value = 'Downloading file...'
    const response = await withTimeout(fetch(url), 30000, 'File download')
    if (!response.ok) throw new Error('Failed to download file')
    const buffer = new Uint8Array(await response.arrayBuffer())

    // Parse STEP
    progress.value = 'Parsing 3D model...'
    const result = occt.ReadStepFile(buffer, null)

    if (!result || !result.meshes || result.meshes.length === 0) {
      throw new Error('No geometry found in file. The file may be empty or corrupted.')
    }

    // Build three.js meshes
    progress.value = 'Rendering...'
    const group = new THREE.Group()

    for (const mesh of result.meshes) {
      if (!mesh.attributes?.position?.array) continue

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3)
      )

      if (mesh.attributes.normal) {
        geometry.setAttribute(
          'normal',
          new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3)
        )
      } else {
        geometry.computeVertexNormals()
      }

      if (mesh.index) {
        geometry.setIndex(new THREE.BufferAttribute(mesh.index.array, 1))
      }

      const color = mesh.color
        ? new THREE.Color(mesh.color[0], mesh.color[1], mesh.color[2])
        : new THREE.Color(0.75, 0.78, 0.82)

      const material = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.2,
        roughness: 0.5,
        side: THREE.DoubleSide,
      })

      group.add(new THREE.Mesh(geometry, material))

      // Edge lines for CAD look
      const edges = new THREE.EdgesGeometry(geometry, 30)
      group.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: 0x00E5FF,
        opacity: 0.15,
        transparent: true,
      })))
    }

    scene.add(group)

    // Fit camera to model
    const box = new THREE.Box3().setFromObject(group)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3()).length()

    if (size > 0) {
      camera.position.set(
        center.x + size * 0.8,
        center.y + size * 0.6,
        center.z + size * 0.8
      )
      camera.near = size * 0.001
      camera.far = size * 100
      camera.updateProjectionMatrix()

      controls.target.copy(center)
      controls.update()

      gridHelper.position.y = box.min.y
      const gridScale = Math.pow(10, Math.floor(Math.log10(size)))
      gridHelper.scale.set(gridScale / 10, 1, gridScale / 10)
    }

    // Render loop
    function animate() {
      animFrameId = requestAnimationFrame(animate)
      controls!.update()
      renderer!.render(scene!, camera!)
    }
    animate()

    loading.value = false
  } catch (err: unknown) {
    const e = err as Error
    error.value = e.message || 'Failed to load 3D model'
    loading.value = false
  } finally {
    isLoadingModel = false
  }
}

function cleanup() {
  cancelAnimationFrame(animFrameId)
  animFrameId = 0
  controls?.dispose()
  renderer?.dispose()
  scene?.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
  })
  scene?.clear()
  scene = null
  renderer = null
  camera = null
  controls = null
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  if (props.fileUrl) {
    loadModel(props.fileUrl)
  }
})

watch(() => props.fileUrl, (url) => {
  if (url) {
    cleanup()
    loadModel(url)
  }
})

onBeforeUnmount(() => {
  cleanup()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="step-viewer">
    <div v-if="loading" class="step-viewer__loading">
      <div class="step-viewer__spinner"></div>
      <span class="label-sm">{{ progress }}</span>
    </div>
    <div v-if="error" class="step-viewer__error">
      <span class="body-md">{{ error }}</span>
    </div>
    <div ref="container" class="step-viewer__canvas" />
    <div v-if="!loading && !error" class="step-viewer__controls-hint">
      <span class="label-sm">Drag to rotate &middot; Pinch to zoom</span>
    </div>
  </div>
</template>

<style scoped>
.step-viewer {
  position: relative;
  width: 100%;
  height: 50vh;
  min-height: 280px;
  max-height: 600px;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-md);
  overflow: hidden;
  touch-action: none;
}

.step-viewer__canvas {
  width: 100%;
  height: 100%;
}

.step-viewer__canvas :deep(canvas) {
  display: block;
  touch-action: none;
}

.step-viewer__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  background: var(--surface-container-lowest);
  z-index: 10;
}

.step-viewer__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--surface-container-high);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.step-viewer__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  text-align: center;
  color: var(--error);
  background: var(--surface-container-lowest);
  z-index: 10;
}

.step-viewer__controls-hint {
  position: absolute;
  bottom: var(--space-3);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(12, 14, 22, 0.7);
  backdrop-filter: blur(8px);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  z-index: 5;
  white-space: nowrap;
}
</style>
