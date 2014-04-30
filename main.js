// Angular
civRogue = angular.module('civRogue', ['ui.keypress']).
	config(function($routeProvider) {
		$routeProvider.
			when('/', {controller:'HomePageCtrl', templateUrl:'app/views/homePage.html'}).
			otherwise({redirectTo:'/'});
	});

civRogue.factory('gameData', function(){
	gameData = {
		message: 'Welcome to Civ Rogue',

		//game loop
		turn: 0,
		phase: 0,
		acceptInteraction: false,

		//agents
		aiBandCount: 2,

		//board size
		rows: 6,
		columns: 8,
		tileCount: this.rows * this.columns,
		linewidth: 2,
		landOdds: 0.85,

		//colors
		landColor: '#9ACD32',
		waterColor: 'aqua'

	};

	gameData.bands = [];
	gameData.aiBands = [];
	var playerBand = {
		id: 0,
		name: 'Fjordish',
		population: 20,
		color: '#DAA520'
	};
	gameData.aiBandFactory = function(id){
		band = {
			name: 'AI Band ' + id,
			id: id,
			population: 20,
			color: 'gray'
		};

		return band;
	};

	gameData.bands.push(playerBand);
	for (y = 0;y<gameData.aiBandCount;y++){
		var band = new gameData.aiBandFactory(y + 1);
		gameData.bands.push(band);
		gameData.aiBands.push(band);
	}

	gameData.createTiles = function(){
		tileId = 0;
		tiles = [];

		//create territories
		for(y = 0; y < gameData.rows; y++){
			for(x = 0; x < gameData.columns; x++){
				// basic info
				var tile = {
					y: y,
					id: tileId
				};

				// tile x
				if (tile.y % 2 === 0){
					tile.x = x * 2;
				} else {
					tile.x = (x * 2) + 1;
				}

				// check for water
				tile.isLand = Math.floor(Math.random()+gameData.landOdds);

				// color tile
				if (tile.isLand) {
					tile.color = gameData.landColor;
				} else {
					tile.color = gameData.waterColor;
				}

				tileId++;
				tiles.push(tile);
			}
		}
		return tiles;
	};

	gameData.getTileByXY = function(x, y){
		neighbor = _.filter(gameData.tiles, function(tile){
			if ((tile.x == x) && (tile.y == y)){
				return tile;
			}
			
		});

		return neighbor[0];
	};

	gameData.addNeighbors = function(tiles){
		angular.forEach(tiles, function(tile){
			tile.neighbors = {
				nw: gameData.getTileByXY(tile.x - 1, tile.y - 1),
				ne: gameData.getTileByXY(tile.x + 1, tile.y - 1),
				sw: gameData.getTileByXY(tile.x - 1, tile.y + 1),
				se: gameData.getTileByXY(tile.x + 1, tile.y + 1),
				w: gameData.getTileByXY(tile.x - 2, tile.y),
				e: gameData.getTileByXY(tile.x + 2, tile.y)
			};
            
		});
	};

	getLandTiles = function(tiles){
		landTiles = [];

		angular.forEach(tiles, function(tile){
			if (tile.isLand){
				landTiles.push(tile);
			}
		});

		return landTiles;
	};

	gameData.placeBands = function(bands, tiles){
		var freeLands = _.shuffle(getLandTiles(tiles));

		angular.forEach(bands, function(band){
			var tile = freeLands.pop();
			gameData.occupyTile(tile, band);

		});
	};

	gameData.occupyTile = function(tile, band){
		if (band.tile) {
			band.tile.occupied = false;
			band.tile.color = gameData.landColor;
		}
		band.tile = tile;
		tile.occupied = true;
		tile.color = band.color;
	};

	gameData.tiles = gameData.createTiles();
	gameData.addNeighbors(gameData.tiles);
	gameData.placeBands(gameData.bands, gameData.tiles);
	


	return gameData;
});

civRogue.factory('gameLoop', ['gameData', function(gameData){

	gameLoop = {};


	gameLoop.phases = [
		
		//player choose target
		function(key){
			var band = gameData.bands[0];
			band.target = null;
			band.staying = false;
			gameData.message = 'Choose Target';
			gameData.acceptInteraction = true;
			var moveKeyArray = [81,87,68,88,90,65,83];
			if (_.contains(moveKeyArray, key)){
				var target = null;

				if (key == 81) target = (band.tile.neighbors.nw || null);
				if (key == 87) target = (band.tile.neighbors.ne || null);
				if (key == 65) target = (band.tile.neighbors.w || null);
				if (key == 83) {
					target = band.tile;
					band.staying = true;
				}
				if (key == 68) target = (band.tile.neighbors.e || null);
				if (key == 90) target = (band.tile.neighbors.sw || null);
				if (key == 88) target = (band.tile.neighbors.se || null);

				var valid = false;

				if (target && target.isLand){
					valid = true;
					band.target = target;
				}

				if (valid){
					gameData.message = 'good pick';
					gameLoop.nextPhase();
				} else {
					gameData.message = 'Invalid Target';
				}
			}
		},

		// ai choose target
		function(){

			angular.forEach(gameData.aiBands, function(band){
				var legalMoves = _.filter(band.tile.neighbors, function(neighbor){
					if (neighbor && neighbor.isLand){
						return neighbor;
					}
				});
				band.target = legalMoves[Math.floor(Math.random() * legalMoves.length)];
			});

			gameLoop.nextPhase();
		},

		// collision detection
		function(){
			angular.forEach(gameData.bands, function(band){
				var mainBand = band;
				angular.forEach(gameData.bands, function(band2){
					var checkBand = band2;
					if (mainBand.id !== checkBand.id){
						if ((checkBand.target === mainBand.target) || ((checkBand.target === mainBand.tile) && (mainBand.target === checkBand.tile))){
							checkBand.target = checkBand.tile;
							mainBand.target = mainBand.tile;
						}
					}
				});
			});

			gameLoop.nextPhase();
		},

		// move
		function(){
			angular.forEach(gameData.bands, function(band){
				if (band.target){
					gameData.occupyTile(band.target, band);
				}
			});
			gameMap.render();
			gameLoop.nextPhase();
		},

		// function clean up, restart
		function(){
			gameData.turn += 1;
			gameLoop.nextPhase();
		}

	];

	gameLoop.nextPhase = function(){
		gameData.phase = (gameData.phase + 1) % gameLoop.phases.length;
		gameLoop.phases[gameData.phase]();
	};

	gameLoop.acceptInput = function(key){
		gameLoop.phases[gameData.phase](key);
	};

	return gameLoop;

}]);

civRogue.factory('gameMap', function(){
	gameMap = {};
	gameMap.init = function(gameData){
		window.stage = new createjs.Stage('canvasId');
		gameMap.render();

	};

	gameMap.render = function(){
		angular.forEach(gameData.bands, function(band){
			gameData.occupyTile(band.tile, band);
		});

		var tileWidth = 48;
		var tileHeight = 43;

		addTile = function(tile){
			var container = new createjs.Container();

			var hex = new createjs.Shape();
			var x = (tile.x/2) * tileWidth;
			var y = tile.y * tileHeight;
			hex.graphics.beginFill(tile.color).drawPolyStar(x, y, 25, 6, 0, 90);
			hex.x = 50;
			hex.y = 50;
			
			/*
			hex.onPress = function(evt) {
				console.log('Target selected:');
			};
			*/

			container.addChild(hex);

			//add text
			var text = new createjs.Text(tile.id, "12px Arial", "black");
			text.x = x + 35;
			text.y = y + 50;
			text.textBaseline = "alphabetic";

			container.addChild(text);

			stage.addChild(container);
		};

		stage.removeAllChildren();

		angular.forEach(gameData.tiles, function(tile){
			addTile(tile);
		});
		

		stage.update();
	};

	return gameMap;
});


civRogue.controller('HomePageCtrl', ['$scope', 'gameData', 'gameMap', 'gameLoop',
	function ($scope, gameData, gameMap, gameLoop){
		$scope.initialize = function(){
			$scope.gameData = gameData;
			$scope.gameMap = gameMap;
			$scope.gameLoop = gameLoop;


			$scope.gameMap.init($scope.gameData);
			$scope.gameData.acceptInteraction = true;
			$scope.playerMessage = "Welcome to Civ Rogue";
		};


		$scope.hitKey = function($event){
			console.log('hit key', $event.keyCode);
			if ($scope.gameData.acceptInteraction){
				$scope.gameLoop.acceptInput($event.keyCode, $scope.gameData.phase);
			}
		};



		$scope.initialize();




	}

]);