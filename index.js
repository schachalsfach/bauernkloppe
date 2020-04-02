const express = require('express');
const http = require('http');
const socket = require('socket.io');

const port = process.env.PORT || 8080

var app = express();
const server = http.createServer(app)
const io = socket(server)
var players;
var joined = true;

app.use(express.static(__dirname + "/"));

var games = Array(100);
for (let i = 0; i < 100; i++) {
    games[i] = {players: 0 , pid: [0 , 0]};
}


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//Todo auch in game.js aendern
var isAIroom = function(roomId){
	if((roomId >10 && roomId < 21) || (roomId >30 && roomId < 41) || (roomId >50 && roomId < 61)){
		return true;
	} else {
	return false;
	}
}


io.on('connection', function (socket) {
    // console.log(players);
    var color;
    var playerId =  Math.floor((Math.random() * 100) + 1)
    

    console.log(playerId + ' connected');

    socket.on('joined', function (roomId) {
        // games[roomId] = {}
        if (games[roomId].players < 2) {
            games[roomId].players++;
            games[roomId].pid[games[roomId].players - 1] = playerId;
        }
        else{
            socket.emit('full', roomId)
            return;
        }
        
        console.log(games[roomId]);
        players = games[roomId].players
        

        if (players % 2 == 0) color = 'black';
        else color = 'white';

        socket.emit('player', { playerId, players, color, roomId })
        // players--;

        
    });
	
	socket.on('joinedAI', function (roomIdString) {
        // games[roomId] = {}
		var x = new Boolean("false");
		var i = 0;
		roomId = +roomIdString + 0;
        while(i < 10){
			if (games[+roomId+i].players == 0) {
				games[+roomId+i].players = 2;
				games[+roomId+i].pid[games[+roomId+i].players - 1] = playerId;
				x = "true";
				break;
			}
			else{
				i++;
			}
		}
		
		if(!x){
			socket.emit('full',-1);
		}
		
        players = games[roomId].players
        
        if (players % 2 == 0) color = 'white';
        else color = 'black';

        socket.emit('player', { playerId, players, color, roomId })
        // players--;
    });

    socket.on('move', function (msg) {
        socket.broadcast.emit('move', msg);
    });

    socket.on('play', function (msg) {
        socket.broadcast.emit('play', msg);
        console.log("ready " + msg);
    });

    socket.on('disconnect', function () {
        for (let i = 0; i < 100; i++) {
            if (games[i].pid[0] == playerId || games[i].pid[1] == playerId)
				if(isAIroom(i)){
					games[i].players = 0;
				} else {
					games[i].players--;
				}
        }
        console.log(playerId + ' disconnected');

    }); 

    
});

server.listen(port);
console.log('Connected');