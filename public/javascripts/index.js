$(function() {
  var socket = io()
  $('form').submit(function(e) {
    e.preventDefault() // prevents page reloading
    socket.emit('chat message', $('#m').val())
    $('#m').val('')
    return false
  })
  socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg))
  })
  socket.on('username', function(username) {
    $('#messages').append($('<li class="username">').text(username))
  })
  socket.on('bot message', function(msg) {
    $('#messages').append($('<li class="botmessage">').text(msg))
  })
  socket.on('link', function(msg) {
    $('#messages').append(
      $('<a href=' + msg + ' target="_blank"><li>').text(msg)
    )
  })
})
