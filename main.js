var RiichiLibrary = require('./RiichiLibrary.js');

var Tile = RiichiLibrary.Tile;
var Hand = RiichiLibrary.Hand;

console.time("Calculating shanten");
// var hand = new Hand({ text:"11122233377h11p" });
var hand = new Hand({ text:"7777777777777h" });
hand.setWinningTile(new Tile({text:"7h"}));
hand.setOptions({
	roundWind: Tile.EAST,
	seatWind: Tile.WEST,
	tsumo: true,
});
console.timeEnd("Calculating shanten");
for(var i = 0; i < hand.numberOfCombinations(); i++){
	var combination = hand.getCombination(i);
	// console.log(combination.toString());
	console.log(combination.print());
}
console.log(hand.getWaits());