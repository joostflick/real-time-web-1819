const express = require('express')
const app = express()
const http = require('http').Server(app)
var mongoose = require('mongoose')

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

var dbUrl = 'mongodb://messages:messages1@ds225492.mlab.com:25492/messages'

const path = require('path')

const io = require('socket.io')(http)

const port = 7070

app.use(express.static(path.join(__dirname, 'public')))

mongoose.connect(dbUrl, err => {
  console.log(err || 'mongodb connected')
})

var Message = mongoose.model('Message', { name: String, message: String })

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'public/views'))

app.get('/', (req, res) => {
  res.render('index')
})

io.on('connection', socket => {
  socket.on('chat message', msg => {
    if (msg) {
      io.emit('chat message', msg)
      Message.create({ name: 'onbekend', message: msg }).then(
        console.log(msg + ' stored in db')
      )
    }
  })
  console.log('A user connected')
  socket.on('disconnect', () => {
    console.log('A user disconnected')
  })
})

http.listen(port, () => {
  console.log(`App running on port ${port}!`)
})
