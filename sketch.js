let shared, me;

let wordTable;

const writingTime = 10;

const chalkSounds = [];

let buttonSound, loseSound, winSound;

function preload() {
  partyConnect("wss://demoserver.p5party.org", "ana_dict");
  shared = partyLoadShared("globals");
  me = partyLoadMyShared({ letter: "" });

  wordTable = loadTable("dict.csv", "csv", "header");

  for (let i = 1; i <= 5; i++) {
    chalkSounds.push(loadSound(`audio/chalk${i}.m4a`));
  }
  buttonSound = loadSound("audio/button.mp3");
  loseSound = loadSound("audio/lose.mp3");
  winSound = loadSound("audio/win.mp3");
}

function setup() {
  noCanvas();
  partySetShared(shared, {
    word: "",
    status: "start",
    order: 0,
    messageTimer: 0,
    playTimer: writingTime,
    turn: "player1",
    players: {
      player1: {
        points: 0,
        rounds: 0,
        name: "Player 1",
      },
      player2: {
        points: 0,
        rounds: 0,
        name: "Player 2",
      },
    },
  });

  me.key = partyIsHost() ? "player1" : "player2";

  select("#start").mousePressed(startGame);
  select("#inst-start").mousePressed(startGame);

  select("#instructions").mousePressed(goToInstructions);
  select("#inst-back").mousePressed(goToStart);

  select("#nextRound").mousePressed(goToNextRound).style("display", "none");
}

function draw() {
  const currentPlayer = shared.turn;
  const previousPlayer = shared.turn === "player1" ? "player2" : "player1";

  if (partyIsHost() && shared.status === "playing") {
    if (frameCount % 60 === 0 && shared.playTimer > 0) {
      shared.playTimer--;
    }
    if (shared.playTimer === 0) {
      goToNextTurn();
    }
  }

  if (shared.status === "continue") {
    if (partyIsHost()) {
      shared.messageTimer++;
      if (shared.messageTimer > 100) {
        shared.status = "playing";
        shared.messageTimer = 0;
      }
    }
  }

  select("#word").html(shared.word + me.letter);
  select("#timer").html(shared.playTimer);

  const player = shared.status === "playing" ? currentPlayer : previousPlayer;

  const statusMessage = writeMessage(shared.players[player].name, shared.word);
  select("#status").class(shared.status).html(statusMessage);

  if (shared.status === "win" || shared.status === "lose") {
    select("#nextRound").style("display", "block");
  } else {
    select("#nextRound").style("display", "none");
  }
}

function keyPressed() {
  if (shared.turn === me.key && shared.status === "playing") {
    playChalkSound();
    if (key === "Enter") {
      goToNextTurn();
    }

    if (/^[a-zA-Z]$/.test(key)) {
      me.letter = key;
    }
  }
}

function checkWord(str) {
  const words = [];

  for (let r = 0; r < wordTable.getRowCount(); r++)
    for (let c = 0; c < wordTable.getColumnCount(); c++) {
      const word = wordTable.getString(r, c);
      if (word.startsWith(str)) {
        words.push(word);
      }
    }

  if (words.length === 0) {
    shared.players[me.key].points -= str.length;
    shared.players[me.key].rounds--;
    updateScores();
    loseSound.play();
    return "lose";
  }
  if (words.find((word) => word === str)) {
    shared.players[me.key].points += str.length;
    shared.players[me.key].rounds++;
    updateScores();
    winSound.play();
    return "win";
  }
  return "continue";
}

function writeMessage(player, word) {
  if (shared.status === "playing") {
    const turnMessage =
      me.key === shared.turn ? "It's your turn! <br> Press enter to finish." : `${player} is writing...`;
    return turnMessage;
  }
  if (shared.status === "start") {
    return "Waiting for host to start the game...";
  }
  if (shared.status === "checking") {
    return `Checking ${word}...`;
  }
  if (shared.status === "continue") {
    return `There are still words <br> that can be formed with <br> "${word}". <br> Keep going!`;
  }
  if (shared.status === "lose") {
    return `There are no words <br> that can be formed with <br> "${word}." <br> ${player} loses!`;
  }
  if (shared.status === "win") {
    return `${word} is a word! ${player} wins!`;
  }
}

function updateScores() {
  select(".player1-rounds").html(shared.players.player1.rounds);
  select(".player1-points").html(shared.players.player1.points);
  select(".player2-rounds").html(shared.players.player2.rounds);
  select(".player2-points").html(shared.players.player2.points);
}

function goToNextRound() {
  buttonSound.play();
  if (partyIsHost()) {
    shared.word = "";
    me.letter = "";
    shared.status = "playing";
  }
}

function goToNextTurn() {
  shared.word += me.letter;
  me.letter = "";
  shared.turn = partyIsHost() ? "player2" : "player1";
  if (shared.word.length > 1) {
    shared.status = "checking";
    shared.status = checkWord(shared.word);
  }
  shared.playTimer = writingTime;
}

function startGame() {
  buttonSound.play();
  if (partyIsHost()) shared.status = "playing";
  select("#instructionsScreen").style("display", "none");
  select("#startScreen").style("display", "none");
  select("#gameScreen").style("display", "block");
}

function goToStart() {
  buttonSound.play();
  if (partyIsHost()) shared.status = "start";
  select("#instructionsScreen").style("display", "none");
  select("#gameScreen").style("display", "none");
  select("#startScreen").style("display", "block");
}

function goToInstructions() {
  buttonSound.play();
  if (partyIsHost()) shared.status = "start";
  select("#instructionsScreen").style("display", "block");
  select("#gameScreen").style("display", "none");
  select("#startScreen").style("display", "none");
}

function playChalkSound() {
  const sound = random(chalkSounds);
  sound.play();
}
