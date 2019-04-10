const express = require('express')
const app = express()
const http = require('http').Server(app)
var mongoose = require('mongoose')
require('isomorphic-fetch')

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

var dbUrl = 'mongodb://messages:messages1@ds225492.mlab.com:25492/messages'

const path = require('path')

const io = require('socket.io')(http)

const port = process.env.PORT || 7070

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

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

var sourceLang = 'auto'
var targetLang = 'en'

io.on('connection', socket => {
  socket.on('chat message', msg => {
    if (msg) {
      var sourceText = msg
      var url =
        'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
        sourceLang +
        '&tl=' +
        targetLang +
        '&dt=t&q=' +
        encodeURI(sourceText)
      fetch(url)
        .then(function(response) {
          return response.json()
        })
        .then(function(myJson) {
          var newMsg = JSON.stringify(myJson[0][0][0])
          var oldMsg = JSON.stringify(myJson[0][0][1])
          var lang = JSON.stringify(myJson[2])
          console.log(newMsg)
          io.emit(
            'chat message',
            // 'Recognized language: ' +
            //   lang +
            //   ' Message: ' +
            //   oldMsg +
            //   ' Translated to English: ' +
            newMsg
          )
        })
      // Message.create({ name: 'onbekend', message: newMsg }).then(
      //   console.log(newMsg + ' stored in db')
      // )
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
