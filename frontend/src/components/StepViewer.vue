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

function onResize() {
  if (!container.value || !camera || !renderer) return
  const w = container.value.clientWidth
  const h = container.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

async function loadModel(url: string) {
  if (!container.value) return

  loading.value = true
  error.value = ''

  try {
    // Setup scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x12131b)

    const w = container.value.clientWidth
    const h = container.value.clientHeight

    camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100000)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    container.value.innerHTML = ''
    container.value.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.8

    // Lighting — studio setup
    const ambientLight = new THREE.AmbientLight(0x404050, 1.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2)
    keyLight.position.set(5, 8, 5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x8090a0, 0.8)
    fillLight.position.set(-3, 2, -3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x00E5FF, 0.3)
    rimLight.position.set(0, -5, -5)
    scene.add(rimLight)

    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 40, 0x282932, 0x1a1b23)
    scene.add(gridHelper)

    // Load OCCT WASM
    progress.value = 'Loading 3D engine...'
    const occt = await occtImportJs({
      locateFile: () => '/occt-import-js.wasm',
    })

    // Fetch STEP file
    progress.value = 'Downloading file...'
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to download file')
    const buffer = new Uint8Array(await response.arrayBuffer())

    // Parse STEP
    progress.value = 'Parsing 3D model...'
    const result = occt.ReadStepFile(buffer, null)

    if (!result.meshes || result.meshes.length === 0) {
      throw new Error('No geometry found in STEP file')
    }

    // Build three.js meshes
    progress.value = 'Rendering...'
    const group = new THREE.Group()

    for (const mesh of result.meshes) {
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
        flatShading: false,
      })

      // Add edges for CAD look
      const meshObj = new THREE.Mesh(geometry, material)
      group.add(meshObj)

      const edges = new THREE.EdgesGeometry(geometry, 30)
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x00E5FF,
        opacity: 0.15,
        transparent: true,
      })
      const edgeLines = new THREE.LineSegments(edges, edgeMaterial)
      group.add(edgeLines)
    }

    scene.add(group)

    // Fit camera to model
    const box = new THREE.Box3().setFromObject(group)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3()).length()

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

    // Align grid to model
    gridHelper.position.y = box.min.y
    const gridScale = Math.pow(10, Math.floor(Math.log10(size)))
    gridHelper.scale.set(gridScale / 10, 1, gridScale / 10)

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
  }
}

function cleanup() {
  cancelAnimationFrame(animFrameId)
  controls?.dispose()
  renderer?.dispose()
  scene?.clear()
  window.removeEventListener('resize', onResize)
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
      <span class="label-sm">Drag to rotate &middot; Scroll to zoom &middot; Right-click to pan</span>
    </div>
  </div>
</template>

<style scoped>
.step-viewer {
  position: relative;
  width: 100%;
  height: 400px;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.step-viewer__canvas {
  width: 100%;
  height: 100%;
}

.step-viewer__canvas canvas {
  display: block;
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
}
</style>
