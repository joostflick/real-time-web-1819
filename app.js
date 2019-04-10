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

String.prototype.replaceAll = function(str1, str2, ignore) {
  return this.replace(
    new RegExp(
      str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'),
      ignore ? 'gi' : 'g'
    ),
    typeof str2 == 'string' ? str2.replace(/\$/g, '$$$$') : str2
  )
}

io.on('connection', socket => {
  socket.on('chat message', msg => {
    if (msg) {
      io.emit('chat message', msg)
      if (msg.includes('!help')) {
        io.emit(
          'chat message',
          'Momenteel heeft deze chat de volgende functionaliteiten:'
        )
        io.emit('chat message', '- Vertaling (!translate)')
        io.emit('chat message', '- Youtube link (!youtube)')
      }
      if (msg.includes('!youtube ') && msg.replace('!youtube ', '') != '') {
        var noYT = msg.replace('!youtube', '')
        var noSpace = noYT.replace(' ', '')
        var query = noSpace.replaceAll(' ', '+')
        url = 'https://www.youtube.com/results?search_query=' + query
        io.emit('chat message', url)
      }
      if (msg.includes('!translate ') && msg.replace('!translate ', '') != '') {
        var sourceText = msg.replace('!translate', '')
        var sourceLang = 'auto'
        var targetLang = 'en'
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
            console.log(JSON.stringify(myJson))
            io.emit(
              'chat message',
              'Recognized language ' +
                lang +
                //   ' Message: ' +
                //   oldMsg +
                ' translated to "en": ' +
                newMsg
            )
          })
        // Message.create({ name: 'onbekend', message: newMsg }).then(
        //   console.log(newMsg + ' stored in db')
        // )
      }
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
