var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(2013);

var s_room;
var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket){

	function log(){
		var array = [">>> Message from server: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('message', function (message) {
		log('Got message: ', message);
    // For a real app, should be room only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('creatorjoin', function (room) {
		var numClients = io.sockets.clients(room).length;

		log('Room ' + room + ' has ' + numClients + ' client(s)');
		log('Request to create or join room', room);

		if (numClients == 0){
			s_room = room;
			log("First Peer Requested to Create Room: " + room);
			socket.join(room);
			socket.emit('created', room);
		} else if (numClients == 1 && s_room == room) {
			log("Second Peer Requested to Join Room: " + room);
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room);
		} else { // max two clients or not right room name
			log("Request to Join Room is ignored! "); 
			socket.emit('ignore', room);
		}

	});

});

