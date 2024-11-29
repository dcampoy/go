import { DrawingState } from ".."
import { Position } from "../engine/State"
import { positionToPixel, stoneSize } from "./board"

export async function drawStone(
  ctx: CanvasRenderingContext2D,
  color: "black" | "white"
) {
  ctx.beginPath()
  ctx.arc(stoneSize / 2, stoneSize / 2, stoneSize / 2 - 2, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.strokeStyle = "black"
  ctx.lineWidth = 1
  ctx.fill()
  ctx.stroke()
  ctx.closePath()
}

export function renderStone(
  drawingState: DrawingState,
  color: "white" | "black",
  pos: Position,
  isHover: boolean,
  libertyCount: number | null
) {
  const texture =
    color === "white"
      ? drawingState.textures.whiteStone
      : drawingState.textures.blackStone
  if (!texture) {
    throw new Error(`No texture for ${color} stone`)
  }

  const { x, y } = positionToPixel(pos)
  if (isHover) {
    drawingState.ctx.globalAlpha = 0.4
  }
  drawingState.ctx.drawImage(
    texture,
    x - stoneSize / 2,
    y - stoneSize / 2,
    stoneSize,
    stoneSize
  )
  if (libertyCount !== null) {
    if (color === "white") {
      drawingState.ctx.fillStyle = "black"
    } else {
      drawingState.ctx.fillStyle = "white"
    }
    drawingState.ctx.font = "12px Arial"
    drawingState.ctx.fillText(libertyCount.toString(), x, y)
  }
  if (isHover) {
    drawingState.ctx.globalAlpha = 1
  }
}
