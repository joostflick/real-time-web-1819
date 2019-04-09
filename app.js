const express = require('express')
const app = express()
const http = require('http').Server(app)

const path = require('path')

const io = require('socket.io')(http)

const port = 7070

app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'public/views'))

app.get('/', (req, res) => {
  res.render('index')
})

io.on('connection', socket => {
  socket.on('chat message', msg => {
    console.log('Message: ' + msg)
    io.emit('chat message', msg)
  })
  console.log('A user connected')
  socket.on('disconnect', () => {
    console.log('A user disconnected')
  })
})

http.listen(port, () => {
  console.log(`App running on port ${port}!`)
})
