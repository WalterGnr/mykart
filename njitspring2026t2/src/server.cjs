const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

var players = { };

io.on('connection', function (socket) {
    console.log('A player connected: ' + socket.id);

    players[socket.id] = {
        x: Math.floor(Math.random() * 35),
        y: 20,
        z: 0,
        id: socket.id
    }

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id])

    socket.on('disconnect', ()  => {
        console.log('A player disconnected: ' + socket.id);
        delete players[socket.id]

        io.emit('playerDisconnected', socket.id)        
    });

    socket.on('playerMovement', (movementData) => {
        players[socket.id].x = movementData.x
        players[socket.id].y = movementData.y
        players[socket.id].z = movementData.z
        players[socket.id].rotationAngle = movementData.rotationAngle
        socket.broadcast.emit('playerMoved', players[socket.id])
    });
});

http.listen(8081, function () {
    console.log(`Listening on ${http.address().port}`);
});