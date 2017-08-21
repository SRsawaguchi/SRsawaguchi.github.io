/*
 * 沢口直哉　SVG画像を作成するJSライブラリです。
 * Dice of Doomの画面描画用に制作しました。
 * */

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function isUndefined(x) {
    return x == undefined;
}

function surround(start, target, end) {
    end = isUndefined(end) ? start : end;
    return start + target + end;
}

function printTag(name, isCloseTag, attr) {
    var tg = '';
    if (isCloseTag) {
        tg += surround('</', name, '>');
    } else {
        tg += surround('<', name + ' ' + attr, '>');
    }
    return tg;
}

function arrayToAttr(arr){
  var attr = '';
  for(var k in arr){
    var v = arr[k];
    attr += k + '="' + v + '" '; // width="10" height="10"
  }
  return attr.trim();
}

/* class SvgGraph */
var SvgGraph = function(tagName,attr,innerGraph,text){
  innerGraph = isUndefined(innerGraph) ? [] : innerGraph;
  attr       = isUndefined(attr) ? [] : attr;
  text       = isUndefined(text) ? '' : text;

  this.attributes = attr;
  this.tagName = tagName;
  this.innerGraph = innerGraph;
  this.text = text;
}

SvgGraph.prototype = {
  addInnerGraph :
    function(g){
      this.innerGraph.push(g);
      return this;
    },

  addAllInnerGraph :
    function(graphs){
      for(var i=0,L=graphs.length;i<L;i++){
        this.addInnerGraph(graphs[i]);
      }
      return this;
    },

  addAttribute    : 
    function(k,v){
      this.attributes[k] = v;
      return this;
    },

  addAllAttribute : 
    function(attr){
      for(var k in attr){
        this.addAttribute(k,attr[k]);
      }
      return this;
    },

  addInnerGraph    :
    function(graph){
      this.innerGraph.push(graph);
      return this;
    },

  drawFunc :
    function(){
      return function(){
        var svg = '';
        svg += printTag(this.tagName,false,arrayToAttr(this.attributes));
        svg += this.text;
        svg += drawAll(this.innerGraph);
        svg += printTag(this.tagName,true);
        return svg;
      }
    },

  draw :
    function(){
      return this.drawFunc().call(this);
    }
};

function drawAll(graphArray){
  return graphArray.map(
      function(x){
        if(isArray(x)){
          return drawAll(x);
        }else{
          return x.draw();
        }
      }).join('');
}

function makeCircle(cx,cy,radius,style){
  var attr = { cx : cx, cy : cy, r : radius, style : arrayToStyle(style)};
  return new SvgGraph('circle',attr);
}

function makeEllipse(cx,cy,rx,ry,style){
  var attr = { cx : cx, cy : cy, rx : rx, ry : ry, style : arrayToStyle(style)};
  return new SvgGraph('ellipse',attr);
}

function makePolygon(points,style){
  var attr = {points : points.toString(), style : arrayToStyle(style)};
  return new SvgGraph('polygon',attr);
}

function makePolyline(points,style){
  var attr = {points : points.toString(), style : arrayToStyle(style)};
  return new SvgGraph('polyline',attr);
}

function makeRect(x,y,width,height,style){
  var attr = {x : x, y : y, width : width, height : height, style : arrayToStyle(style)};
  return new SvgGraph('rect',attr);
}

function makeLine(x1,y1,x2,y2,style){
  var attr = {x1:x1, y1:y1, x2:x2, y2:y2, style:arrayToStyle(style)};
  return new SvgGraph('line',attr);
}

function makePath(cmds,style){
  var attr = { d : dCmdArrayToAttr(cmds) , style : arrayToStyle(style) };
  return new SvgGraph('path',attr);
}

function makeText(textStyleAttr,text){
  return new SvgGraph('text',textStyleAttr,[],text);
}

function makeTextPath(link,text){
  return new SvgGraph('textPath',{'xlink:href' : link},[],text);
}

function makeAnimate(attr){
  return new SvgGraph('animate',attr);
}

function makeAnimateTransform(attr){
  return new SvgGraph('animateTransform',attr);
}

function makeGroup(attr,group){
  var g = new SvgGraph('g',attr);
  g.addAllInnerGraph(group);
  return g;
}

function makeScript(attr,script){
  return new SvgGraph('script',attr,[],script);
}

/* PathCommand */
var Dcmd = function(cmdType,value){
  this.cmdType = cmdType;
  this.value = value;
}
Dcmd.prototype = {
  toString :
    function(){
      return this.cmdType + ' ' + this.value;
    }
};

function makeDcmd(cmdType,value){
  return new Dcmd(cmdType,value);
}

function dCmdArrayToAttr(cmds,delim){
  delim = isUndefined(delim) ? ' ' : delim;
  return cmds.map(function(cmd){return cmd.toString();}).join(delim);
}

/* Points */
var Pt = function(x,y){
  this.x = x;
  this.y = y;
}

Pt.prototype = {
  toString :
    function (){
      return this.x + ',' + this.y;
    }
};

var Points = function(){
  this.pointArray = [];
  for(var i=0,L=arguments.length;i<L;i=i+2){
    this.pointArray.push(new Pt(arguments[i],arguments[i+1]));
  }
}

Points.prototype = {
  add :
    function(x,y){
      this.pointArray.push(new Pt(x,y));
      return this;
    },
  addAll :
    function(points){
      this.pointArray = this.pointArray.concat(points);
      return this;
    },
  toString :
    function(){
      return this.pointArray.map(function(p){return p.toString();}).join(' ');
    }
};

function arrayToStyle(aarr) {
    var style = '';
    for (var k in aarr) {
        var v = aarr[k];
        style += k + ':' + v + ';';
    }
    return style;
}

var RGBA = function (r, g, b, a) {
    a = isUndefined(a) ? 1 : a;
    this.R = r;
    this.G = g;
    this.B = b;
    this.A = a;
};

RGBA.prototype = {
  toString : 
    function () {
      return 'rgba(' + this.R + ',' + this.G + ',' + this.B + ',' + this.A + ')';
    },

    brightness : 
    function (x) {
      this.R = Math.min(255, Math.max(0, this.R + x));
      this.G = Math.min(255, Math.max(0, this.G + x));
      this.B = Math.min(255, Math.max(0, this.B + x));
      return this;
    },
};

function makeRGB(colorCode) {
    return makeRGBA(colorCode);
}

function makeRGBA(colorCode, alpha) {
    alpha = isUndefined(alpha) ? 1 : alpha;
    if (colorCode.length > 4) {
        return new RGBA(parseInt(colorCode.substr(1, 2), 16),
                        parseInt(colorCode.substr(3, 2), 16), 
                        parseInt(colorCode.substr(5, 2), 16),
                        alpha);
    } else {
        return new RGBA(parseInt(colorCode[1].repeat(2), 16),
                        parseInt(colorCode[2].repeat(2), 16),
                        parseInt(colorCode[3].repeat(2), 16), alpha);
    }
}
