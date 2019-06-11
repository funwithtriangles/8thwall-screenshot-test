const canvasEl = document.querySelector('#canvas')

const photoContainerEl = document.querySelector('#photo-container')
const photoEl = document.querySelector('#photo')

const gridSize = 5
const spacing = 2
const halfLength = gridSize * spacing / 2
const numObjs = gridSize * gridSize
const geom = new THREE.DodecahedronBufferGeometry(1)

const buildGrid = group => {
  // Build grid of meshes with varying opacity
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const xPos = x * spacing - halfLength
      const yPos = y * spacing - halfLength

      const i = y * gridSize + x
      const opacity = (i + 1) / numObjs

      const mat = new THREE.MeshNormalMaterial(
        { 
          opacity, 
          // We don't even need to have transparency for the artefacts to appear
          transparent: true
        }
      )

      const mesh = new THREE.Mesh(geom, mat)
      mesh.position.set(xPos, yPos, 0)
      group.add(mesh)
    }
  }
}

const initXrScene = ({ scene, camera }) => {
  camera.position.set(0, 3, 0)

  const group = new THREE.Group()
  group.rotation.y = Math.PI
  group.position.z = -15

  scene.add(group)

  buildGrid(group)
}

const scenePipelineModule = () => {
    return {
      name: 'scene',
      onStart: ({canvas, canvasWidth, canvasHeight}) => {
        const {scene, camera} = XR.Threejs.xrScene() 

        initXrScene({ scene, camera })

        XR.XrController.updateCameraProjectionMatrix({
          origin: camera.position,
          facing: camera.quaternion,
        })

        // Take screenshot on touch
        canvasEl.addEventListener('touchstart', () => {
          XR.canvasScreenshot().takeScreenshot().then(
            data => {
              photo.src = 'data:image/jpeg;base64,' + data
              photoContainerEl.style.display = 'block'
            },
            error => {
              console.error(error)
              // Handle screenshot error.
            })
        })
      },
    }
  }
  
  const onxrloaded = () => {
    XR.addCameraPipelineModules([  // Add camera pipeline modules.
      // Existing pipeline modules.
      XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
      XR.Threejs.pipelineModule(),                 // Creates a ThreeJS AR Scene.
      XR.XrController.pipelineModule(),            // Enables SLAM tracking.
      XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
      XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
      XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
      XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
      XR.canvasScreenshot().cameraPipelineModule(),
      // Custom pipeline modules.
      scenePipelineModule(),
    ])
  
    // Open the camera and start running the camera run loop.
    XR.run({ canvas: canvasEl })
  }
  
  // Show loading screen before the full XR library has been loaded.
  const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
  window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }