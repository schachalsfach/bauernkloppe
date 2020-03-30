var socket = io();

var color = "white";
var players;
var roomId;
var play = true;

var room = document.getElementById("room")
var spielart = document.getElementById("spielart")
var game
var enemy = document.getElementById("enemy")
var roomNumber = document.getElementById("roomNumbers")
var button = document.getElementById("button")
var button2 = document.getElementById("button2")
var state = document.getElementById('state')

//todo auch in index.js aendern
var isAIroom = function(roomId){
	if((roomId >10 && roomId < 21) || (roomId >30 && roomId < 41)){
		return true;
	} else {
	return false;
	}
}

var connect = function(){
    roomId = room.value;
	gameId = spielart.value;
	enemyId = enemy.value;
	
	
	switch(gameId){
		case "Bauernkloppe" : game = new Bauernkloppe();
				console.log("Bauernkloppe");
		break;
		case "normal":
		console.log("normales Schach");
		roomId = +roomId + 20;
		game = new Chess();
		break;
		default: console.log("Leer");
		break;
	}

	
    if (enemyId == "freund") {
		spielart.remove();
        room.remove();
		enemy.remove();
        roomNumber.innerHTML = "Du spielst in Raum Nummer " + roomId;
        button.remove();
		button2.style = "display:inline;";
        socket.emit('joined', roomId);
    } else if (enemyId == "easy"){
		spielart.remove();
        room.remove();
		enemy.remove();
        roomNumber.innerHTML = "Du spielst gegen den Computer (leicht)";
        button.remove();
		button2.style = "display:inline;";
		roomId=+roomId+10;
        socket.emit('joinedAI', roomId);
	} else if (enemyId == "normal"){
		spielart.remove();
        room.remove();
		enemy.remove();
        roomNumber.innerHTML = "Du spielst gegen den Computer (mittel)";
        button.remove();
		button2.style = "display:inline;";
		roomId=+roomId+10;
        socket.emit('joinedAI', roomId);
	}
	 else if (enemyId == "hard"){
		spielart.remove();
        room.remove();
		enemy.remove();
        roomNumber.innerHTML = "Du spielst gegen den Computer (schwer)";
        button.remove();
		button2.style = "display:inline;";
		roomId=+roomId+10;
        socket.emit('joinedAI', roomId);
	} else {
		console.log("ERROR ENEMY NOT FOUND");
	}

}

var disconnect = function(){
		button2.style="display:none;";
        socket.emit('disconnect');
}

socket.on('full', function (msg) {
    if(roomId == msg)
       // window.location.assign(window.location.href+ 'full.html');
	state.innerHTML = "Dieser Raum ist leider schon voll, bitte wähle einen anderen Raum."

});

socket.on('play', function (msg) {
    if (msg == roomId) {
        play = false;
        state.innerHTML = "Spiel läuft gerade ..."
    }
	console.log("play");
});

socket.on('move', function (msg) {
    if (msg.room == roomId) {
        game.move(msg.move);
        board.position(game.fen());
        console.log("moved");
		if (game.game_over()) {
			state.innerHTML = 'Spiel beendet';
			socket.emit('gameOver', roomId);
		}

    }
});

var removeGreySquares = function () {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function (square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var onDragStart = function (source, piece) {
    // do not pick up pieces if the game is over
    // or if it's not that side's turn
    if (play || (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white') ) {
            return false;
    }
    // console.log({play, players});
};

var onDrop = function (source, target) {
    removeGreySquares();

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
	
    if (game.game_over()) {
        state.innerHTML = 'Spiel beendet';
        socket.emit('gameOver', roomId)
    }

	
		console.log(roomId);
			console.log(isAIroom(roomId));
	
    // illegal move
    if (move === null) return 'snapback';
    else
		console.log("moved");
        socket.emit('move', { move: move, board: game.fen(), room: roomId });
		//legitimer Zug gemacht, jetzt checken ob AI gleich zurueckmoven soll
		
	if(isAIroom(roomId) && !game.game_over()){
		console.log("HALLO WELT");
		var x = game.generate_moves(JSON.parse('{"legal": true}'));
		
		//AI-difficulty
		var movenr = Math.floor(Math.random() * x.length); 
		move_neu = x[movenr];
		move = game.move({
			from: game.algebraic(move_neu.from),
			to: game.algebraic(move_neu.to),
			promotion: 'q' // NOTE: always promote to a queen for example simplicity
		});
		console.log(move);
		socket.emit('move', { move: move, board: game.fen(), room: roomId });
	} 
	

};

var onMouseoverSquare = function (square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function (square, piece) {
    removeGreySquares();
};

var onSnapEnd = function () {
    board.position(game.fen());
	game.cantmove();
};


socket.on('player', (msg) => {
    var plno = document.getElementById('player')
    color = msg.color;

    plno.innerHTML = 'Player ' + msg.players + " : " + color;
    players = msg.players;

    if(players == 2){
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "Spiel läuft gerade"
    }
    else
        state.innerHTML = "Warte auf Gegner";


    var cfg = {
        orientation: color,
        draggable: true,
        position: game.fen(),
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    board = ChessBoard('board', cfg);
});
// console.log(color)

var board;
