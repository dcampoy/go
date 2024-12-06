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
  game: Game,
  hoverStone: {
    pos: Position | null
    isValidMove: boolean
  }
) {
  const gameState = game.getCurrentGameState()

  const renderFingerprint =
    gameState.fingerPrint() +
    (hoverStone
      ? `${hoverStone.pos.x}.${hoverStone.pos.y} ${hoverStone.isValidMove}`
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
      renderStone(drawingState, gameState.turn, hoverStone.pos, true, null)
    }
  }
}

const root = document.getElementById("root")

if (!root) {
  throw new Error("Invalid root element")
}

init(root).then(([drawingState, canvas]) => {
  const game = new Game(board)

  canvas.addEventListener("mousemove", (ev) => {
    const pos = {
      x: Math.floor((ev.offsetX - unit / 2) / unit),
      y: Math.floor((ev.offsetY - unit / 2) / unit),
    }

    if (!game.getCurrentGameState().isPositionWithinBoundaries(pos)) {
      return
    }

    const isValidMove = game.getCurrentGameState().isValidMove(pos, game)

    render(drawingState, game, { pos, isValidMove })
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

    if (!game.getCurrentGameState().isValidMove(pos, game)) {
      return
    }

    game.registerMove(pos)

    render(drawingState, game, null)
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
  })

  render(drawingState, game, null)
})
