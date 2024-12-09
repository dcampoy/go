import { GameState, Position } from "./State"

export class Game {
  private current: number
  private movements: { state: GameState; move: Position | null | undefined }[] =
    []

  constructor(public boardSize: number) {
    this.current = 0
    this.movements.push({
      state: new GameState(boardSize, "black"),
      move: null,
    })
  }

  findMovementByFingerPrint(fingerPrint: string) {
    for (const { state } of this.movements) {
      if (state.fingerPrint() === fingerPrint) {
        return state
      }
    }
    return null
  }

  exportToNN() {
    const lines: string[] = []
    let state = new GameState(this.boardSize, "black")
    for (const mov of this.movements) {
      let move = !mov.move
        ? "pass"
        : `${mov.move.y * this.boardSize + mov.move.x}`

      lines.push(
        `${state.turn} ${state.fingerPrint().replace(/\n/g, "")} ${move}`
      )
      state = mov.state
    }
    return lines.join("\n")
  }

  getCurrentGameState() {
    const lastMove = this.movements[this.current]
    let currentState: GameState
    currentState = lastMove.state
    return currentState
  }

  registerMove(pos: Position | null) {
    const currentState = this.getCurrentGameState()
    const nextState = currentState.move(pos)

    this.movements = this.movements.slice(0, this.current + 1)
    this.movements.push({
      state: nextState,
      move: pos,
    })
    this.current = this.movements.length - 1
  }

  undo() {
    if (this.current > 0) {
      this.current--
    }
  }

  redo() {
    if (this.current < this.movements.length - 1) {
      this.current++
    }
  }
}
