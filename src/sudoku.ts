
type Num = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
const nums: Num[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
type Index = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
const indices: Index[] = [0, 1, 2, 3, 4, 5, 6, 7, 8]
type Coordinates = [Index, Index]
type SubgridIndex = 0 | 1 | 2
type SubGridCoordinates = [SubgridIndex, SubgridIndex]
type Opts = Num[]
type GridRow = [Opts, Opts, Opts, Opts, Opts, Opts, Opts, Opts, Opts]
type Grid = [
  GridRow, GridRow, GridRow, GridRow, GridRow, GridRow,GridRow, GridRow, GridRow
]
const range = (n: number) => [...Array(n).keys()]
const emptyRow = (): GridRow => [[], [], [], [], [], [], [], [], []]
const emptyGrid = (): Grid => [emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]
const parseGrid = (gridStr: string): Grid => {
  const rows = gridStr.trim().split('\n').map(row => row.trim())
  const digits = rows.map(row => row.split('').map(ch => parseInt(ch) as Num))
  const grid = emptyGrid()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = digits[r][c]
      if (digit) {
        grid[r][c] = [digit]
      }
    }
  }
  fillOptions(grid)
  return grid
}
const printGrid = (grid: Grid) => console.log(grid.map(row => row.map(cell => cell.length === 1 ? cell[0] : '.').join('')).join('\n'))

const printGrid2 = (grid: Grid) => console.log(
  grid.map(
    row => row.map(cell => 
      cell.join("").padEnd(9, ' ')
    ).join(' ')
  ).join('\n'))



const coordinatesForRow = (row: Index) => indices.map(col => [row, col] as Coordinates)
const coordinatesForCol = (col: Index) => indices.map(row => [row, col] as Coordinates)
const coordinatesForSubgrid = (coords: SubGridCoordinates): Coordinates[] => {
  const row = coords[0] * 3
  const col = coords[1] * 3
  return [
    [row, col], [row + 1, col], [row + 2, col],
    [row, col + 1], [row + 1, col + 1], [row + 2, col + 1],
    [row, col + 2], [row + 1, col + 2], [row + 2, col + 2]
  ] as Coordinates[]
}
const subgridCoordinates: SubGridCoordinates[] = [0, 1, 2].map(x => [0, 1, 2].map(y => [x, y] as SubGridCoordinates)).flat()

const solved = (grid: Grid) => grid.every(row => row.every(cell => cell.length === 1))
const unsolvable = (grid: Grid) => grid.some(row => row.some(cell => cell.length === 0))

const exclusions = [
  ...indices.map(row => coordinatesForRow(row)),
  ...indices.map(col => coordinatesForCol(col)),
  ...subgridCoordinates.map(coords => coordinatesForSubgrid(coords))
]

function exclusionStep(grid: Grid) {
  let changed = false
  for (const coords of exclusions) {
    const currentOptions = coords.map(([r, c]) => grid[r][c])    
    for (let i = 0; i < currentOptions.length; i++) {
      if (currentOptions[i].length === 1) {
        const num = currentOptions[i][0]
        for (let j = 0; j < currentOptions.length; j++) {
          if (i !== j) {
            const idx = currentOptions[j].indexOf(num)
            if (idx >= 0) {
              currentOptions[j].splice(idx, 1)
              changed = true
            }
          }
        }
      }
    }
  }  
  return changed
}

const arrayEqual = <T>(xs: T[], ys: T[]): boolean => xs.length === ys.length && xs.every((x, i) => x === ys[i])

function removeFromArray(array: Num[], toRemove: Num[]) {
  let changed = false
  for (const n of toRemove) {
    const idx = array.indexOf(n)
    if (idx >= 0) {
      changed = true
      array.splice(idx, 1)
    }
  }
  return changed
}

function identicalOptionsStep(grid: Grid) {
  let changed = false
  for (const coords of exclusions) {
    const currentOptions = coords.map(([r, c]) => grid[r][c])
    for (let i = 0; i < currentOptions.length; i++) {
      for (let j = i + 1; j < currentOptions.length; j++) {
        if (currentOptions[i].length === 2 && arrayEqual(currentOptions[i], currentOptions[j])) {
          for (let k = 0; k < currentOptions.length; k++) {
            if (k !== i && k !== j) {
              const optionsToRemove = currentOptions[i]
              const removed = removeFromArray(currentOptions[k], optionsToRemove)
              changed = changed || removed              
            }
          }
        }
      }
    }
  }  
  return changed
}

function onlyPositionStep(grid: Grid) {
  let changed = false
  for (const coords of exclusions) {
    const currentOptions = coords.map(([r, c]) => grid[r][c])
    for (const num of nums) {
      const cellsWithNum = currentOptions.filter(opts => opts.includes(num))
      if (!cellsWithNum.some(cell => cell.length === 1)) {
        if (cellsWithNum.length === 1) {
          cellsWithNum[0].splice(0, cellsWithNum[0].length, num)
          changed = true
        }               
      }
    }
  }  
  return changed
}

function rowExclusionStep(grid: Grid) {
  let changed = false
  for (const coordsInThisSubGrid of subgridCoordinates.map(coords => coordinatesForSubgrid(coords))) {
    const currentOptions = coordsInThisSubGrid.map(([r, c]) => ({ opts: grid[r][c], coords: [r, c]}))
    for (const num of nums) {
      const optsIncludingNum = currentOptions.filter(opts => opts.opts.includes(num))
      if (optsIncludingNum.length > 0) {
        const row = optsIncludingNum[0].coords[0]
        const col = optsIncludingNum[0].coords[1]
        if (optsIncludingNum.every(opts => opts.coords[0] === row) && optsIncludingNum.some(opts => opts.opts.length > 1)) {
          //console.log("All options including", num, "are in the same row", row, optsIncludingNum)
          for (const c of coordinatesForRow(row)) {
            if (!coordsInThisSubGrid.some(c2 => arrayEqual(c, c2))) {
              // Remove from c
              const cell = grid[c[0]][c[1]]
              if (cell.includes(num)) {
                //console.log("Removing", num, "from", c)
                cell.splice(cell.indexOf(num), 1)
                changed = true
              }
            }
          }
        }

        if (optsIncludingNum.every(opts => opts.coords[1] === col) && optsIncludingNum.some(opts => opts.opts.length > 1)) {
          //console.log("All options including", num, "are in the same col", col, optsIncludingNum)
          for (const c of coordinatesForCol(col)) {
            if (!coordsInThisSubGrid.some(c2 => arrayEqual(c, c2))) {
              // Remove from c
              const cell = grid[c[0]][c[1]]
              if (cell.includes(num)) {
                //console.log("Removing", num, "from", c)
                cell.splice(cell.indexOf(num), 1)
                changed = true
              }
            }
          }
        }
      }
    }
  }
  return changed
}

function fillOptions(grid: Grid) {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.length === 0) {
        cell.push(...nums)
      }
    }
  }
}

function verify(grid: Grid) {
  for (const coords of exclusions) {
    const currentOptions = coords.map(([r, c]) => grid[r][c])
    for (const opt of currentOptions) {
      if (opt.length !== 1) {
        console.error("Verify error", opt, "at", coords)
      }
    }
    const includedNums = currentOptions.flat()
    for (const num of nums) {
      if (!includedNums.includes(num)) {
        console.error("Verify error: missing", num, "at", coords)
      }
    }
    if (includedNums.length !== 9) {
      console.error("Verify error: not 9 numbers at", coords)
    }
  } 
}

function solveByIteration(grid: Grid) {
  let iteration = 0
  if (verbose) {
    console.log("Iteration", iteration)
    printGrid2(grid)  
  }
  while (!unsolvable(grid) && !solved(grid)) {
    iteration++
    const c1 = exclusionStep(grid)
    const c2 = identicalOptionsStep(grid)
    const c3 = onlyPositionStep(grid)
    const c4 = rowExclusionStep(grid)
    if (verbose) {
      console.log("Iteration", iteration)
      printGrid2(grid)    
    }
    if (!c1 && !c2 && !c3 && !c4) {
      break
    }
  }
  return solved(grid)
}

function cloneGrid(grid: Grid, target: Grid = emptyGrid()): Grid {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      target[r][c] = [...grid[r][c]]
    }
  }
  return target
}

function takeGuess(grid: Grid, guessIndex: number): Grid {
  const forkedGrid = cloneGrid(grid)
  let cumulativeIndex = 0
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const optCount = forkedGrid[row][col].length
      if (optCount > 1) {
        const localIndex = guessIndex - cumulativeIndex
        if (localIndex < optCount) {
          forkedGrid[row][col] = [forkedGrid[row][col][localIndex]]
          return forkedGrid
        }
        cumulativeIndex += optCount
      }
    }
  }
  return forkedGrid
}

function solveByGuessing(grid: Grid, guesses: number[]) {
  let index = 0
  while (true) {
    const newGuesses = [...guesses, index]
    if (verbose) console.log("Taking guess", newGuesses)
    const forkedGrid = takeGuess(grid, index)
    const solved = solve(forkedGrid, newGuesses)
    if (solved) {
      //console.log("Solved with guess", newGuesses)
      return forkedGrid
    } else {
      if (verbose) console.log("Guess", newGuesses, "failed")
    }    
    index++
  }
}


function solve(grid: Grid, guesses: number[] = []) {
  const solved = solveByIteration(grid)
  if (solved) {
    return true
  }
  if (unsolvable(grid)) {
    return false
  }
  const guessedGrid = solveByGuessing(grid, guesses)
  cloneGrid(guessedGrid, grid)
  return true
}

function solveAndPrint(grid: Grid) {
  const started = Date.now()
  solve(grid)
  const elapsed = Date.now() - started
  if (solved(grid)) {
    console.log("SOLVED in", elapsed, "ms")
    verify(grid)
    printGrid(grid)
  } else {
    console.log("GAVE UP in", elapsed, "ms")
  }
}

import * as Grids from "./testGrids"
import * as fs from "fs"
let verbose = false
//solveAndPrint(parseGrid(Grids.grid8))
solveAndPrint(parseGrid(fs.readFileSync("./input.txt", "utf-8")))
