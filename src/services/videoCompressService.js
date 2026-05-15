import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg = null
let loaded = false

/**
 * Load ffmpeg.wasm (only once per session).
 * Uses CDN-hosted WASM so we don't bundle the 30MB binary.
 */
async function loadFFmpeg() {
  if (loaded) return
  ffmpeg = new FFmpeg()
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd'
  await ffmpeg.load({
    coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })
  loaded = true
}

/**
 * Compress a video File using ffmpeg.wasm.
 * Target: 720p, CRF 28, AAC audio — typically 5–10x smaller than original.
 * @param {File} file - source video file
 * @param {(pct: number) => void} [onProgress] - 0–100
 * @returns {Promise<File>} compressed video file
 */
export async function compressVideo(file, onProgress) {
  await loadFFmpeg()

  const inputName  = `input.${file.name.split('.').pop() || 'mp4'}`
  const outputName = 'output.mp4'

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100))
  })

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  await ffmpeg.exec([
    '-i',       inputName,
    '-vf',      'scale=-2:720',    // max 720p, keep aspect ratio
    '-c:v',     'libx264',
    '-crf',     '28',              // quality (lower = better, 18–28 typical)
    '-preset',  'ultrafast',       // fast encode, slightly larger
    '-c:a',     'aac',
    '-b:a',     '96k',
    '-movflags', '+faststart',     // optimize for streaming
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  return new File(
    [data.buffer],
    `compressed_${Date.now()}.mp4`,
    { type: 'video/mp4' },
  )
}
