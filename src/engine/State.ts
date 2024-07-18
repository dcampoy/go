import { Game } from "./Game"

type BoardValue = "black" | "white" | null

// 0-based E.g. 1-1 is {x:0, y:0}
export type Position = {
  x: number
  y: number
}

export class GameState {
  private board: BoardValue[]
  // private prev: GameState | null = null

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

  public isKo(game: Game) {
    const currentFingerPrint = this.fingerPrint()
    const koState = game.findMovementByFingerPrint(currentFingerPrint)
    return koState !== null
  }

  public isSuicide() {
    const currentFingerPrint = this.fingerPrint()
    const stateAfterPass = this.move(null)
    if (stateAfterPass.fingerPrint() !== currentFingerPrint) {
      return true
    }

    return false
  }

  public removeDeadGroups() {
    // TODO To recalculate group information each time is inefficient.
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

  public identifyGroups(): [[x: number, y: number], number][] {
    const groups = new Array(this.boardSize * this.boardSize).fill(null)
    for (let i = 0; i < this.board.length; i++) {
      const x = i % this.boardSize
      const y = Math.floor(i / this.boardSize)
      const leftGroup = x > 0 ? groups[i - 1] : null
      const upperGroup = y > 0 ? groups[i - this.boardSize] : null

      if (this.board[i] === this.turn) {
        if (leftGroup === null && upperGroup === null) {
          groups[i] = i
        } else if (leftGroup === upperGroup) {
          groups[i] = upperGroup
        } else if (upperGroup === null) {
          groups[i] = leftGroup
        } else if (leftGroup === null) {
          groups[i] = upperGroup
        } else if (leftGroup !== null && upperGroup !== null) {
          const canonical = Math.min(leftGroup, upperGroup)
          const toRemove = Math.max(leftGroup, upperGroup)
          groups[i] = leftGroup
          for (let j = 0; j < groups.length; j++) {
            if (groups[j] === toRemove) {
              groups[j] = canonical
            }
          }
        } else {
          throw new Error("Unreachable")
        }
      }
    }

    const libertyCounts = new Map<number, number>()
    for (let i = 0; i < this.board.length; i++) {
      const x = i % this.boardSize
      const y = Math.floor(i / this.boardSize)
      const visited = new Set<number>()

      if (this.board[i] === null) {
        const leftGroup = x > 0 ? groups[i - 1] : null
        if (leftGroup) {
          if (!visited.has(leftGroup)) {
            libertyCounts.set(
              leftGroup,
              (libertyCounts.get(leftGroup) || 0) + 1
            )
            visited.add(leftGroup)
          }
        }
        const rightGroup = x < this.boardSize - 1 ? groups[i + 1] : null
        if (rightGroup) {
          if (!visited.has(rightGroup)) {
            libertyCounts.set(
              rightGroup,
              (libertyCounts.get(rightGroup) || 0) + 1
            )
            visited.add(rightGroup)
          }
        }

        const upperGroup = y > 0 ? groups[i - this.boardSize] : null
        if (upperGroup) {
          if (!visited.has(upperGroup)) {
            libertyCounts.set(
              upperGroup,
              (libertyCounts.get(upperGroup) || 0) + 1
            )
            visited.add(upperGroup)
          }
        }

        const lowerGroup =
          y < this.boardSize - 1 ? groups[i + this.boardSize] : null
        if (lowerGroup) {
          if (!visited.has(lowerGroup)) {
            libertyCounts.set(
              lowerGroup,
              (libertyCounts.get(lowerGroup) || 0) + 1
            )
            visited.add(lowerGroup)
          }
        }
      }
    }

    // TODO Process libertyCounts to return <Pos> => libertyCounts
    return [...libertyCounts.entries()].map(([i, lib]) => {
      const x = i % this.boardSize
      const y = Math.floor(i / this.boardSize)
      return [[x, y], lib]
    })
  }

  public isEye(pos: Position) {
    let enemyOnDiagonal = false
    // Upper left
    if (pos.x > 0 && pos.y > 0) {
      const index = (pos.y - 1) * this.boardSize + (pos.x - 1)
      if (this.board[index] !== null && this.board[index] !== this.turn) {
        enemyOnDiagonal = true
      }
    }

    // Left
    if (pos.x > 0) {
      const index = pos.y * this.boardSize + (pos.x - 1)
      if (this.board[index] !== this.turn) {
        return false
      }
    }

    // Lower left
    if (pos.x > 0 && pos.y < this.boardSize - 1) {
      const index = (pos.y + 1) * this.boardSize + (pos.x - 1)
      if (this.board[index] !== null && this.board[index] !== this.turn) {
        enemyOnDiagonal = true
      }
    }

    // Up
    if (pos.y > 0) {
      const index = (pos.y - 1) * this.boardSize
      if (this.board[index] !== this.turn) {
        return false
      }
    }

    // Down
    if (pos.y < this.boardSize - 1) {
      const index = (pos.y + 1) * this.boardSize
      if (this.board[index] !== this.turn) {
        return false
      }
    }

    // Upper right
    if (pos.x > 0 && pos.y > 0) {
      const index = (pos.y - 1) * this.boardSize + (pos.x + 1)
      if (this.board[index] !== null && this.board[index] !== this.turn) {
        enemyOnDiagonal = true
      }
    }

    // Right
    if (pos.x > 0) {
      const index = pos.y * this.boardSize + (pos.x + 1)
      if (this.board[index] !== this.turn) {
        return false
      }
    }

    // Lower right
    if (pos.x > 0 && pos.y < this.boardSize - 1) {
      const index = (pos.y + 1) * this.boardSize + (pos.x + 1)
      if (this.board[index] !== null && this.board[index] !== this.turn) {
        enemyOnDiagonal = true
      }
    }

    if (
      enemyOnDiagonal &&
      (pos.x === 0 ||
        pos.y === 0 ||
        pos.x === this.boardSize - 1 ||
        pos.y === this.boardSize - 1)
    ) {
      return false
    }

    return true
  }

  public move(pos: Position | null) {
    const nextMove = this.clone()
    if (pos !== null) {
      nextMove.set(pos, this.turn)
    }

    nextMove.turn = this.turn === "black" ? "white" : "black"
    nextMove.removeDeadGroups()
    return nextMove
  }

  public isValidMove(pos: Position | null, game: Game | null) {
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

    if (game && newState.isKo(game)) {
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

  public getEmptyPositions() {
    const positions: Position[] = []
    for (let i = 0; i < this.board.length; i++) {
      const value = this.board[i]
      if (value === null) {
        const x = i % this.boardSize
        const y = Math.floor(i / this.boardSize)
        positions.push({ x, y })
      }
    }
    return positions
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

  public clone() {
    const cloned = new GameState(this.boardSize, this.turn)
    cloned.board = [...this.board]
    return cloned
  }

  public numberOfBlackStones() {
    let c = 0
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] === "black") {
        c++
      }
    }
    return c
  }
  public numberOfWhiteStones() {
    let c = 0
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] === "white") {
        c++
      }
    }
    return c
  }
}
