import { GameState, Position } from "./engine/State"
import {
  board,
  boardSize,
  stoneSize,
  drawBoard,
  renderBoard,
  unit,
} from "./ui/board"
import { drawStone, renderStone } from "./ui/stones"

export type DrawingState = {
  readonly ctx: CanvasRenderingContext2D
  readonly textures: {
    readonly board: ImageBitmap
    readonly whiteStone: ImageBitmap
    readonly blackStone: ImageBitmap
  }
}

async function init(
  rootNode: Element
): Promise<[DrawingState, HTMLCanvasElement]> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Unable to get canvas 2d context")
  }

  canvas.setAttribute("width", `${boardSize}px`)
  canvas.setAttribute("height", `${boardSize}px`)
  ctx.clearRect(0, 0, boardSize, boardSize)
  await drawBoard(ctx)
  const boardTexture = await createImageBitmap(canvas)

  canvas.setAttribute("width", `${stoneSize}px`)
  canvas.setAttribute("height", `${stoneSize}px`)

  ctx.clearRect(0, 0, stoneSize, stoneSize)
  await drawStone(ctx, "white")
  const whiteStoneTexture = await createImageBitmap(canvas)

  ctx.clearRect(0, 0, stoneSize, stoneSize)
  await drawStone(ctx, "black")
  const blackStoneTexture = await createImageBitmap(canvas)

  canvas.setAttribute("width", `${boardSize}px`)
  canvas.setAttribute("height", `${boardSize}px`)

  rootNode.appendChild(canvas)
  return [
    {
      ctx,
      textures: {
        board: boardTexture,
        whiteStone: whiteStoneTexture,
        blackStone: blackStoneTexture,
      },
    },
    canvas,
  ]
}

let lastRenderFingerPrint: string | null = null
function render(
  drawingState: DrawingState,
  state: GameState,
  hoverStone: Position | null
) {
  const renderFingerprint =
    state.fingerPrint() + (hoverStone ? `${hoverStone.x}.${hoverStone.y}` : "")

  if (lastRenderFingerPrint === renderFingerprint) return
  lastRenderFingerPrint = renderFingerprint

  renderBoard(drawingState)

  state.getAllElements().forEach((element) => {
    const { x, y } = element.pos
    if (element.value === "black") {
      renderStone(drawingState, "black", { x, y }, false)
    }

    if (element.value === "white") {
      renderStone(drawingState, "white", { x, y }, false)
    }
  })

  if (hoverStone) {
    if (state.isValidMove(hoverStone)) {
      renderStone(drawingState, state.turn, hoverStone, true)
    }
  }
}

const root = document.getElementById("root")

if (!root) {
  throw new Error("Invalid root element")
}

init(root).then(([drawingState, canvas]) => {
  let gameState = new GameState(board, "black")

  canvas.addEventListener("mousemove", (ev) => {
    const pos = {
      x: Math.floor((ev.offsetX - unit / 2) / unit),
      y: Math.floor((ev.offsetY - unit / 2) / unit),
    }

    if (!gameState.isPositionValid(pos)) {
      return
    }

    render(drawingState, gameState, pos)
  })

  // Controller
  canvas.addEventListener("click", (ev) => {
    const pos = {
      x: Math.floor((ev.offsetX - unit / 2) / unit),
      y: Math.floor((ev.offsetY - unit / 2) / unit),
    }
    // @ts-ignore
    if (window.edit && window.color) {
      // @ts-ignore
      gameState.set(pos, window.color as "black" | "white")
      return
    }

    if (!gameState.isValidMove(pos)) {
      return
    }

    gameState = gameState.move(pos)

    render(drawingState, gameState, pos)
  })

  render(drawingState, gameState, null)
})
