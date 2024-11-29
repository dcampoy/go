import { GameState } from "./State"

test("It is possible to create a game state", () => {
  const state = new GameState(5, "black")
  expect(state.boardSize).toBe(5)
  expect(state.turn).toBe("black")
})

test("It is possible to set a stone", () => {
  const state = new GameState(5, "black")

  expect(state.get({ x: 0, y: 0 })).toEqual(null)
  state.set({ x: 0, y: 0 }, "black")
  expect(state.getBoardValue({ x: 0, y: 0 })).toEqual({
    colour: "black",
    group: 0,
  })
})

test("It is possible to get a list of empty positions", () => {
  const state = new GameState(3, "black")
  // •●•
  // ●•●
  // ●●●
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 0, y: 1 }, "black")
  state.set({ x: 2, y: 1 }, "black")
  state.set({ x: 0, y: 2 }, "black")
  state.set({ x: 1, y: 2 }, "black")
  state.set({ x: 2, y: 2 }, "black")
  expect(state.getEmptyPositions()).toEqual([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
  ])
})

test("It is possible to get number of black stones on the board", () => {
  const state = new GameState(3, "black")
  // •●•
  // ●•●
  // ●●●
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 0, y: 1 }, "black")
  state.set({ x: 2, y: 1 }, "black")
  state.set({ x: 0, y: 2 }, "black")
  state.set({ x: 1, y: 2 }, "black")
  state.set({ x: 2, y: 2 }, "black")
  expect(state.numberOfBlackStones()).toEqual(6)
})

test("It is possible to get number of white stones on the board", () => {
  const state = new GameState(3, "black")
  // •●•
  // ●•●
  // ●●●
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 0, y: 1 }, "black")
  state.set({ x: 2, y: 1 }, "black")
  state.set({ x: 0, y: 2 }, "black")
  state.set({ x: 1, y: 2 }, "black")
  state.set({ x: 2, y: 2 }, "black")
  expect(state.numberOfWhiteStones()).toEqual(0)
})

test("An error is thrown when setting a stone out of boundaries", () => {
  const state = new GameState(5, "black")
  expect(() => state.set({ x: 10, y: 10 }, "black")).toThrow(
    "Invalid position (10,10)"
  )
})

test("An error is thrown when setting a stone on an already occupied position", () => {
  const state = new GameState(5, "black")
  state.set({ x: 0, y: 0 }, "black")
  expect(() => state.set({ x: 0, y: 0 }, "white")).toThrow(
    "Position (0,0) occupied by a black stone"
  )
})

test("It is possible to remove a stone", () => {
  const state = new GameState(5, "black")
  state.set({ x: 0, y: 0 }, "black")
  state.removeStone({ x: 0, y: 0 })
  expect(state.getBoardValue({ x: 0, y: 0 })).toEqual({
    colour: null,
    group: null,
  })
})

test("Two adjacent stones of the same colour are part of the same group", () => {
  const state = new GameState(5, "black")
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 0, y: 0 }, "black")
  expect(state.getBoardValue({ x: 0, y: 0 })).toEqual({
    colour: "black",
    group: 0,
  })
  expect(state.getBoardValue({ x: 1, y: 0 })).toEqual({
    colour: "black",
    group: 0,
  })
})

test("Two adjacent stones of different colours are part of different groups", () => {
  const state = new GameState(5, "black")
  state.set({ x: 0, y: 0 }, "black")
  state.set({ x: 1, y: 0 }, "white")
  expect(state.getBoardValue({ x: 0, y: 0 })).toEqual({
    colour: "black",
    group: 0,
  })
  expect(state.getBoardValue({ x: 1, y: 0 })).toEqual({
    colour: "white",
    group: 1,
  })
})

test("It is possible to get a finger print of the state", () => {
  const state = new GameState(5, "black")
  state.set({ x: 0, y: 0 }, "black")
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 1, y: 1 }, "white")
  expect(state.fingerPrint()).toBe("●●•••\n•○•••\n•••••\n•••••\n•••••\n")
})

describe("Detect eyes in the corner", () => {
  test("In the top left corner", () => {
    const state = new GameState(5, "black")
    // e●•
    // ●••
    // •••
    state.set({ x: 1, y: 0 }, "black")
    state.set({ x: 0, y: 1 }, "black")
    state.set({ x: 1, y: 1 }, "black")
    expect(state.isEye({ x: 0, y: 0 })).toBe(true)

    // e●•
    // ●○•
    // •••
    state.removeStone({ x: 1, y: 1 })
    state.set({ x: 1, y: 1 }, "white")

    expect(state.isEye({ x: 0, y: 0 })).toBe(false)
  })

  test("In the edge", () => {
    const state = new GameState(5, "black")
    // ●••
    // e●•
    // ●••
    state.set({ x: 0, y: 0 }, "black")
    state.set({ x: 1, y: 1 }, "black")
    state.set({ x: 0, y: 2 }, "black")
    expect(state.isEye({ x: 0, y: 1 })).toBe(true)
  })

  test("In the middle", () => {
    const state = new GameState(5, "black")
    // •●○
    // ●e●
    // •●•
    state.set({ x: 1, y: 0 }, "black")
    state.set({ x: 2, y: 0 }, "white")
    state.set({ x: 0, y: 1 }, "black")
    state.set({ x: 2, y: 1 }, "black")
    state.set({ x: 1, y: 2 }, "black")

    expect(state.isEye({ x: 1, y: 1 })).toBe(true)
  })
})

test("Detect captures", () => {
  let state = new GameState(3, "black")
  // •●•
  // ●○•
  // •●•
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 0, y: 1 }, "black")
  state.set({ x: 1, y: 1 }, "white")
  state.set({ x: 1, y: 2 }, "black")
  expect(state.fingerPrint()).toBe("•●•\n●○•\n•●•\n")

  // •●•
  // ●•●
  // •●•
  const newState = state.move({ x: 2, y: 1 })
  expect(newState.fingerPrint()).toBe("•●•\n●•●\n•●•\n")
})

test("Play inside an eye is not a valid move", () => {
  const state = new GameState(3, "white")
  // •●•
  // ●x●
  // •●•
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 0, y: 1 }, "black")
  state.set({ x: 2, y: 1 }, "black")
  state.set({ x: 1, y: 2 }, "black")

  expect(state.isValidMove({ x: 1, y: 1 }, null)).toBe(false)
})

test("Suicide is not allowed", () => {
  const state = new GameState(3, "white")
  // •●•
  // ○●•
  // ●••
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 0, y: 1 }, "white")
  state.set({ x: 1, y: 1 }, "black")
  state.set({ x: 0, y: 2 }, "black")

  expect(state.isValidMove({ x: 0, y: 0 }, null)).toBe(false)
})

test("It is not suicide when capturing an opponent's stone", () => {
  const state = new GameState(3, "white")
  // •●•
  // ●○•
  // ○••
  state.set({ x: 1, y: 0 }, "black")
  state.set({ x: 0, y: 1 }, "black")
  state.set({ x: 1, y: 1 }, "white")
  state.set({ x: 0, y: 2 }, "white")

  expect(state.isValidMove({ x: 0, y: 0 }, null)).toBe(true)
})

test("Making a move doesn't change previous state", () => {
  const state = new GameState(3, "black")
  // ●••
  // ○●•
  // •••
  state.set({ x: 0, y: 0 }, "black")
  state.set({ x: 0, y: 1 }, "white")
  state.set({ x: 1, y: 1 }, "black")

  const fingerprintBeforeMove = state.fingerPrint()

  const newState = state.move({ x: 0, y: 2 })
  const fingerprintAfterMove = state.fingerPrint()

  expect(newState.fingerPrint()).toBe("●••\n•●•\n●••\n")
  expect(fingerprintBeforeMove).toBe(fingerprintAfterMove)
})

test("It is posible to generate next state making a move", () => {
  let state = new GameState(3, "black")

  state = state.move({ x: 0, y: 0 })
  expect(state.fingerPrint()).toBe("●••\n•••\n•••\n")
  expect(state.turn).toBe("white")

  state = state.move({ x: 1, y: 0 })
  expect(state.fingerPrint()).toBe("●○•\n•••\n•••\n")
  expect(state.turn).toBe("black")

  state = state.move({ x: 1, y: 1 })
  expect(state.fingerPrint()).toBe("●○•\n•●•\n•••\n")
  expect(state.turn).toBe("white")

  state = state.move({ x: 2, y: 2 })
  expect(state.fingerPrint()).toBe("●○•\n•●•\n••○\n")
  expect(state.turn).toBe("black")

  state = state.move({ x: 2, y: 0 })
  expect(state.fingerPrint()).toBe("●•●\n•●•\n••○\n")
  expect(state.turn).toBe("white")
})

test("It is posible to generate next state passing", () => {
  const state = new GameState(3, "black")
  const oldFingerprint = state.fingerPrint()
  const newState = state.move(null)
  const newFingerprint = newState.fingerPrint()
  expect(newFingerprint).toBe(oldFingerprint)
  expect(newState.turn).toBe("white")
})
