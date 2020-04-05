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

var minimaxDepth = 3;
var pieThe = 'img/chesspieces/wikipedia/{piece}.png';

var staerke;
var ea = 1;
var no = 2;
var ha = 3;

//todo auch in index.js aendern
var isAIroom = function(roomId){
	if((roomId >10 && roomId < 21) || (roomId >30 && roomId < 41) || (roomId >50 && roomId < 61)){
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
		case "Pferdeapfel":
		console.log("Pferdeapfel");
		roomId = +roomId + 40;
		game = new Pferdeapfel(enemyId);
		pieThe = 'img/chesspieces/markerstattbauern/{piece}.png'
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
		minimaxDepth = ea;
        socket.emit('joinedAI', roomId);
	} else if (enemyId == "normal"){
		spielart.remove();
        room.remove();
		enemy.remove();
        roomNumber.innerHTML = "Du spielst gegen den Computer (mittel)";
        button.remove();
		button2.style = "display:inline;";
		roomId=+roomId+10;
		minimaxDepth = no;
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
		minimaxDepth = ha;
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
    if (move === null) return 'snapback';
    else
	if(!isAIroom(roomId)){
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
	if(isAIroom(roomId)){
		AImove(game.type);
	}
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
        onSnapEnd: onSnapEnd,
		pieceTheme: pieThe
    };
    board = ChessBoard('board', cfg);
});

var board;


function AIpferdeapfel(spielst){
	var possibleNextMoves = game.moves();
	if(spielst == 'easy'){
		var bestMove = possibleNextMoves[Math.floor(Math.random() * possibleNextMoves.length)];
		move_neu = game.move_from_san(bestMove)
		game.move({
			from: game.algebraic(move_neu.from),
			to: game.algebraic(move_neu.to),
			promotion: 'q' 
		});
		board.position(game.fen());
	} else if (spielst == 'normal') { //zwei gegner
		
	for(var k = 0; k < possibleNextMoves.length; k++) {
		possibleNextMoves[k] = game.move_from_san(possibleNextMoves[k]);
	}
		
	var allcombos = new Array();
	var i = 0;
	while(possibleNextMoves.length > 0){
		for(var j = 1; j < possibleNextMoves.length; j++) {
			allcombos.push(new Array());
			allcombos[i].push(possibleNextMoves[0])
			allcombos[i].push(possibleNextMoves[j])
			i++;
		}
		possibleNextMoves.shift();
	}
	
	allcombos.sort(() => Math.random() - 0.5);
	
	for(var u = 0; u < allcombos.length; u++){
		if((allcombos[u][0].from != allcombos[u][1].from) && (allcombos[u][0].to != allcombos[u][1].to)){
			game.move({
				from: game.algebraic(allcombos[u][0].from),
				to: game.algebraic(allcombos[u][0].to),
				promotion: 'q' 
			});
			board.position(game.fen());
			game.swapcolor();
			game.move({
				from: game.algebraic(allcombos[u][1].from),
				to: game.algebraic(allcombos[u][1].to),
				promotion: 'q' 
			});
			board.position(game.fen());
			return;
		}
	}
	game.spie = 'easy';
	AIpferdeapfel('easy');

	} else if (spielst == 'hard'){ //3 gegner, TODO: Die sollen auch zu dritt ziehen
		
	for(var k = 0; k < possibleNextMoves.length; k++) {
		possibleNextMoves[k] = game.move_from_san(possibleNextMoves[k]);
	}
		
	var allcombos = new Array();
	var i = 0;
	while(possibleNextMoves.length > 0){
		for(var j = 0; j < possibleNextMoves.length; j++) {
			for(var l = 0; l < possibleNextMoves.length; l++) {
				allcombos.push(new Array());
				allcombos[i].push(possibleNextMoves[0])
				allcombos[i].push(possibleNextMoves[j])
				allcombos[i].push(possibleNextMoves[l])
				i++;
			}
		}
		possibleNextMoves.shift();
	}
	
	allcombos.sort(() => Math.random() - 0.5);
	
	for(var u = 0; u < allcombos.length; u++){
		if((allcombos[u][0].from != allcombos[u][1].from) && (allcombos[u][0].from != allcombos[u][2].from) && (allcombos[u][1].from != allcombos[u][2].from)
		&& (allcombos[u][0].to != allcombos[u][1].to) && (allcombos[u][0].to != allcombos[u][2].to) && (allcombos[u][1].to != allcombos[u][2].to)){
			
			console.log(allcombos[u]);
			
			
			
			game.move({
				from: game.algebraic(allcombos[u][0].from),
				to: game.algebraic(allcombos[u][0].to),
				promotion: 'q' 
			});
			board.position(game.fen());
			game.swapcolor();
			game.move({
				from: game.algebraic(allcombos[u][1].from),
				to: game.algebraic(allcombos[u][1].to),
				promotion: 'q' 
			});
			board.position(game.fen());	
			game.swapcolor();
			game.move({
				from: game.algebraic(allcombos[u][2].from),
				to: game.algebraic(allcombos[u][2].to),
				promotion: 'q' 
			});
			board.position(game.fen());
			return;
		}
	}
	game.spie = 'normal';
	AIpferdeapfel('normal');
	console.log(spielst);
	}  else {
		console.log("sollte nie passieren, spielst undefined");
		console.log(spielst);
		}
}


function AIdefault(){		
		//todo folgende zeile kann man glaube ich streichen
		var x = game.generate_moves(JSON.parse('{"legal": true}'));
		var bestMove = calculateBestMove();
		move_neu = game.move_from_san(bestMove)
		
		game.move({
			from: game.algebraic(move_neu.from),
			to: game.algebraic(move_neu.to),
			promotion: 'q'
		});
		board.position(game.fen());
	} 




function AImove(){
	if(!game.cantmove()){
		switch(game.type){
			case 'Pferdeapfel':
				AIpferdeapfel(game.spie);
			break;
			
			case 'Bauernkloppe':
				AIdefault();
			break;
			
			case 'normal':
				AIdefault();
			break;
			
			default:
			console.log("Game Type not detected!" + game.type);
			break;
		}	
	}
}


//stolen from https://github.com/gautambajaj/Chess-AI/blob/master/js/chessAI.js


var calculateBestMove = function() {
	    var possibleNextMoves = game.moves();
	    var bestMove = -9999;
	    var bestMoveFound;

	    for(var i = 0; i < possibleNextMoves.length; i++) {
		//	console.log(i);
	        var possibleNextMove = possibleNextMoves[i]
	        game.move(possibleNextMove);
	        var value = minimax(minimaxDepth, -10000, 10000, false);
	        game.undo();
	        if(value >= bestMove) {
	            bestMove = value;
	            bestMoveFound = possibleNextMove;
	        }
	    }
	    return bestMoveFound;

	};


	// minimax with alhpha-beta pruning and search depth d = 3 levels
	var minimax = function (depth, alpha, beta, isMaximisingPlayer) {
	    if (depth === 0) {
	        return -evaluateBoard(game.board());
	    }

	    var possibleNextMoves = game.moves();
	    var numPossibleMoves = possibleNextMoves.length

	    if (isMaximisingPlayer) {
	        var bestMove = -9999;
	        for (var i = 0; i < numPossibleMoves; i++) {
	            game.move(possibleNextMoves[i]);
	            bestMove = Math.max(bestMove, minimax(depth - 1, alpha, beta, !isMaximisingPlayer));
	            game.undo();
	            alpha = Math.max(alpha, bestMove);
	            if(beta <= alpha){
	            	return bestMove;
	            }
	        }

	    } else {
	        var bestMove = 9999;
	        for (var i = 0; i < numPossibleMoves; i++) {
	            game.move(possibleNextMoves[i]);
	            bestMove = Math.min(bestMove, minimax(depth - 1, alpha, beta, !isMaximisingPlayer));
	            game.undo();
	            beta = Math.min(beta, bestMove);
	            if(beta <= alpha){
	            	return bestMove;
	            }
	        }
	    }

		return bestMove;
	};


	// the evaluation function for minimax
	var evaluateBoard = function (board) {
	    var totalEvaluation = 0;
	    for (var i = 0; i < 8; i++) {
	        for (var j = 0; j < 8; j++) {
	            totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i, j);
	        }
	    }
	    return totalEvaluation;
	};


	var reverseArray = function(array) {
    	return array.slice().reverse();
	};

	var whitePawnEval =
	    [
	        [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
	        [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
	        [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
	        [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
	        [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
	        [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
	        [0.5,  1.0,  1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
	        [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
	    ];

	var blackPawnEval = reverseArray(whitePawnEval);

	var knightEval =
	    [
	        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
	        [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
	        [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
	        [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
	        [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
	        [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
	        [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
	        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
	    ];

	var whiteBishopEval = [
	    [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
	    [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
	    [ -1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
	    [ -1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
	    [ -1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
	    [ -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
	    [ -1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
	    [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
	];

	var blackBishopEval = reverseArray(whiteBishopEval);

	var whiteRookEval = [
	    [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
	    [  0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
	    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
	    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
	    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
	    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
	    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
	    [  0.0,   0.0, 0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
	];

	var blackRookEval = reverseArray(whiteRookEval);

	var evalQueen = [
	    [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
	    [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
	    [ -1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
	    [ -0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
	    [  0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
	    [ -1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
	    [ -1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
	    [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
	];

	var whiteKingEval = [

	    [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
	    [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
	    [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
	    [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
	    [ -2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
	    [ -1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
	    [  2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0 ],
	    [  2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0 ]
	];

	var blackKingEval = reverseArray(whiteKingEval);


	var getPieceValue = function (piece, x, y) {
	    if (piece === null) {
	        return 0;
	    }

	    var absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x ,y);

	    if(piece.color === 'w'){
	    	return absoluteValue;
	    } else {
	    	return -absoluteValue;
	    }
	};


	var getAbsoluteValue = function (piece, isWhite, x ,y) {
        if (piece.type === 'p') {
            return 10 + ( isWhite ? whitePawnEval[y][x] : blackPawnEval[y][x] );
        } else if (piece.type === 'r') {
            return 50 + ( isWhite ? whiteRookEval[y][x] : blackRookEval[y][x] );
        } else if (piece.type === 'n') {
            return 30 + knightEval[y][x];
        } else if (piece.type === 'b') {
            return 30 + ( isWhite ? whiteBishopEval[y][x] : blackBishopEval[y][x] );
        } else if (piece.type === 'q') {
            return 90 + evalQueen[y][x];
        } else if (piece.type === 'k') {
            return 900 + ( isWhite ? whiteKingEval[y][x] : blackKingEval[y][x] );
        }
};