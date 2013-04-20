(function(){
/**
 *	Represents a tile
 *	@example new Tile({ index: 4})
 *	@example new Tile({ number: 5, suit: "m" })
 *	@example new Tile({ text: "5m" })
 *	@example new Tile({ text: "5m", akadora: true})
 *	@param {object} value
 */
var Tile = function(value){
	if(value.index !== undefined){
		this.suit = Tile.getSuitFromIndex(value.index);
		this.number = Tile.getNumberFromIndex(value.index);
	} else if(value.number && value.suit){
		this.setFromNumberAndSuit(value.number, value.suit);
	} else if(value.text) {
		var text = value.text.trim();
		if(text.length != 2){
			throw new Error("Invalid text value specified:" + text);
		}
		var number = text[0];
		var suit = text[1];
		this.setFromNumberAndSuit(number, suit);
	} else {
		throw new Error("Value not specified for Tile");
	}
	this.dora = !!value.dora;
};
(function(){
	// The honor tiles
	Tile.EAST = 1;
	Tile.SOUTH = 2;
	Tile.WEST = 3;
	Tile.NORTH = 4;
	Tile.HAKU = 5;
	Tile.HATSU = 6;
	Tile.CHUN = 7;
	// The values of the suits
	Tile.SUIT_MAN = 0;
	Tile.SUIT_SOU = 1;
	Tile.SUIT_PIN = 2;
	Tile.SUIT_HONOR = 3;
	// Other constants
	Tile.MIN_INDEX = 0;
	Tile.MAX_INDEX = 33;
	Tile.TILES_PER_SUIT = 9;
	Tile.MIN_NUMBER = 1;
	Tile.MAX_NUMBER = 9;

	// Static functions
	Tile.getSuitFromIndex = function(index){
		switch(Math.floor(index/9)){
			case Tile.SUIT_MAN:
				return "m";
			case Tile.SUIT_SOU:
				return "s";
			case Tile.SUIT_PIN:
				return "p";
			case Tile.SUIT_HONOR:
				return "h";
			default:
				throw new Error("Invalid index to convert:" + index);
		}
	};

	Tile.createTileFromString = function(string){
		return new Tile({text:string});
	};

	Tile.getNumberFromIndex = function(index){
		if(index < Tile.MIN_INDEX || index > Tile.MAX_INDEX){
			throw "Invalid index, out of range" + index;
		}
		return index % Tile.TILES_PER_SUIT + 1;
	};

	Tile.getDoraFromIndicator = function(text){
		var tile = new Tile({text: text});
		var number = tile.getNumber();
		var suit = tile.getSuit();
		if(tile.isHonor()){
			switch(number){
				case Tile.EAST:
					return new Tile({number:Tile.SOUTH, suit:suit}).toString();
				case Tile.SOUTH:
					return new Tile({number:Tile.WEST, suit:suit}).toString();
				case Tile.WEST:
					return new Tile({number:Tile.NORTH, suit:suit}).toString();
				case Tile.NORTH:
					return new Tile({number:Tile.EAST, suit:suit}).toString();

				case Tile.HAKU:
					return new Tile({number:Tile.HATSU, suit:suit}).toString();
				case Tile.HATSU:
					return new Tile({number:Tile.CHUN, suit:suit}).toString();
				case Tile.CHUN:
					return new Tile({number:Tile.HAKU, suit:suit}).toString();
			}
			throw new Error("Invalid number");
		}
		if(number == Tile.MAX_NUMBER){
			return new Tile({number:Tile.MIN_NUMBER, suit:suit}).toString();
		}
		return new Tile({number:number + 1, suit:suit}).toString();
	};

	// Methods
	Tile.prototype.setFromNumberAndSuit = function(number, suit){
		number = parseInt(number);
		if(!(Tile.MIN_NUMBER <= number && number <= Tile.MAX_NUMBER)){
			throw "Invalid number, out of range " + number;
		}
		if("msphz".indexOf(suit) == -1 || suit.length != 1){
			throw "Unknown suit" + suit;
		}
		this.number = number;
		this.suit = suit;
		if(this.suit == "z"){
			this.suit == "h";
		}
	};

	Tile.prototype.getSuitIndex = function(){
		if(this.suit == "m"){
			return Tile.SUIT_MAN;
		} else if(this.suit == "s") {
			return Tile.SUIT_SOU;
		} else if(this.suit == "p") {
			return Tile.SUIT_PIN;
		} else if(this.suit == "h") {
			return Tile.SUIT_HONOR;
		}
		throw "Unknown suit " + this.suit;
	};

	Tile.prototype.getIndex = function(){
		var suit = this.getSuitIndex();
		var number = this.number - 1;
		return Tile.TILES_PER_SUIT * suit + number;
	};

	Tile.prototype.toString = function(){
		var number = this.number;
		var suit = this.suit;
		return number + suit;
	};

	Tile.prototype.getSuit = function(){
		return this.suit;
	};
	Tile.prototype.getNumber = function(){
		return this.number;
	};
	Tile.prototype.isEnd = function(){
		return this.isTerminal() || this.suit == 'h';
	};
	Tile.prototype.isTerminal = function(){
		return this.number == Tile.MIN_NUMBER || this.number == Tile.MAX_NUMBER;
	};
	Tile.prototype.isHonor = function(){
		return this.suit == 'h';
	};
	Tile.prototype.isDragon = function(){
		return this.suit == "h" && (
			this.number == Tile.HAKU || 
			this.number == Tile.HATSU || 
			this.number == Tile.CHUN
		);
	};
	Tile.prototype.equals = function(tile){
		return this.number == tile.number && this.suit == tile.suit;
	}
}());
/**
 *	An object representing a hand
 *	@example new Hand({ text_hand:"12345m567s678p11h" })
 *	@example new Hand({ text_hand:"12345m567s11h", text_melds: "678p" })
 */
var Hand = function(value){
	this.hand = [];
	this.melds = [];
	if(value.text){
		var text = value.text.replace(/(\d*)([msphz])/g, function(input, number, text){
			var output = "";
			for(var i = 0; i < number.length; i++){
				output += number[i] + text;
			}
			return output;
		});
		for(var i = 0; i < text.length; i += 2){
			var tileString = text.substr(i,2);
			this.hand.push(new Tile({
				text: tileString
			}));
		}
	} else {
		throw "Invalid parameters";
	}

	this.handCalculator = new HandCalculator(this.hand);
	this.bestShanten = this.handCalculator.bestShanten;
	this.validHands = this.handCalculator.getValidHands();
};
(function(){
	Hand.prototype.numberOfCombinations = function(){
		return this.validHands.length;
	};

	Hand.prototype.isValid = function(){
		return this.handCalculator.isValid();
	};

	Hand.prototype.getBestPoints = function(){
		var bestHandPoints = {han:0, fu:0};
		for (var i = 0; i < this.validHands.length; i++) {
			var hand = this.validHands[i];
			var points = hand.calculatePoints();
			if(points){
				if(bestHandPoints.han < points.han){
					bestHandPoints = points;
				} else if(bestHandPoints.han == points.han && bestHandPoints.fu < points.fu){
					bestHandPoints = points;
				}
			}
		};
		return bestHandPoints;
	};

	Hand.prototype.getWaits = function(){
		// No waits if the shanten is not 0
		if(this.bestShanten != 0){
			return [];
		}
		var allWaits = {};
		for (var i = 0; i < this.validHands.length; i++) {
			var hand = this.validHands[i];
			var waits = hand.getWaits();
			for (var j = 0; j < waits.length; j++) {
				allWaits[waits[j].getIndex()] = true;
			};
		};
		var returnWaits = [];
		for (var i = 0; i <= Tile.MAX_INDEX; i++) {
			// console.log(i, allWaits[i]);
			if(allWaits[i]){
				returnWaits.push(new Tile({index: i}));
			}
		};
		return returnWaits;
	};

	Hand.prototype.getShanten = function(){
		return this.bestShanten;
	};

	Hand.prototype.convertHandToString = function(input){
		var stringHand = [];
		for(var i = 0; i < input.length; i++){
			var set = input[i];
			var stringSet = [];
			stringHand.push(stringSet);
			for(var j = 0; j < set.length; j++){
				var tile = set[j];
				stringSet.push(new Tile({index:tile}).toString());
			}
		}
		return stringHand;
	};

	Hand.prototype.getCombination = function(i){
		return this.validHands[i];
	};

	Hand.prototype.setOptions = function(options) {
		for (var i = 0; i < this.validHands.length; i++) {
			this.validHands[i].setOptions(options);
		}
	};

	Hand.prototype.setWinningTile = function(tile){
		for (var i = 0; i < this.validHands.length; i++) {
			this.validHands[i].setWinningTile(tile);
		}
	};

	Hand.prototype.addOpenMeld = function(meld){
		for (var i = 0; i < this.validHands.length; i++) {
			this.validHands[i].addOpenMeld(meld);
		}
	};

	Hand.prototype.addClosedKan = function(meld){
		for (var i = 0; i < this.validHands.length; i++) {
			this.validHands[i].addClosedKan(meld);
		}
	};
}());

/**
 *	Represents a meld
 */
function Meld(tiles, open){
	this.open = !!open;
	this.tiles = [];
	for (var i = 0; i < tiles.length; i++) {
		this.tiles.push(tiles[i]);
	};
	this.tiles.sort(function(a,b){
		return a.getIndex() - b.getIndex();
	});
}

(function(){
	Meld.prototype.getTiles = function(){
		return this.tiles;
	};

	Meld.prototype.isChi = function(){
		return this.tiles.length == 3 &&
			this.tiles[0].getIndex() == this.tiles[1].getIndex() - 1 &&
			this.tiles[1].getIndex() == this.tiles[2].getIndex() - 1;
	};

	Meld.prototype.isPon = function(){
		if(this.isKan()){
			return true;
		}
		return this.tiles.length == 3 &&
			this.tiles[0].getIndex() == this.tiles[1].getIndex() &&
			this.tiles[1].getIndex() == this.tiles[2].getIndex();
	};

	Meld.prototype.isKan = function(){
		return this.tiles.length == 4 &&
			this.tiles[0].getIndex() == this.tiles[1].getIndex() &&
			this.tiles[1].getIndex() == this.tiles[2].getIndex() &&
			this.tiles[2].getIndex() == this.tiles[3].getIndex();
	};

	Meld.prototype.tileCount = function(){
		return this.tiles.length;
	};

	Meld.prototype.isPair = function(){
		return this.tiles.length == 2 && this.tiles[0].getIndex() == this.tiles[1].getIndex()
	};

	Meld.prototype.isTwoSided = function(){
		// Must be two tiles
		if(this.tiles.length != 2){
			return false;
		}
		// Must not be honor tiles
		if(this.tiles[0].getSuit() == "h" || this.tiles[1].getSuit() == "h"){
			return false;
		}
		// Get the smaller and larger value
		var smaller	= this.tiles[0].getNumber();
		var larger = this.tiles[1].getNumber();
		// Must be sequential
		if(smaller != larger - 1){
			return false;
		}
		// Must not be edge wait
		if(smaller == Tile.MIN_NUMBER){
			return false;
		}
		if(larger == Tile.MAX_NUMBER){
			return false;
		}
		return true;
	};
	Meld.prototype.isCenterWait = function(){
		if(this.tiles.length != 2){
			return false;
		}
		// Must not be honor tiles
		if(this.tiles[0].isHonor() || this.tiles[1].isHonor()){
			return false;
		}
		// Get the smaller and larger value
		var smaller	= this.tiles[0].getNumber();
		var larger = this.tiles[1].getNumber();
		return smaller == larger - 2;
	};
	Meld.prototype.isEdgeWait = function(){
		if(this.tiles.length != 2){
			return false;
		}
		// Must not be honor tiles
		if(this.tiles[0].isHonor() || this.tiles[1].isHonor()){
			return false;
		}
		// Get the smaller and larger value
		var smaller	= this.tiles[0].getNumber();
		var larger = this.tiles[1].getNumber();

		if(smaller != larger - 1){
			return false;
		}
		return smaller == Tile.MIN_NUMBER || larger == Tile.MAX_NUMBER;

	};
	Meld.prototype.equals = function(meld){
		return this.tiles[0].getIndex() == meld.tiles[0].getIndex() &&
			this.tiles[1].getIndex() == meld.tiles[1].getIndex() &&
			this.tiles[2].getIndex() == meld.tiles[2].getIndex();
	};
	Meld.prototype.isTanki = function(){
		return this.tiles.length == 1;
	};
	/**
	 *	Returns the first tile in the meld, this is the smallest tile
	 *
	 */
	Meld.prototype.getFirstTile = function(){
		return this.tiles[0];
	};
	/**
	 *	Returns the tile that represents a tanki, a pair, a pon or a kan
	 *
	 */
	Meld.prototype.getRepresentitiveTile = function(){
		if(!this.isPon() && !this.isPair() && !this.isTanki()){
			throw new Error("Tried to get representitive tile of invalid set" + JSON.stringify(this));
		}
		return this.tiles[0];
	};
	Meld.prototype.toString = function(){
		return this.tiles.map(function(tile){
			return tile.toString();
		}).join(",");
	};
}());

function PointCalculator(handDivision, options){
	this.options = options || {};

	this.han = 0;
	this.fu = 0;

	this.melds = [].concat(handDivision.melds, handDivision.closedKans);
	this.shanten = handDivision.shanten;
	this.openMelds = handDivision.openMelds;
	this.winningTile = handDivision.winningTile;

	// Create a list of all tiles in the hand
	var tiles = [];
	// Melds
	this.melds.forEach(function(meld){
		meld.getTiles().forEach(function(tile){
			tiles.push(tile);
		});
	});
	// Open melds
	this.openMelds.forEach(function(meld){
		meld.getTiles().forEach(function(tile){
			tiles.push(tile);
		});
	});
	// Winning tile
	tiles.push(this.winningTile);

	this.tiles = tiles;

	// Create a list of all the melds in the hand
	this.completeMelds = this.melds.concat(this.openMelds).filter(function(meld){
		return meld.tileCount() > 2;
	});

	// Find the waiting meld, finds number of melds of length <= 2
	var remainingMelds = this.melds.filter(function(meld){
		return meld.tileCount() <= 2;
	});

	// Determine the wait
	if(remainingMelds.length == 1){
		// Must be a normal tanki wait
		this.wait = remainingMelds[0];
		this.pair = null;
	} else if(remainingMelds.length > 2){
		// Chi toi tsu case
		this.isChiToiTsu = true;
		for (var i = 0; i < remainingMelds.length; i++) {
			var meld = remainingMelds[i];
			if(meld.isTanki()){
				this.wait = meld;
			}
		};
	} else {
		// Normal other wait
		var onePair = remainingMelds[0].isPair();
		var twoPairs = remainingMelds[1].isPair();
		if(onePair && twoPairs){
			// Shanpon case
			// Determine which pair is the winning set
			if(this.winningTile && this.winningTile.getIndex() == remainingMelds[0].getRepresentitiveTile().getIndex()){
				this.wait = remainingMelds[0];
				this.pair = remainingMelds[1];
			} else {
				// Opposite case or no winning tile so we can choose arbitrarily
				this.wait = remainingMelds[1];
				this.pair = remainingMelds[0];
			}
		} else if(onePair){
			// First meld is the pair
			this.wait = remainingMelds[1];
			this.pair = remainingMelds[0];
		} else if(twoPairs){
			// Second meld is the pair
			this.wait = remainingMelds[0];
			this.pair = remainingMelds[1];
		}
	}

	if(this.winningTile){
		// Find the winning meld
		if(this.wait.isPair()){
			// Possible shanpon
			if(this.wait.getRepresentitiveTile().getIndex() == this.winningTile.getIndex()){
				this.winningMeld = new Meld([this.winningTile].concat(this.wait.getTiles()), true);
			} else {
				this.winningMeld = new Meld([this.winningTile].concat(this.pair.getTiles()), true);
			}
		} else {
			this.winningMeld = new Meld([this.winningTile].concat(this.wait.getTiles()), true);
		}
		// all the melds in the hand
		if(!this.winningMeld.isPair()){
			this.allMelds = [this.winningMeld].concat(this.completeMelds);
		} else {
			this.allMelds = [].concat(this.completeMelds);
		}
	}

	// Flag for semi closed hands
	this.semiClosed = this.openMelds.length == 0;
}

(function(){
	PointCalculator.prototype.getWaits = function(){
		if(!this.wait){
			return [];
		}
		if(this.wait.isPair()){
			// Shanpon
			var tile1 = new Tile({index: this.wait.getRepresentitiveTile().getIndex()});
			var tile2 = new Tile({index: this.pair.getRepresentitiveTile().getIndex()});
			return [tile1, tile2];
		}
		if(this.wait.isTanki()){
			var tile1 = new Tile({index: this.wait.getRepresentitiveTile().getIndex()});
			return [tile1];
		}
		if(this.wait.isTwoSided()){
			var index = this.wait.getFirstTile().getIndex();
			var tile1 = new Tile({index: index - 1});
			var tile2 = new Tile({index: index + 2});
			return [tile1, tile2];
		}
		if(this.wait.isCenterWait()){
			var index = this.wait.getFirstTile().getIndex();
			return [new Tile({index: index + 1})];
		}
		if(this.wait.isEdgeWait()){
			var index = this.wait.getFirstTile().getIndex();
			var number = this.wait.getFirstTile().getNumber();
			if(number == Tile.MIN_NUMBER){
				return [new Tile({index: index + 2})];
			} else if(number == Tile.MAX_NUMBER - 1){
				return [new Tile({index: index - 1})];
			} else {
				throw new Error("Invalid meld");
			}
		}
		console.error(this.wait);
		throw new Error("All wait exaused with no match");
	};
	PointCalculator.prototype.isValidWait = function(){
		return this.shanten == 0 && 
			this.winningTile &&
			(this.winningMeld.isPon() || this.winningMeld.isChi() || this.winningMeld.isPair());
	};
	PointCalculator.prototype.calculate = function(){
		var points;
		if(this.isChiToiTsu){
			points = this.calculateChiToiTsu();
		} else {
			points = this.calculateNormal();
		}
		this.tallyPoints(points);
		return points;
	};
	PointCalculator.prototype.tallyPoints = function(points){
		var breakdown = {};
		points.breakdown = breakdown;
		var options = this.options;
		var semiClosed = this.semiClosed;
		// Doras
		breakdown.dora = options.dora;
		// Points from options
		if(options.chanKan) breakdown.ChanKan = 1;
		if(options.doubleRiichi) breakdown.DoubleRiichi = 1;
		if(options.haiTei) breakdown.HaiTei = 1;
		if(options.houTei) breakdown.HouTei = 1;
		if(options.ippatsu) breakdown.Ippatsu = 1;
		if(options.tsumo && semiClosed) breakdown.MenzenTsumo = 1;
		if(options.riichi) breakdown.Riichi = 1;
		if(options.rinshanKaihou) breakdown.RinshanKaihou = 1;
		// Regular points
		if(points.IiPeiKou && !points.RyanPeiKou) breakdown.IiPeiKou = 1;
		if(points.PinFu) breakdown.PinFu = 1;
		if(points.TanYao) breakdown.TanYao = 1;
		// Yakuhai
		if(points.Haku) breakdown.Haku = 1;
		if(points.Hatsu) breakdown.Hatsu = 1;
		if(points.Chun) breakdown.Chun = 1;
		if(points.RoundWind) breakdown.RoundWind = 1;
		if(points.SeatWind) breakdown.SeatWind = 1;
		// End Yakuhai
		if(points.Chanta && !points.JunChanta && !points.HonRouTou){
			if(semiClosed){
				breakdown.Chanta = 2;
			} else {
				breakdown.Chanta = 1;
			}
		}
		if(points.ChiToiTsu && !points.RyanPeiKou) breakdown.ChiToiTsu = 2;
		if(points.HonRouTou) breakdown.HonRouTou = 2; 
		if(points.Itsuu){
			if(semiClosed){
				breakdown.Itsuu = 2; 
			} else {
				breakdown.Itsuu = 1; 
			}
		}
		if(options.openRiichi) breakdown.OpenRiichi = 2;
		if(points.SanAnKou) breakdown.SanAnKou = 2;
		if(points.SanKanTsu) breakdown.SanKanTsu = 2;
		if(points.SanShokuDouJun){
			if(semiClosed){
				breakdown.SanShokuDouJun = 2;
			} else {
				breakdown.SanShokuDouJun = 1;
			}
		}
		if(points.SanShokuDouKou) breakdown.SanShokuDouKou = 2;
		if(points.ToiToi) breakdown.ToiToi = 2;
		if(points.HonItsu && !points.ChinItsu){
			if(semiClosed){
				breakdown.HonItsu = 3;
			} else {
				breakdown.HonItsu = 2;
			}
		}
		if(points.JunChanta){
			if(semiClosed){
				breakdown.JunChanta = 3;
			} else {
				breakdown.JunChanta = 2;
			}
		}
		if(points.RyanPeiKou && !points.ChiToiTsu) breakdown.RyanPeiKou = 3;
		if(points.ShouSanGen) breakdown.ShouSanGen = 2;
		if(points.ChinItsu){
			if(semiClosed){
				breakdown.ChinItsu = 6;
			} else {
				breakdown.ChinItsu = 5;
			}
		}
		points.han = 0;
		for (var point in breakdown){
			points.han += breakdown[point];
		}
		points.fuBreakdown = this.calculateFu();

		var fu = points.fuBreakdown.total;
		var han = points.han;
		var basePoints = fu * Math.pow(2, han + 2);
		var noLimits = basePoints;
		if(basePoints >= 2000){
			basePoints = this.getLimitHand(han);
		}
		if(this.options.seatWind == Tile.EAST){
			points.isDealer = true;
			points.tsumo = this.options.tsumo;
			if(this.options.tsumo){
				points.othersPay = Math.ceil(basePoints * 2 / 100) * 100;
				points.dealerPays = 0;
				points.noLimitsOthersPay = Math.ceil(noLimits * 2 / 100) * 100;
				points.noLimitsDealerPays = 0;
			} else {
				points.othersPay = Math.ceil(basePoints * 6 / 100) * 100;
				points.dealerPays = 0;
				points.noLimitsOthersPay = Math.ceil(noLimits * 6 / 100) * 100;
				points.noLimitsDealerPays = 0;
			}
		} else {
			if(this.options.tsumo){
				points.othersPay = Math.ceil(basePoints / 100) * 100;
				points.dealerPays = Math.ceil(basePoints * 2 / 100) * 100;
				points.noLimitsOthersPay = Math.ceil(noLimits / 100) * 100;
				points.noLimitsDealerPays = Math.ceil(noLimits * 2 / 100) * 100;
			} else {
				points.othersPay = Math.ceil(basePoints * 4/ 100) * 100;
				points.dealerPays = 0;
				points.noLimitsOthersPay = Math.ceil(noLimits * 4/ 100) * 100;
				points.noLimitsDealerPays = 0;
			}
		}
	};
	PointCalculator.prototype.getLimitHand = function(han){
		if(han <= 5){
			return 2000;
		} else if(han == 6 || han == 7){
			return 3000;
		} else if(8 <= han && han <= 10){
			return 4000;
		} else if(11 <= han && han <= 12){
			return 6000;
		} else {
			return 8000;
		}
	};
	PointCalculator.prototype.calculateFu = function(){
		var fuBreakdown = this.calculateFuNoRounding();
		fuBreakdown.total = Math.ceil(fuBreakdown.total / 10) * 10;
		return fuBreakdown;
	}
	PointCalculator.prototype.calculateFuNoRounding = function(){
		var fuBreakdown = {
			minKou: 0,
			anKou: 0,
			endMinKou: 0,
			endAnKou: 0,
			minKan: 0,
			anKan: 0,
			endMinKan: 0,
			endAnKan: 0,
			tsumo: 0,
			kanchanMachi: 0,
			penchanMachi: 0,
			tankiMachi: 0,
			pair: 0,
			base: 20,
			tsumo: 0,
			menzenRon: 0,
			total: 20,
		};
		if(this.isPinFu()){
			if(this.options.tsumo){
				fuBreakdown.tsumo = 0;
				fuBreakdown.total = 20;
				return fuBreakdown;
			} else {
				fuBreakdown.menzenRon = 10;
				fuBreakdown.total = 30;
				return fuBreakdown;
			}
		}
		if(this.isChiToiTsu){
			fuBreakdown.chitoitsu = 25;
			fuBreakdown.total = 25;
			return fuBreakdown;
		}
		if(this.options.tsumo){
			fuBreakdown.tsumo = 2;
			fuBreakdown.total += 2;
		} else if(!this.options.tsumo && this.semiClosed){
			fuBreakdown.menzenRon = 10;
			fuBreakdown.total += 10;
		}
		// Handle closed melds
		for (var i = 0; i < this.melds.length; i++) {
			var meld = this.melds[i];
			if(meld.isPon()){
				if(meld.isKan()){
					if(meld.getRepresentitiveTile().isEnd()){
						fuBreakdown.endAnKan += 32;
						fuBreakdown.total += 32;
					} else {
						fuBreakdown.anKan += 16;
						fuBreakdown.total += 16;
					}
				} else {
					if(meld.getRepresentitiveTile().isEnd()){
						fuBreakdown.endAnKou += 8;
						fuBreakdown.total += 8;
					} else {
						fuBreakdown.anKou += 4;
						fuBreakdown.total += 4;
					}
				}
			}
		};
		// Handle open melds
		for (var i = 0; i < this.openMelds.length; i++) {
			var meld = this.openMelds[i];
			if(meld.isPon()){
				if(meld.isKan()){
					if(meld.getRepresentitiveTile().isEnd()){
						fuBreakdown.endMinKan += 16;
						fuBreakdown.total += 16;
					} else {
						fuBreakdown.minKan += 8;
						fuBreakdown.total += 8;
					}
				} else {
					if(meld.getRepresentitiveTile().isEnd()){
						fuBreakdown.endMinKou += 4;
						fuBreakdown.total += 4;
					} else {
						fuBreakdown.minKou += 2;
						fuBreakdown.total += 2;
					}
				}
			}
		};
		if(this.pair && this.pair.getRepresentitiveTile().isHonor()){
			var tile = this.pair.getRepresentitiveTile().getNumber();
			if(tile == Tile.HAKU || tile == Tile.HATSU || tile == Tile.CHUN){
				fuBreakdown.pair += 2;
				fuBreakdown.total += 2;
			}
			if(tile == this.options.roundWind){
				fuBreakdown.pair += 2;
				fuBreakdown.total += 2;
			}
			if(tile == this.options.seatWind){
				fuBreakdown.pair += 2;
				fuBreakdown.total += 2;
			}
		}
		if(this.wait.isTanki()){
			fuBreakdown.tankiMachi = 2;
			fuBreakdown.total += 2;
		}
		return fuBreakdown;
	};
	PointCalculator.prototype.calculateNormal = function(){
		var points = {}
		points.PinFu = this.isPinFu();
		points.IiPeiKou = this.isIiPeiKou();
		points.TanYao = this.isTanYao();
		this.calculateYakuhai(points);
		points.Chanta = this.isChanta();
		points.HonRouTou = this.isHonRouTou();
		points.Itsuu = this.isItsuu();
		points.SanAnKou = this.isSanAnKou();
		points.SanShokuDouJun = this.isSanShokuDouJun();
		points.SanShokuDouKou = this.isSanShokuDouKou();
		points.ToiToi = this.isToiToi();
		points.HonItsu = this.isHonItsu();
		points.JunChanta = this.isJunChanta();
		points.RyanPeiKou = this.isRyanPeiKou();
		points.ShouSanGen = this.isShouSanGen();
		points.ChinItsu = this.isChinItsu();
		return points;
	};
	PointCalculator.prototype.calculateChiToiTsu = function(){
		var points = {};
		// Automatic point
		points.ChiToiTsu = true;

		points.TanYao = this.isTanYao();
		points.HonItsu = this.isHonItsu();
		points.HonRouTou = this.isHonRouTou();
		points.ChinItsu = this.isChinItsu();
		return points;
	};
	PointCalculator.prototype.isPinFu = function() {
		// Pin fu must be closed
		if(!this.semiClosed){
			return false;
		}
		// Everything must be a chi
		for (var i = 0; i < this.completeMelds.length; i++) {
			if(!this.completeMelds[i].isChi()){
				return false;
			}
		}
		// Must have exactly 3 melds
		if(this.completeMelds.length != 3){
			return false;
		}
		// Must be two sided
		if(!this.wait.isTwoSided()){
			return false;
		}
		if(!this.pair){
			return false;
		}
		var tile = this.pair.getRepresentitiveTile();
		if(tile.isHonor()){
			var number = tile.getNumber();
			if(number == Tile.HAKU ||
				number == Tile.HATSU ||
				number == Tile.CHUN){
				return false;
			}
			if(number == this.options.roundWind || number == this.options.seatWind){
				return false;
			}
		}
		return true;
	};
	PointCalculator.prototype.isIiPeiKou = function(){
		if(!this.semiClosed){
			return false;
		}
		// Check every pair of melds
		for (var i = 0; i < this.allMelds.length; i++) {
			var meld1 = this.allMelds[i];
			if(!meld1.isChi()){
				continue;
			}
			for (var j = i + 1; j < this.allMelds.length; j++) {
				var meld2 = this.allMelds[j];
				if(meld1.equals(meld2)){
					return true;
				}
			}
		}
		return false;
	};
	PointCalculator.prototype.isTanYao = function(){
		for (var i = 0; i < this.tiles.length; i++) {
			var tile = this.tiles[i];
			if(tile.isEnd()){
				return false;
			}
		}
		return true;
	};
	PointCalculator.prototype.calculateYakuhai = function(points){
		for (var i = 0; i < this.allMelds.length; i++) {
			var meld = this.allMelds[i];
			if(!meld.isPon()){
				continue;
			}
			var tile = meld.getRepresentitiveTile();
			if(!tile.isHonor()){
				continue;
			}
			if(tile.getNumber() == Tile.HATSU){
				points.Hatsu = true;
			} else if(tile.getNumber() == Tile.HAKU){
				points.Haku = true;
			} else if(tile.getNumber() == Tile.CHUN){
				points.Chun = true;
			} else {
				// Round and seat winds
				if(tile.getNumber() == this.options.roundWind){
					points.RoundWind = tile.getNumber();
				}
				if(tile.getNumber() == this.options.seatWind){
					points.SeatWind = tile.getNumber();
				}
			}
		};
	};
	PointCalculator.prototype.isChanta = function() {
		var pairTile;
		if(this.pair){
			pairTile = this.pair.getRepresentitiveTile();
		} else {
			// Tanki
			pairTile = this.wait.getRepresentitiveTile();
		}
		if(!pairTile.isEnd()){
			return false;
		}
		// Make sure each meld has an end tile
		for (var i = 0; i < this.allMelds.length; i++) {
			var foundEnd = false;
			var meld = this.allMelds[i];
			for (var j = 0; j < meld.getTiles().length; j++) {
				var tile = meld.getTiles()[j];
				if(tile.isEnd()){
					foundEnd = true;
					break;
				}
			};
			// One meld did not have an end tile
			if(!foundEnd){
				return false;
			}
		};
		return true;
	};
	PointCalculator.prototype.isJunChanta = function() {
		var pairTile;
		if(this.pair){
			pairTile = this.pair.getRepresentitiveTile();
		} else {
			// Tanki
			pairTile = this.wait.getRepresentitiveTile();
		}
		if(!pairTile.isEnd() || pairTile.isHonor()){
			return false;
		}
		// Make sure each meld has an end tile
		for (var i = 0; i < this.allMelds.length; i++) {
			var foundEnd = false;
			var meld = this.allMelds[i];
			for (var j = 0; j < meld.getTiles().length; j++) {
				var tile = meld.getTiles()[j];
				if(tile.isEnd() && !pairTile.isHonor()){
					foundEnd = true;
					break;
				}
			};
			// One meld did not have an end tile
			if(!foundEnd){
				return false;
			}
		};
		return true;
	};
	PointCalculator.prototype.isHonRouTou = function() {
		for (var i = 0; i < this.tiles.length; i++) {
			var tile = this.tiles[i];
			if(!tile.isEnd()){
				return false;
			}
		};
		return true;
	};
	PointCalculator.prototype.isItsuu = function(){
		var man = [false, false, false];
		var sou = [false, false, false];
		var pin = [false, false, false];
		for (var i = 0; i < this.allMelds.length; i++) {
			var meld = this.allMelds[i];
			if(!meld.isChi()){
				continue;
			}
			var array;
			switch(meld.getFirstTile().getSuit()){
				case 'm':
					array = man;
					break;
				case 's':
					array = sou;
					break;
				case 'p':
					array = pin;
					break;
				default:
					continue;
			}
			switch(meld.getFirstTile().getNumber()){
				case 1:
					array[0] = true;
					break;
				case 4:
					array[1] = true;
					break;
				case 7:
					array[2] = true;
					break;
				default:
					continue;
			}
		};
		return (man[0] && man[1] && man[2]) ||
			(sou[0] && sou[1] && sou[2]) ||
			(pin[0] && pin[1] && pin[2]);
	};
	PointCalculator.prototype.isSanAnKou = function(){
		var anKous = 0;
		for (var i = 0; i < this.melds.length; i++) {
			var meld = this.melds[i];
			if(meld.isPon()){
				anKous++;
			}
		};
		if(this.options.tsumo){
			if(this.winningMeld.isPon()){
				anKous++;
			}
		}
		return anKous >= 3;
	};
	PointCalculator.prototype.isSanShokuDouJun = function(){
		var melds = [];
		for (var i = 0; i < this.allMelds.length; i++) {
			var meld = this.allMelds[i];
			if(meld.isChi()){
				melds.push(this.allMelds[i]);
			}
		};
		// Sort based on their tile number
		melds.sort(function(meld1, meld2){
			return meld1.getFirstTile().getNumber() - meld2.getFirstTile().getNumber();
		});
		var man = null;
		var sou = null;
		var pin = null;
		var number = 0;
		for (var i = 0; i < melds.length; i++) {
			var meld = melds[i];
			var firstTile = meld.getFirstTile();
			// Reset
			if(firstTile.getNumber() != number){
				number = firstTile.getNumber();
				man = null;
				sou = null;
				pin = null;
			}
			switch(firstTile.getSuit()){
				case 'm':
					man = meld;
					break;
				case 's':
					sou = meld;
					break;
				case 'p':
					pin = meld;
					break;
				default:
					throw new Error("Unknown suit");
			}
			if(man && sou && pin){
				return true;
			}
		};
		return false;
	};
	PointCalculator.prototype.isSanShokuDouKou = function(){
		var melds = [];
		for (var i = 0; i < this.allMelds.length; i++) {
			var meld = this.allMelds[i];
			if(meld.isPon()){
				melds.push(this.allMelds[i]);
			}
		};
		// Sort based on their tile number
		melds.sort(function(meld1, meld2){
			return meld1.getRepresentitiveTile().getNumber() - meld2.getRepresentitiveTile().getNumber();
		});
		var man = null;
		var sou = null;
		var pin = null;
		var number = 0;
		for (var i = 0; i < melds.length; i++) {
			var meld = melds[i];
			var firstTile = meld.getRepresentitiveTile();
			// Reset
			if(firstTile.getNumber() != number){
				number = firstTile.getNumber();
				man = null;
				sou = null;
				pin = null;
			}
			switch(firstTile.getSuit()){
				case 'm':
					man = meld;
					break;
				case 's':
					sou = meld;
					break;
				case 'p':
					pin = meld;
					break;
				default:
					// Honor tiles
					continue;
			}
			if(man && sou && pin){
				return true;
			}
		};
		return false;
	};
	PointCalculator.prototype.isToiToi = function(){
		for (var i = 0; i < this.allMelds.length; i++) {
			if(!this.allMelds[i].isPon()){
				return false;
			}
		};
		return true;
	};
	PointCalculator.prototype.isHonItsu = function(){
		var suit = null;
		for (var i = 0; i < this.tiles.length; i++) {
			var tile = this.tiles[i];
			if(tile.isHonor()){
				continue;
			}
			if(!suit){
				suit = tile.getSuit();
				continue;
			}
			if(suit != tile.getSuit()){
				return false;
			}
		};
		// Must have at least one of the tile in the suit
		if(suit == null){
			return false;
		}
		return true;
	};
	PointCalculator.prototype.isRyanPeiKou = function(){
		var iipeikou1 = -1;
		var iipeikou2 = -1;
		// Finds an ii pei kou then finds another and makes sure they aren't the same one
		for (var i = 0; i < this.allMelds.length; i++) {
			var meld1 = this.allMelds[i];
			if(!meld1.isChi()){
				continue;
			}
			for (var j = i + 1; j < this.allMelds.length; j++) {
				var meld2 = this.allMelds[j];
				if(meld1.equals(meld2)){
					// First ii pei kou
					if(iipeikou1 < 0 && iipeikou2 < 0){
						iipeikou1 = i;
						iipeikou2 = j;
					} else if(
						iipeikou1 != i &&
						iipeikou2 != i &&
						iipeikou1 != j &&
						iipeikou2 != j
					) {
						return true;
					}
				};
			};
		};
		return false;
	};
	PointCalculator.prototype.isShouSanGen = function(){
		var points = {};
		this.calculateYakuhai(points);
		var count = 0;
		if(points.Haku) { count++; }
		if(points.Hatsu) { count++; }
		if(points.Chun) { count++; }
		// Already eliminates dai san gen possibility
		if(count != 2){
			return false;
		}
		// If pair is already dragon
		if(this.pair && this.pair.getRepresentitiveTile().isDragon()){
			return true;
		}
		// Shanpon case, can't be dai san gen from above
		if(this.wait.isPair() && this.wait.getRepresentitiveTile().isDragon()){

		}
		// Other option is tanki wait
		if(this.wait.isTanki() && this.wait.getRepresentitiveTile().isDragon()){
			return true;
		}
	};
	PointCalculator.prototype.isChinItsu = function(){
		var firstTile = this.tiles[0];
		if(firstTile.isHonor()){
			return false;
		}
		for (var i = 0; i < this.tiles.length; i++) {
			var tile = this.tiles[i];
			if(firstTile.getSuit() != tile.getSuit()){
				return false;
			}
		};
		return true;
	};
	// PointCalculator.prototype.
}());

/**
 *	Represents a hand with the melds seperated
 *
 */
function HandDivision(hand, shanten){
	this.melds = [];
	this.openMelds = [];
	this.closedKans = [];
	this.winningTile = null;

	for(var i = 0; i < hand.length; i++){
		var meld = [];
		for(var j = 0; j < hand[i].length; j++){
			meld.push(new Tile({index: hand[i][j]}));
		}
		this.melds.push(new Meld(meld));
	}
	this.shanten = shanten;


	this.options = {
		// Points
		riichi: false,
		doubleRiichi: false,
		chanKan: false,
		haiTei: false,
		houTei: false,
		ippatsu: false,
		rinshanKaihou: false,
		openRiichi: false,
		// Options
		seatWind: false,
		roundWind: false,
		tsumo: false,
		// Dora
		dora: 0,
	};
}

(function(){
	HandDivision.prototype.toString = function(){
		var out = "Shanten: " + this.shanten + "\n";
		var encodedMelds = this.melds.map(function(meld){
			return meld.getTiles().reduce(function(l, r){
				return l + r.toString();
			}, "");
		}).join(", ");
		return out + encodedMelds + " Win:" + this.winningTile.toString();
	};

	HandDivision.prototype.createPointCalculator = function(){
		return new PointCalculator(this, this.options);
	}

	HandDivision.prototype.calculatePoints = function(){
		var pointCalculator = this.createPointCalculator();
		if(pointCalculator.isValidWait()){
			return pointCalculator.calculate();
		} else {
			return null;
		}
	};

	HandDivision.prototype.getWaits = function(){
		return this.createPointCalculator().getWaits();
	}

	HandDivision.prototype.print = function() {
		var pointCalculator = this.createPointCalculator();
		if(pointCalculator.isValidWait()){
			console.log(this.toString());
			console.log(pointCalculator.calculate());
		} else {
			console.log("Invalid hand");
		}
	};

	HandDivision.prototype.isWin = function(){
		return this.shanten == 0 && this.winningTile
	};
	
	HandDivision.prototype.setOptions = function(options){
		for(var key in this.options){
			if(options[key] !== undefined){
				this.options[key] = options[key];
			}
		}
	}
	
	HandDivision.prototype.addOpenMeld = function(meld){
		this.openMelds.push(meld);
	}

	HandDivision.prototype.addClosedKan = function(meld){
		this.closedKans.push(meld);
	}

	HandDivision.prototype.setWinningTile = function(tile){
		this.winningTile = tile;
	}
}());

/**
 *	Calculates the shanten and meld combinations of a given hand
 *
 */
function HandCalculator(hand){
	this.hand = [];
	this.tileCount = 0;
	for(var i = 0; i <= Tile.MAX_INDEX; i++){
		this.hand[i] = 0;
	}

	for(var i = 0; i < hand.length; i++){
		var index = hand[i].getIndex();
		this.hand[index] ++;
		this.tileCount ++;
	}

	this.chi = [];
	this.pon = [];
	this.twoSided = [];
	this.center = [];
	this.pairs = [];
	this.singles = [];

	this.bestShanten = 100;
	this.validHands = [];

	this.meldsNeeded = Math.floor(this.tileCount / 3);

	this.calculate();
};
(function(){
	HandCalculator.prototype.isValid = function(){
		return this.tileCount % 3 == 1;
	};
	HandCalculator.prototype.calculate = function(){
		this.checkChiToi();
		this.runCalculation(0);
	};
	HandCalculator.prototype.addValidHand = function(hand, shanten){
		if(shanten < this.bestShanten){
			this.bestShanten = shanten;
			this.validHands = [];
			this.validHands.push(hand);
		} else if(shanten == this.bestShanten){
			this.validHands.push(hand);
		}
	};
	HandCalculator.prototype.checkChiToi = function(){
		var pairCount = 0;
		var hand = [];
		var wastedTiles = 0;
		for (var i = 0; i < this.hand.length; i++) {
			if(this.hand[i] >= 2){
				hand.push([i, i]);
				pairCount++;
				if(this.hand[i] >= 3){
					wastedTiles += this.hand[i] - 2;
					for (var j = 0; j < this.hand[j] - 2; j++) {
						hand.push([i]);
					};
				}
			} else if(this.hand[i] == 1){
				hand.push([i]);
			}
		}
		var shanten = Math.floor(this.tileCount / 2);
		shanten -= pairCount;
		shanten += wastedTiles;
		this.addValidHand(hand, shanten);
	};
	HandCalculator.prototype.getValidHands = function(){
		var validHands = [];
		for(var i = 0 ; i < this.validHands.length; i++){
			validHands.push(new HandDivision(this.validHands[i], this.bestShanten));
		}
		return validHands;
	};

	HandCalculator.prototype.calculateShanten = function(){
		var shanten = this.meldsNeeded * 2;
		var meldCount = this.chi.length + this.pon.length;
		shanten -= meldCount * 2;

		var extraPairs = 0;
		if(this.pairs.length > 0){
			shanten -= 1;
		}
		if(this.pairs.length > 1){
			extraPairs = this.pairs.length - 1;
		}

		var remainingMelds = this.meldsNeeded - meldCount;
		var oneTileSets = extraPairs + this.twoSided.length + this.center.length;

		shanten -= Math.min(oneTileSets, remainingMelds);
		var hand = new Array().concat(this.pon, this.chi, this.twoSided, this.center, this.pairs, this.singles);
		this.addValidHand(hand, shanten);
	};

	HandCalculator.prototype.runCalculation = function(i){
		if(i > Tile.MAX_INDEX){
			this.calculateShanten();
			return;
		}
		var count = this.hand[i];
		// Fake to allow impossible hands
		if(count > 4){
			count = 4;
		}
		var number = Tile.getNumberFromIndex(i);
		var suit = Tile.getSuitFromIndex(i);
		switch(count){
			case 4:
			case 3:
				this.doPon(i);
				this.runCalculation(i);
				this.undoPon(i);
			case 2:
				this.doPair(i);
				this.runCalculation(i);
				this.undoPair(i);
			case 1:
				if(this.hand[i] && this.hand[i+1] && this.hand[i+2] && number < 8 && suit != 'h'){
					this.doChi(i);
					this.runCalculation(i);
					this.undoChi(i);
				}
				if(this.hand[i] && this.hand[i+1] && number < 9 && suit != 'h'){
					this.doTwoSided(i);
					this.runCalculation(i);
					this.undoTwoSided(i);
				}
				if(this.hand[i] && this.hand[i+2] && number < 8 && suit != 'h'){
					this.doCenter(i);
					this.runCalculation(i);
					this.undoCenter(i);
				}
				this.doSingle(i);
				this.runCalculation(i);
				this.undoSingle(i);
				break;
			case 0:
				this.runCalculation(i+1);
				break;
		}
	};

	HandCalculator.prototype.doChi = function(i) {
		this.hand[i]--;
		this.hand[i+1]--;
		this.hand[i+2]--;
		this.chi.push([i, i+1, i+2]);
	};

	HandCalculator.prototype.undoChi = function(i) {
		this.hand[i]++;
		this.hand[i+1]++;
		this.hand[i+2]++;
		this.chi.pop();
	};

	HandCalculator.prototype.doPon = function(i) {
		this.hand[i] -= 3;
		this.pon.push([i, i, i]);
	};

	HandCalculator.prototype.undoPon = function(i) {
		this.hand[i] += 3;
		this.pon.pop();
	};

	HandCalculator.prototype.doTwoSided = function(i) {
		this.hand[i]--;
		this.hand[i+1]--;
		this.twoSided.push([i, i+1]);
	};

	HandCalculator.prototype.undoTwoSided = function(i) {
		this.hand[i]++;
		this.hand[i+1]++;
		this.twoSided.pop();
	};

	HandCalculator.prototype.doCenter = function(i) {
		this.hand[i]--;
		this.hand[i+2]--;
		this.center.push([i, i+2]);
	};

	HandCalculator.prototype.undoCenter = function(i) {
		this.hand[i]++;
		this.hand[i+2]++;
		this.center.pop();
	};

	HandCalculator.prototype.doPair = function(i) {
		this.hand[i] -= 2;
		this.pairs.push([i, i]);
	};

	HandCalculator.prototype.undoPair = function(i) {
		this.hand[i] += 2;
		this.pairs.pop();
	};

	HandCalculator.prototype.doSingle = function(i) {
		this.hand[i] --;
		this.singles.push([i]);
	};

	HandCalculator.prototype.undoSingle = function(i) {
		this.hand[i] ++;
		this.singles.pop();
	};
}());

var lib = {
	Tile: Tile,
	Meld: Meld,
	Hand: Hand,
};
if(typeof module != 'undefined'){
	module.exports = lib;
}
if(typeof window != 'undefined'){
	window.Riichi = lib;
}
})();