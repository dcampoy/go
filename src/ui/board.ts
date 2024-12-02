import { DrawingState } from ".."
import { Position } from "../engine/State"

export const board = 19 // 9x9, 13x13, etc
export const lightWood = "#FFC876"
export const boardSize = 800
export const stoneSize = boardSize / (board + 1)
export const fontSize = 14
export const unit = boardSize / (board + 1)

function hoshis(): Position[] {
  const hoshis: Position[] = []

  if (board % 2 !== 0) {
    hoshis.push({ x: Math.floor(board / 2), y: Math.floor(board / 2) })
  }

  if (board > 8 && board <= 11) {
    hoshis.push(
      { x: 2, y: 2 },
      { x: 2, y: board - 3 },
      { x: board - 3, y: 2 },
      { x: board - 3, y: board - 3 }
    )
  }

  if (board > 11) {
    hoshis.push(
      { x: 3, y: 3 },
      { x: 3, y: board - 4 },
      { x: board - 4, y: 3 },
      { x: board - 4, y: board - 4 }
    )
  }

  if (board % 2 !== 0 && board >= 15) {
    hoshis.push(
      { x: Math.floor(board / 2), y: 3 },
      { x: 3, y: Math.floor(board / 2) },
      { x: board - 4, y: Math.floor(board / 2) },
      { x: Math.floor(board / 2), y: board - 4 }
    )
  }

  return hoshis
}

export function positionToPixel(pos: Position) {
  return {
    x: pos.x * unit + unit,
    y: pos.y * unit + unit,
  }
}

export async function drawBoard(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = lightWood
  ctx.fillRect(0, 0, boardSize, boardSize)

  ctx.strokeStyle = "black"
  ctx.fillStyle = "black"

  // Horizontal lines
  for (let i = 0; i < board; i++) {
    ctx.beginPath()
    ctx.moveTo(unit, i * unit + unit)
    ctx.lineTo(board * unit, i * unit + unit)
    ctx.stroke()
    ctx.closePath()
  }

  // Vertical lines
  for (let i = 0; i < board; i++) {
    ctx.beginPath()
    ctx.moveTo(i * unit + unit, unit)
    ctx.lineTo(i * unit + unit, board * unit)
    ctx.stroke()
    ctx.closePath()
  }

  for (const hoshi of hoshis()) {
    ctx.beginPath()
    const { x, y } = positionToPixel(hoshi)
    ctx.arc(x, y, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  }
}

export async function renderBoard(drawingState: DrawingState) {
  drawingState.ctx.drawImage(
    drawingState.textures.board,
    0,
    0,
    boardSize,
    boardSize
  )
}
