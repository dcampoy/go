import { GameState } from "./State"

export function simulate(state: GameState) {
  let positions = state.getEmptyPositions()
  let pass = false
  let c = 0
  while (true) {
    c++
    if (c > 100) {
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

export function score(state: GameState) {
  let results: number[] = []
  for (let k = 0; k < 1000; k++) {
    const sim = simulate(state)
    const blackStones = sim.numberOfBlackStones()
    const whiteStones = sim.numberOfWhiteStones()
    results.push(blackStones - whiteStones)
  }

  const blackWins = results.filter((v) => v > 0).length
  const total = results.length

  return {
    blackWinningChances: ((100 * blackWins) / total).toFixed(2),
  }
}
