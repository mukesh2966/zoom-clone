const path = require("path"); // for joining paths
const express = require("express");
const compression = require("compression");
const { v4: uuidv4 } = require("uuid");
////////////////----------------------------------------
const app = express();
app.use(compression());

const server = require("http").Server(app);
// requiring socket.io below server as it needs server as an argument
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

////------- specifying view engine as "ejs" and folder to look into as ----/views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
//////////////-------------------------------

///////-----------------FOR SERVING STATIC FILES(CSS, JS, images) from the public folder----used in ejs templates
app.use(express.static(path.join(__dirname, "public")));

////////////////////---------------------------------------

app.use("/peerjs", peerServer);
app.get("/", (req, res) => {
  //   res.status(200).send("hello world");
  //   res.status(200).render("room");
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.status(200).render("room", {
    roomId: req.params.room,
  });
});

app.get("/meeting/exited", (req, res) => {
  res.status(200).render("exit");
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, name) => {
    // console.log("I joined the room.");
    socket.join(roomId);
    // telling our socket-room that new user just connected
    // this broadcast is not emitted to the new user-----------and is emitted to only those users which were previously present in the room.
    socket.to(roomId).broadcast.emit("user-connected", userId, name);
    console.log("this is the name carried to server:", name);

    socket.on("message", (message, name) => {
      io.to(roomId).emit("createMessage", message, name);
    });

    socket.on("room-left", (name) => {
      io.to(roomId).emit("person-left", name);
    });
  });
});

const port = process.env.PORT || 3030;
server.listen(port, () => {
  console.log(`app has started on port: ${port} `);
});
