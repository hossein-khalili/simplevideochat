var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(2013);
var room_owner_map = {};
var client_to_room_map = {};
var io = require('socket.io').listen(app);

function remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
}


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
    	if(message.type == 'close'){
    		roomName = client_to_room_map[socket.id];
    		if(roomName){
    			delete client_to_room_map[socket.id];
    			for (var i = 0; i < io.sockets.clients(roomName).length; i++) {
	    			reciver = io.sockets.clients(roomName)[i];
	    			if(reciver.id != socket.id){
	    				reciver.emit('message',message);
	    			}
    			}
    			io.sockets.clients(roomName).forEach(function(s){
    				s.leave(roomName);
    			});
    		}
    		
    	} else {
    		roomName = client_to_room_map[socket.id];
    		for (var i = 0; i < io.sockets.clients(roomName).length; i++) {
    			reciver = io.sockets.clients(roomName)[i];
    			if(reciver.id != socket.id){
    				reciver.emit('message',message);
    			}
    		}
    	}
	});

	socket.on('creatorjoin', function (room) {
		var numClients = io.sockets.clients(room).length;

		log('Room ' + room + ' has ' + numClients + ' client(s)');
		log('Request to create or join room', room);

		if (numClients == 0){
			log("First Peer Requested to Create Room: " + room);
			socket.join(room);
			client_to_room_map[socket.id] = room;
			room_owner_map[room] = socket;
			socket.emit('created', room);
		} else if (numClients == 1) {
			log("Second Peer Requested to Join Room: " + room);
			admin = room_owner_map[room];
			admin.emit('join',room);
			admin.on('accept',function(){
				console.log("#####################################################");
				console.log("accepted");
				console.log("#####################################################");
				socket.join(room);
				client_to_room_map[socket.id] = room;
				socket.emit('joined', room);
			});
			admin.on('ignore',function(){
				log("Request to Join Room is ignored! "); 
				socket.emit('ignore', room);
			});
			// io.sockets.in(room).on('accept',function(){
			// 	socket.join(room);
			// 	client_to_room_map[socket.id] = room;
			// 	socket.emit('joined', room);
			// })
			
		} else { // max two clients or not right room name
			log("Request to Join Room is ignored! "); 
			socket.emit('ignore', room);
		}

	});

});

