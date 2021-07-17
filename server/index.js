const http = require('http');
const path = require('path');
const favicon = require('express-favicon');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketio(server)

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./routes/routes');

app.use(cors())

io.on('connection', (socket) => {
    console.log('connected successfully..!!')

    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if (error) return callback(error);

        socket.join(user.room);

        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', { user: user.name, text: message });

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        }
    }) 
}) 

// app.use(favicon(__dirname + '/fav.png'));

// app.use(express.static(path.join(__dirname, '../', 'client', 'build')));

// app.get('/*', function (req, res) {
//     res.sendFile(path.join(__dirname, '../', 'client', 'build', 'index.html'));
// });

app.use(router);

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));