const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateText, generateLocation} = require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const PORT = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')

app.use(express.static(publicDirectory))


io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', ({ username, room }, callback) =>{
        const { error, user } = addUser({ id: socket.id, username, room })
        if(error){
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateText('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateText('Admin',`${user.username} has joined the chat!`))   
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (msg, callback) =>{
        const user = getUser(socket.id)
        if (!user) {
            return callback('User not found!')
        }
        if (!msg || msg.trim() === '') {
            return callback('Message cannot be empty!')
        }
        const filter = new Filter()
        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateText(user.username, msg))
        callback('Delivered!') // Acknowledgment to the client
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateText('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (msg, callback) =>{
        const user = getUser(socket.id)
        if (!user) {
            return callback('User not found!')
        }
        if (!msg.latitude || !msg.longitude) {
            return callback('Location data is required!')
        }
        const location = `https://google.com/maps?q=${msg.latitude},${msg.longitude}`
        io.to(user.room).emit('sharelocation', generateLocation(user.username, location))
        callback('Location shared!')
    })
})

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})