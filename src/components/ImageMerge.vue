<template>
    <div class="row justify-content-center">
        <div class="col-12 col-lg-9" style="line-height: 0">
            <canvas ref="canvas" class="output-image" @click="handleCanvasClick" @drop.prevent="handleDrop"
                @dragover.prevent=""></canvas>
            <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFileChange" />
        </div>
        <div class="col-7 col-md-5 col-lg-3 d-flex flex-column justify-content-between">
            <div>
                <div class="config-item">
                    <div class="config-item-label">
                        <b>分辨率</b>
                        <div class="d-flex">
                            <div v-for="resolution in resolutions" :key="resolution">
                                <input type="radio" class="btn-check" name="resolution" :id="resolution"
                                    :value="resolution" autocomplete="off" v-model="selectedResolution" />
                                <label class="btn btn-sm btn-outline-secondary border-0" :for="resolution">
                                    {{ resolutionLabels[resolution] }}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="config-item">
                    <div class="config-item-label">
                        <b>缩放</b>
                        <span class="config-value">{{ scale.toFixed(2) }}</span>
                    </div>
                    <input style="width: 100%" v-model.number="scale" @input="drawMergeImage" type="range" min="0.1"
                        max="0.5" step="0.01" />
                </div>

                <div class="config-item">
                    <div class="config-item-label">
                        <b>位置</b>
                        <div class="d-flex">
                            <div v-for="position in positions" :key="position">
                                <input type="radio" class="btn-check" name="position" :id="position" :value="position"
                                    autocomplete="off" v-model="selectedPosition" />
                                <label class="btn btn-sm btn-outline-secondary border-0" :for="position">
                                    {{ positionLabels[position] }}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="config-item">
                    <div class="row">
                        <div class="col-6">
                            <div class="config-item-label">
                                <b>集数</b>
                            </div>
                            <input v-model="episode" type="text" class="form-control form-control-sm"
                                @input="drawMergeImage" />
                        </div>
                        <div class="col-6">
                            <div class="config-item-label">
                                <b>时间</b>
                            </div>
                            <input v-model="time" type="text" class="form-control form-control-sm"
                                @input="drawMergeImage" />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <hr />
                <div class="d-flex justify-content-between">
                    <div class="col-8">
                        <input type="text" v-model="prefix" class="form-control" placeholder="文件名前缀"
                            autocomplete="on" />
                    </div>
                    <button class="btn btn-secondary" style="display: table-cell; vertical-align: middle"
                        @click="saveImage">
                        下载
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { ResolutionType, ResolutionMap } from "@/types/Resolution"
enum Position {
    TopLeft = "top-left",
    TopRight = "top-right",
    BottomLeft = "bottom-left",
    BottomRight = "bottom-right",
}

// Refs for reactive state
const referenceImage = ref<HTMLImageElement | null>(null)
const cameraImage = ref<HTMLImageElement | null>(null)
const scale = ref<number>(0.3)
const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const isReference = ref<boolean>(false)

const selectedResolution = ref<ResolutionType>(ResolutionType.FHD)
const resolutions = Object.values(ResolutionType)
const resolutionLabels: Record<ResolutionType, string> = {
    [ResolutionType.HD]: "720",
    [ResolutionType.FHD]: "1080",
    [ResolutionType.QHD]: "2K",
    [ResolutionType.UHD]: "4K",
}

const selectedPosition = ref<Position>(Position.BottomRight)
const positions = Object.values(Position)
const positionLabels: Record<Position, string> = {
    [Position.TopLeft]: "左上",
    [Position.TopRight]: "右上",
    [Position.BottomLeft]: "左下",
    [Position.BottomRight]: "右下",
}

const episode = ref<string>("")
const time = ref<string>("")

const prefix = ref<string>("")

// Load image function
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = src
    })
}

// Draw merged image
const drawMergeImage = () => {
    if (!canvas.value || !ctx.value) return

    const width = ResolutionMap[selectedResolution.value].width
    const height = ResolutionMap[selectedResolution.value].height
    const textSize = 0.03 * height

    canvas.value.width = width
    canvas.value.height = height

    ctx.value.clearRect(0, 0, width, height)

    if (cameraImage.value === null) {
        ctx.value.fillStyle = "gray"
        ctx.value.fillRect(0, 0, width, height)
        ctx.value.fillStyle = "white"
        ctx.value.font = `${textSize}px sans-serif`
        ctx.value.textAlign = "center"
        ctx.value.fillText("请点击或拖拽上传图片", width / 2, height / 2)
    } else {
        ctx.value.fillStyle = "black"
        ctx.value.fillRect(0, 0, width, height)
        const imgRatio = cameraImage.value.width / cameraImage.value.height
        const canvasRatio = width / height

        if (imgRatio > canvasRatio) {
            const newHeight = width / imgRatio
            ctx.value.drawImage(cameraImage.value, 0, (height - newHeight) / 2, width, newHeight)
        } else {
            const newWidth = height * imgRatio
            ctx.value.drawImage(cameraImage.value, (width - newWidth) / 2, 0, newWidth, height)
        }
    }

    // Set shadow properties
    ctx.value.shadowColor = "rgba(0, 0, 0, 1)" // semi-transparent black
    ctx.value.shadowBlur = width / 100 // how soft the shadow edge is

    // Draw reference image scaled
    const startX =
        selectedPosition.value == Position.TopLeft || selectedPosition.value == Position.BottomLeft
            ? 0
            : width * (1 - scale.value)
    const startY =
        selectedPosition.value == Position.TopLeft || selectedPosition.value == Position.TopRight
            ? 0
            : height * (1 - scale.value)
    const scaledWidth = width * scale.value
    const scaledHeight = height * scale.value

    if (referenceImage.value === null) {
        ctx.value.fillStyle = "gray"
        ctx.value.fillRect(startX, startY, scaledWidth, scaledHeight)

        ctx.value.shadowColor = "rgba(0, 0, 0, 0)"
        ctx.value.fillStyle = "white"
        ctx.value.font = `${textSize}px sans-serif`
        ctx.value.textAlign = "center"
        ctx.value.fillText("请点击或拖拽上传图片", startX + scaledWidth / 2, startY + scaledHeight / 2)
    } else {
        ctx.value.drawImage(referenceImage.value, startX, startY, scaledWidth, scaledHeight)
    }

    // add text
    ctx.value.font = `${textSize}px sans-serif`
    ctx.value.fillStyle = "white"

    ctx.value.shadowColor = "rgba(0, 0, 0, 0.7)" // Color of the shadow
    ctx.value.shadowOffsetX = textSize / 20 // Horizontal offset
    ctx.value.shadowOffsetY = textSize / 20 // Vertical offset
    ctx.value.shadowBlur = textSize / 20 // Blur radius
    ctx.value.textAlign = "left"
    ctx.value.fillText(episode.value, startX + 0.01 * width, startY + textSize + 0.01 * height)
    ctx.value.textAlign = "right"
    ctx.value.fillText(
        time.value,
        startX + scaledWidth - 0.01 * width,
        startY + textSize + 0.01 * height,
    )
}

// Handle canvas click
const handleCanvasClick = (e: MouseEvent) => {
    setIsReference(e.clientX, e.clientY)
    fileInput.value?.click()
}

// Handle file drop
const handleDrop = (e: DragEvent) => {
    const file = e.dataTransfer?.files[0]
    if (!file) return

    setIsReference(e.clientX, e.clientY)
    getSrcFromFile(file)
}

// Set isReference based on click position
const setIsReference = (absX: number, absY: number) => {
    if (!canvas.value) return

    const rect = canvas.value.getBoundingClientRect()
    if (absX < rect.left || absX > rect.right || absY < rect.top || absY > rect.bottom) return

    const x = absX - rect.left
    const y = absY - rect.top

    const inX = (selectedPosition.value == Position.TopLeft || selectedPosition.value == Position.BottomLeft)
        ? x < (rect.right - rect.left) * scale.value
        : x > (rect.right - rect.left) * (1 - scale.value)

    const inY = (selectedPosition.value == Position.TopLeft || selectedPosition.value == Position.TopRight)
        ? y < (rect.bottom - rect.top) * scale.value
        : y > (rect.bottom - rect.top) * (1 - scale.value)

    isReference.value = inX && inY
}

// Handle file input change
const fileInput = ref<HTMLInputElement | null>(null)
const onFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    getSrcFromFile(file)
        ; (e.target as HTMLInputElement).value = ""
}

// Get image source from file
const getSrcFromFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        loadImage(e.target?.result as string).then((img) => {
            if (isReference.value) {
                infoFromFilename(file.name)
                referenceImage.value = img
            } else {
                cameraImage.value = img
            }
            drawMergeImage()
        })
    }
    reader.readAsDataURL(file)
}

const infoFromFilename = (filename: string) => {
    const episodeRegex = /\[(\d+)\]/
    const timeRegex = /_(\d{2})(\d{2})(\d{2})\.(\d{3})/

    const episodeMatch = filename.match(episodeRegex)
    const timeMatch = filename.match(timeRegex)

    if (episodeMatch && timeMatch) {
        episode.value = `EP${episodeMatch[1]}`
    }

    if (timeMatch) {
        const hours = timeMatch[2]
        const minutes = timeMatch[3]

        time.value = `${hours}:${minutes}`
    }

    console.log(episode.value, time.value)
}

const saveImage = () => {
    if (!canvas.value) return
    const imageURL = canvas.value.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = imageURL
    link.download = `[巡礼对比图]${prefix.value}[${episode.value}][${time.value.replace(":", "")}].png`
    link.click()
}

// Initialize on mount
onMounted(() => {
    ctx.value = canvas.value?.getContext("2d") || null
    drawMergeImage()
})

watch(selectedResolution, drawMergeImage)
watch(selectedPosition, drawMergeImage)
</script>

<style scoped>
.output-image {
    width: 100%;
    height: auto;
}

.config-item-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 5px;
}
</style>
