'use client';
import { useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { MersenneTwister19937, pick, real } from 'random-js';

// --- AUDIO PLACEHOLDERS (Replace as needed) ---
const clickUrl = '/sounds/click.mp3'; // Place your audio in public/sounds or another accessible folder
const errorUrl = '/sounds/error.mp3';

function createAudioManager(url: string) {
  const audioArray = Array.from({ length: 10 }, () => {
    const audio = typeof Audio !== 'undefined' ? new Audio(url) : { play: () => { } }
    return audio;
  });
  let k = 0;
  return {
    play: () => {
      audioArray[k].play();
      k = (k + 1) % audioArray.length;
    },
  };
}

const clickSound = createAudioManager(clickUrl);
const errorSound = createAudioManager(errorUrl);

// --- TYPES ---
type Direction = 'top' | 'bottom' | 'left' | 'right';

interface Size {
  width: number;
  height: number;
}
interface Position {
  x: number;
  y: number;
}

interface Departure extends Position {
  type: 'departure';
  exit: Direction;
}

interface Destination extends Position {
  type: 'destination';
  entrance: Direction;
  colorIndex: number;
}

interface Track extends Position {
  type: 'track';
  entrance: Direction;
  exit: Direction;
}

interface Switch extends Position {
  type: 'switch';
  entrance: Direction;
  exit: Direction;
  otherExit: Direction;
  state: 'initial' | 'swapped';
  trainCount: number;
  mouseIsOver: boolean;
}

type Station = Departure | Destination;

type Rail = Track | Switch;

type Tile = Station | Rail;

interface Level {
  departure: Departure;
  destinationArray: Destination[];
  railArray: Rail[];
}

// --- UTILITIES ---
function createEmptyGrid<T>(size: Size) {
  return Array.from({ length: size.height }, () =>
    Array.from({ length: size.width }, () => null as T)
  );
}

function toHtmlColor(color: number) {
  return '#' + color.toString(16).padStart(6, '0');
}

function isStation(a: Tile | null): a is Station {
  return ['departure', 'destination'].includes(a?.type ?? '');
}

function isRail(a: Tile | null): a is Rail {
  return ['track', 'switch'].includes(a?.type ?? '');
}

function directionToDelta(direction: Direction) {
  return {
    bottom: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
    top: { dx: 0, dy: -1 },
  }[direction];
}

function oppositeOf(direction: Direction): Direction {
  return {
    bottom: 'top',
    left: 'right',
    right: 'left',
    top: 'bottom',
  }[direction] as Direction;
}

function isStraight(a: Direction, b: Direction) {
  let [c, d] = [a, b].sort();
  let e = c + d;
  return e === 'bottomtop' || e === 'leftright';
}

// --- THEME & COLORS ---
const defaultTheme = {
  background: 0x2d2e37,
  pavement: 0xb0b0b0,
  asphalt: 0x37383f,
  departure: 0x000000,
  switch: 0x4b494a,
  switchHover: 0x9b999a,
  switchOutline: 0xdddddd,
  scoreBackground: 0x4b494a,
  switchWithTrain: 0x000000,
  switchHoverWithTrain: 0xffffff,
};
type Theme = typeof defaultTheme;

const defaultColorList = [
  0x0088ff, // blue
  0x00ff00, // green
  0xff0000, // red
  0x00ffff, // cyan
  0xffff00, // yellow
  0xff8800, // orange
  0xff8888, // pink
  0x004488, // dark blue
  0x008800, // dark green
  0x880000, // dark red
  0x008888, // dark cyan
  0x888800, // dark yellow
  0x666666, // grey
  0xcccccc, // white-ish
  0x884444, // dark pink
];

// --- LAYOUT ---
interface Layout {
  squareWidth: number;
  stationBorder: number;
  stationMargin: number;
  squareBorder: number;
  roadWidth: number;
  interiorRoadWidth: number;
  roadHole: number;
  roadBorder: number;
  scoreHeight: number;
  switchOutlineWidth: number;
  switchRadius: number;
}

const defaultLayout: Layout = {
  squareWidth: 128,
  stationBorder: 128 / 24,
  stationMargin: 128 / 6,
  squareBorder: 128 / 16,
  roadWidth: (128 * 3) / 10,
  interiorRoadWidth: (128 * 2) / 10,
  roadHole: (128 - (128 * 3) / 10) / 2,
  roadBorder: ((128 * 3) / 10 - (128 * 2) / 10) / 2,
  scoreHeight: 50,
  switchOutlineWidth: 2,
  switchRadius: 128 / 3,
};

// --- SCORE ---
function createScore(container: HTMLElement, layout: Layout, theme: Theme) {
  let totalCount = 0;
  let goodCount = 0;

  const getScoreText = () => {
    let difference = totalCount - goodCount;
    let text = `${goodCount} / ${totalCount} (-${difference})`;
    return text;
  };
  const getAssessment = () => {
    let assessment = '';
    let difference = totalCount - goodCount;
    if (difference === 0) {
      assessment = `Perfect score!`;
    } else if (difference <= 2) {
      assessment = `Level complete!`;
    }
    return assessment;
  };

  let scoreSpan = document.createElement('span');
  scoreSpan.style.position = 'fixed';
  scoreSpan.style.padding = '3px 15px';
  scoreSpan.style.height = `${layout.scoreHeight}px`;
  scoreSpan.style.backgroundColor = toHtmlColor(theme.scoreBackground);
  scoreSpan.style.fontSize = `${layout.scoreHeight}px`;
  scoreSpan.style.userSelect = 'none';
  scoreSpan.textContent = getScoreText();

  container.appendChild(scoreSpan);

  return {
    showScore: () => {
      let div = document.createElement('div');
      div.style.position = 'fixed';
      div.style.top = '50%';
      div.style.left = '50%';
      div.style.transform = 'translate(-50%, -50%)';
      div.style.fontSize = '80px';
      div.style.textAlign = 'center';
      div.style.padding = '15px 75px';
      div.style.backgroundColor = toHtmlColor(theme.scoreBackground);
      div.style.border = 'solid 10px #808080';
      div.style.userSelect = 'none';

      let d1 = document.createElement('div');
      d1.textContent = 'Score:';

      let d2 = document.createElement('div');
      d2.textContent = getScoreText();

      let d3 = document.createElement('div');
      d3.textContent = getAssessment();

      div.appendChild(d1);
      div.appendChild(d2);
      div.appendChild(d3);

      container.appendChild(div);
    },
    scoreEvent(isGoodEvent: boolean) {
      totalCount += 1;
      if (isGoodEvent) {
        goodCount += 1;
      }
      scoreSpan.textContent = getScoreText();
    },
  };
}
type Score = ReturnType<typeof createScore>;

// --- SKETCH ---
function createSketcher(layout: Layout, theme: Theme, showColorIndices: boolean) {
  const text = (textContent: string, fontSize: number) => {
    return new PIXI.Text(textContent, {
      fontFamily: 'Arial',
      fontSize,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowDistance: 0,
      dropShadowBlur: 2,
    });
  };

  const roadTurn = () => {
    let g = new PIXI.Graphics();
    g.moveTo(0, 0);
    // Road turn exterior
    g.beginFill(theme.pavement);
    g.arc(0, 0, layout.roadHole + layout.roadWidth, 0, Math.PI / 2, false);
    g.endFill();
    // hole
    g.beginHole();
    g.moveTo(0, 0);
    g.arc(0, 0, layout.roadHole, 0, Math.PI / 2 - 0.0001, false);
    g.endHole();

    g.moveTo(0, 0);
    g.beginFill(theme.asphalt);
    g.arc(
      0,
      0,
      layout.roadHole + layout.roadBorder + layout.interiorRoadWidth,
      0,
      PIXI.PI_2 / 4,
      false
    );
    g.endFill();
    g.beginHole();
    g.moveTo(0, 0);
    g.arc(0, 0, layout.roadHole, 0, PIXI.PI_2 / 4, false);
    g.endHole();

    g.moveTo(0, 0);
    g.beginFill(theme.pavement);
    g.arc(0, 0, layout.roadHole + layout.roadBorder, 0, PIXI.PI_2 / 4, false);
    g.endFill();
    g.beginHole();
    g.moveTo(0, 0);
    g.arc(0, 0, layout.roadHole, 0, PIXI.PI_2 / 4, false);
    g.endHole();
    return g;
  };

  const road = () => {
    let g = new PIXI.Graphics();
    g.beginFill(theme.pavement);
    g.drawRect(0, layout.roadHole, layout.squareWidth, layout.roadWidth);
    g.endFill();

    g.beginFill(theme.asphalt);
    g.drawRect(
      0,
      layout.roadHole + layout.roadBorder,
      layout.squareWidth,
      layout.interiorRoadWidth
    );
    g.endFill();
    return g;
  };

  const getColorFromList = (colorIndex: number, colorList: number[]) => {
    return colorList[colorIndex % colorList.length];
  };

  const station = (station: Station, colorIndex: number, colorList: number[]) => {
    let direction: Direction;
    if (station.type === 'departure') {
      direction = station.exit;
    } else {
      direction = station.entrance;
    }

    let { squareWidth, squareBorder, stationMargin } = layout;

    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawRect(
      stationMargin,
      stationMargin,
      squareWidth - 2 * stationMargin,
      squareWidth - 2 * stationMargin
    );
    g.beginFill(getColorFromList(colorIndex, colorList));
    g.drawRect(
      stationMargin + squareBorder,
      stationMargin + squareBorder,
      squareWidth - 2 * (stationMargin + squareBorder),
      squareWidth - 2 * (stationMargin + squareBorder)
    );
    g.endFill();

    let { dx, dy } = directionToDelta(direction);

    let h = new PIXI.Container();
    h.x += stationMargin * dx;
    h.y += stationMargin * dy;
    h.addChild(g);

    if (showColorIndices) {
      let textContent = colorIndex.toString(16).toUpperCase();
      let j = text(textContent, squareWidth / 4);
      j.x += 0.52 * squareWidth - 0.08 * squareWidth * textContent.length;
      j.y += 0.38 * squareWidth;
      h.addChild(j);
    }

    return h;
  };

  const train = (colorIndex: number, colorList: number[]) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawCircle(layout.squareWidth / 2, layout.squareWidth / 2, layout.roadWidth / 2);
    g.beginFill(getColorFromList(colorIndex, colorList));
    g.drawCircle(layout.squareWidth / 2, layout.squareWidth / 2, layout.interiorRoadWidth / 2);
    g.endFill();
    let h = new PIXI.Container();
    h.addChild(g);

    if (showColorIndices) {
      let textContent = colorIndex.toString(16).toUpperCase();
      let j = text(textContent, layout.squareWidth / 7);
      j.x += 0.53 * layout.squareWidth - 0.06 * layout.squareWidth * textContent.length;
      j.y += 0.42 * layout.squareWidth;
      h.addChild(j);
    }
    return h;
  };

  const switchCircle = (g: PIXI.Graphics, circleColor: number) => {
    g.clear();
    g.beginFill(theme.switchOutline);
    g.drawCircle(layout.squareWidth / 2, layout.squareWidth / 2, layout.switchRadius);
    g.beginFill(circleColor);
    g.drawCircle(
      layout.squareWidth / 2,
      layout.squareWidth / 2,
      layout.switchRadius - layout.switchOutlineWidth
    );
    g.endFill();
  };

  return {
    roadTurn,
    road,
    station,
    train,
    switchCircle,
  };
}
type Sketcher = ReturnType<typeof createSketcher>;

// --- GENERATION LOGIC (SIMPLIFIED) ---
// We'll just rely on the existing generator code as is:
class GeneratorAbortionError extends Error { }

function distance2(a: Position, b: Position) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}
function distance(a: Position, b: Position) {
  return Math.sqrt(distance2(a, b));
}
function positionEqual(a: Position, b: Position) {
  return a.x === b.x && a.y === b.y;
}

function nextTile(tile: Tile, direction: Direction, grid: (Tile | null)[][]) {
  let { dx, dy } = directionToDelta(direction);
    if (!grid[tile.y + dy]) {
    throw new Error("Next tile is out of bounds");
  }
  let next = grid[tile.y + dy][tile.x + dx];
  if (!next) {
    throw new Error('never, null tile');
  }
  return next;
}

function trackIsTooLinear(
  departure: Departure,
  grid: (Tile | null)[][],
  maximumTrackLength: number
) {
  let tile = nextTile(departure, departure.exit, grid);
  if (!isRail(tile)) {
    throw new Error('never, not rail tile');
  }
  return longestTrack(tile, grid) > maximumTrackLength;
}

function longestTrack(tile: Tile, grid: (Tile | null)[][]): number {
  if (!isRail(tile)) {
    return 0;
  }
  if (tile.type === 'track') {
    return 1 + longestTrack(nextTile(tile, tile.exit, grid), grid);
  }
  return (
    1 +
    Math.max(
      longestTrack(nextTile(tile, tile.exit, grid), grid),
      longestTrack(nextTile(tile, tile.otherExit, grid), grid)
    )
  );
}

// Simple railway connection logic
function moveDirectionArray(from: Position, to: Position): Direction[] {
  const vector = { x: to.x - from.x, y: to.y - from.y };
  let directionArray: Direction[] = [];
  const topBottom = () => {
    if (vector.y <= 0) {
      directionArray.push('top');
    }
    if (vector.y >= 0) {
      directionArray.push('bottom');
    }
  };

  const leftRight = () => {
    if (vector.x <= 0) {
      directionArray.push('left');
    }
    if (vector.x >= 0) {
      directionArray.push('right');
    }
  };

  if (Math.abs(vector.y) >= Math.abs(vector.x)) {
    topBottom();
    leftRight();
  } else {
    leftRight();
    topBottom();
  }
  return directionArray;
}

function railwayConnection(grid: (Tile | null)[][], start: Tile, destination: Tile) {
    let railway: Rail[] = [];
    let entrance = '<direction to be determined>' as Direction;

    let cursor = { x: destination.x, y: destination.y };
    let target = { x: start.x, y: start.y };
    let track: Track | null = null;

    // We'll use a random approach:
    const tryDirections = () => {
        let arr = moveDirectionArray(cursor, target);
        return arr.filter((direction) => {
            if (direction === track?.exit) {
                return false;
            }
            let { dx, dy } = directionToDelta(direction);
           
             if(!grid[cursor.y + dy]) {
               return false
             }
            let tile = grid[cursor.y + dy][cursor.x + dx];

            if (cursor.x + dx === target.x && cursor.y + dy === target.y) {
                return true;
            }
            if (tile === undefined) {
                return false;
            }
           
            if (tile === null) {
               return true;
             }
             if(tile.type === 'track' && (tile.x !== target.x || tile.y !== target.y)){
                return true
             }
            return false;
        });
    };


    const CURSOR_LOOP_LIMIT = 300;
    for (let k = 0; k < CURSOR_LOOP_LIMIT; k++) {
        let validDirections = tryDirections();

         if (validDirections.length === 0) {
              throw new GeneratorAbortionError('cannot find a direction to continue the track');
          }
         
        let direction = validDirections[0];

        if (k > 0) {
            railway.slice(-1)[0].entrance = direction;
        } else {
            entrance = direction;
        }

        let { dx, dy } = directionToDelta(direction);
        let nextX = cursor.x + dx;
        let nextY = cursor.y + dy;

        if (positionEqual({x:nextX, y:nextY}, target) || grid[nextY][nextX]?.type === 'track') {
             return { railway, entrance, exit: oppositeOf(direction) };
        }

        if(grid[nextY][nextX] !== null){
            throw new GeneratorAbortionError("Can not build the track on existing tiles.");
        }

        cursor.x += dx;
        cursor.y += dy;


        track = {
            type: 'track',
            entrance: '<direction to be determined>' as Direction,
            exit: oppositeOf(direction),
            x: cursor.x,
            y: cursor.y,
        };
        railway.push(track);
    }
    throw new Error('reached the loop limit');
}


interface GeneratorConfig {
  randomEngine: MersenneTwister19937;
  gridSize: Size;
  retryCount: number;
  stationCount: number;
  departureClearance: number;
}

function generate(config: GeneratorConfig): Level {
  for (let k = 0; ; k++) {
    try {
      return coreGenerate(config);
    } catch (e) {
      if (e instanceof GeneratorAbortionError && k < config.retryCount) {
        continue;
      }
      throw e;
    }
  }
}

function coreGenerate(config: GeneratorConfig): Level {
    let grid = createEmptyGrid<Tile | null>(config.gridSize);

    function randomDeparture(): Departure {
        const xPicker = pick(config.randomEngine, [0, config.gridSize.width - 1]);
        const yPicker = pick(config.randomEngine, [1, config.gridSize.height - 2]);
        return {
            type: 'departure',
            x: xPicker,
            y: yPicker,
            exit: 'right', // will be determined below
        };
    }

    let departure = randomDeparture();

    // Place stations at edges
    let destinationArray: Destination[] = [];
    for (let k = 0; k < config.stationCount; k++) {
        let x = k + 1;
        let y = config.gridSize.height - 2;
        if (x >= config.gridSize.width - 1) {
            x = config.gridSize.width - 2;
        }
        const d: Destination = { type: 'destination', x, y, entrance: 'top', colorIndex: k };
        destinationArray.push(d);
        grid[y][x] = d;
    }

    let railArray: Rail[] = [];

    const addRailway = (r: Rail[]) => {
        railArray.push(...r);
        r.forEach((rail) => {
            grid[rail.y][rail.x] = rail;
        });
    };

    // Connect first destination
    let { railway: rw1, exit: exit1, entrance: entrance1 } = railwayConnection(
        grid,
        departure,
        destinationArray[0]
    );
    addRailway(rw1);
    destinationArray[0].entrance = entrance1;
    departure.exit = exit1;


    // Connect other stations
    for (let i = 1; i < destinationArray.length; i++) {
      let reachableRailArray = railArray.filter((r) => r.type === 'track');
      let closest = reachableRailArray.reduce((acc, track) => {
        let val = distance2(track, destinationArray[i]);
        if (val < distance2(acc, destinationArray[i])) return track;
        return acc;
      }, reachableRailArray[0]);

      let connectionResult;

      try {
         connectionResult = railwayConnection(grid, closest, destinationArray[i])
      } catch (e) {
        if (e instanceof GeneratorAbortionError) {
            throw e;
        }
        throw new Error('railway connection failed without throwing abort');
      }         connectionResult = railwayConnection(grid, closest, destinationArray[i])


      let { railway, exit, entrance } = connectionResult;
        addRailway(railway);
      destinationArray[i].entrance = entrance;

      if (railway.length === 0) {
         throw new GeneratorAbortionError("Railway is empty");
      }
        // convert junction to switch
        let lastTrack = railway.slice(-1)[0];
        if(!lastTrack) {
            throw new Error('lastTrack is undefined. this should never occur')
        }
        let { x, y } = lastTrack;
        let { dx, dy } = directionToDelta(entrance);

        if(!grid[y+dy]){
              throw new GeneratorAbortionError(`Grid y out of bounds`);
        }
        if(!grid[y+dy][x+dx]){
             throw new GeneratorAbortionError(`Grid x out of bounds at ${x + dx}, ${y + dy}`);
        }
         if(grid[y + dy][x + dx]?.type !== null && grid[y + dy][x + dx] !== undefined) {
            throw new GeneratorAbortionError(`The grid is not null at ${x + dx}, ${y + dy} its ${grid[y + dy][x+dx]?.type}`);
         }
        let junction:Switch = {
           type: 'switch',
           x: x + dx,
           y: y + dy,
           entrance,
           exit: exit as Direction,
           otherExit: exit,
           trainCount:0,
           mouseIsOver: false,
           state:'initial'
         }
         grid[y + dy][x + dx] = junction;


  }


  if (trackIsTooLinear(departure, grid, config.gridSize.width + config.gridSize.height - 3)) {
    throw new GeneratorAbortionError('track is too linear');
  }

  return {
    departure,
    destinationArray,
    railArray,
  };

}
// --- TRAIN LOGIC ---
interface TrackOfThoughtConfig {
  autoPlay: boolean;
  autoPlayOnEntry: boolean;
  autoPlayOnExit: boolean;
  colorList: string;
  departureClearance: number;
  device: string;
  duration: number;
  gamePlay: 'station' | 'switch';
  generateRetryCount: number;
  gridHeight: number;
  gridWidth: number;
  layout: string;
  level: number;
  seed: number;
  stationSeed: number;
  trainSeed: number;
  showColorIndices: boolean;
  stationCount: number;
  theme: string;
  trainCount: number;
}

interface TrainManagerParam {
  colorList: number[];
  config: TrackOfThoughtConfig;
  container: PIXI.Container;
  departure: Departure;
  destinationArray: Destination[];
  graphicalGrid: (PIXI.Container | null)[][];
  grid: (Tile | null)[][];
  layout: Layout;
  onGameEnd: () => void;
  randomEngine: MersenneTwister19937;
  score: Score;
  sketch: Sketcher;
  updateSwitchColor: (x: number, y: number) => void;
  toggleSwitch: (g: PIXI.Container, rail: Switch) => void;
    smartSwitchGrid: ('initial' | 'swapped' | null)[][];
}

function createTrainManager(param: TrainManagerParam) {
  const {
    colorList,
    config,
    container,
    departure,
    destinationArray,
    grid,
    layout,
    randomEngine,
    score,
    sketch,
    updateSwitchColor,
    smartSwitchGrid,
      toggleSwitch,
    graphicalGrid
  } = param;

  let trainArray: ReturnType<typeof createTrain>[] = [];
  let trainPeriod = config.duration / config.trainCount;
  let trainTime = 0;
  let sentTrainCount = 0;
  let over = false;

  const addTrain = () => {
    while (sentTrainCount < config.trainCount && trainTime >= trainPeriod) {
      trainTime -= trainPeriod;
      const cIndex = pick(randomEngine, destinationArray).colorIndex;
      let train = createTrain({
        autoPlayOnEntry: config.autoPlayOnEntry,
        autoPlayOnExit: config.autoPlayOnExit,
        colorIndex: cIndex,
        colorList,
        gamePlay: config.gamePlay,
        graphicalGrid,
        grid,
        layout,
        position: departure,
        score,
        sketch,
        smartSwitchGrid,
        toggleSwitch,
        updateSwitchColor,
      });
      container.addChild(train.g);
      trainArray.push(train);
      train.progress += trainTime;
      sentTrainCount += 1;
    }
  };

  return {
    update(timeStep: number) {
      trainTime += timeStep / 60;
      addTrain();
      trainArray = trainArray.filter((train) => {
        if (!train.running) {
          if (config.gamePlay === 'station') {
            score.scoreEvent(train.colorMatchesStation());
          }
          container.removeChild(train.g);
          train.g.destroy();
          return false;
        }
        return true;
      });
      trainArray.forEach((train) => {
        train.update(timeStep);
      });
      if (sentTrainCount === config.trainCount && trainArray.length === 0 && !over) {
        over = true;
        param.onGameEnd();
      }
    },
  };
}

interface TrainParam {
  autoPlayOnEntry: boolean;
  autoPlayOnExit: boolean;
  colorIndex: number;
  colorList: number[];
  gamePlay: 'station' | 'switch';
  graphicalGrid: (PIXI.Container | null)[][];
  grid: (Tile | null)[][];
  layout: Layout;
  position: Position;
  score: Score;
  sketch: Sketcher;
    smartSwitchGrid: ('initial' | 'swapped' | null)[][];
    toggleSwitch: (g: PIXI.Container, rail: Switch) => void;
  updateSwitchColor: (x: number, y: number) => void;
}

function createTrain(param: TrainParam) {
  let position = { ...param.position };
  let {
    autoPlayOnEntry,
    autoPlayOnExit,
    colorIndex,
    colorList,
    gamePlay,
    graphicalGrid,
    grid,
    layout,
    score,
    sketch,
    smartSwitchGrid,
      toggleSwitch,
    updateSwitchColor,
  } = param;

  let g = sketch.train(colorIndex, colorList);

  let me = {
    g,
    running: true,
    progress: 0.5,
    colorIndex,
    update,
    colorMatchesStation,
  };

  function next() {
    let { x, y } = position;
    let track = grid[y][x];
    if (!track) {
      throw new Error(`encountered a null entry in the grid, at ${y}:${x}`);
    }
    if (track.type === 'destination') {
      throw new Error('never, destination');
    }

    let { dx, dy } = directionToDelta(track.exit);
    position.x += dx;
    position.y += dy;
  }

  function bumpSwitchTrainCount(amount: number) {
    let { x, y } = position;
    let tile = grid[y][x];
    if (tile?.type === 'switch') {
      tile.trainCount += amount;
      updateSwitchColor(x, y);
    }
  }

  function setSwitch(weak = false) {
      let { x, y } = position;
      let tile = grid[y][x];

      if (tile?.type !== 'switch') {
          return false;
      }

      let smartSwitch = smartSwitchGrid[y][x];


      if(smartSwitch === null && !weak){
        return false;
      }
      if (smartSwitch === null) {
          return false;
      }
      if (tile.state === smartSwitch) {
          return false;
      }

      let graphicalSwitch = graphicalGrid[y][x];
      toggleSwitch(graphicalSwitch!, tile);
      return true;
  }

  function updatePosition() {
    g.x = layout.squareWidth * position.x;
    g.y = layout.squareWidth * position.y;

    let tile = grid[position.y][position.x]!;

    let entrance: Direction;
    let exit: Direction;
    if (isRail(tile)) {
      entrance = tile.entrance;
      exit = tile.exit;
    } else if (tile.type === 'departure') {
      exit = tile.exit;
      entrance = oppositeOf(exit);
    } else if (tile.type === 'destination') {
      entrance = tile.entrance;
      exit = oppositeOf(entrance);
    } else {
      throw new Error('never');
    }

    if (isStraight(entrance, exit)) {
      if (exit === 'right') {
        g.x += (me.progress - 0.5) * layout.squareWidth;
      } else if (exit === 'left') {
        g.x += (0.5 - me.progress) * layout.squareWidth;
      } else if (exit === 'bottom') {
        g.y += (me.progress - 0.5) * layout.squareWidth;
      } else if (exit === 'top') {
        g.y += (0.5 - me.progress) * layout.squareWidth;
      }
    } else {
      let from = ((Math.sin((me.progress * Math.PI) / 2) - 1) * layout.squareWidth) / 2;
      let to = ((Math.cos((me.progress * Math.PI) / 2) - 1) * layout.squareWidth) / 2;
      if (entrance === 'top') g.y += from;
      if (entrance === 'left') g.x += from;
      if (entrance === 'right') g.x -= from;
      if (entrance === 'bottom') g.y -= from;

      if (exit === 'top') g.y += to;      if (exit === 'left') g.x += to;
      if (exit === 'right') g.x -= to;
      if (exit === 'bottom') g.y -= to;
    }
  }

  function colorMatchesStation() {
    let s = grid[position.y][position.x];
    if (!s || !isStation(s)) {
      throw new Error('train is not at a station');
    }
    return me.colorIndex === (s as any).colorIndex;
  }

  function update(timeStep: number) {
    me.progress += timeStep / 80;
    if (me.progress > 1) {
        if (autoPlayOnExit || gamePlay === 'switch') {
          let hasChanged = setSwitch();
           if (gamePlay === 'switch') {
             let {x,y} = position;
             let tile = grid[y][x]
            if(tile?.type === 'switch'){
              score.scoreEvent(!hasChanged);
            }
          }
        }
      bumpSwitchTrainCount(-1);
      while (me.progress > 1) {
        next();
        me.progress -= 1;
      }
      bumpSwitchTrainCount(1);
       if (autoPlayOnEntry) {
        setSwitch(true);
      }
    }
    updatePosition();
    if (grid[position.y][position.x]?.type === 'destination' && me.progress >= 0.5) {
      me.running = false;
    }
  }

  update(0);
  return me;
}

// --- GAME SETUP ---
function setupGame(config: TrackOfThoughtConfig, theme: Theme) {
  const showColorIndices = config.showColorIndices;
  const layout = defaultLayout;

  document.body.classList.add('gamemode');
  const sketch = createSketcher(layout, theme, showColorIndices);

  let colorList = config.colorList.split(',').map((w) => parseInt(w, 16));
  if (colorList.length < config.stationCount) {
    const colorSet = new Set(colorList);
    defaultColorList.forEach((color) => {
      if (!colorSet.has(color)) {
        colorList.push(color);
        colorSet.add(color);
      }
    });
  }

  const level = generate({
    gridSize: { height: config.gridHeight, width: config.gridWidth },
    randomEngine: MersenneTwister19937.seed(config.stationSeed),
    stationCount: config.stationCount,
    retryCount: config.generateRetryCount,
    departureClearance: config.departureClearance,
  });

  const grid = (() => {
    let g = createEmptyGrid<Tile | null>({ width: config.gridWidth, height: config.gridHeight });
    g[level.departure.y][level.departure.x] = level.departure;
    level.railArray.forEach((track) => {
      g[track.y][track.x] = track;
    });
    level.destinationArray.forEach((station) => {
      g[station.y][station.x] = station;
    });
    return g;
  })();

  const onGameEnd = () => {
      interativeGraphicalSwitchArray.forEach((g) => {
         g.interactive = false;
      });
    score.showScore();
  };

  const score = createScore(document.body, layout, theme);

  const graphicalGrid = createEmptyGrid<PIXI.Container | null>({
    width: config.gridWidth,
    height: config.gridHeight,
  });

   const smartSwitchGrid = createEmptyGrid<'initial' | 'swapped' | null>({
    width: config.gridWidth,
    height: config.gridHeight,
  });


  let app = new PIXI.Application({
    antialias: true,
    resizeTo: window,
    background: theme.background,
  });
  let canvas = app.view as HTMLCanvasElement;
  setTimeout(() => {
    canvas.classList.add('visible');
  }, 0);
  document.body.appendChild(canvas);

  let gameContainer = new PIXI.Container();
  let railContainer = new PIXI.Container();
  let trainContainer = new PIXI.Container();
  let stationContainer = new PIXI.Container();

  gameContainer.y += layout.scoreHeight + 6;

  const addPosition = (g: PIXI.Container, position: Position) => {
    g.x += layout.squareWidth * position.x;
    g.y += layout.squareWidth * position.y;
    return g;
  };

  // Draw Start
  {
    let g = sketch.station(level.departure, 0, [theme.departure]);
    addPosition(g, level.departure);
    stationContainer.addChild(g);
    graphicalGrid[level.departure.y][level.departure.x] = g;
  }

  // Draw destination stations
  level.destinationArray.forEach((station, k) => {
    let g = sketch.station(station, k, colorList);
    addPosition(g, station);
      graphicalGrid[station.y][station.x] = g;
    stationContainer.addChild(g);
  });

  const drawTrack = (start: Direction, end: Direction) => {
    if (start === end) {
      throw new Error(`encountered equal start and end (${start})`);
    }
    if (isStraight(start, end)) {
      let result = sketch.road();
      if ([start, end].includes('top')) {
        result.rotation = Math.PI / 2;
        result.x += layout.squareWidth;
      }
      return result;
    } else {
      let turn = sketch.roadTurn();
      let [c, d] = [start, end].sort();
      if (c + d === 'righttop') {
        turn.rotation = Math.PI / 2;
        turn.x += layout.squareWidth;
      } else if (c + d === 'bottomright') {
        turn.rotation = Math.PI;
        turn.x += layout.squareWidth;
        turn.y += layout.squareWidth;
      } else if (c + d === 'bottomleft') {
        turn.rotation = -Math.PI / 2;
        turn.y += layout.squareWidth;
      }
      return turn;
    }
  };

  let drawSwitch = (track: Switch) => {
    let result = new PIXI.Container();
    result.addChild(drawTrack(track.entrance, track.otherExit));
    let g = new PIXI.Graphics();
    sketch.switchCircle(g, theme.switch);
    result.addChild(g);
    result.addChild(drawTrack(track.entrance, track.exit));
    return result;
  };

  const toggleSwitch = (g: PIXI.Container, rail: Switch) => {
    rail.state = rail.state === 'initial' ? 'swapped' : 'initial';
      ;[rail.exit, rail.otherExit] = [rail.otherExit, rail.exit];
      let h: any = g;
       [h.children[0], h.children[2]] = [h.children[2], h.children[0]];
      clickSound.play()
  };

    const updateSwitchColor = (x: number, y: number) => {
    let rail = grid[y][x];
    if (rail?.type !== 'switch') {
      throw new Error('never, switch');
    }
      let color = theme.switch;
    if (rail.mouseIsOver) {
        if(rail.trainCount > 0){
           color = theme.switchHoverWithTrain
        }else{
             color = theme.switchHover
        }
    } else if (rail.trainCount > 0){
           color = theme.switchWithTrain
    }
    let g = graphicalGrid[y][x];
    sketch.switchCircle(g?.children[1] as PIXI.Graphics, color);
  };

  let interativeGraphicalSwitchArray: PIXI.Container[] = [];
  const makeSwitchInteractive = (g: PIXI.Container, rail: Switch) => {
    g.interactive = true;
    interativeGraphicalSwitchArray.push(g);
    g.hitArea = new PIXI.Circle(
      layout.squareWidth / 2,
      layout.squareWidth / 2,
      layout.squareWidth / 2
    );
    let toggle = () => toggleSwitch(g, rail);
    g.on('mousedown', toggle);
    g.on('tap', toggle);
    g.on('mouseover', () => {
      canvas.style.cursor = 'pointer';
      rail.mouseIsOver = true;
      updateSwitchColor(rail.x, rail.y);
    });
    g.on('mouseout', () => {
      canvas.style.cursor = 'inherit';
      rail.mouseIsOver = false;
      updateSwitchColor(rail.x, rail.y);
    });
  };

    level.railArray.map((track) => {
    let g: PIXI.Container;
    if (track.type === 'switch') {
      g = drawSwitch(track);
        makeSwitchInteractive(g, track);
        smartSwitchGrid[track.y][track.x] = track.state;
    } else {
      g = drawTrack(track.entrance, track.exit!);
        smartSwitchGrid[track.y][track.x] = null;
    }
    addPosition(g, track);
    graphicalGrid[track.y][track.x] = g;
    railContainer.addChild(g);
    });

  let speedFactor = 1;
  window.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      speedFactor = 3;
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.key === ' ') {
      speedFactor = 1;
    }
  });

  app.stage.addChild(gameContainer);
  gameContainer.addChild(railContainer);
  gameContainer.addChild(trainContainer);
  gameContainer.addChild(stationContainer);

  let trainManager = createTrainManager({
    colorList,
    config,
    container: trainContainer,
    departure: level.departure,
    destinationArray: level.destinationArray,
    graphicalGrid,
    grid,
    layout,
    onGameEnd,
    randomEngine: MersenneTwister19937.seed(config.trainSeed),
    score,
    sketch,
     smartSwitchGrid,
    toggleSwitch,
     updateSwitchColor,
  });

  let lastTime = Date.now();
  const loop = () => {
    let elapsedTime = Date.now() - lastTime;
    lastTime += elapsedTime;
    let clampedTime = Math.min(1, elapsedTime / 20);
    trainManager.update(speedFactor * clampedTime);
    requestAnimationFrame(loop);
  };
  loop();
}

// --- MAIN COMPONENT ---
export default function HomePage() {
    const [isGameLoaded, setGameLoaded] = useState(false);
    const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (!isGameLoaded) {
            // Static config
          const config: TrackOfThoughtConfig = {
                autoPlay: true,
                autoPlayOnEntry: true,
                autoPlayOnExit: true,
                colorList: defaultColorList
                  .map((c) => c.toString(16).padStart(6, '0'))
                  .join(','),
                departureClearance: 3,
                device: 'desktop',
                duration: 100,
                gamePlay: 'switch',
                generateRetryCount: 2000,
                gridHeight: 6,
                gridWidth: 8,
                layout: '', // not used
                level: 3,
                seed: Math.floor(Math.random() * 2 ** 32),
                stationSeed: Math.floor(Math.random() * 2 ** 32),
                trainSeed: Math.floor(Math.random() * 2 ** 32),
                showColorIndices: false,
                stationCount: 3,
                theme: Object.entries(defaultTheme)
                    .map(([k, v]) => `${k}:${v.toString(16)}`)
                    .join(','),
                trainCount: 20,
          };

          let theme: Theme = { ...defaultTheme };

          document.documentElement.style.backgroundColor = toHtmlColor(theme.background);
          setupGame(config, theme);
            setGameLoaded(true);
      }

      return () => {
            document.body.classList.remove('gamemode');
            const canvas = document.querySelector('canvas');
            if (canvas) {
                document.body.removeChild(canvas);
            }

           if(gameRef.current){
               gameRef.current.innerHTML = '';
           }
      }
  }, [isGameLoaded]);

  return (
      <div ref={gameRef} className='relative w-screen h-screen overflow-hidden'>
      <style jsx global>{`
        html {
            background-color: black;
            color: #c7b59d;
            font-family: Arial, Helvetica, sans-serif;
          margin: 0;
          padding: 0;
        }

          body {
          margin: 0;
          padding: 0;
        }

        body.gamemode {
          overflow: hidden;
        }

          canvas {
          opacity: 0;
        }

        canvas.visible {
          opacity: 1;
          transition: opacity 0.7s;
        }
      `}</style>
        {/* The game will render into the body */}
    </div>
  );
}