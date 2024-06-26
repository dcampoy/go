type BoardValue = "black" | "white" | null

// 0-based E.g. 1-1 is {x:0, y:0}
export type Position = {
  x: number
  y: number
}

export class GameState {
  private board: BoardValue[]
  private prev: GameState | null = null

  constructor(public boardSize: number, public turn: "black" | "white") {
    this.board = new Array(boardSize * boardSize).fill(null)
  }

  public isPositionValid(pos: Position) {
    return !(
      pos.x < 0 ||
      pos.x >= this.boardSize ||
      pos.y < 0 ||
      pos.y >= this.boardSize
    )
  }

  public set(pos: Position, value: "black" | "white" | null) {
    if (!this.isPositionValid(pos)) {
      throw new Error(`Invalid position ${pos}`)
    }

    const index = pos.y * this.boardSize + pos.x
    if (this.board[index] !== null) {
      throw new Error(`Position ${pos} occupied by ${this.board[index]}`)
    }

    this.board[index] = value
  }

  public get(pos: Position): BoardValue {
    if (!this.isPositionValid(pos)) {
      throw new Error(`Invalid position ${pos}`)
    }
    const index = pos.y * this.boardSize + pos.x
    return this.board[index]
  }

  public isKo() {
    const currentFingerPrint = this.fingerPrint()
    let prevGame = this.prev
    for (let i = 0; i < 8 && prevGame !== null; i++) {
      if (prevGame.fingerPrint() === currentFingerPrint) {
        return true
      }
      prevGame = prevGame.prev
    }
    return false
  }

  public isSuicide() {
    // TODO
    return false
  }

  public removeDeadGroups() {
    const groups = new Array(this.boardSize * this.boardSize).fill(null)
    let nextGroupId = 1
    const allGroups = new Set<number>()
    for (let i = 0; i < this.board.length; i++) {
      const x = i % this.boardSize
      const y = Math.floor(i / this.boardSize)
      const leftGroup = x > 0 ? groups[i - 1] : null
      const upperGroup = y > 0 ? groups[i - this.boardSize] : null

      if (this.board[i] === this.turn) {
        if (leftGroup === null && upperGroup === null) {
          allGroups.add(nextGroupId)
          groups[i] = nextGroupId++
        } else if (leftGroup === upperGroup) {
          groups[i] = leftGroup
        } else if (upperGroup === null) {
          groups[i] = leftGroup
        } else if (leftGroup === null) {
          groups[i] = upperGroup
        } else if (leftGroup !== null && upperGroup !== null) {
          // Merge groups
          const canonical = Math.min(leftGroup, upperGroup)
          const toRemove = Math.max(leftGroup, upperGroup)
          groups[i] = leftGroup
          for (let j = 0; j < groups.length; j++) {
            if (groups[j] === toRemove) {
              groups[j] = canonical
            }
          }
          allGroups.delete(toRemove)
        } else {
          throw new Error("Unreachable")
        }
      }
    }

    const groupsWithAtLeastOneLiberty = new Set<number>()
    for (let i = 0; i < this.board.length; i++) {
      const x = i % this.boardSize
      const y = Math.floor(i / this.boardSize)

      if (this.board[i] === null) {
        const leftGroup = x > 0 ? groups[i - 1] : null
        if (leftGroup) {
          groupsWithAtLeastOneLiberty.add(leftGroup)
        }
        const rightGroup = x < this.boardSize - 1 ? groups[i + 1] : null
        if (rightGroup) {
          groupsWithAtLeastOneLiberty.add(rightGroup)
        }
        const upperGroup = y > 0 ? groups[i - this.boardSize] : null
        if (upperGroup) {
          groupsWithAtLeastOneLiberty.add(upperGroup)
        }
        const lowerGroup =
          y < this.boardSize - 1 ? groups[i + this.boardSize] : null
        if (lowerGroup) {
          groupsWithAtLeastOneLiberty.add(lowerGroup)
        }
      }
    }

    allGroups.forEach((g) => {
      if (!groupsWithAtLeastOneLiberty.has(g)) {
        for (let i = 0; i < this.board.length; i++) {
          if (groups[i] === g) {
            this.board[i] = null
          }
        }
      }
    })
  }

  public move(pos: Position | null) {
    const nextMove = this.clone()
    if (pos !== null) {
      nextMove.set(pos, this.turn)
    }

    nextMove.turn = this.turn === "black" ? "white" : "black"
    nextMove.removeDeadGroups()
    nextMove.prev = this
    return nextMove
  }

  public isValidMove(pos: Position | null) {
    // Pass is always allowed
    if (!pos) {
      return true
    }

    if (!this.isPositionValid(pos)) {
      return false
    }

    if (this.get(pos) !== null) {
      return false
    }

    const newState = this.move(pos)

    if (newState.isKo()) {
      return false
    }

    if (newState.isSuicide()) {
      return false
    }

    return true
  }

  // An element is any board value but nulls
  public getAllElements() {
    const elements: { pos: Position; value: Exclude<BoardValue, null> }[] = []
    for (let i = 0; i < this.board.length; i++) {
      const value = this.board[i]
      if (value !== null) {
        const x = i % this.boardSize
        const y = Math.floor(i / this.boardSize)
        elements.push({ pos: { x, y }, value })
      }
    }
    return elements
  }

  public fingerPrint() {
    let output = ""
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] === "black") output += "●"
      if (this.board[i] === "white") output += "○"
      if (this.board[i] === null) output += "•"

      if (i % this.boardSize === this.boardSize - 1) output += "\n"
    }
    return output
  }

  public passTurn() {
    this.turn = this.turn === "black" ? "white" : "black"
  }

  public clone() {
    const cloned = new GameState(this.boardSize, this.turn)
    cloned.board = [...this.board]
    return cloned
  }
}
