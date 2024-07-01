import { GameState } from "./State"

export function simulate(state: GameState) {
  let positions = state.getEmptyPositions()
  let pass = false
  let c = 0
  while (true) {
    c++
    if (c > 500) {
      break
    }
    if (positions.length === 0) {
      state = state.move(null)
      if (pass) {
        break
      } else {
        pass = true
        positions = state.getEmptyPositions()
      }
    }

    const i = Math.floor(Math.random() * positions.length)

    if (!state.isValidMove(positions[i])) {
      positions = positions.slice(0, i).concat(positions.slice(i + 1))
      continue
    }

    if (state.isEye(positions[i])) {
      positions = positions.slice(0, i).concat(positions.slice(i + 1))
      continue
    }

    state = state.move(positions[i])
    positions = state.getEmptyPositions()
    pass = false
  }

  return state
}

export function winningChance(state: GameState) {
  let w = 0
  let total = 0
  for (let k = 0; k < 1000; k++) {
    if (
      simulate(state).numberOfBlackStones() >
      (state.boardSize * state.boardSize) / 2
    ) {
      w++
    }
    total++
  }
  return ((100 * w) / total).toFixed(2)
}
