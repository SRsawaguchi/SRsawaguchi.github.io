const NUM_PLAYERS = 2;
const MAX_DICE = 3;
const BOARD_SIZE = 5;
const BOARD_HEXNUM = BOARD_SIZE * BOARD_SIZE;
const BOARD_WIDTH = 900;
const BOARD_SCALE = 64;
const TOP_OFFSET = 3;
const DICE_SCALE = 50;
const DOT_SIZE = 0.05;
const PLAYER_COLORS = ['#0F0','#00F'];
const HEX_COLOR = '#F00'

function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    var temp = obj.constructor();
    for (var key in obj) {
        temp[key] = cloneObject(obj[key]);
    }
 
    return temp;
}

function getRandomInt(min, max) {
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

var Hex = function (playerId , diceCount){
  this.playerId = playerId;
  this.diceCount = diceCount;
}
Hex.prototype = {
  init :
    function(playerId,diceCount){
      this.playerId = playerId;
      this.diceCount = diceCount;
      return this;
    },
  toString :
    function(){
      return this.playerId + '-' + this.diceCount;
    }
}

function initBoard(){
  var board = [];
  for(var i=0;i<BOARD_HEXNUM;i++){
    var r = getRandomInt(0,NUM_PLAYERS-1);
    var d = getRandomInt(1,MAX_DICE);
    board.push(new Hex(r,d));
  }

  return board;
}

function drawBoard(board){
  var L = board.length;
  for(var r=0;r<BOARD_SIZE;r++){
    var line = '';
    //空白を作成
    for(var i=0;i<BOARD_SIZE-r;i++){
      line += ' ';
    }

    for(var c=0;c<BOARD_SIZE;c++){
      line += board[r * BOARD_SIZE + c].toString() + ' ';
    }
    console.log(line);
  }
}

var UIdata = function(){
  this.input = [];
  this.cond  = 'getSrc';
}
UIdata.prototype = {
  clearInput :
    function(){
      this.input.splice(0);
      return this;
    }
};

var GameNode = function(playerId,board,attackCount,spareDice,moves){
  this.playerId = playerId;
  this.board = board;
  this.attackCount = attackCount;
  this.moves = (moves == undefined) ? [] : moves;
  this.spareDice = spareDice;
  this.uiData = new UIdata();
}
GameNode.prototype = {
}

var GameMove = function(moveType,src,dst){
  this.moveType = moveType;
  this.src = src;
  this.dst = dst;
  this.nextNode = undefined;
}
GameMove.prototype = {
  toString :
    function(){
      if(this.moveType == 'atk'){
        return '[atk : ' + this.src + ' -> ' + this.dst + ']';
      }
      else if(this.moveType == 'pass'){
        return '[pass]';
      }
    }
};

function findNeighbors(pos){
  var upRight  = pos - BOARD_SIZE;
  var downLeft = pos + BOARD_SIZE;
  var neighbors = [upRight,downLeft];

  //左端ではないとき
  if( (pos % BOARD_SIZE) != 0 ){
    var upLeft = upRight - 1;
    var left   = pos - 1;

    neighbors.push(upLeft);
    neighbors.push(left);
  }

  //右端ではないとき
  if( ((pos + 1) % BOARD_SIZE) != 0 ){
    var downRight = downLeft + 1;
    var right = pos + 1;

    neighbors.push(downRight);
    neighbors.push(right);
  }

  return neighbors.filter(
      function(n){
        //ボード内のもののみ抽出 0 <= n < BOARD_HEXNUM
        return (n >= 0) && (n < BOARD_HEXNUM);
      }).sort();
}

function findMoves(gameNode){
  var board = gameNode.board;
  var cur_player = gameNode.playerId;
  var moves = [];

  //1回以上攻撃している場合、相手にターンを渡す
  if(gameNode.attackCount > 0){
    var passing = new GameMove('pass');
    moves.push(passing);
  }

  //自分のマスを取得する(添え字の形式で取得)
  var myHexes = getPlayerHexes(board,cur_player);
  
  myHexes.forEach(
      function(src){
        var neighbors = findNeighbors(src);

        neighbors.forEach(
          function(dst){
            var srcHex = board[src];
            var dstHex = board[dst];

            if( (srcHex.playerId != dstHex.playerId) &&
              (srcHex.diceCount > dstHex.diceCount) ){
                var move = new GameMove('atk',src,dst);
                moves.push(move);
              }//end if
          });
      });

  return moves;
}

function getNextPlayerId(gameNode){
  return (gameNode.playerId + 1) % NUM_PLAYERS;
}

function getPlayerColor(playerId){
  return PLAYER_COLORS[playerId];
}

function getPlayerHexes(board,playerId){
  var ids = [];
  for(var i=0,L=board.length;i<L;i++){
    if(board[i].playerId == playerId){
      ids.push(i);
    }
  }
  return ids;
}

function turnEnd(node){
  var pId    = node.playerId;
  var spDice = node.spareDice - 1;
  var board  = node.board;
  var targetHexes = getPlayerHexes(board,pId);

  //さいころの補給を行う。
  //獲得さいころ(spDice)がゼロになるか、所有するすべてのマスが最大さいころ数になったら終了
  var idx = 0;
  var L   = targetHexes.length;
  while(spDice > 0 && board.some(function(elt){return elt.diceCount < MAX_DICE;})){
    var hex = board[targetHexes[idx]];
    if(hex.diceCount < MAX_DICE){
      hex.diceCount++;
      spDice--;
    }
    idx = (idx + 1) % L;
  }//end while

  //次のプレーヤーへ書き換え
  node.playerId = getNextPlayerId(node);
  node.attackCount = 0;
  node.spareDice = 0;
  node.moves = findMoves(node);

  return node;
}

function atkHex(gameNode,move){
  var srcHex = gameNode.board[move.src];
  var dstHex = gameNode.board[move.dst];

  //相手のさいころを獲得する
  var winDice = dstHex.diceCount;

  //相手方ますを獲得する
  dstHex.playerId  = gameNode.playerId;
  
  //攻撃元のマスは1個除いて、攻撃先のマスに移される。
  dstHex.diceCount = srcHex.diceCount - 1;
  srcHex.diceCount = 1;

  //獲得さいころを追加する
  gameNode.spareDice += winDice;

  //攻撃回数を１増加する
  gameNode.attackCount++;

  //攻撃後のマスから、選択可能な手を再設定する
  gameNode.moves = findMoves(gameNode);

  return gameNode;
}

function nextNode(currentNode,move){
  var node = cloneObject(currentNode);
  if(move.moveType == 'pass'){
    node.uiData.clearInput();
    node.uiData.cond = 'getSrc';
    return turnEnd(node);
  }else if(move.moveType == 'atk'){
    node.uiData.clearInput();
    node.uiData.cond = 'getSrc';
    return atkHex(node,move);
  }
}

function isGameOver(gameNode){
  return gameNode.moves.length <= 0;
}

function getComputerInput(gameNode){
  /* めんどくさいので最初は乱数で返す。。。 */
    console.log('len = ' + gameNode.moves.length);
    return getRandomInt(0,gameNode.moves.length - 1);
}

/* とりあえず、CpuのIDは1固定で */
function getCpuId(node){
  return 1;
}

function svgDice(x,y,rgbColor,scale){
  function calcPt(pt){
    return new Pt(x + scale * pt.x, y + scale * pt.y);
  }

  function drwPolygon(points,color){
    var style = {fill : color.toString()};
    return makePolygon(points.pointArray.map(calcPt),style);
  }

  var dice = 
    [drwPolygon(new Points(0,-1   , -0.6,-0.75 ,    0,-0.5 , 0.6,-0.75),rgbColor.brightness(40)),
    drwPolygon(new Points(0,-0.5 , -0.6,-0.75 , -0.6,   0 ,   0, 0.25),rgbColor),
    drwPolygon(new Points(0,-0.5 ,  0.6,-0.75 ,  0.6,   0 ,   0, 0.25),rgbColor.brightness(-40))];
  return dice;
}

function svgHex(xx,yy,col,scale){
  function calcPt(pt,z){
    return new Pt(xx + (scale * pt.x),
        yy + (scale * (pt.y + (1 - z) * 0.1)));
  }
  function drwPolygon(points,color){
    var style = {fill : color.toString(),
      stroke : new RGBA(155,0,0).toString()};
    var pts = [];
    for(var i=0;i<2;i++){
      var abspt = points.pointArray.map(
          function(pt){
            return calcPt(pt,i);
          });
      pts = pts.concat(abspt);
    }
    return makePolygon(pts,style);
  }

  var pts = new Points(-1,-0.2 , 0,-0.5 , 1,-0.2 , 1,0.2 , 0,0.5 , -1,0.2);
  return drwPolygon(pts,col);
}

function makeHexId(no){
  return 'hex_' + no;
}

function makeHexIdArray(length){
  var idArr = [];
  for(var i=0;i<length;i++){
    idArr.push(makeHexId(i));
  }
  return idArr;
}

function getHexNo(strId){
  return parseInt(strId.split('_')[1]);
}

function setHexClickListener(node){
  for(var i=-1;i<BOARD_HEXNUM;i++){
    var id = makeHexId(i);
    var e  = document.getElementById(id);
    if(e != null){
      e.onclick = function(){
        onHexClick(this.id,node);
      }
    }//end if
  }//end for
}

function setGameSVG(svg,node){
  document.getElementsByTagName('svg')[0].innerHTML = drawAll(svg);
  setHexClickListener(node);
}

function getMove(node,src,dst){
  var moves = node.moves;
  var target = -1;
  for(var i=0,L=moves.length;i<L;i++){
    var m = moves[i];
    if(m.moveType == 'atk'){
      if( (m.src == src) && (m.dst == dst) ){
        target = i;
        break;
      }//end if
    }//end if
  }//end for
  return target;
}

function onHexClick(hexId,node){
  var ui  = node.uiData;
  var dom = document.getElementById(hexId);


  //攻撃元選択
  if(ui.cond == 'getSrc'){
    if(getHexNo(hexId) == -1){
      node = nextNode(node,node.moves[0]);
    }else{
      ui.input.push(getHexNo(hexId));
      ui.cond = 'getDst';
    }
  //攻撃先選択
  }else if(ui.cond == 'getDst'){
    ui.input.push(getHexNo(hexId));
    var move = getMove(node,ui.input[0],ui.input[1]);
    if(move == -1){
      ui.clearInput();
      ui.cond = 'getSrc';
      alert('攻撃できません。');
    }else{
      node = nextNode(node,node.moves[move]);
    }//end if

  //不正な入力(なんかのエラー)
  }else{
    alert('無効な操作です');
  }//end if

  drawGameInfo(node.playerId,node.spareDice,node.attackCount);

  while(node.playerId == getCpuId(node) && !isGameOver(node)){
    var choice = getComputerInput(node);
    node = nextNode(node,node.moves[choice]);
    drawGameInfo(node.playerId,node.spareDice,node.attackCount);
  }

  var svg = drawSvgBoard(node);
  setGameSVG(svg,node);

  if(isGameOver(node)){
    //厳密にいえば違うが、2人だけのバトルだからOK
    var winner = getWinner(node);
    alert('game over!!' + getPlayerName(winner) +'の勝利です');
  }

}

function getWinner(node){
  var cpu = 0;
  var you = 0;
  node.board.forEach(
      function(hex){
        if(hex.playerId == getCpuId()){
          cpu += hex.diceCount;
        }else{
          you += hex.diceCount;
        }
      });

  if(cpu == you){
    return -1;
  }else if(cpu > you){
    return getCpuId();
  }else{
    return 0;
  }
}

function getPlayerName(id){
  if(id == -1){
    return 'いません'
  }else if(id == getCpuId()){
    return 'COM';
  }else{
    return 'あなた';
  }
}

/* svgでやるといろいろめんどくさそうだし、とりあえず、HTMLで笑*/
function drawGameInfo(targetId,spareDice,attackCount){
  var info = document.getElementById('gameInfo' + targetId);
  info.getElementsByClassName('spareDice')[0].innerHTML = '獲得ダイス : ' + spareDice;
  info.getElementsByClassName('attackCount')[0].innerHTML = '攻撃回数   : ' + attackCount;
}

function drwHexInfo(no,x,y,xx,yy,diceCount,hexColor,diceColor){
  var svg = [];
  svg.push(svgHex(xx,yy,hexColor,60));
  for(var z=0;z<diceCount;z++){
    var dice;
    //奇数の時はちょっとずらす
    if( (x + y + z) % 2 == 1 ){
      dice = svgDice(
          xx + (50 * 0.3 * -0.3),
          yy - (50 * z   *  0.8),
          diceColor,
          50
          );
    }else{
      dice = svgDice(
          xx + (50 * 0.3 * 0.3),
          yy - (50 * z   * 0.8),
          diceColor,
          50
          );
    }
    svg.push(dice);
  }// end for
  return makeGroup({id : makeHexId(no)},svg);
}

function drawSvgBoard(gameNode){
  var svg = [];
  if(gameNode.attackCount > 0){
    var circle = makeCircle(50,50,45,{fill:'red'});
    circle.addAttribute('id',makeHexId(-1));
    svg.push(circle);
  }

  if(gameNode.playerId != getCpuId(node)){
    document.getElementById('gameMsg').innerHTML = 'あなたのターンです';
  }else{
    document.getElementById('gameMsg').innerHTML = 'CPUのターンです';
  }

  for(var x=0;x<BOARD_SIZE;x++){
    for(var y=0;y<BOARD_SIZE;y++){
      var idx = x + BOARD_SIZE * y;
      var hex = gameNode.board[idx];
      var xx  = BOARD_SCALE * ((1.88 * x) + (BOARD_SIZE - y));
      var yy  = BOARD_SCALE * ((0.65 * y) + TOP_OFFSET);
      var diceCol = makeRGB(getPlayerColor(hex.playerId));
      var hexCol  = makeRGB(HEX_COLOR);
      if(gameNode.playerId == hex.playerId){
        hexCol.brightness(100);
      }
      svg.push(drwHexInfo(idx,x,y,xx,yy,hex.diceCount,hexCol,diceCol));
    }
  }//end for(x)

  return svg;
}

var board = initBoard();
var node = new GameNode(0,board,0,0);
node.moves = findMoves(node);
var svg = drawSvgBoard(node,[]);
document.getElementsByTagName('svg')[0].innerHTML = drawAll(svg);
setHexClickListener(node);
