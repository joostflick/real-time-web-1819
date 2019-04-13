const express = require('express')
const app = express()
const http = require('http').Server(app)
var mongoose = require('mongoose')
require('isomorphic-fetch')

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
const axios = require('axios')

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

// shuffle function from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
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

// replace all function
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
  let userID = socket.id
  var username = 'New user'
  axios
    .post('http://api.codetunnel.net/random-nick', {
      dataType: 'json'
    })
    .then(function(response) {
      username = response.data.nickname + ' (' + userID + ')'
      io.emit(
        'bot message',
        username +
          ' connected. Type !help to see which commands are currently available'
      )
    })

    .catch(function(error) {
      console.log(error)
    })
  socket.on('chat message', msg => {
    if (msg) {
      io.emit('username', username + ':')
      io.emit('chat message', msg)
      if (msg.includes('!help')) {
        io.emit('bot message', 'This chat utilizes the following commands::')
        io.emit('bot message', '- Translation (!translate)')
        io.emit('bot message', '- Youtube link (!youtube)')
        io.emit('bot message', '- Shuffle text (!shuffle)')
      }
      if (msg.includes('!shuffle ') && msg.replace('!youtube ', '') != '') {
        var noShuffle = msg.replace('!shuffle', '')
        var splitmsg = noShuffle.split(' ')
        var shuffled = shuffle(splitmsg).join(' ')
        var addSpaces = shuffled.replaceAll(',', ' ')
        io.emit('bot message', 'Shuffled message: ' + addSpaces)
      }
      if (msg.includes('!youtube ') && msg.replace('!youtube ', '') != '') {
        var noYT = msg.replace('!youtube', '')
        // var noSpace = noYT.replace(' ', '')
        // var query = noSpace.replaceAll(' ', '+')
        var query = encodeURI(noYT)
        url = 'https://www.youtube.com/results?search_query=' + query
        io.emit('link', url)
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
              'bot message',
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
    io.emit('bot message', username + ' disconnected.')
  })
})

http.listen(port, () => {
  console.log(`App running on port ${port}!`)
})
