import { score } from "./engine/Score"
import { Position } from "./engine/State"
import { Game } from "./engine/Game"
import {
  board,
  boardSize,
  stoneSize,
  drawBoard,
  renderBoard,
  unit,
} from "./ui/board"
import { drawStone, renderStone } from "./ui/stones"
import { drawHelp as drawHelp, hideOverlay } from "./ui/overlay"

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
): Promise<[DrawingState, HTMLCanvasElement, HTMLDivElement]> {
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

  const overlay = document.createElement("div")
  overlay.style.display = "none"
  overlay.style.position = "absolute"
  overlay.style.top = "0"
  overlay.style.left = "0"
  overlay.style.width = "100%"
  overlay.style.height = "100%"
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)"
  overlay.style.alignItems = "center"
  overlay.style.justifyContent = "center"
  overlay.addEventListener("click", () => {
    overlay.style.display = "none"
  })
  rootNode.appendChild(overlay)

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
    overlay,
  ]
}

let lastRenderFingerPrint: string | null = null

function render(
  drawingState: DrawingState,
  game: Game,
  hoverStone: {
    pos: Position | null
    isValidMove: boolean
    colour: "black" | "white"
  }
) {
  const gameState = game.getCurrentGameState()

  const renderFingerprint =
    gameState.fingerPrint() +
    (hoverStone
      ? `${hoverStone.pos.x}.${hoverStone.pos.y} ${hoverStone.isValidMove} ${hoverStone.colour}`
      : "")

  if (lastRenderFingerPrint === renderFingerprint) return

  lastRenderFingerPrint = renderFingerprint

  renderBoard(drawingState)

  const hoverGroup = hoverStone && gameState.getBoardValue(hoverStone.pos).group
  const liberties = hoverGroup
    ? gameState.calculateLiberties(hoverGroup).length
    : null

  gameState.getAllElements().forEach((element) => {
    const { x, y } = element.pos

    const group = gameState.getBoardValue(element.pos)?.group

    if (element.value.colour === "black") {
      renderStone(
        drawingState,
        "black",
        { x, y },
        false,
        group === hoverGroup ? liberties : null
      )
    }

    if (element.value.colour === "white") {
      renderStone(
        drawingState,
        "white",
        { x, y },
        false,
        group === hoverGroup ? liberties : null
      )
    }
  })

  if (hoverStone) {
    if (hoverStone.isValidMove) {
      renderStone(drawingState, hoverStone.colour, hoverStone.pos, true, null)
    }
  }
}

const root = document.getElementById("root")

if (!root) {
  throw new Error("Invalid root element")
}

init(root).then(([drawingState, canvas, overlay]) => {
  const game = new Game(board)
  let lastPos: Position | null = null

  canvas.addEventListener("mousemove", (ev) => {
    const isMac = navigator.userAgent.includes("Mac")
    const isEditing = isMac ? ev.metaKey : ev.ctrlKey
    const isShift = ev.shiftKey

    const pos = {
      x: Math.floor((ev.offsetX - unit / 2) / unit),
      y: Math.floor((ev.offsetY - unit / 2) / unit),
    }

    if (!game.getCurrentGameState().isPositionWithinBoundaries(pos)) {
      return
    }

    const isValidMove = game.getCurrentGameState().isValidMove(pos, game)

    let colour = game.getCurrentGameState().turn

    if (isEditing) {
      if (isShift) {
        colour = "white"
      } else {
        colour = "black"
      }
    }

    render(drawingState, game, { pos, isValidMove, colour })
    lastPos = pos
  })

  // Controller
  canvas.addEventListener("click", (ev) => {
    const isMac = navigator.userAgent.includes("Mac")
    const isEditing = isMac ? ev.metaKey : ev.ctrlKey
    const isShift = ev.shiftKey

    const pos = {
      x: Math.floor((ev.offsetX - unit / 2) / unit),
      y: Math.floor((ev.offsetY - unit / 2) / unit),
    }

    if (isEditing) {
      game.getCurrentGameState().set(pos, isShift ? "white" : "black")
      render(drawingState, game, null)
      return
    }

    if (!game.getCurrentGameState().isValidMove(pos, game)) {
      return
    }

    game.registerMove(pos)

    render(drawingState, game, null)
    lastPos = null
  })

  window.addEventListener("keydown", (ev) => {
    const isMac = navigator.userAgent.includes("Mac")
    const isEditing = isMac ? ev.metaKey : ev.ctrlKey
    const isShift = ev.shiftKey

    if (isEditing && lastPos) {
      render(drawingState, game, {
        pos: lastPos,
        isValidMove: true,
        colour: isShift ? "white" : "black",
      })
    }
  })

  window.addEventListener("keyup", (ev) => {
    const isMac = navigator.userAgent.includes("Mac")
    const wasEditing = isMac ? ev.metaKey : ev.ctrlKey

    console.log(lastPos)
    if (wasEditing && lastPos) {
      const isValidMove = game.getCurrentGameState().isValidMove(lastPos, game)
      let colour = game.getCurrentGameState().turn

      render(drawingState, game, {
        pos: lastPos,
        isValidMove,
        colour,
      })
    }
  })

  window.addEventListener("keyup", (ev) => {
    if (ev.code === "KeyS") {
      console.log(score(game.getCurrentGameState()))
    }

    if (ev.code === "KeyE") {
      console.log(game.exportToNN())
    }

    if (ev.code === "KeyP") {
      game.registerMove(null)
      render(drawingState, game, null)
    }

    if (ev.code === "ArrowLeft") {
      game.undo()
      render(drawingState, game, null)
    }

    if (ev.code === "ArrowRight") {
      game.redo()
      render(drawingState, game, null)
    }

    if (ev.key === "F1" || ev.key === "?") {
      if (overlay.style.display !== "none") {
        hideOverlay(overlay)
      } else {
        drawHelp(overlay)
      }
    }

    if (ev.key === "Escape" && overlay.style.display !== "none") {
      hideOverlay(overlay)
    }
  })

  render(drawingState, game, null)
})
