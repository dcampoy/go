import { Game } from "./Game"

type Group = number

type BoardValue = {
  colour: "black" | "white" | null
  group: Group | null
}

// 0-based E.g. 1-1 is {x:0, y:0}
export type Position = {
  x: number
  y: number
}

export class GameState {
  private board: BoardValue[]

  constructor(public boardSize: number, public turn: "black" | "white") {
    this.board = new Array(boardSize * boardSize).fill({
      colour: null,
      group: null,
    })
  }

  /**
   * Determines if a position is within the board boundaries.
   * @param Position pos
   * @returns boolean
   */
  public isPositionWithinBoundaries(pos: Position) {
    return !(
      pos.x < 0 ||
      pos.x >= this.boardSize ||
      pos.y < 0 ||
      pos.y >= this.boardSize
    )
  }

  private topPositionIndex(index: number): number | null {
    const y = Math.floor(index / this.boardSize)
    if (y === 0) return null
    return index - this.boardSize
  }

  private rightPositionIndex(index: number): number | null {
    const x = index % this.boardSize
    if (x === this.boardSize - 1) return null
    return index + 1
  }

  private bottomPositionIndex(index: number): number | null {
    const y = Math.floor(index / this.boardSize)
    if (y === this.boardSize - 1) return null
    return index + this.boardSize
  }

  private leftPositionIndex(index: number): number | null {
    const x = index % this.boardSize
    if (x === 0) return null
    return index - 1
  }

  /**
   * Sets a value to a position on the board.
   *
   * @throws Error if the position is out of boundaries or already occupied
   * @param Position pos
   * @param colour "black" | "white"
   */
  public set(pos: Position, colour: "black" | "white") {
    if (!this.isPositionWithinBoundaries(pos)) {
      throw new Error(`Invalid position (${pos.x},${pos.y})`)
    }

    const index = pos.y * this.boardSize + pos.x
    if (this.board[index].colour !== null) {
      throw new Error(
        `Position (${pos.x},${pos.y}) occupied by a ${this.board[index].colour} stone`
      )
    }

    this.board[index] = { colour, group: index }

    const adyacentGroupsWithSameColour = [
      this.topPositionIndex(index),
      this.rightPositionIndex(index),
      this.leftPositionIndex(index),
      this.bottomPositionIndex(index),
    ]
      .filter((p) => p !== null)
      .map((p) => this.board[p])
      .filter((p) => p.colour === colour)
      .map((p) => p.group) as number[]

    const canonicalGroupId = Math.min(...adyacentGroupsWithSameColour, index)
    const groupsToMerge = [...adyacentGroupsWithSameColour, index].filter(
      (g) => g !== canonicalGroupId
    )

    for (let i = 0; i < this.board.length; i++) {
      const groupAtI = this.board[i].group
      if (groupAtI && groupsToMerge.includes(groupAtI)) {
        this.board[i].group = canonicalGroupId
      }
    }
  }

  public removeStone(pos: Position) {
    const index = pos.y * this.boardSize + pos.x
    const group = this.board[index].group
    const colour = this.board[index].colour

    this.board[index] = { colour: null, group: null }

    if (group) {
      for (let i = 0; i < this.board.length; i++) {
        if (this.board[i].group === group) {
          const top = this.topPositionIndex(i)
          const groupAtTop =
            top && this.board[top].colour === colour
              ? this.board[top].group
              : null

          const left = this.leftPositionIndex(i)
          const groupAtLeft =
            left && this.board[left].colour === colour
              ? this.board[left].group
              : null

          if (groupAtTop === null && groupAtLeft === null) {
            this.board[i].group = i
          } else if (groupAtTop !== null && groupAtLeft === null) {
            this.board[i].group = groupAtTop
          } else if (groupAtLeft !== null && groupAtTop === null) {
            this.board[i].group = groupAtLeft
          } else if (
            groupAtTop !== null &&
            groupAtLeft !== null &&
            groupAtTop !== groupAtLeft
          ) {
            const canonical = Math.min(groupAtTop, groupAtLeft)
            const toRemove = Math.max(groupAtTop, groupAtLeft)
            this.board[i].group = canonical
            for (let j = 0; j < this.board.length; j++) {
              if (this.board[j].group === toRemove) {
                this.board[j].group = canonical
              }
            }
          }
        }
      }
    }
  }

  /**
   * Gets the value of a position on the board.
   *
   * @throws Error if the position is out of boundaries
   * @param Position pos
   * @returns "black" | "white" | null if empty
   */
  public get(pos: Position): BoardValue["colour"] {
    if (!this.isPositionWithinBoundaries(pos)) {
      throw new Error(`Invalid position (${pos.x},${pos.y})`)
    }
    const index = pos.y * this.boardSize + pos.x
    return this.board[index].colour
  }

  public getBoardValue(pos: Position): BoardValue {
    if (!this.isPositionWithinBoundaries(pos)) {
      throw new Error(`Invalid position (${pos.x},${pos.y})`)
    }
    const index = pos.y * this.boardSize + pos.x
    return this.board[index]
  }

  /**
   * Determines if the current position board was seen before in the game.
   * @param Game game
   * @returns boolean
   */
  public isKo(game: Game) {
    const currentFingerPrint = this.fingerPrint()
    const koState = game.findMovementByFingerPrint(currentFingerPrint)
    return koState !== null
  }

  /**
   * Determines if the current position board contains a group without liberties.
   * @returns boolean
   */
  private containsDeadGroupAt(pos: Position) {
    const index = pos.y * this.boardSize + pos.x
    const group = this.board[index].group
    if (group !== null) {
      const liberties = this.calculateLiberties(group)
      if (liberties.length === 0) {
        return true
      }
    }
    return false
  }

  public calculateLiberties(group: number) {
    const liberties = new Set<number>()
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i].colour === null) {
        const top = this.topPositionIndex(i)
        if (top !== null && this.board[top].group === group) {
          liberties.add(i)
        }
        const left = this.leftPositionIndex(i)
        if (left !== null && this.board[left].group === group) {
          liberties.add(i)
        }
        const bottom = this.bottomPositionIndex(i)
        if (bottom !== null && this.board[bottom].group === group) {
          liberties.add(i)
        }
        const right = this.rightPositionIndex(i)
        if (right !== null && this.board[right].group === group) {
          liberties.add(i)
        }
      }
    }
    return [...liberties]
  }

  /**
   * Removes dead groups from the board.
   */
  private removeDeadGroupsAround(pos: Position) {
    // Get all existing groups
    const opponentColour = this.turn === "black" ? "white" : "black"
    const index = pos.y * this.boardSize + pos.x
    const opponentGroups = [
      this.topPositionIndex(index),
      this.rightPositionIndex(index),
      this.leftPositionIndex(index),
      this.bottomPositionIndex(index),
    ]
      .filter((p) => p !== null)
      .map((p) => this.board[p])
      .filter((v) => v.colour === opponentColour)
      .map((v) => v.group)

    for (const group of opponentGroups) {
      const liberties = this.calculateLiberties(group)
      if (liberties.length === 0) {
        for (let i = 0; i < this.board.length; i++) {
          if (this.board[i].group === group) {
            this.board[i].colour = null
            this.board[i].group = null
          }
        }
      }
    }
  }

  /**
   * Determines if a position is an eye.
   *
   * A position is an eye when it is empty and there are surrounded by stones of the same colour.
   * When the position is not on the edge or the corner, it may have at most one enemy stone on the diagonal.
   *
   *   Eye on the corner        Eye on the edge        Eye in the middle
   *      e●•                      ●••                    •●○
   *      ●••                      e●•                    ●e●
   *      •••                      ●••                    •●•
   *
   * @param Position pos
   * @returns boolean
   */
  public isEye(pos: Position) {
    let enemyOnDiagonal = false

    // Up
    if (pos.y > 0) {
      const index = (pos.y - 1) * this.boardSize + pos.x
      if (this.board[index].colour !== this.turn) {
        return false
      }
    }

    // Upper right
    if (pos.x > 0 && pos.y > 0) {
      const index = (pos.y - 1) * this.boardSize + (pos.x + 1)
      if (
        this.board[index].colour !== null &&
        this.board[index].colour !== this.turn
      ) {
        enemyOnDiagonal = true
      }
    }

    // Right
    if (pos.x < this.boardSize - 1) {
      const index = pos.y * this.boardSize + (pos.x + 1)
      if (this.board[index].colour !== this.turn) {
        return false
      }
    }

    // Lower right
    if (pos.x < this.boardSize - 1 && pos.y < this.boardSize - 1) {
      const index = (pos.y + 1) * this.boardSize + (pos.x + 1)
      if (
        this.board[index].colour !== null &&
        this.board[index].colour !== this.turn
      ) {
        enemyOnDiagonal = true
      }
    }

    // Down
    if (pos.y < this.boardSize - 1) {
      const index = (pos.y + 1) * this.boardSize + pos.x
      if (this.board[index].colour !== this.turn) {
        return false
      }
    }

    // Lower left
    if (pos.x > 0 && pos.y < this.boardSize - 1) {
      const index = (pos.y + 1) * this.boardSize + (pos.x - 1)
      if (
        this.board[index].colour !== null &&
        this.board[index].colour !== this.turn
      ) {
        enemyOnDiagonal = true
      }
    }

    // Left
    if (pos.x > 0) {
      const index = pos.y * this.boardSize + (pos.x - 1)
      if (this.board[index].colour !== this.turn) {
        return false
      }
    }

    // Upper left
    if (pos.x > 0 && pos.y > 0) {
      const index = (pos.y - 1) * this.boardSize + (pos.x - 1)
      if (
        this.board[index] !== null &&
        this.board[index].colour !== this.turn
      ) {
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

  /**
   * Performs a move on the board.
   *
   * @param Position | null pos
   * @returns GameState
   */
  public move(pos: Position | null) {
    const nextMove = this.clone()
    if (pos !== null) {
      nextMove.set(pos, this.turn)
      nextMove.removeDeadGroupsAround(pos)
    }
    nextMove.turn = this.turn === "black" ? "white" : "black"
    return nextMove
  }

  /**
   * Determines if a move is valid.
   *
   * When a game is passed, it checks for ko situations.
   *
   * @param Position | null meaning pass
   * @param Game | null game
   * @returns boolean
   */
  public isValidMove(pos: Position | null, game: Game | null) {
    // Pass is always allowed
    if (!pos) {
      return true
    }

    if (!this.isPositionWithinBoundaries(pos)) {
      return false
    }

    if (this.get(pos) !== null) {
      return false
    }

    const newState = this.move(pos)

    // Suicide is not allowed
    if (newState.containsDeadGroupAt(pos)) {
      return false
    }

    // Ko is not allowed
    if (game && newState.isKo(game)) {
      return false
    }

    return true
  }

  /**
   * Gets all elements on the board.
   *
   * @returns { pos: Position; value: Exclude<BoardValue, null> }[]
   */
  public getAllElements(): {
    pos: Position
    value: Exclude<BoardValue, null>
  }[] {
    // TODO DIEGO Think about returning groups information instead
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

  /**
   * Gets all empty positions on the board.
   *
   * @returns Position[]
   */
  public getEmptyPositions(): Position[] {
    const positions: Position[] = []
    for (let i = 0; i < this.board.length; i++) {
      const value = this.board[i].colour
      if (value === null) {
        const x = i % this.boardSize
        const y = Math.floor(i / this.boardSize)
        positions.push({ x, y })
      }
    }
    return positions
  }

  /**
   * Gets a fingerprint of the current board state.
   *
   * @returns string
   */
  public fingerPrint(): string {
    let output = ""
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i].colour === "black") output += "●"
      if (this.board[i].colour === "white") output += "○"
      if (this.board[i].colour === null) output += "•"

      if (i % this.boardSize === this.boardSize - 1) output += "\n"
    }
    return output
  }

  /**
   * Clones the current board state.
   *
   * @returns GameState
   */
  public clone(): GameState {
    const cloned = new GameState(this.boardSize, this.turn)
    cloned.board = this.board.map((v) => ({
      colour: v.colour,
      group: v.group,
    }))
    return cloned
  }

  /**
   * Gets the number of black stones on the board.
   *
   * @returns number
   */
  public numberOfBlackStones(): number {
    let c = 0
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i].colour === "black") {
        c++
      }
    }
    return c
  }

  /**
   * Gets the number of white stones on the board.
   *
   * @returns number
   */
  public numberOfWhiteStones(): number {
    let c = 0
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i].colour === "white") {
        c++
      }
    }
    return c
  }
}
