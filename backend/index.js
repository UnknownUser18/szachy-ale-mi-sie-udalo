const http = require("http");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const server = http.createServer();
const wss = new WebSocketServer({ server });

const users = new Map();
const clients = new Map();

const pendingInvites = new Map();
const activeGames = new Map();

const randomUsername = () => {
  const adjectives = [
    "Sleepy",
    "Curious",
    "Clever",
    "Swift",
    "Mighty",
    "Peaceful",
    "Mystic",
    "Radiant",
    "Silent",
    "Wise",
  ];
  const nouns = [
    "Panda",
    "Tiger",
    "Owl",
    "Dolphin",
    "Lion",
    "Bear",
    "Fox",
    "Hawk",
  ];
  return `${adjectives[(Math.random() * adjectives.length) | 0]}${
    nouns[(Math.random() * nouns.length) | 0]
  }${(Math.random() * 100) | 0}`;
};

const standarizeData = (method, data) => JSON.stringify({ method, data });

function findClientByUserId(userId) {
  for (const [client, id] of clients.entries()) {
    if (id === userId) return client;
  }
  return null;
}

function handleGameInvite(fromUserId, toUserId, gameAttributes) {
  const fromUser = users.get(fromUserId);
  const toUser = users.get(toUserId);

  if (!fromUser || !toUser || fromUser.inGame || toUser.inGame) {
    const client = findClientByUserId(fromUserId);
    client?.send(standarizeData("error", { message: "Cannot send invite" }));
    return;
  }

  const inviteId = crypto.randomBytes(4).toString("hex");
  pendingInvites.set(inviteId, { fromUserId, toUserId, gameAttributes });

  const toClient = findClientByUserId(toUserId);
  toClient?.send(
    standarizeData("gameInvite", {
      inviteId,
      fromUser: { id: fromUser.id, username: fromUser.username },
      gameAttributes: gameAttributes,
    })
  );
}

function handleGameAccept(userId, inviteId) {
  const invite = pendingInvites.get(inviteId);
  if (!invite || invite.toUserId !== userId) return;

  pendingInvites.delete(inviteId);
  const gameId = crypto.randomBytes(4).toString("hex");

  users.get(invite.fromUserId).inGame = true;
  users.get(invite.toUserId).inGame = true;

  let gameAttr = invite.gameAttributes;

  let white =
    gameAttr.mainPlayerColor === "white" ? invite.fromUserId : invite.toUserId;
  let black =
    gameAttr.mainPlayerColor === "black" ? invite.fromUserId : invite.toUserId;

  activeGames.set(gameId, {
    whiteUserId: white,
    blackUserId: black,
    currentPlayer: "white",
  });

  const whiteClient = findClientByUserId(white);
  const blackClient = findClientByUserId(black);

  [whiteClient, blackClient].forEach((client) => {
    let eachGameAttr = gameAttr;
    eachGameAttr.mainPlayerColor = client === whiteClient ? "white" : "black";
    client?.send(
      standarizeData("gameStart", {
        gameId,
        color: client === whiteClient ? "white" : "black",
        opponent: users.get(
          client === whiteClient ? invite.toUserId : invite.fromUserId
        ).username,
        gameAttributes: eachGameAttr,
      })
    );
  });

  // broadcastUsers();
}

function handleGameReject(userId, inviteId) {
  const invite = pendingInvites.get(inviteId);
  if (!invite || invite.toUserId !== userId) return;

  pendingInvites.delete(inviteId);
  const fromClient = findClientByUserId(invite.fromUserId);
  fromClient?.send(
    standarizeData("gameRejected", {
      byUserId: userId,
      username: users.get(userId).username,
    })
  );
}

function handleMoveAttempt(userId, gameId, move) {
  const game = activeGames.get(gameId);
  if (!game) return;

  const expectedPlayer =
    game.currentPlayer === "white" ? game.whiteUserId : game.blackUserId;
  if (userId !== expectedPlayer) return;

  game.currentPlayer = game.currentPlayer === "white" ? "black" : "white";
  const opponentId =
    game.currentPlayer === "black" ? game.blackUserId : game.whiteUserId;
  const opponentClient = findClientByUserId(opponentId);

  console.log("a", move, game);

  opponentClient?.send(
    standarizeData("move", {
      gameId,
      move,
      newTurn: game.currentPlayer,
    })
  );
}

wss.on("connection", (ws) => {
  const userId = crypto.randomBytes(4).toString("hex");
  const user = {
    id: userId,
    username: randomUsername(),
    connectedAt: new Date().toISOString(),
    inGame: false,
  };

  users.set(userId, user);
  clients.set(ws, userId);

  ws.send(
    standarizeData(
      "userList",
      [...users.values()]
        .filter((u) => u.id !== userId)
        .map(({ id, username, inGame }) => ({ id, username, inGame }))
    )
  );

  ws.on("message", (raw) => {
    try {
      const { method, data } = JSON.parse(raw);
      const userId = clients.get(ws);

      switch (method) {
        case "gameInvite":
          handleGameInvite(userId, data.toUserId, data.gameAttributes);
          break;
        case "gameAccept":
          handleGameAccept(userId, data.inviteId);
          break;
        case "gameReject":
          handleGameReject(userId, data.inviteId);
          break;
        case "move":
          handleMoveAttempt(userId, data.gameId, data.move);
          break;
      }
    } catch (e) {
      console.error("Message handling error:", e);
    }
  });

  ws.on("close", () => {
    const userId = clients.get(ws);
    const user = users.get(userId);

    // End any active games
    if (user?.inGame) {
      for (const [gameId, game] of activeGames) {
        if ([game.whiteUserId, game.blackUserId].includes(userId)) {
          const opponentId =
            game.whiteUserId === userId ? game.blackUserId : game.whiteUserId;
          const opponentClient = findClientByUserId(opponentId);
          opponentClient?.send(
            standarizeData("gameEnd", { reason: "opponent_disconnected" })
          );
          activeGames.delete(gameId);
          users.get(opponentId).inGame = false;
        }
      }
    }

    users.delete(userId);
    clients.delete(ws);
    broadcastUsers();
  });

  const broadcastUsers = () => {
    const userList = [...users.values()].map(({ id, username, inGame }) => ({
      id,
      username,
      inGame,
    }));
    clients.forEach((id, client) => {
      if (client.readyState === ws.OPEN) {
        client.send(
          standarizeData(
            "userList",
            userList.filter((u) => u.id !== id)
          )
        );
      }
    });
  };
  broadcastUsers();
});

server.listen(11111, () => console.log("Server running on port 11111"));
