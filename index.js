const express = require('express')
const app = express()
const server = require('http').Server(app)
const path = require('path')
const io = require('socket.io')(server)
const waitingSocket =[]
let rooms = 0

app.use(express.static('./public'))
app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'public/index.html'))
})

io.on('connection', socket=> {
    socket.on('disconnect', ()=> {
        let index = waitingSocket.findIndex(val=> val.id === socket.id)
        if(index !== -1) {
            waitingSocket.splice(index, 1)
        }
        if(socket.room) {
            socket.in(socket.room).broadcast.emit('opponent-out')
        }
    })
    // find match
    socket.on('find-match', ()=> {
        if(socket.room) socket.in(socket.room).emit('opponent-out')
        if(waitingSocket.length !== 0) {
            let room = "room-"+rooms++
            socket.join(room)
            waitingSocket[0].join(room)
            socket.room = room
            socket.opponent = waitingSocket[0]
            waitingSocket[0].room = room
            waitingSocket[0].opponent = socket
            io.in(room).emit("isMatched")
            waitingSocket[0].emit('first-move')
            waitingSocket.splice(0,1)
        } else {
            waitingSocket.push(socket)
        }
    })
    //start game
    socket.on('start-game', ()=> {
        if(socket.opponent.status === 'ready') {
            console.log('start-game')
            io.sockets.in(socket.room).emit('start-game')
        } else socket.status = 'ready'
    })
    socket.on('new-position', data=> socket.in(socket.room).broadcast.emit('new-position', data))
    socket.on('game-over', ()=> {
        socket.status = 'over'
    })
})

server.listen(3000, ()=>console.log('server is running on port 3000...'))