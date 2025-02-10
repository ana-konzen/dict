let shared, me, guests;

let wordTable;

function preload() {
  partyConnect("wss://demoserver.p5party.org", "ana_dict");
  shared = partyLoadShared("globals", { word: "", status: "start", order: 0, timer: 0 });
  me = partyLoadMyShared({ letter: "" });
  guests = partyLoadGuestShareds();

  wordTable = loadTable("dict.csv", "csv", "header");
}

function setup() {
  noCanvas();
  partySetShared(shared, { word: "", status: "start", order: 0, timer: 0 });
  shared.players = {
    player1: {
      points: 0,
      rounds: 0,
      index: "1",
    },
    player2: {
      points: 0,
      rounds: 0,
      index: "2",
    },
  };

  if (partyIsHost()) {
    me.turn = true;
    me.key = "player1";
  } else {
    me.turn = false;
    me.key = "player2";
  }

  select("#start").mousePressed(startGame);
  select("#inst-start").mousePressed(startGame);

  select("#instructions").mousePressed(goToInstructions);
  select("#inst-back").mousePressed(goToStart);

  select("#nextRound").mousePressed(goToNextRound).style("display", "none");
}

function draw() {
  let currentPlayer;
  let previousPlayer;

  guests.forEach((guest) => {
    if (guest.turn) {
      currentPlayer = guest;
    } else {
      previousPlayer = guest;
    }
  });

  if (shared.status === "continue") {
    shared.timer++;
    if (shared.timer > 100) {
      shared.status = "playing";
      shared.timer = 0;
    }
  }

  select("#word").html(shared.word + me.letter);

  const player = shared.status === "playing" ? currentPlayer : previousPlayer;

  const statusMessage = writeMessage(player, shared.word);
  select("#status").class(shared.status).html(statusMessage);

  if (shared.status === "win" || shared.status === "lose") {
    select("#nextRound").style("display", "block");
  } else {
    select("#nextRound").style("display", "none");
  }
}

function keyPressed() {
  if (me.turn && shared.status === "playing") {
    if (key === "Enter") {
      shared.word += me.letter;
      me.turn = false;
      me.letter = "";
      shared.order++;
      guests[shared.order % guests.length].turn = true;
      if (shared.word.length > 1) {
        shared.status = "checking";
        shared.status = checkWord(shared.word);
      }
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
    return "lose";
  }
  if (words.find((word) => word === str)) {
    shared.players[me.key].points += str.length;
    shared.players[me.key].rounds++;
    updateScores();
    return "win";
  }
  return "continue";
}

function writeMessage(player, word) {
  if (shared.status === "playing") {
    const turnMessage = me.turn
      ? "It's your turn! <br> Press enter to finish."
      : `Player ${guests.indexOf(player) + 1} is typing...`;
    return turnMessage;
  }
  if (shared.status === "checking") {
    return `Checking ${word}...`;
  }
  if (shared.status === "continue") {
    return `There are still words that can be formed with ${word}. Keep going!`;
  }
  if (shared.status === "lose") {
    return `There are no words that can be formed with ${word}. Player ${guests.indexOf(player) + 1} loses!`;
  }
  if (shared.status === "win") {
    return `${word} is a word! Player ${guests.indexOf(player) + 1} wins!`;
  }
}

function updateScores() {
  select(".player1-rounds").html(shared.players.player1.rounds);
  select(".player1-points").html(shared.players.player1.points);
  select(".player2-rounds").html(shared.players.player2.rounds);
  select(".player2-points").html(shared.players.player2.points);
}

function goToNextRound() {
  shared.word = "";
  me.letter = "";
  shared.status = "playing";
}

function startGame() {
  shared.status = "playing";
  select("#instructionsScreen").style("display", "none");
  select("#startScreen").style("display", "none");
  select("#gameScreen").style("display", "block");
}

function goToStart() {
  shared.status = "start";
  select("#instructionsScreen").style("display", "none");
  select("#gameScreen").style("display", "none");
  select("#startScreen").style("display", "block");
}

function goToInstructions() {
  shared.status = "start";
  select("#instructionsScreen").style("display", "block");
  select("#gameScreen").style("display", "none");
  select("#startScreen").style("display", "none");
}
