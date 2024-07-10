
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.KmlUtils = {}));
})(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
	//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
	//[5]   	Name	   ::=   	NameStartChar (NameChar)*
	var nameStartChar$1 = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;//\u10000-\uEFFFF
	var nameChar$1 = new RegExp("[\\-\\.0-9"+nameStartChar$1.source.slice(1,-1)+"\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
	var tagNamePattern$1 = new RegExp('^'+nameStartChar$1.source+nameChar$1.source+'*(?:\:'+nameStartChar$1.source+nameChar$1.source+'*)?$');
	//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
	//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')

	//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
	//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
	var S_TAG$1 = 0;//tag name offerring
	var S_ATTR$1 = 1;//attr name offerring 
	var S_ATTR_SPACE$1=2;//attr name end and space offer
	var S_EQ$1 = 3;//=space?
	var S_ATTR_NOQUOT_VALUE$1 = 4;//attr value(no quot value only)
	var S_ATTR_END$1 = 5;//attr value end and no space(quot end)
	var S_TAG_SPACE$1 = 6;//(attr value end || tag end ) && (space offer)
	var S_TAG_CLOSE$1 = 7;//closed el<el />

	function XMLReader$2(){
		
	}

	XMLReader$2.prototype = {
		parse:function(source,defaultNSMap,entityMap){
			var domBuilder = this.domBuilder;
			domBuilder.startDocument();
			_copy$1(defaultNSMap ,defaultNSMap = {});
			parse$7(source,defaultNSMap,entityMap,
					domBuilder,this.errorHandler);
			domBuilder.endDocument();
		}
	};
	function parse$7(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
		function fixedFromCharCode(code) {
			// String.prototype.fromCharCode does not supports
			// > 2 bytes unicode chars directly
			if (code > 0xffff) {
				code -= 0x10000;
				var surrogate1 = 0xd800 + (code >> 10)
					, surrogate2 = 0xdc00 + (code & 0x3ff);

				return String.fromCharCode(surrogate1, surrogate2);
			} else {
				return String.fromCharCode(code);
			}
		}
		function entityReplacer(a){
			var k = a.slice(1,-1);
			if(k in entityMap){
				return entityMap[k]; 
			}else if(k.charAt(0) === '#'){
				return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
			}else {
				errorHandler.error('entity not found:'+a);
				return a;
			}
		}
		function appendText(end){//has some bugs
			if(end>start){
				var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
				locator&&position(start);
				domBuilder.characters(xt,0,end-start);
				start = end;
			}
		}
		function position(p,m){
			while(p>=lineEnd && (m = linePattern.exec(source))){
				lineStart = m.index;
				lineEnd = lineStart + m[0].length;
				locator.lineNumber++;
				//console.log('line++:',locator,startPos,endPos)
			}
			locator.columnNumber = p-lineStart+1;
		}
		var lineStart = 0;
		var lineEnd = 0;
		var linePattern = /.*(?:\r\n?|\n)|.*$/g;
		var locator = domBuilder.locator;
		
		var parseStack = [{currentNSMap:defaultNSMapCopy}];
		var closeMap = {};
		var start = 0;
		while(true){
			try{
				var tagStart = source.indexOf('<',start);
				if(tagStart<0){
					if(!source.substr(start).match(/^\s*$/)){
						var doc = domBuilder.doc;
		    			var text = doc.createTextNode(source.substr(start));
		    			doc.appendChild(text);
		    			domBuilder.currentElement = text;
					}
					return;
				}
				if(tagStart>start){
					appendText(tagStart);
				}
				switch(source.charAt(tagStart+1)){
				case '/':
					var end = source.indexOf('>',tagStart+3);
					var tagName = source.substring(tagStart+2,end);
					var config = parseStack.pop();
					if(end<0){
						
		        		tagName = source.substring(tagStart+2).replace(/[\s<].*/,'');
		        		//console.error('#@@@@@@'+tagName)
		        		errorHandler.error("end tag name: "+tagName+' is not complete:'+config.tagName);
		        		end = tagStart+1+tagName.length;
		        	}else if(tagName.match(/\s</)){
		        		tagName = tagName.replace(/[\s<].*/,'');
		        		errorHandler.error("end tag name: "+tagName+' maybe not complete');
		        		end = tagStart+1+tagName.length;
					}
					//console.error(parseStack.length,parseStack)
					//console.error(config);
					var localNSMap = config.localNSMap;
					var endMatch = config.tagName == tagName;
					var endIgnoreCaseMach = endMatch || config.tagName&&config.tagName.toLowerCase() == tagName.toLowerCase();
			        if(endIgnoreCaseMach){
			        	domBuilder.endElement(config.uri,config.localName,tagName);
						if(localNSMap){
							for(var prefix in localNSMap){
								domBuilder.endPrefixMapping(prefix) ;
							}
						}
						if(!endMatch){
			            	errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName );
						}
			        }else {
			        	parseStack.push(config);
			        }
					
					end++;
					break;
					// end elment
				case '?':// <?...?>
					locator&&position(tagStart);
					end = parseInstruction$1(source,tagStart,domBuilder);
					break;
				case '!':// <!doctype,<![CDATA,<!--
					locator&&position(tagStart);
					end = parseDCC$1(source,tagStart,domBuilder,errorHandler);
					break;
				default:
					locator&&position(tagStart);
					var el = new ElementAttributes$1();
					var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
					//elStartEnd
					var end = parseElementStartPart$1(source,tagStart,el,currentNSMap,entityReplacer,errorHandler);
					var len = el.length;
					
					
					if(!el.closed && fixSelfClosed$1(source,end,el.tagName,closeMap)){
						el.closed = true;
						if(!entityMap.nbsp){
							errorHandler.warning('unclosed xml attribute');
						}
					}
					if(locator && len){
						var locator2 = copyLocator$1(locator,{});
						//try{//attribute position fixed
						for(var i = 0;i<len;i++){
							var a = el[i];
							position(a.offset);
							a.locator = copyLocator$1(locator,{});
						}
						//}catch(e){console.error('@@@@@'+e)}
						domBuilder.locator = locator2;
						if(appendElement$2(el,domBuilder,currentNSMap)){
							parseStack.push(el);
						}
						domBuilder.locator = locator;
					}else {
						if(appendElement$2(el,domBuilder,currentNSMap)){
							parseStack.push(el);
						}
					}
					
					
					
					if(el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed){
						end = parseHtmlSpecialContent$1(source,end,el.tagName,entityReplacer,domBuilder);
					}else {
						end++;
					}
				}
			}catch(e){
				errorHandler.error('element parse error: '+e);
				//errorHandler.error('element parse error: '+e);
				end = -1;
				//throw e;
			}
			if(end>start){
				start = end;
			}else {
				//TODO: 这里有可能sax回退，有位置错误风险
				appendText(Math.max(tagStart,start)+1);
			}
		}
	}
	function copyLocator$1(f,t){
		t.lineNumber = f.lineNumber;
		t.columnNumber = f.columnNumber;
		return t;
	}

	/**
	 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
	 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
	 */
	function parseElementStartPart$1(source,start,el,currentNSMap,entityReplacer,errorHandler){
		var attrName;
		var value;
		var p = ++start;
		var s = S_TAG$1;//status
		while(true){
			var c = source.charAt(p);
			switch(c){
			case '=':
				if(s === S_ATTR$1){//attrName
					attrName = source.slice(start,p);
					s = S_EQ$1;
				}else if(s === S_ATTR_SPACE$1){
					s = S_EQ$1;
				}else {
					//fatalError: equal must after attrName or space after attrName
					throw new Error('attribute equal must after attrName');
				}
				break;
			case '\'':
			case '"':
				if(s === S_EQ$1 || s === S_ATTR$1 //|| s == S_ATTR_SPACE
					){//equal
					if(s === S_ATTR$1){
						errorHandler.warning('attribute value must after "="');
						attrName = source.slice(start,p);
					}
					start = p+1;
					p = source.indexOf(c,start);
					if(p>0){
						value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
						el.add(attrName,value,start-1);
						s = S_ATTR_END$1;
					}else {
						//fatalError: no end quot match
						throw new Error('attribute value no end \''+c+'\' match');
					}
				}else if(s == S_ATTR_NOQUOT_VALUE$1){
					value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					//console.log(attrName,value,start,p)
					el.add(attrName,value,start);
					//console.dir(el)
					errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
					start = p+1;
					s = S_ATTR_END$1;
				}else {
					//fatalError: no equal before
					throw new Error('attribute value must after "="');
				}
				break;
			case '/':
				switch(s){
				case S_TAG$1:
					el.setTagName(source.slice(start,p));
				case S_ATTR_END$1:
				case S_TAG_SPACE$1:
				case S_TAG_CLOSE$1:
					s =S_TAG_CLOSE$1;
					el.closed = true;
				case S_ATTR_NOQUOT_VALUE$1:
				case S_ATTR$1:
				case S_ATTR_SPACE$1:
					break;
				//case S_EQ:
				default:
					throw new Error("attribute invalid close char('/')")
				}
				break;
			case ''://end document
				//throw new Error('unexpected end of input')
				errorHandler.error('unexpected end of input');
				if(s == S_TAG$1){
					el.setTagName(source.slice(start,p));
				}
				return p;
			case '>':
				switch(s){
				case S_TAG$1:
					el.setTagName(source.slice(start,p));
				case S_ATTR_END$1:
				case S_TAG_SPACE$1:
				case S_TAG_CLOSE$1:
					break;//normal
				case S_ATTR_NOQUOT_VALUE$1://Compatible state
				case S_ATTR$1:
					value = source.slice(start,p);
					if(value.slice(-1) === '/'){
						el.closed  = true;
						value = value.slice(0,-1);
					}
				case S_ATTR_SPACE$1:
					if(s === S_ATTR_SPACE$1){
						value = attrName;
					}
					if(s == S_ATTR_NOQUOT_VALUE$1){
						errorHandler.warning('attribute "'+value+'" missed quot(")!!');
						el.add(attrName,value.replace(/&#?\w+;/g,entityReplacer),start);
					}else {
						if(currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !value.match(/^(?:disabled|checked|selected)$/i)){
							errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!');
						}
						el.add(value,value,start);
					}
					break;
				case S_EQ$1:
					throw new Error('attribute value missed!!');
				}
	//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
				return p;
			/*xml space '\x20' | #x9 | #xD | #xA; */
			case '\u0080':
				c = ' ';
			default:
				if(c<= ' '){//space
					switch(s){
					case S_TAG$1:
						el.setTagName(source.slice(start,p));//tagName
						s = S_TAG_SPACE$1;
						break;
					case S_ATTR$1:
						attrName = source.slice(start,p);
						s = S_ATTR_SPACE$1;
						break;
					case S_ATTR_NOQUOT_VALUE$1:
						var value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
						errorHandler.warning('attribute "'+value+'" missed quot(")!!');
						el.add(attrName,value,start);
					case S_ATTR_END$1:
						s = S_TAG_SPACE$1;
						break;
					//case S_TAG_SPACE:
					//case S_EQ:
					//case S_ATTR_SPACE:
					//	void();break;
					//case S_TAG_CLOSE:
						//ignore warning
					}
				}else {//not space
	//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
	//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
					switch(s){
					//case S_TAG:void();break;
					//case S_ATTR:void();break;
					//case S_ATTR_NOQUOT_VALUE:void();break;
					case S_ATTR_SPACE$1:
						el.tagName;
						if(currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !attrName.match(/^(?:disabled|checked|selected)$/i)){
							errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead2!!');
						}
						el.add(attrName,attrName,start);
						start = p;
						s = S_ATTR$1;
						break;
					case S_ATTR_END$1:
						errorHandler.warning('attribute space is required"'+attrName+'"!!');
					case S_TAG_SPACE$1:
						s = S_ATTR$1;
						start = p;
						break;
					case S_EQ$1:
						s = S_ATTR_NOQUOT_VALUE$1;
						start = p;
						break;
					case S_TAG_CLOSE$1:
						throw new Error("elements closed character '/' and '>' must be connected to");
					}
				}
			}//end outer switch
			//console.log('p++',p)
			p++;
		}
	}
	/**
	 * @return true if has new namespace define
	 */
	function appendElement$2(el,domBuilder,currentNSMap){
		var tagName = el.tagName;
		var localNSMap = null;
		//var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
		var i = el.length;
		while(i--){
			var a = el[i];
			var qName = a.qName;
			var value = a.value;
			var nsp = qName.indexOf(':');
			if(nsp>0){
				var prefix = a.prefix = qName.slice(0,nsp);
				var localName = qName.slice(nsp+1);
				var nsPrefix = prefix === 'xmlns' && localName;
			}else {
				localName = qName;
				prefix = null;
				nsPrefix = qName === 'xmlns' && '';
			}
			//can not set prefix,because prefix !== ''
			a.localName = localName ;
			//prefix == null for no ns prefix attribute 
			if(nsPrefix !== false){//hack!!
				if(localNSMap == null){
					localNSMap = {};
					//console.log(currentNSMap,0)
					_copy$1(currentNSMap,currentNSMap={});
					//console.log(currentNSMap,1)
				}
				currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
				a.uri = 'http://www.w3.org/2000/xmlns/';
				domBuilder.startPrefixMapping(nsPrefix, value); 
			}
		}
		var i = el.length;
		while(i--){
			a = el[i];
			var prefix = a.prefix;
			if(prefix){//no prefix attribute has no namespace
				if(prefix === 'xml'){
					a.uri = 'http://www.w3.org/XML/1998/namespace';
				}if(prefix !== 'xmlns'){
					a.uri = currentNSMap[prefix || ''];
					
					//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
				}
			}
		}
		var nsp = tagName.indexOf(':');
		if(nsp>0){
			prefix = el.prefix = tagName.slice(0,nsp);
			localName = el.localName = tagName.slice(nsp+1);
		}else {
			prefix = null;//important!!
			localName = el.localName = tagName;
		}
		//no prefix element has default namespace
		var ns = el.uri = currentNSMap[prefix || ''];
		domBuilder.startElement(ns,localName,tagName,el);
		//endPrefixMapping and startPrefixMapping have not any help for dom builder
		//localNSMap = null
		if(el.closed){
			domBuilder.endElement(ns,localName,tagName);
			if(localNSMap){
				for(prefix in localNSMap){
					domBuilder.endPrefixMapping(prefix); 
				}
			}
		}else {
			el.currentNSMap = currentNSMap;
			el.localNSMap = localNSMap;
			//parseStack.push(el);
			return true;
		}
	}
	function parseHtmlSpecialContent$1(source,elStartEnd,tagName,entityReplacer,domBuilder){
		if(/^(?:script|textarea)$/i.test(tagName)){
			var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
			var text = source.substring(elStartEnd+1,elEndStart);
			if(/[&<]/.test(text)){
				if(/^script$/i.test(tagName)){
					//if(!/\]\]>/.test(text)){
						//lexHandler.startCDATA();
						domBuilder.characters(text,0,text.length);
						//lexHandler.endCDATA();
						return elEndStart;
					//}
				}//}else{//text area
					text = text.replace(/&#?\w+;/g,entityReplacer);
					domBuilder.characters(text,0,text.length);
					return elEndStart;
				//}
				
			}
		}
		return elStartEnd+1;
	}
	function fixSelfClosed$1(source,elStartEnd,tagName,closeMap){
		//if(tagName in closeMap){
		var pos = closeMap[tagName];
		if(pos == null){
			//console.log(tagName)
			pos =  source.lastIndexOf('</'+tagName+'>');
			if(pos<elStartEnd){//忘记闭合
				pos = source.lastIndexOf('</'+tagName);
			}
			closeMap[tagName] =pos;
		}
		return pos<elStartEnd;
		//} 
	}
	function _copy$1(source,target){
		for(var n in source){target[n] = source[n];}
	}
	function parseDCC$1(source,start,domBuilder,errorHandler){//sure start with '<!'
		var next= source.charAt(start+2);
		switch(next){
		case '-':
			if(source.charAt(start + 3) === '-'){
				var end = source.indexOf('-->',start+4);
				//append comment source.substring(4,end)//<!--
				if(end>start){
					domBuilder.comment(source,start+4,end-start-4);
					return end+3;
				}else {
					errorHandler.error("Unclosed comment");
					return -1;
				}
			}else {
				//error
				return -1;
			}
		default:
			if(source.substr(start+3,6) == 'CDATA['){
				var end = source.indexOf(']]>',start+9);
				domBuilder.startCDATA();
				domBuilder.characters(source,start+9,end-start-9);
				domBuilder.endCDATA(); 
				return end+3;
			}
			//<!DOCTYPE
			//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 
			var matchs = split$1(source,start);
			var len = matchs.length;
			if(len>1 && /!doctype/i.test(matchs[0][0])){
				var name = matchs[1][0];
				var pubid = len>3 && /^public$/i.test(matchs[2][0]) && matchs[3][0];
				var sysid = len>4 && matchs[4][0];
				var lastMatch = matchs[len-1];
				domBuilder.startDTD(name,pubid && pubid.replace(/^(['"])(.*?)\1$/,'$2'),
						sysid && sysid.replace(/^(['"])(.*?)\1$/,'$2'));
				domBuilder.endDTD();
				
				return lastMatch.index+lastMatch[0].length
			}
		}
		return -1;
	}



	function parseInstruction$1(source,start,domBuilder){
		var end = source.indexOf('?>',start);
		if(end){
			var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
			if(match){
				match[0].length;
				domBuilder.processingInstruction(match[1], match[2]) ;
				return end+2;
			}else {//error
				return -1;
			}
		}
		return -1;
	}

	/**
	 * @param source
	 */
	function ElementAttributes$1(source){
		
	}
	ElementAttributes$1.prototype = {
		setTagName:function(tagName){
			if(!tagNamePattern$1.test(tagName)){
				throw new Error('invalid tagName:'+tagName)
			}
			this.tagName = tagName;
		},
		add:function(qName,value,offset){
			if(!tagNamePattern$1.test(qName)){
				throw new Error('invalid attribute:'+qName)
			}
			this[this.length++] = {qName:qName,value:value,offset:offset};
		},
		length:0,
		getLocalName:function(i){return this[i].localName},
		getLocator:function(i){return this[i].locator},
		getQName:function(i){return this[i].qName},
		getURI:function(i){return this[i].uri},
		getValue:function(i){return this[i].value}
	//	,getIndex:function(uri, localName)){
	//		if(localName){
	//			
	//		}else{
	//			var qName = uri
	//		}
	//	},
	//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
	//	getType:function(uri,localName){}
	//	getType:function(i){},
	};




	function _set_proto_(thiz,parent){
		thiz.__proto__ = parent;
		return thiz;
	}
	if(!(_set_proto_({},_set_proto_.prototype) instanceof _set_proto_)){
		_set_proto_ = function(thiz,parent){
			function p(){}		p.prototype = parent;
			p = new p();
			for(parent in thiz){
				p[parent] = thiz[parent];
			}
			return p;
		};
	}

	function split$1(source,start){
		var match;
		var buf = [];
		var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
		reg.lastIndex = start;
		reg.exec(source);//skip <
		while(match = reg.exec(source)){
			buf.push(match);
			if(match[1])return buf;
		}
	}

	var XMLReader_1$1 = XMLReader$2;

	var sax$1 = {
		XMLReader: XMLReader_1$1
	};

	/*
	 * DOM Level 2
	 * Object DOMException
	 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
	 */

	function copy$1(src,dest){
		for(var p in src){
			dest[p] = src[p];
		}
	}
	/**
	^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
	^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
	 */
	function _extends$1(Class,Super){
		var pt = Class.prototype;
		if(Object.create){
			var ppt = Object.create(Super.prototype);
			pt.__proto__ = ppt;
		}
		if(!(pt instanceof Super)){
			function t(){}		t.prototype = Super.prototype;
			t = new t();
			copy$1(pt,t);
			Class.prototype = pt = t;
		}
		if(pt.constructor != Class){
			if(typeof Class != 'function'){
				console.error("unknow Class:"+Class);
			}
			pt.constructor = Class;
		}
	}
	var htmlns = 'http://www.w3.org/1999/xhtml' ;
	// Node Types
	var NodeType$1 = {};
	var ELEMENT_NODE$1                = NodeType$1.ELEMENT_NODE                = 1;
	var ATTRIBUTE_NODE$1              = NodeType$1.ATTRIBUTE_NODE              = 2;
	var TEXT_NODE$1                   = NodeType$1.TEXT_NODE                   = 3;
	var CDATA_SECTION_NODE$1          = NodeType$1.CDATA_SECTION_NODE          = 4;
	var ENTITY_REFERENCE_NODE$1       = NodeType$1.ENTITY_REFERENCE_NODE       = 5;
	var ENTITY_NODE$1                 = NodeType$1.ENTITY_NODE                 = 6;
	var PROCESSING_INSTRUCTION_NODE$1 = NodeType$1.PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE$1                = NodeType$1.COMMENT_NODE                = 8;
	var DOCUMENT_NODE$1               = NodeType$1.DOCUMENT_NODE               = 9;
	var DOCUMENT_TYPE_NODE$1          = NodeType$1.DOCUMENT_TYPE_NODE          = 10;
	var DOCUMENT_FRAGMENT_NODE$1      = NodeType$1.DOCUMENT_FRAGMENT_NODE      = 11;
	var NOTATION_NODE$1               = NodeType$1.NOTATION_NODE               = 12;

	// ExceptionCode
	var ExceptionCode$1 = {};
	var ExceptionMessage$1 = {};
	ExceptionCode$1.INDEX_SIZE_ERR              = ((ExceptionMessage$1[1]="Index size error"),1);
	ExceptionCode$1.DOMSTRING_SIZE_ERR          = ((ExceptionMessage$1[2]="DOMString size error"),2);
	var HIERARCHY_REQUEST_ERR$1       = ExceptionCode$1.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage$1[3]="Hierarchy request error"),3);
	ExceptionCode$1.WRONG_DOCUMENT_ERR          = ((ExceptionMessage$1[4]="Wrong document"),4);
	ExceptionCode$1.INVALID_CHARACTER_ERR       = ((ExceptionMessage$1[5]="Invalid character"),5);
	ExceptionCode$1.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage$1[6]="No data allowed"),6);
	ExceptionCode$1.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage$1[7]="No modification allowed"),7);
	var NOT_FOUND_ERR$1               = ExceptionCode$1.NOT_FOUND_ERR               = ((ExceptionMessage$1[8]="Not found"),8);
	ExceptionCode$1.NOT_SUPPORTED_ERR           = ((ExceptionMessage$1[9]="Not supported"),9);
	var INUSE_ATTRIBUTE_ERR$1         = ExceptionCode$1.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage$1[10]="Attribute in use"),10);
	//level2
	ExceptionCode$1.INVALID_STATE_ERR        	= ((ExceptionMessage$1[11]="Invalid state"),11);
	ExceptionCode$1.SYNTAX_ERR               	= ((ExceptionMessage$1[12]="Syntax error"),12);
	ExceptionCode$1.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage$1[13]="Invalid modification"),13);
	ExceptionCode$1.NAMESPACE_ERR           	= ((ExceptionMessage$1[14]="Invalid namespace"),14);
	ExceptionCode$1.INVALID_ACCESS_ERR      	= ((ExceptionMessage$1[15]="Invalid access"),15);


	function DOMException$1(code, message) {
		if(message instanceof Error){
			var error = message;
		}else {
			error = this;
			Error.call(this, ExceptionMessage$1[code]);
			this.message = ExceptionMessage$1[code];
			if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException$1);
		}
		error.code = code;
		if(message) this.message = this.message + ": " + message;
		return error;
	}DOMException$1.prototype = Error.prototype;
	copy$1(ExceptionCode$1,DOMException$1);
	/**
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
	 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
	 * The items in the NodeList are accessible via an integral index, starting from 0.
	 */
	function NodeList$1() {
	}NodeList$1.prototype = {
		/**
		 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
		 * @standard level1
		 */
		length:0, 
		/**
		 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
		 * @standard level1
		 * @param index  unsigned long 
		 *   Index into the collection.
		 * @return Node
		 * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
		 */
		item: function(index) {
			return this[index] || null;
		},
		toString:function(isHTML,nodeFilter){
			for(var buf = [], i = 0;i<this.length;i++){
				serializeToString$1(this[i],buf,isHTML,nodeFilter);
			}
			return buf.join('');
		}
	};
	function LiveNodeList$1(node,refresh){
		this._node = node;
		this._refresh = refresh;
		_updateLiveList$1(this);
	}
	function _updateLiveList$1(list){
		var inc = list._node._inc || list._node.ownerDocument._inc;
		if(list._inc != inc){
			var ls = list._refresh(list._node);
			//console.log(ls.length)
			__set__$1(list,'length',ls.length);
			copy$1(ls,list);
			list._inc = inc;
		}
	}
	LiveNodeList$1.prototype.item = function(i){
		_updateLiveList$1(this);
		return this[i];
	};

	_extends$1(LiveNodeList$1,NodeList$1);
	/**
	 * 
	 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
	 * NamedNodeMap objects in the DOM are live.
	 * used for attributes or DocumentType entities 
	 */
	function NamedNodeMap$1() {
	}
	function _findNodeIndex$1(list,node){
		var i = list.length;
		while(i--){
			if(list[i] === node){return i}
		}
	}

	function _addNamedNode$1(el,list,newAttr,oldAttr){
		if(oldAttr){
			list[_findNodeIndex$1(list,oldAttr)] = newAttr;
		}else {
			list[list.length++] = newAttr;
		}
		if(el){
			newAttr.ownerElement = el;
			var doc = el.ownerDocument;
			if(doc){
				oldAttr && _onRemoveAttribute$1(doc,el,oldAttr);
				_onAddAttribute$1(doc,el,newAttr);
			}
		}
	}
	function _removeNamedNode$1(el,list,attr){
		//console.log('remove attr:'+attr)
		var i = _findNodeIndex$1(list,attr);
		if(i>=0){
			var lastIndex = list.length-1;
			while(i<lastIndex){
				list[i] = list[++i];
			}
			list.length = lastIndex;
			if(el){
				var doc = el.ownerDocument;
				if(doc){
					_onRemoveAttribute$1(doc,el,attr);
					attr.ownerElement = null;
				}
			}
		}else {
			throw DOMException$1(NOT_FOUND_ERR$1,new Error(el.tagName+'@'+attr))
		}
	}
	NamedNodeMap$1.prototype = {
		length:0,
		item:NodeList$1.prototype.item,
		getNamedItem: function(key) {
	//		if(key.indexOf(':')>0 || key == 'xmlns'){
	//			return null;
	//		}
			//console.log()
			var i = this.length;
			while(i--){
				var attr = this[i];
				//console.log(attr.nodeName,key)
				if(attr.nodeName == key){
					return attr;
				}
			}
		},
		setNamedItem: function(attr) {
			var el = attr.ownerElement;
			if(el && el!=this._ownerElement){
				throw new DOMException$1(INUSE_ATTRIBUTE_ERR$1);
			}
			var oldAttr = this.getNamedItem(attr.nodeName);
			_addNamedNode$1(this._ownerElement,this,attr,oldAttr);
			return oldAttr;
		},
		/* returns Node */
		setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
			var el = attr.ownerElement, oldAttr;
			if(el && el!=this._ownerElement){
				throw new DOMException$1(INUSE_ATTRIBUTE_ERR$1);
			}
			oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
			_addNamedNode$1(this._ownerElement,this,attr,oldAttr);
			return oldAttr;
		},

		/* returns Node */
		removeNamedItem: function(key) {
			var attr = this.getNamedItem(key);
			_removeNamedNode$1(this._ownerElement,this,attr);
			return attr;
			
			
		},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
		
		//for level2
		removeNamedItemNS:function(namespaceURI,localName){
			var attr = this.getNamedItemNS(namespaceURI,localName);
			_removeNamedNode$1(this._ownerElement,this,attr);
			return attr;
		},
		getNamedItemNS: function(namespaceURI, localName) {
			var i = this.length;
			while(i--){
				var node = this[i];
				if(node.localName == localName && node.namespaceURI == namespaceURI){
					return node;
				}
			}
			return null;
		}
	};
	/**
	 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
	 */
	function DOMImplementation$3(/* Object */ features) {
		this._features = {};
		if (features) {
			for (var feature in features) {
				 this._features = features[feature];
			}
		}
	}
	DOMImplementation$3.prototype = {
		hasFeature: function(/* string */ feature, /* string */ version) {
			var versions = this._features[feature.toLowerCase()];
			if (versions && (!version || version in versions)) {
				return true;
			} else {
				return false;
			}
		},
		// Introduced in DOM Level 2:
		createDocument:function(namespaceURI,  qualifiedName, doctype){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
			var doc = new Document$1();
			doc.implementation = this;
			doc.childNodes = new NodeList$1();
			doc.doctype = doctype;
			if(doctype){
				doc.appendChild(doctype);
			}
			if(qualifiedName){
				var root = doc.createElementNS(namespaceURI,qualifiedName);
				doc.appendChild(root);
			}
			return doc;
		},
		// Introduced in DOM Level 2:
		createDocumentType:function(qualifiedName, publicId, systemId){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
			var node = new DocumentType$1();
			node.name = qualifiedName;
			node.nodeName = qualifiedName;
			node.publicId = publicId;
			node.systemId = systemId;
			// Introduced in DOM Level 2:
			//readonly attribute DOMString        internalSubset;
			
			//TODO:..
			//  readonly attribute NamedNodeMap     entities;
			//  readonly attribute NamedNodeMap     notations;
			return node;
		}
	};


	/**
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
	 */

	function Node$1() {
	}
	Node$1.prototype = {
		firstChild : null,
		lastChild : null,
		previousSibling : null,
		nextSibling : null,
		attributes : null,
		parentNode : null,
		childNodes : null,
		ownerDocument : null,
		nodeValue : null,
		namespaceURI : null,
		prefix : null,
		localName : null,
		// Modified in DOM Level 2:
		insertBefore:function(newChild, refChild){//raises 
			return _insertBefore$1(this,newChild,refChild);
		},
		replaceChild:function(newChild, oldChild){//raises 
			this.insertBefore(newChild,oldChild);
			if(oldChild){
				this.removeChild(oldChild);
			}
		},
		removeChild:function(oldChild){
			return _removeChild$1(this,oldChild);
		},
		appendChild:function(newChild){
			return this.insertBefore(newChild,null);
		},
		hasChildNodes:function(){
			return this.firstChild != null;
		},
		cloneNode:function(deep){
			return cloneNode$1(this.ownerDocument||this,this,deep);
		},
		// Modified in DOM Level 2:
		normalize:function(){
			var child = this.firstChild;
			while(child){
				var next = child.nextSibling;
				if(next && next.nodeType == TEXT_NODE$1 && child.nodeType == TEXT_NODE$1){
					this.removeChild(next);
					child.appendData(next.data);
				}else {
					child.normalize();
					child = next;
				}
			}
		},
	  	// Introduced in DOM Level 2:
		isSupported:function(feature, version){
			return this.ownerDocument.implementation.hasFeature(feature,version);
		},
	    // Introduced in DOM Level 2:
	    hasAttributes:function(){
	    	return this.attributes.length>0;
	    },
	    lookupPrefix:function(namespaceURI){
	    	var el = this;
	    	while(el){
	    		var map = el._nsMap;
	    		//console.dir(map)
	    		if(map){
	    			for(var n in map){
	    				if(map[n] == namespaceURI){
	    					return n;
	    				}
	    			}
	    		}
	    		el = el.nodeType == ATTRIBUTE_NODE$1?el.ownerDocument : el.parentNode;
	    	}
	    	return null;
	    },
	    // Introduced in DOM Level 3:
	    lookupNamespaceURI:function(prefix){
	    	var el = this;
	    	while(el){
	    		var map = el._nsMap;
	    		//console.dir(map)
	    		if(map){
	    			if(prefix in map){
	    				return map[prefix] ;
	    			}
	    		}
	    		el = el.nodeType == ATTRIBUTE_NODE$1?el.ownerDocument : el.parentNode;
	    	}
	    	return null;
	    },
	    // Introduced in DOM Level 3:
	    isDefaultNamespace:function(namespaceURI){
	    	var prefix = this.lookupPrefix(namespaceURI);
	    	return prefix == null;
	    }
	};


	function _xmlEncoder$1(c){
		return c == '<' && '&lt;' ||
	         c == '>' && '&gt;' ||
	         c == '&' && '&amp;' ||
	         c == '"' && '&quot;' ||
	         '&#'+c.charCodeAt()+';'
	}


	copy$1(NodeType$1,Node$1);
	copy$1(NodeType$1,Node$1.prototype);

	/**
	 * @param callback return true for continue,false for break
	 * @return boolean true: break visit;
	 */
	function _visitNode$1(node,callback){
		if(callback(node)){
			return true;
		}
		if(node = node.firstChild){
			do{
				if(_visitNode$1(node,callback)){return true}
	        }while(node=node.nextSibling)
	    }
	}



	function Document$1(){
	}
	function _onAddAttribute$1(doc,el,newAttr){
		doc && doc._inc++;
		var ns = newAttr.namespaceURI ;
		if(ns == 'http://www.w3.org/2000/xmlns/'){
			//update namespace
			el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value;
		}
	}
	function _onRemoveAttribute$1(doc,el,newAttr,remove){
		doc && doc._inc++;
		var ns = newAttr.namespaceURI ;
		if(ns == 'http://www.w3.org/2000/xmlns/'){
			//update namespace
			delete el._nsMap[newAttr.prefix?newAttr.localName:''];
		}
	}
	function _onUpdateChild$1(doc,el,newChild){
		if(doc && doc._inc){
			doc._inc++;
			//update childNodes
			var cs = el.childNodes;
			if(newChild){
				cs[cs.length++] = newChild;
			}else {
				//console.log(1)
				var child = el.firstChild;
				var i = 0;
				while(child){
					cs[i++] = child;
					child =child.nextSibling;
				}
				cs.length = i;
			}
		}
	}

	/**
	 * attributes;
	 * children;
	 * 
	 * writeable properties:
	 * nodeValue,Attr:value,CharacterData:data
	 * prefix
	 */
	function _removeChild$1(parentNode,child){
		var previous = child.previousSibling;
		var next = child.nextSibling;
		if(previous){
			previous.nextSibling = next;
		}else {
			parentNode.firstChild = next;
		}
		if(next){
			next.previousSibling = previous;
		}else {
			parentNode.lastChild = previous;
		}
		_onUpdateChild$1(parentNode.ownerDocument,parentNode);
		return child;
	}
	/**
	 * preformance key(refChild == null)
	 */
	function _insertBefore$1(parentNode,newChild,nextChild){
		var cp = newChild.parentNode;
		if(cp){
			cp.removeChild(newChild);//remove and update
		}
		if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE$1){
			var newFirst = newChild.firstChild;
			if (newFirst == null) {
				return newChild;
			}
			var newLast = newChild.lastChild;
		}else {
			newFirst = newLast = newChild;
		}
		var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;

		newFirst.previousSibling = pre;
		newLast.nextSibling = nextChild;
		
		
		if(pre){
			pre.nextSibling = newFirst;
		}else {
			parentNode.firstChild = newFirst;
		}
		if(nextChild == null){
			parentNode.lastChild = newLast;
		}else {
			nextChild.previousSibling = newLast;
		}
		do{
			newFirst.parentNode = parentNode;
		}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
		_onUpdateChild$1(parentNode.ownerDocument||parentNode,parentNode);
		//console.log(parentNode.lastChild.nextSibling == null)
		if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE$1) {
			newChild.firstChild = newChild.lastChild = null;
		}
		return newChild;
	}
	function _appendSingleChild$1(parentNode,newChild){
		var cp = newChild.parentNode;
		if(cp){
			var pre = parentNode.lastChild;
			cp.removeChild(newChild);//remove and update
			var pre = parentNode.lastChild;
		}
		var pre = parentNode.lastChild;
		newChild.parentNode = parentNode;
		newChild.previousSibling = pre;
		newChild.nextSibling = null;
		if(pre){
			pre.nextSibling = newChild;
		}else {
			parentNode.firstChild = newChild;
		}
		parentNode.lastChild = newChild;
		_onUpdateChild$1(parentNode.ownerDocument,parentNode,newChild);
		return newChild;
		//console.log("__aa",parentNode.lastChild.nextSibling == null)
	}
	Document$1.prototype = {
		//implementation : null,
		nodeName :  '#document',
		nodeType :  DOCUMENT_NODE$1,
		doctype :  null,
		documentElement :  null,
		_inc : 1,
		
		insertBefore :  function(newChild, refChild){//raises 
			if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE$1){
				var child = newChild.firstChild;
				while(child){
					var next = child.nextSibling;
					this.insertBefore(child,refChild);
					child = next;
				}
				return newChild;
			}
			if(this.documentElement == null && newChild.nodeType == ELEMENT_NODE$1){
				this.documentElement = newChild;
			}
			
			return _insertBefore$1(this,newChild,refChild),(newChild.ownerDocument = this),newChild;
		},
		removeChild :  function(oldChild){
			if(this.documentElement == oldChild){
				this.documentElement = null;
			}
			return _removeChild$1(this,oldChild);
		},
		// Introduced in DOM Level 2:
		importNode : function(importedNode,deep){
			return importNode$1(this,importedNode,deep);
		},
		// Introduced in DOM Level 2:
		getElementById :	function(id){
			var rtv = null;
			_visitNode$1(this.documentElement,function(node){
				if(node.nodeType == ELEMENT_NODE$1){
					if(node.getAttribute('id') == id){
						rtv = node;
						return true;
					}
				}
			});
			return rtv;
		},
		
		//document factory method:
		createElement :	function(tagName){
			var node = new Element$1();
			node.ownerDocument = this;
			node.nodeName = tagName;
			node.tagName = tagName;
			node.childNodes = new NodeList$1();
			var attrs	= node.attributes = new NamedNodeMap$1();
			attrs._ownerElement = node;
			return node;
		},
		createDocumentFragment :	function(){
			var node = new DocumentFragment$1();
			node.ownerDocument = this;
			node.childNodes = new NodeList$1();
			return node;
		},
		createTextNode :	function(data){
			var node = new Text$1();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		createComment :	function(data){
			var node = new Comment$1();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		createCDATASection :	function(data){
			var node = new CDATASection$1();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		createProcessingInstruction :	function(target,data){
			var node = new ProcessingInstruction$1();
			node.ownerDocument = this;
			node.tagName = node.target = target;
			node.nodeValue= node.data = data;
			return node;
		},
		createAttribute :	function(name){
			var node = new Attr$1();
			node.ownerDocument	= this;
			node.name = name;
			node.nodeName	= name;
			node.localName = name;
			node.specified = true;
			return node;
		},
		createEntityReference :	function(name){
			var node = new EntityReference$1();
			node.ownerDocument	= this;
			node.nodeName	= name;
			return node;
		},
		// Introduced in DOM Level 2:
		createElementNS :	function(namespaceURI,qualifiedName){
			var node = new Element$1();
			var pl = qualifiedName.split(':');
			var attrs	= node.attributes = new NamedNodeMap$1();
			node.childNodes = new NodeList$1();
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.tagName = qualifiedName;
			node.namespaceURI = namespaceURI;
			if(pl.length == 2){
				node.prefix = pl[0];
				node.localName = pl[1];
			}else {
				//el.prefix = null;
				node.localName = qualifiedName;
			}
			attrs._ownerElement = node;
			return node;
		},
		// Introduced in DOM Level 2:
		createAttributeNS :	function(namespaceURI,qualifiedName){
			var node = new Attr$1();
			var pl = qualifiedName.split(':');
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.name = qualifiedName;
			node.namespaceURI = namespaceURI;
			node.specified = true;
			if(pl.length == 2){
				node.prefix = pl[0];
				node.localName = pl[1];
			}else {
				//el.prefix = null;
				node.localName = qualifiedName;
			}
			return node;
		}
	};
	_extends$1(Document$1,Node$1);


	function Element$1() {
		this._nsMap = {};
	}Element$1.prototype = {
		nodeType : ELEMENT_NODE$1,
		hasAttribute : function(name){
			return this.getAttributeNode(name)!=null;
		},
		getAttribute : function(name){
			var attr = this.getAttributeNode(name);
			return attr && attr.value || '';
		},
		getAttributeNode : function(name){
			return this.attributes.getNamedItem(name);
		},
		setAttribute : function(name, value){
			var attr = this.ownerDocument.createAttribute(name);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr);
		},
		removeAttribute : function(name){
			var attr = this.getAttributeNode(name);
			attr && this.removeAttributeNode(attr);
		},
		
		//four real opeartion method
		appendChild:function(newChild){
			if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE$1){
				return this.insertBefore(newChild,null);
			}else {
				return _appendSingleChild$1(this,newChild);
			}
		},
		setAttributeNode : function(newAttr){
			return this.attributes.setNamedItem(newAttr);
		},
		setAttributeNodeNS : function(newAttr){
			return this.attributes.setNamedItemNS(newAttr);
		},
		removeAttributeNode : function(oldAttr){
			//console.log(this == oldAttr.ownerElement)
			return this.attributes.removeNamedItem(oldAttr.nodeName);
		},
		//get real attribute name,and remove it by removeAttributeNode
		removeAttributeNS : function(namespaceURI, localName){
			var old = this.getAttributeNodeNS(namespaceURI, localName);
			old && this.removeAttributeNode(old);
		},
		
		hasAttributeNS : function(namespaceURI, localName){
			return this.getAttributeNodeNS(namespaceURI, localName)!=null;
		},
		getAttributeNS : function(namespaceURI, localName){
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			return attr && attr.value || '';
		},
		setAttributeNS : function(namespaceURI, qualifiedName, value){
			var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr);
		},
		getAttributeNodeNS : function(namespaceURI, localName){
			return this.attributes.getNamedItemNS(namespaceURI, localName);
		},
		
		getElementsByTagName : function(tagName){
			return new LiveNodeList$1(this,function(base){
				var ls = [];
				_visitNode$1(base,function(node){
					if(node !== base && node.nodeType == ELEMENT_NODE$1 && (tagName === '*' || node.tagName == tagName)){
						ls.push(node);
					}
				});
				return ls;
			});
		},
		getElementsByTagNameNS : function(namespaceURI, localName){
			return new LiveNodeList$1(this,function(base){
				var ls = [];
				_visitNode$1(base,function(node){
					if(node !== base && node.nodeType === ELEMENT_NODE$1 && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)){
						ls.push(node);
					}
				});
				return ls;
				
			});
		}
	};
	Document$1.prototype.getElementsByTagName = Element$1.prototype.getElementsByTagName;
	Document$1.prototype.getElementsByTagNameNS = Element$1.prototype.getElementsByTagNameNS;


	_extends$1(Element$1,Node$1);
	function Attr$1() {
	}Attr$1.prototype.nodeType = ATTRIBUTE_NODE$1;
	_extends$1(Attr$1,Node$1);


	function CharacterData$1() {
	}CharacterData$1.prototype = {
		data : '',
		substringData : function(offset, count) {
			return this.data.substring(offset, offset+count);
		},
		appendData: function(text) {
			text = this.data+text;
			this.nodeValue = this.data = text;
			this.length = text.length;
		},
		insertData: function(offset,text) {
			this.replaceData(offset,0,text);
		
		},
		appendChild:function(newChild){
			throw new Error(ExceptionMessage$1[HIERARCHY_REQUEST_ERR$1])
		},
		deleteData: function(offset, count) {
			this.replaceData(offset,count,"");
		},
		replaceData: function(offset, count, text) {
			var start = this.data.substring(0,offset);
			var end = this.data.substring(offset+count);
			text = start + text + end;
			this.nodeValue = this.data = text;
			this.length = text.length;
		}
	};
	_extends$1(CharacterData$1,Node$1);
	function Text$1() {
	}Text$1.prototype = {
		nodeName : "#text",
		nodeType : TEXT_NODE$1,
		splitText : function(offset) {
			var text = this.data;
			var newText = text.substring(offset);
			text = text.substring(0, offset);
			this.data = this.nodeValue = text;
			this.length = text.length;
			var newNode = this.ownerDocument.createTextNode(newText);
			if(this.parentNode){
				this.parentNode.insertBefore(newNode, this.nextSibling);
			}
			return newNode;
		}
	};
	_extends$1(Text$1,CharacterData$1);
	function Comment$1() {
	}Comment$1.prototype = {
		nodeName : "#comment",
		nodeType : COMMENT_NODE$1
	};
	_extends$1(Comment$1,CharacterData$1);

	function CDATASection$1() {
	}CDATASection$1.prototype = {
		nodeName : "#cdata-section",
		nodeType : CDATA_SECTION_NODE$1
	};
	_extends$1(CDATASection$1,CharacterData$1);


	function DocumentType$1() {
	}DocumentType$1.prototype.nodeType = DOCUMENT_TYPE_NODE$1;
	_extends$1(DocumentType$1,Node$1);

	function Notation$1() {
	}Notation$1.prototype.nodeType = NOTATION_NODE$1;
	_extends$1(Notation$1,Node$1);

	function Entity$1() {
	}Entity$1.prototype.nodeType = ENTITY_NODE$1;
	_extends$1(Entity$1,Node$1);

	function EntityReference$1() {
	}EntityReference$1.prototype.nodeType = ENTITY_REFERENCE_NODE$1;
	_extends$1(EntityReference$1,Node$1);

	function DocumentFragment$1() {
	}DocumentFragment$1.prototype.nodeName =	"#document-fragment";
	DocumentFragment$1.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE$1;
	_extends$1(DocumentFragment$1,Node$1);


	function ProcessingInstruction$1() {
	}
	ProcessingInstruction$1.prototype.nodeType = PROCESSING_INSTRUCTION_NODE$1;
	_extends$1(ProcessingInstruction$1,Node$1);
	function XMLSerializer$2(){}
	XMLSerializer$2.prototype.serializeToString = function(node,isHtml,nodeFilter){
		return nodeSerializeToString$1.call(node,isHtml,nodeFilter);
	};
	Node$1.prototype.toString = nodeSerializeToString$1;
	function nodeSerializeToString$1(isHtml,nodeFilter){
		var buf = [];
		var refNode = this.nodeType == 9?this.documentElement:this;
		var prefix = refNode.prefix;
		var uri = refNode.namespaceURI;
		
		if(uri && prefix == null){
			//console.log(prefix)
			var prefix = refNode.lookupPrefix(uri);
			if(prefix == null){
				//isHTML = true;
				var visibleNamespaces=[
				{namespace:uri,prefix:null}
				//{namespace:uri,prefix:''}
				];
			}
		}
		serializeToString$1(this,buf,isHtml,nodeFilter,visibleNamespaces);
		//console.log('###',this.nodeType,uri,prefix,buf.join(''))
		return buf.join('');
	}
	function needNamespaceDefine$1(node,isHTML, visibleNamespaces) {
		var prefix = node.prefix||'';
		var uri = node.namespaceURI;
		if (!prefix && !uri){
			return false;
		}
		if (prefix === "xml" && uri === "http://www.w3.org/XML/1998/namespace" 
			|| uri == 'http://www.w3.org/2000/xmlns/'){
			return false;
		}
		
		var i = visibleNamespaces.length; 
		//console.log('@@@@',node.tagName,prefix,uri,visibleNamespaces)
		while (i--) {
			var ns = visibleNamespaces[i];
			// get namespace prefix
			//console.log(node.nodeType,node.tagName,ns.prefix,prefix)
			if (ns.prefix == prefix){
				return ns.namespace != uri;
			}
		}
		//console.log(isHTML,uri,prefix=='')
		//if(isHTML && prefix ==null && uri == 'http://www.w3.org/1999/xhtml'){
		//	return false;
		//}
		//node.flag = '11111'
		//console.error(3,true,node.flag,node.prefix,node.namespaceURI)
		return true;
	}
	function serializeToString$1(node,buf,isHTML,nodeFilter,visibleNamespaces){
		if(nodeFilter){
			node = nodeFilter(node);
			if(node){
				if(typeof node == 'string'){
					buf.push(node);
					return;
				}
			}else {
				return;
			}
			//buf.sort.apply(attrs, attributeSorter);
		}
		switch(node.nodeType){
		case ELEMENT_NODE$1:
			if (!visibleNamespaces) visibleNamespaces = [];
			visibleNamespaces.length;
			var attrs = node.attributes;
			var len = attrs.length;
			var child = node.firstChild;
			var nodeName = node.tagName;
			
			isHTML =  (htmlns === node.namespaceURI) ||isHTML; 
			buf.push('<',nodeName);
			
			
			
			for(var i=0;i<len;i++){
				// add namespaces for attributes
				var attr = attrs.item(i);
				if (attr.prefix == 'xmlns') {
					visibleNamespaces.push({ prefix: attr.localName, namespace: attr.value });
				}else if(attr.nodeName == 'xmlns'){
					visibleNamespaces.push({ prefix: '', namespace: attr.value });
				}
			}
			for(var i=0;i<len;i++){
				var attr = attrs.item(i);
				if (needNamespaceDefine$1(attr,isHTML, visibleNamespaces)) {
					var prefix = attr.prefix||'';
					var uri = attr.namespaceURI;
					var ns = prefix ? ' xmlns:' + prefix : " xmlns";
					buf.push(ns, '="' , uri , '"');
					visibleNamespaces.push({ prefix: prefix, namespace:uri });
				}
				serializeToString$1(attr,buf,isHTML,nodeFilter,visibleNamespaces);
			}
			// add namespace for current node		
			if (needNamespaceDefine$1(node,isHTML, visibleNamespaces)) {
				var prefix = node.prefix||'';
				var uri = node.namespaceURI;
				var ns = prefix ? ' xmlns:' + prefix : " xmlns";
				buf.push(ns, '="' , uri , '"');
				visibleNamespaces.push({ prefix: prefix, namespace:uri });
			}
			
			if(child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)){
				buf.push('>');
				//if is cdata child node
				if(isHTML && /^script$/i.test(nodeName)){
					while(child){
						if(child.data){
							buf.push(child.data);
						}else {
							serializeToString$1(child,buf,isHTML,nodeFilter,visibleNamespaces);
						}
						child = child.nextSibling;
					}
				}else
				{
					while(child){
						serializeToString$1(child,buf,isHTML,nodeFilter,visibleNamespaces);
						child = child.nextSibling;
					}
				}
				buf.push('</',nodeName,'>');
			}else {
				buf.push('/>');
			}
			// remove added visible namespaces
			//visibleNamespaces.length = startVisibleNamespaces;
			return;
		case DOCUMENT_NODE$1:
		case DOCUMENT_FRAGMENT_NODE$1:
			var child = node.firstChild;
			while(child){
				serializeToString$1(child,buf,isHTML,nodeFilter,visibleNamespaces);
				child = child.nextSibling;
			}
			return;
		case ATTRIBUTE_NODE$1:
			return buf.push(' ',node.name,'="',node.value.replace(/[<&"]/g,_xmlEncoder$1),'"');
		case TEXT_NODE$1:
			return buf.push(node.data.replace(/[<&]/g,_xmlEncoder$1));
		case CDATA_SECTION_NODE$1:
			return buf.push( '<![CDATA[',node.data,']]>');
		case COMMENT_NODE$1:
			return buf.push( "<!--",node.data,"-->");
		case DOCUMENT_TYPE_NODE$1:
			var pubid = node.publicId;
			var sysid = node.systemId;
			buf.push('<!DOCTYPE ',node.name);
			if(pubid){
				buf.push(' PUBLIC "',pubid);
				if (sysid && sysid!='.') {
					buf.push( '" "',sysid);
				}
				buf.push('">');
			}else if(sysid && sysid!='.'){
				buf.push(' SYSTEM "',sysid,'">');
			}else {
				var sub = node.internalSubset;
				if(sub){
					buf.push(" [",sub,"]");
				}
				buf.push(">");
			}
			return;
		case PROCESSING_INSTRUCTION_NODE$1:
			return buf.push( "<?",node.target," ",node.data,"?>");
		case ENTITY_REFERENCE_NODE$1:
			return buf.push( '&',node.nodeName,';');
		//case ENTITY_NODE:
		//case NOTATION_NODE:
		default:
			buf.push('??',node.nodeName);
		}
	}
	function importNode$1(doc,node,deep){
		var node2;
		switch (node.nodeType) {
		case ELEMENT_NODE$1:
			node2 = node.cloneNode(false);
			node2.ownerDocument = doc;
			//var attrs = node2.attributes;
			//var len = attrs.length;
			//for(var i=0;i<len;i++){
				//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
			//}
		case DOCUMENT_FRAGMENT_NODE$1:
			break;
		case ATTRIBUTE_NODE$1:
			deep = true;
			break;
		//case ENTITY_REFERENCE_NODE:
		//case PROCESSING_INSTRUCTION_NODE:
		////case TEXT_NODE:
		//case CDATA_SECTION_NODE:
		//case COMMENT_NODE:
		//	deep = false;
		//	break;
		//case DOCUMENT_NODE:
		//case DOCUMENT_TYPE_NODE:
		//cannot be imported.
		//case ENTITY_NODE:
		//case NOTATION_NODE：
		//can not hit in level3
		//default:throw e;
		}
		if(!node2){
			node2 = node.cloneNode(false);//false
		}
		node2.ownerDocument = doc;
		node2.parentNode = null;
		if(deep){
			var child = node.firstChild;
			while(child){
				node2.appendChild(importNode$1(doc,child,deep));
				child = child.nextSibling;
			}
		}
		return node2;
	}
	//
	//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
	//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
	function cloneNode$1(doc,node,deep){
		var node2 = new node.constructor();
		for(var n in node){
			var v = node[n];
			if(typeof v != 'object' ){
				if(v != node2[n]){
					node2[n] = v;
				}
			}
		}
		if(node.childNodes){
			node2.childNodes = new NodeList$1();
		}
		node2.ownerDocument = doc;
		switch (node2.nodeType) {
		case ELEMENT_NODE$1:
			var attrs	= node.attributes;
			var attrs2	= node2.attributes = new NamedNodeMap$1();
			var len = attrs.length;
			attrs2._ownerElement = node2;
			for(var i=0;i<len;i++){
				node2.setAttributeNode(cloneNode$1(doc,attrs.item(i),true));
			}
			break;	case ATTRIBUTE_NODE$1:
			deep = true;
		}
		if(deep){
			var child = node.firstChild;
			while(child){
				node2.appendChild(cloneNode$1(doc,child,deep));
				child = child.nextSibling;
			}
		}
		return node2;
	}

	function __set__$1(object,key,value){
		object[key] = value;
	}
	//do dynamic
	try{
		if(Object.defineProperty){
			Object.defineProperty(LiveNodeList$1.prototype,'length',{
				get:function(){
					_updateLiveList$1(this);
					return this.$$length;
				}
			});
			Object.defineProperty(Node$1.prototype,'textContent',{
				get:function(){
					return getTextContent(this);
				},
				set:function(data){
					switch(this.nodeType){
					case ELEMENT_NODE$1:
					case DOCUMENT_FRAGMENT_NODE$1:
						while(this.firstChild){
							this.removeChild(this.firstChild);
						}
						if(data || String(data)){
							this.appendChild(this.ownerDocument.createTextNode(data));
						}
						break;
					default:
						//TODO:
						this.data = data;
						this.value = data;
						this.nodeValue = data;
					}
				}
			});
			
			function getTextContent(node){
				switch(node.nodeType){
				case ELEMENT_NODE$1:
				case DOCUMENT_FRAGMENT_NODE$1:
					var buf = [];
					node = node.firstChild;
					while(node){
						if(node.nodeType!==7 && node.nodeType !==8){
							buf.push(getTextContent(node));
						}
						node = node.nextSibling;
					}
					return buf.join('');
				default:
					return node.nodeValue;
				}
			}
			__set__$1 = function(object,key,value){
				//console.log(value)
				object['$$'+key] = value;
			};
		}
	}catch(e){//ie8
	}

	//if(typeof require == 'function'){
		var DOMImplementation_1$1 = DOMImplementation$3;
		var XMLSerializer_1$1 = XMLSerializer$2;
	//}

	var dom$2 = {
		DOMImplementation: DOMImplementation_1$1,
		XMLSerializer: XMLSerializer_1$1
	};

	var domParser$1 = createCommonjsModule(function (module, exports) {
	function DOMParser(options){
		this.options = options ||{locator:{}};
		
	}
	DOMParser.prototype.parseFromString = function(source,mimeType){
		var options = this.options;
		var sax =  new XMLReader();
		var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
		var errorHandler = options.errorHandler;
		var locator = options.locator;
		var defaultNSMap = options.xmlns||{};
		var entityMap = {'lt':'<','gt':'>','amp':'&','quot':'"','apos':"'"};
		if(locator){
			domBuilder.setDocumentLocator(locator);
		}
		
		sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
		sax.domBuilder = options.domBuilder || domBuilder;
		if(/\/x?html?$/.test(mimeType)){
			entityMap.nbsp = '\xa0';
			entityMap.copy = '\xa9';
			defaultNSMap['']= 'http://www.w3.org/1999/xhtml';
		}
		defaultNSMap.xml = defaultNSMap.xml || 'http://www.w3.org/XML/1998/namespace';
		if(source){
			sax.parse(source,defaultNSMap,entityMap);
		}else {
			sax.errorHandler.error("invalid doc source");
		}
		return domBuilder.doc;
	};
	function buildErrorHandler(errorImpl,domBuilder,locator){
		if(!errorImpl){
			if(domBuilder instanceof DOMHandler){
				return domBuilder;
			}
			errorImpl = domBuilder ;
		}
		var errorHandler = {};
		var isCallback = errorImpl instanceof Function;
		locator = locator||{};
		function build(key){
			var fn = errorImpl[key];
			if(!fn && isCallback){
				fn = errorImpl.length == 2?function(msg){errorImpl(key,msg);}:errorImpl;
			}
			errorHandler[key] = fn && function(msg){
				fn('[xmldom '+key+']\t'+msg+_locator(locator));
			}||function(){};
		}
		build('warning');
		build('error');
		build('fatalError');
		return errorHandler;
	}

	//console.log('#\n\n\n\n\n\n\n####')
	/**
	 * +ContentHandler+ErrorHandler
	 * +LexicalHandler+EntityResolver2
	 * -DeclHandler-DTDHandler 
	 * 
	 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
	 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
	 */
	function DOMHandler() {
	    this.cdata = false;
	}
	function position(locator,node){
		node.lineNumber = locator.lineNumber;
		node.columnNumber = locator.columnNumber;
	}
	/**
	 * @see org.xml.sax.ContentHandler#startDocument
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
	 */ 
	DOMHandler.prototype = {
		startDocument : function() {
	    	this.doc = new DOMImplementation().createDocument(null, null, null);
	    	if (this.locator) {
	        	this.doc.documentURI = this.locator.systemId;
	    	}
		},
		startElement:function(namespaceURI, localName, qName, attrs) {
			var doc = this.doc;
		    var el = doc.createElementNS(namespaceURI, qName||localName);
		    var len = attrs.length;
		    appendElement(this, el);
		    this.currentElement = el;
		    
			this.locator && position(this.locator,el);
		    for (var i = 0 ; i < len; i++) {
		        var namespaceURI = attrs.getURI(i);
		        var value = attrs.getValue(i);
		        var qName = attrs.getQName(i);
				var attr = doc.createAttributeNS(namespaceURI, qName);
				this.locator &&position(attrs.getLocator(i),attr);
				attr.value = attr.nodeValue = value;
				el.setAttributeNode(attr);
		    }
		},
		endElement:function(namespaceURI, localName, qName) {
			var current = this.currentElement;
			current.tagName;
			this.currentElement = current.parentNode;
		},
		startPrefixMapping:function(prefix, uri) {
		},
		endPrefixMapping:function(prefix) {
		},
		processingInstruction:function(target, data) {
		    var ins = this.doc.createProcessingInstruction(target, data);
		    this.locator && position(this.locator,ins);
		    appendElement(this, ins);
		},
		ignorableWhitespace:function(ch, start, length) {
		},
		characters:function(chars, start, length) {
			chars = _toString.apply(this,arguments);
			//console.log(chars)
			if(chars){
				if (this.cdata) {
					var charNode = this.doc.createCDATASection(chars);
				} else {
					var charNode = this.doc.createTextNode(chars);
				}
				if(this.currentElement){
					this.currentElement.appendChild(charNode);
				}else if(/^\s*$/.test(chars)){
					this.doc.appendChild(charNode);
					//process xml
				}
				this.locator && position(this.locator,charNode);
			}
		},
		skippedEntity:function(name) {
		},
		endDocument:function() {
			this.doc.normalize();
		},
		setDocumentLocator:function (locator) {
		    if(this.locator = locator){// && !('lineNumber' in locator)){
		    	locator.lineNumber = 0;
		    }
		},
		//LexicalHandler
		comment:function(chars, start, length) {
			chars = _toString.apply(this,arguments);
		    var comm = this.doc.createComment(chars);
		    this.locator && position(this.locator,comm);
		    appendElement(this, comm);
		},
		
		startCDATA:function() {
		    //used in characters() methods
		    this.cdata = true;
		},
		endCDATA:function() {
		    this.cdata = false;
		},
		
		startDTD:function(name, publicId, systemId) {
			var impl = this.doc.implementation;
		    if (impl && impl.createDocumentType) {
		        var dt = impl.createDocumentType(name, publicId, systemId);
		        this.locator && position(this.locator,dt);
		        appendElement(this, dt);
		    }
		},
		/**
		 * @see org.xml.sax.ErrorHandler
		 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
		 */
		warning:function(error) {
			console.warn('[xmldom warning]\t'+error,_locator(this.locator));
		},
		error:function(error) {
			console.error('[xmldom error]\t'+error,_locator(this.locator));
		},
		fatalError:function(error) {
			console.error('[xmldom fatalError]\t'+error,_locator(this.locator));
		    throw error;
		}
	};
	function _locator(l){
		if(l){
			return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
		}
	}
	function _toString(chars,start,length){
		if(typeof chars == 'string'){
			return chars.substr(start,length)
		}else {//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
			if(chars.length >= start+length || start){
				return new java.lang.String(chars,start,length)+'';
			}
			return chars;
		}
	}

	/*
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
	 * used method of org.xml.sax.ext.LexicalHandler:
	 *  #comment(chars, start, length)
	 *  #startCDATA()
	 *  #endCDATA()
	 *  #startDTD(name, publicId, systemId)
	 *
	 *
	 * IGNORED method of org.xml.sax.ext.LexicalHandler:
	 *  #endDTD()
	 *  #startEntity(name)
	 *  #endEntity(name)
	 *
	 *
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
	 * IGNORED method of org.xml.sax.ext.DeclHandler
	 * 	#attributeDecl(eName, aName, type, mode, value)
	 *  #elementDecl(name, model)
	 *  #externalEntityDecl(name, publicId, systemId)
	 *  #internalEntityDecl(name, value)
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
	 * IGNORED method of org.xml.sax.EntityResolver2
	 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
	 *  #resolveEntity(publicId, systemId)
	 *  #getExternalSubset(name, baseURI)
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
	 * IGNORED method of org.xml.sax.DTDHandler
	 *  #notationDecl(name, publicId, systemId) {};
	 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
	 */
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
		DOMHandler.prototype[key] = function(){return null};
	});

	/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
	function appendElement (hander,node) {
	    if (!hander.currentElement) {
	        hander.doc.appendChild(node);
	    } else {
	        hander.currentElement.appendChild(node);
	    }
	}//appendChild and setAttributeNS are preformance key

	//if(typeof require == 'function'){
		var XMLReader = sax$1.XMLReader;
		var DOMImplementation = exports.DOMImplementation = dom$2.DOMImplementation;
		exports.XMLSerializer = dom$2.XMLSerializer ;
		exports.DOMParser = DOMParser;
	//}
	});
	domParser$1.DOMImplementation;
	domParser$1.XMLSerializer;
	domParser$1.DOMParser;

	var serializer = new domParser$1.XMLSerializer();
	function xml2str$1(str) {
	  // IE9 will create a new XMLSerializer but it'll crash immediately.
	  // This line is ignored because we don't run coverage tests in IE9
	  /* istanbul ignore next */
	  if (str.xml !== undefined) return str.xml;
	  return serializer.serializeToString(str);
	}
	function parent$2(el) {
	  return el.parentElement || el.parentNode || null;
	}
	function get$4(doc, tag) {
	  return doc.getElementsByTagName(tag);
	}
	function get1$3(doc, tag) {
	  var els = get$4(doc, tag);
	  return els.length ? els[0] : null;
	}
	function getChild(doc, tag) {
	  var list = [];
	  if (!doc || !doc.childNodes.length) {
	    return list;
	  }
	  for (var i = 0; i < doc.childNodes.length; i++) {
	    var el = doc.childNodes[i];
	    if (el.tagName === tag) {
	      list.push(el);
	    }
	  }
	  return list;
	}
	function getChild1$1(doc, tag) {
	  if (!doc || !doc.childNodes.length) {
	    return null;
	  }
	  for (var i = 0; i < doc.childNodes.length; i++) {
	    var el = doc.childNodes[i];
	    if (el.tagName === tag) {
	      return el;
	    }
	  }
	  return null;
	}
	function attr$4(el, name) {
	  return el.getAttribute(name);
	}
	function setAttr$1(el, name, value) {
	  return el.setAttribute(name, value);
	}
	function attrf(el, name) {
	  return parseFloat(attr$4(el, name));
	}
	function norm(el) {
	  return el.normalize ? el.normalize() : el;
	}
	function nodeVal$4(el, trim) {
	  if (el) {
	    norm(el);
	  }
	  var value = el && el.textContent || '';
	  trim = trim === undefined ? true : trim; // trim line breaks and spaces
	  return trim ? value.replace(/(\r\n|\n|\r)/gm, "").trim() : value;
	}
	var dom$1 = {
	  parent: parent$2,
	  get: get$4,
	  get1: get1$3,
	  getChild: getChild,
	  getChild1: getChild1$1,
	  attr: attr$4,
	  setAttr: setAttr$1,
	  attrf: attrf,
	  norm: norm,
	  nodeVal: nodeVal$4,
	  xml2str: xml2str$1
	};

	/**
	 * 
	 * @param {Number} n
	 * @param {Number} topValue 1 or 255, default is 255
	 * @return 2 digits hex value in lowercase like, ff
	 */
	function numberToHex$1(n, topValue) {
	  var hex;
	  topValue = topValue || 255;
	  if (topValue === 1) {
	    n *= 255;
	  }
	  n = Math.min(n, 255);
	  hex = n.toString(16);
	  if (hex.indexOf('.') > -1) {
	    hex = hex.substr(0, hex.indexOf('.'));
	  }
	  if (hex.length < 2) {
	    hex = '0' + hex;
	  }
	  return hex;
	}

	/**
	 * convert hex to kml color value
	 * @param {String} hexColor format like: FFF/FFFFFF/#FFF/#FFFFFF
	 * @param {Number} opacity [0, 1]
	 * @return {String} aabbggrr (lowercase)
	 */
	function hexToKmlColor(hexColor, opacity) {
	  if (typeof hexColor !== 'string') {
	    return '';
	  }
	  hexColor = hexColor.replace('#', '').toLowerCase();
	  if (hexColor.length === 3) {
	    hexColor = hexColor[0] + hexColor[0] + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2];
	  } else if (hexColor.length !== 6) {
	    return '';
	  }
	  var r = hexColor[0] + hexColor[1];
	  var g = hexColor[2] + hexColor[3];
	  var b = hexColor[4] + hexColor[5];
	  var o = 'ff';
	  if (typeof opacity === 'number' && opacity >= 0.0 && opacity <= 1.0) {
	    o = (opacity * 255).toString(16);
	    if (o.indexOf('.') > -1) {
	      o = o.substr(0, o.indexOf('.'));
	    }
	    if (o.length < 2) {
	      o = '0' + o;
	    }
	  }
	  return o + b + g + r;
	}

	/**
	 * parse kml color value
	 * @param {String} v acceptable formats: rgb/#rgb/rrggbb/#rrggbb/aabbggrr
	 * @return [hexColorString(#rrggbb), opacity([0,1])]
	 */
	function kmlColor$1(v) {
	  var color, opacity;
	  v = v || '';
	  if (v.substr(0, 1) === '#') {
	    v = v.substr(1);
	  }
	  if (v.length === 6 || v.length === 3) {
	    // rrggbb || rgb
	    color = v;
	  }
	  if (v.length === 8) {
	    // aabbggrr https://developers.google.com/kml/documentation/kmlreference#colorstyle
	    opacity = parseInt(v.substr(0, 2), 16) / 255; // [0, 1]
	    color = '#' + v.substr(6, 2) + v.substr(4, 2) + v.substr(2, 2); // #rrggbb
	  }
	  return [color, isNaN(opacity) ? undefined : opacity];
	}
	var color = {
	  hexToKmlColor: hexToKmlColor,
	  kmlColor: kmlColor$1,
	  numberToHex: numberToHex$1
	};

	var get$3 = dom$1.get;
	var get1$2 = dom$1.get1;
	var attr$3 = dom$1.attr;
	var nodeVal$3 = dom$1.nodeVal;
	var xml2str = dom$1.xml2str;
	var kmlColor = color.kmlColor;
	var parse_1$4 = parse$6;

	// generate a short, numeric hash of a string
	function okhash(x) {
	  if (!x || !x.length) {
	    return 0;
	  }
	  for (var i = 0, h = 0; i < x.length; i++) {
	    h = (h << 5) - h + x.charCodeAt(i) | 0;
	  }
	  return h;
	}
	function parse$6(doc, options) {
	  // styleIndex keeps track of hashed styles in order to match features
	  var styleIndex = {}; // { '#styleId': <hashValue> }
	  var styleByHash = {};
	  // styleMapIndex keeps track of style maps to expose in properties
	  var styleMapIndex = {};
	  var styles = get$3(doc, 'Style');
	  var styleMaps = get$3(doc, 'StyleMap');
	  for (var k = 0; k < styles.length; k++) {
	    var hash = okhash(xml2str(styles[k])).toString(16);
	    styleIndex['#' + attr$3(styles[k], 'id')] = hash;
	    styleByHash[hash] = styles[k];
	  }
	  for (var l = 0; l < styleMaps.length; l++) {
	    styleIndex['#' + attr$3(styleMaps[l], 'id')] = okhash(xml2str(styleMaps[l])).toString(16);
	    var pairs = get$3(styleMaps[l], 'Pair');
	    var pairsMap = {};
	    for (var m = 0; m < pairs.length; m++) {
	      pairsMap[nodeVal$3(get1$2(pairs[m], 'key'))] = nodeVal$3(get1$2(pairs[m], 'styleUrl'));
	    }
	    styleMapIndex['#' + attr$3(styleMaps[l], 'id')] = pairsMap;
	  }
	  if (options && options.returnPropertiesSetter) {
	    return function (placemarkNode, properties) {
	      setStyleProperties(placemarkNode, properties, styleByHash, styleIndex, styleMapIndex);
	    };
	  } else {
	    return {
	      styleByHash,
	      styleIndex,
	      styleMapIndex
	    };
	  }
	}
	function setStyleProperties(placemarkNode, properties, styleByHash, styleIndex, styleMapIndex) {
	  var styleUrl = nodeVal$3(get1$2(placemarkNode, 'styleUrl'));
	  var lineStyle = get1$2(placemarkNode, 'LineStyle');
	  var polyStyle = get1$2(placemarkNode, 'PolyStyle');
	  // var iconStyle = null
	  let iconStyle = get1$2(placemarkNode, 'IconStyle');
	  if (styleUrl) {
	    if (styleUrl[0] !== '#') {
	      styleUrl = '#' + styleUrl;
	    }
	    properties.styleUrl = styleUrl;
	    if (styleIndex[styleUrl]) {
	      properties.styleHash = styleIndex[styleUrl];
	    }
	    if (styleMapIndex[styleUrl]) {
	      properties.styleMapHash = styleMapIndex[styleUrl];
	      properties.styleHash = styleIndex[styleMapIndex[styleUrl].normal];
	    }

	    // Try to populate the lineStyle or polyStyle since we got the style hash
	    var style = styleByHash[properties.styleHash];
	    if (style) {
	      iconStyle = iconStyle || get1$2(style, 'IconStyle');
	      lineStyle = lineStyle || get1$2(style, 'LineStyle');
	      polyStyle = polyStyle || get1$2(style, 'PolyStyle');
	    }
	  }
	  if (iconStyle) {
	    setPointStyleProperties(properties, iconStyle);
	  }
	  if (lineStyle) {
	    setLineStyleProperties(properties, lineStyle);
	  }
	  if (polyStyle) {
	    setPolygonStyleProperties(properties, polyStyle);
	  }
	  let ovattr = get1$2(placemarkNode, 'OvAttr');
	  if (ovattr) {
	    setOVAttrProperties(properties, ovattr);
	  }
	}
	function setOVAttrProperties(properties, style) {
	  if (style) {
	    try {
	      let c = style.children;
	      if (c) {
	        [...c].map(node => {
	          properties[node.tagName] = nodeVal$3(node);
	        });
	      }
	    } catch (e) {}
	  }
	}

	/**
	 * point style fields: { icon: <icon url> }
	 * about IconStyle: https://developers.google.com/kml/documentation/kmlreference#iconstyle
	 */
	function setPointStyleProperties(properties, style) {
	  var icon = get1$2(style, 'Icon');
	  if (icon) {
	    var href = nodeVal$3(get1$2(icon, 'href'));
	    if (href) {
	      properties['icon'] = href;
	    }
	  }
	}

	/**
	 * polyline style fields: { 'stroke', 'stroke-opacity', 'stroke-width' }
	 * about LineStyle: https://developers.google.com/kml/documentation/kmlreference#linestyle
	 */
	function setLineStyleProperties(properties, style) {
	  var linestyles = kmlColor(nodeVal$3(get1$2(style, 'color')));
	  var color = linestyles[0];
	  var opacity = linestyles[1];
	  var width = parseFloat(nodeVal$3(get1$2(style, 'width')));
	  if (color) {
	    properties['stroke'] = color;
	  }
	  if (!isNaN(opacity)) {
	    properties['stroke-opacity'] = opacity;
	  }
	  if (!isNaN(width)) {
	    properties['stroke-width'] = width;
	  }
	}

	/**
	 * polygon style fields: { 'fill', 'fill-opacity', 'stroke-opacity' }
	 * about PolyStyle: https://developers.google.com/kml/documentation/kmlreference#polystyle
	 */
	function setPolygonStyleProperties(properties, style) {
	  var polystyles = kmlColor(nodeVal$3(get1$2(style, 'color')));
	  var color = polystyles[0];
	  var opacity = polystyles[1];
	  var fill = nodeVal$3(get1$2(style, 'fill'));
	  nodeVal$3(get1$2(style, 'outline'));
	  if (color) {
	    properties['fill'] = color;
	  }
	  if (!isNaN(opacity)) {
	    properties['fill-opacity'] = opacity;
	  }
	  if (fill) {
	    properties['fill-opacity'] = fill === '1' ? properties['fill-opacity'] || 1 : 0;
	  }
	  // if (outline) {
	  // 	properties['stroke-opacity'] = outline === '1' ? properties['stroke-opacity'] || 1 : 0
	  // }
	}
	var style$1 = {
	  parse: parse_1$4
	};

	var FOLDER_KEY_NAME$2 = '_fkey';
	var DEFAULT_KML_STYLES = {
	  polySyleColor: '88555555',
	  lineStyleColor: 'ff555555',
	  lineWidth: 2
	};
	var DEFAULT_SYMBOLS$1 = {
	  marker: {
	    type: 'esriSMS',
	    style: 'esriSMSCircle',
	    color: [255, 0, 0, 64],
	    size: 10,
	    angle: 0,
	    xoffset: 0,
	    yoffset: 0,
	    outline: {
	      color: [255, 0, 0, 255],
	      width: 1,
	      style: 'esriSLSSolid',
	      type: 'esriSLS'
	    }
	  },
	  polyline: {
	    type: 'esriSLS',
	    style: 'esriSLSSolid',
	    color: [255, 0, 0, 255],
	    width: 2
	  },
	  polygon: {
	    type: 'esriSFS',
	    style: 'esriSFSSolid',
	    color: [255, 0, 0, 64],
	    outline: {
	      type: 'esriSLS',
	      style: 'esriSLSSolid',
	      color: [255, 0, 0, 255],
	      width: 2
	    }
	  }
	};
	var constants = {
	  FOLDER_KEY_NAME: FOLDER_KEY_NAME$2,
	  DEFAULT_KML_STYLES: DEFAULT_KML_STYLES,
	  DEFAULT_SYMBOLS: DEFAULT_SYMBOLS$1
	};

	var get$2 = dom$1.get;
	var get1$1 = dom$1.get1;
	var nodeVal$2 = dom$1.nodeVal;
	var geotypes = ['Polygon', 'LineString', 'Point', 'Track', 'gx:Track'];
	var $options$1 = {};
	function parse$5(root, options) {
	  if (options) $options$1 = options;
	  var geomNode,
	    geomNodes,
	    i,
	    j,
	    k,
	    geoms = [],
	    coordTimes = [];
	  if (get1$1(root, 'MultiGeometry')) {
	    return parse$5(get1$1(root, 'MultiGeometry'));
	  }
	  if (get1$1(root, 'MultiTrack')) {
	    return parse$5(get1$1(root, 'MultiTrack'));
	  }
	  if (get1$1(root, 'gx:MultiTrack')) {
	    return parse$5(get1$1(root, 'gx:MultiTrack'));
	  }
	  for (i = 0; i < geotypes.length; i++) {
	    geomNodes = get$2(root, geotypes[i]);
	    if (geomNodes) {
	      for (j = 0; j < geomNodes.length; j++) {
	        geomNode = geomNodes[j];
	        if (geotypes[i] === 'Point') {
	          geoms.push({
	            type: 'Point',
	            coordinates: coord1(nodeVal$2(get1$1(geomNode, 'coordinates'), false))
	          });
	        } else if (geotypes[i] === 'LineString') {
	          geoms.push({
	            type: 'LineString',
	            coordinates: coord(nodeVal$2(get1$1(geomNode, 'coordinates'), false))
	          });
	        } else if (geotypes[i] === 'Polygon') {
	          var rings = get$2(geomNode, 'LinearRing'),
	            coords = [];
	          for (k = 0; k < rings.length; k++) {
	            coords.push(coord(nodeVal$2(get1$1(rings[k], 'coordinates'), false)));
	          }
	          geoms.push({
	            type: 'Polygon',
	            coordinates: coords
	          });
	        } else if (geotypes[i] === 'Track' || geotypes[i] === 'gx:Track') {
	          var track = gxCoords(geomNode);
	          geoms.push({
	            type: 'LineString',
	            coordinates: track.coords
	          });
	          if (track.times.length) {
	            coordTimes.push(track.times);
	          }
	        }
	      }
	    }
	  }
	  return {
	    geoms: geoms,
	    coordTimes: coordTimes
	  };
	}

	// cast array x into numbers
	function numarray(x) {
	  for (var j = 0, o = []; j < x.length; j++) {
	    o[j] = parseFloat(x[j]);
	  }
	  return o;
	}

	// get one coordinate from a coordinate array, if any
	var removeSpace = /\s*/g;
	var trimSpace = /^\s*|\s*$/g;
	var splitSpace = /\s+/;
	function coord1(v) {
	  var cord = numarray(v.replace(removeSpace, '').split(','));
	  if ($options$1.coordCallback) cord = $options$1.coordCallback(cord, $options$1.attributes);
	  return cord;
	}

	// get all coordinates from a coordinate array as [[],[]]
	function coord(v) {
	  var coords = v.replace(trimSpace, '').split(splitSpace);
	  var o = [];
	  for (var i = 0; i < coords.length; i++) {
	    o.push(coord1(coords[i]));
	  }
	  return o;
	}
	function gxCoord(v) {
	  return numarray(v.split(' '));
	}
	function gxCoords(root) {
	  var elems = get$2(root, 'coord', 'gx'),
	    coords = [],
	    times = [];
	  if (elems.length === 0) {
	    elems = get$2(root, 'gx:coord');
	  }
	  for (var i = 0; i < elems.length; i++) {
	    coords.push(gxCoord(nodeVal$2(elems[i])));
	  }
	  var timeElems = get$2(root, 'when');
	  for (var j = 0; j < timeElems.length; j++) {
	    times.push(nodeVal$2(timeElems[j]));
	  }
	  return {
	    coords: coords,
	    times: times
	  };
	}
	var parse_1$3 = parse$5;
	var geometry$2 = {
	  parse: parse_1$3
	};

	var FOLDER_KEY_NAME$1 = constants.FOLDER_KEY_NAME;
	var parseGeometry = geometry$2.parse;
	var get$1 = dom$1.get;
	var parent$1 = dom$1.parent;
	var get1 = dom$1.get1;
	var nodeVal$1 = dom$1.nodeVal;
	var attr$2 = dom$1.attr;
	var isObj$2 = function (a) {
	  return Object.prototype.toString.call(a) === '[object Object]';
	};
	var $options = {};
	function parse$4(root, stylePropertiesSetter, options) {
	  if (options) $options = options;
	  var i,
	    properties = {};
	  var folder = options.folderElements.some(function (a) {
	    return a === parent$1(root).tagName;
	  }) ? attr$2(parent$1(root), FOLDER_KEY_NAME$1) : null;
	  var key = options.folderElements.some(function (a) {
	    return a === root.tagName;
	  }) ? attr$2(root, FOLDER_KEY_NAME$1) : null;
	  var name = nodeVal$1(get1(root, 'name'));
	  var address = nodeVal$1(get1(root, 'address'));
	  var description = nodeVal$1(get1(root, 'description'));
	  var OvCoordType = nodeVal$1(get1(root, 'OvCoordType'));
	  var timeSpan = get1(root, 'TimeSpan');
	  var timeStamp = get1(root, 'TimeStamp');
	  var extendedData = get1(root, 'ExtendedData');
	  var visibility = get1(root, 'visibility');

	  // parse extendedData first, so it could be overrided if name conflicts
	  if (extendedData) {
	    var datas = get$1(extendedData, 'Data');
	    var simpleDatas = get$1(extendedData, 'SimpleData');
	    for (i = 0; i < datas.length; i++) {
	      properties[datas[i].getAttribute('name')] = nodeVal$1(get1(datas[i], 'value'));
	    }
	    for (i = 0; i < simpleDatas.length; i++) {
	      properties[simpleDatas[i].getAttribute('name')] = nodeVal$1(simpleDatas[i]);
	    }
	  }
	  if (folder) {
	    properties.folder = folder;
	    properties.parent = folder;
	  }
	  if (key) {
	    properties.key = key;
	  }
	  if (name) {
	    properties.name = name;
	  }
	  if (address) {
	    properties.address = address;
	  }
	  if (description) {
	    properties.description = description;
	  }
	  if (OvCoordType) {
	    properties.OvCoordType = OvCoordType;
	  }
	  if (visibility) {
	    properties.visibility = nodeVal$1(visibility);
	  }
	  if (timeStamp) {
	    properties.timestamp = nodeVal$1(get1(timeStamp, 'when'));
	  }
	  if (timeSpan) {
	    var begin = nodeVal$1(get1(timeSpan, 'begin'));
	    var end = nodeVal$1(get1(timeSpan, 'end'));
	    properties.timespan = {
	      begin: begin,
	      end: end
	    };
	  }
	  if (stylePropertiesSetter) {
	    stylePropertiesSetter(root, properties);
	  }
	  var callbacks = $options.propertyCallbacks;
	  if (isObj$2(callbacks)) {
	    for (var key in callbacks) {
	      if (!properties.hasOwnProperty(key)) continue;
	      var val = callbacks[key](properties[key]);
	      if (isObj$2(val)) {
	        delete properties[key];
	        Object.assign(properties, val);
	      } else {
	        properties[key] = callbacks[key](properties[key]);
	      }
	    }
	  }
	  $options.attributes = properties;
	  var geomsAndTimes = parseGeometry(root, $options);
	  if (!geomsAndTimes.geoms.length) {
	    return [];
	  }
	  if (geomsAndTimes.coordTimes.length) {
	    properties.coordTimes = geomsAndTimes.coordTimes.length === 1 ? geomsAndTimes.coordTimes[0] : geomsAndTimes.coordTimes;
	  }
	  var feature = {
	    type: 'Feature',
	    geometry: geomsAndTimes.geoms.length === 1 ? geomsAndTimes.geoms[0] : {
	      type: 'GeometryCollection',
	      geometries: geomsAndTimes.geoms
	    },
	    properties: properties
	  };
	  if (attr$2(root, 'id')) {
	    feature.id = attr$2(root, 'id');
	  }
	  return feature;
	}
	var parse_1$2 = parse$4;
	var placemark = {
	  parse: parse_1$2
	};

	var FOLDER_KEY_NAME = constants.FOLDER_KEY_NAME;
	var parent = dom$1.parent;
	var nodeVal = dom$1.nodeVal;
	var get = dom$1.get;
	var getChild1 = dom$1.getChild1;
	var attr$1 = dom$1.attr;
	var setAttr = dom$1.setAttr;

	/**
	 * returns folder tree: [{ key, parent, name, children }]
	 * and set Folder element with key attribute
	 */
	function parse$3(kmlDocument, options) {
	  var folderEls = [];
	  options.folderElements.forEach(function (a) {
	    folderEls = folderEls.concat(Array.from(get(kmlDocument, a)));
	  });
	  if (folderEls.length === 0) {
	    return [];
	  }
	  var defaultFolderName = options.defaultFolderName;
	  var parentEl = parent(folderEls[0]);
	  var n = 0;
	  var process = function (folderEl) {
	    var parentEl = parent(folderEl);
	    var nameEl = getChild1(folderEl, 'name');
	    var descEl = getChild1(folderEl, 'desc');
	    var valueEl = getChild1(folderEl, 'value');
	    var key = n++ + '';
	    setAttr(folderEl, FOLDER_KEY_NAME, key);
	    var result = {
	      key: key,
	      parent: options.folderElements.some(function (a) {
	        return a === parentEl.tagName;
	      }) ? attr$1(parentEl, FOLDER_KEY_NAME) : null,
	      name: nameEl ? nodeVal(nameEl) : defaultFolderName,
	      children: folderEls.filter(function (e) {
	        return parent(e) === folderEl;
	      }).map(process)
	    };
	    if (descEl) {
	      result.desc = nodeVal(descEl);
	    }
	    if (valueEl) {
	      result.value = nodeVal(valueEl);
	    }
	    return result;
	  };
	  return folderEls.filter(function (e) {
	    return parent(e) === parentEl;
	  }).map(process);
	}
	var parse_1$1 = parse$3;
	var folder$1 = {
	  parse: parse_1$1
	};

	/**
	 * Ponyfill for `Array.prototype.find` which is only available in ES6 runtimes.
	 *
	 * Works with anything that has a `length` property and index access properties, including NodeList.
	 *
	 * @template {unknown} T
	 * @param {Array<T> | ({length:number, [number]: T})} list
	 * @param {function (item: T, index: number, list:Array<T> | ({length:number, [number]: T})):boolean} predicate
	 * @param {Partial<Pick<ArrayConstructor['prototype'], 'find'>>?} ac `Array.prototype` by default,
	 * 				allows injecting a custom implementation in tests
	 * @returns {T | undefined}
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	 * @see https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.find
	 */
	function find$1(list, predicate, ac) {
		if (ac === undefined) {
			ac = Array.prototype;
		}
		if (list && typeof ac.find === 'function') {
			return ac.find.call(list, predicate);
		}
		for (var i = 0; i < list.length; i++) {
			if (Object.prototype.hasOwnProperty.call(list, i)) {
				var item = list[i];
				if (predicate.call(undefined, item, i, list)) {
					return item;
				}
			}
		}
	}

	/**
	 * "Shallow freezes" an object to render it immutable.
	 * Uses `Object.freeze` if available,
	 * otherwise the immutability is only in the type.
	 *
	 * Is used to create "enum like" objects.
	 *
	 * @template T
	 * @param {T} object the object to freeze
	 * @param {Pick<ObjectConstructor, 'freeze'> = Object} oc `Object` by default,
	 * 				allows to inject custom object constructor for tests
	 * @returns {Readonly<T>}
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
	 */
	function freeze(object, oc) {
		if (oc === undefined) {
			oc = Object;
		}
		return oc && typeof oc.freeze === 'function' ? oc.freeze(object) : object
	}

	/**
	 * Since we can not rely on `Object.assign` we provide a simplified version
	 * that is sufficient for our needs.
	 *
	 * @param {Object} target
	 * @param {Object | null | undefined} source
	 *
	 * @returns {Object} target
	 * @throws TypeError if target is not an object
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	 * @see https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.assign
	 */
	function assign(target, source) {
		if (target === null || typeof target !== 'object') {
			throw new TypeError('target is not an object')
		}
		for (var key in source) {
			if (Object.prototype.hasOwnProperty.call(source, key)) {
				target[key] = source[key];
			}
		}
		return target
	}

	/**
	 * All mime types that are allowed as input to `DOMParser.parseFromString`
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#Argument02 MDN
	 * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#domparsersupportedtype WHATWG HTML Spec
	 * @see DOMParser.prototype.parseFromString
	 */
	var MIME_TYPE = freeze({
		/**
		 * `text/html`, the only mime type that triggers treating an XML document as HTML.
		 *
		 * @see DOMParser.SupportedType.isHTML
		 * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
		 * @see https://en.wikipedia.org/wiki/HTML Wikipedia
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
		 * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring WHATWG HTML Spec
		 */
		HTML: 'text/html',

		/**
		 * Helper method to check a mime type if it indicates an HTML document
		 *
		 * @param {string} [value]
		 * @returns {boolean}
		 *
		 * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
		 * @see https://en.wikipedia.org/wiki/HTML Wikipedia
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
		 * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring 	 */
		isHTML: function (value) {
			return value === MIME_TYPE.HTML
		},

		/**
		 * `application/xml`, the standard mime type for XML documents.
		 *
		 * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType registration
		 * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
		 * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		 */
		XML_APPLICATION: 'application/xml',

		/**
		 * `text/html`, an alias for `application/xml`.
		 *
		 * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
		 * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
		 * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		 */
		XML_TEXT: 'text/xml',

		/**
		 * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
		 * but is parsed as an XML document.
		 *
		 * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType registration
		 * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
		 * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
		 */
		XML_XHTML_APPLICATION: 'application/xhtml+xml',

		/**
		 * `image/svg+xml`,
		 *
		 * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
		 * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
		 * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
		 */
		XML_SVG_IMAGE: 'image/svg+xml',
	});

	/**
	 * Namespaces that are used in this code base.
	 *
	 * @see http://www.w3.org/TR/REC-xml-names
	 */
	var NAMESPACE$3 = freeze({
		/**
		 * The XHTML namespace.
		 *
		 * @see http://www.w3.org/1999/xhtml
		 */
		HTML: 'http://www.w3.org/1999/xhtml',

		/**
		 * Checks if `uri` equals `NAMESPACE.HTML`.
		 *
		 * @param {string} [uri]
		 *
		 * @see NAMESPACE.HTML
		 */
		isHTML: function (uri) {
			return uri === NAMESPACE$3.HTML
		},

		/**
		 * The SVG namespace.
		 *
		 * @see http://www.w3.org/2000/svg
		 */
		SVG: 'http://www.w3.org/2000/svg',

		/**
		 * The `xml:` namespace.
		 *
		 * @see http://www.w3.org/XML/1998/namespace
		 */
		XML: 'http://www.w3.org/XML/1998/namespace',

		/**
		 * The `xmlns:` namespace
		 *
		 * @see https://www.w3.org/2000/xmlns/
		 */
		XMLNS: 'http://www.w3.org/2000/xmlns/',
	});

	var assign_1 = assign;
	var find_1 = find$1;
	var freeze_1 = freeze;
	var MIME_TYPE_1 = MIME_TYPE;
	var NAMESPACE_1 = NAMESPACE$3;

	var conventions = {
		assign: assign_1,
		find: find_1,
		freeze: freeze_1,
		MIME_TYPE: MIME_TYPE_1,
		NAMESPACE: NAMESPACE_1
	};

	function helper(g) {
	    var doc = commonjsGlobal.document || g,
	        root = doc.documentElement || g,

	        isSingleMatch,
	        isSingleSelect,

	        lastSlice,
	        lastContext,
	        lastPosition,

	        lastMatcher,
	        lastSelector,

	        lastPartsMatch,
	        lastPartsSelect,

	        prefixes = '(?:[#.:]|::)?',
	        operators = '([~*^$|!]?={1})',
	        whitespace = '[\\x20\\t\\n\\r\\f]',
	        combinators = '\\x20|[>+~](?=[^>+~])',
	        pseudoparms = '(?:[-+]?\\d*n)?[-+]?\\d*',
	        skip_groups = '\\[.*\\]|\\(.*\\)|\\{.*\\}',

	        any_esc_chr = '\\\\.',
	        alphalodash = '[_a-zA-Z]',
	        non_asc_chr = '[^\\x00-\\x9f]',
	        escaped_chr = '\\\\[^\\n\\r\\f0-9a-fA-F]',
	        unicode_chr = '\\\\[0-9a-fA-F]{1,6}(?:\\r\\n|' + whitespace + ')?',

	        quotedvalue = '"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"' + "|'[^'\\\\]*(?:\\\\.[^'\\\\]*)*'",

	        reSplitGroup = /([^,\\()[\]]+|\[[^[\]]*\]|\[.*\]|\([^()]+\)|\(.*\)|\{[^{}]+\}|\{.*\}|\\.)+/g,

	        reTrimSpaces = RegExp('[\\n\\r\\f]|^' + whitespace + '+|' + whitespace + '+$', 'g'),

	        reEscapedChars = /\\([0-9a-fA-F]{1,6}[\x20\t\n\r\f]?|.)|([\x22\x27])/g,

	        standardValidator, extendedValidator, reValidator,

	        attrcheck, attributes, attrmatcher, pseudoclass,

	        reOptimizeSelector, reSimpleNot, reSplitToken,

	        Optimize, identifier, extensions = '.+',

	        Patterns = {
	            spseudos: /^\:(root|empty|(?:first|last|only)(?:-child|-of-type)|nth(?:-last)?(?:-child|-of-type)\(\s?(even|odd|(?:[-+]{0,1}\d*n\s?)?[-+]{0,1}\s?\d*)\s?\))?(.*)/i,
	            dpseudos: /^\:(link|visited|target|active|focus|hover|checked|disabled|enabled|selected|lang\(([-\w]{2,})\)|(?:matches|not)\(\s?(:nth(?:-last)?(?:-child|-of-type)\(\s?(?:even|odd|(?:[-+]{0,1}\d*n\s?)?[-+]{0,1}\s?\d*)\s?\)|[^()]*)\s?\))?(.*)/i,
	            epseudos: /^((?:[:]{1,2}(?:after|before|first-letter|first-line))|(?:[:]{2,2}(?:selection|backdrop|placeholder)))?(.*)/i,
	            children: RegExp('^' + whitespace + '?\\>' + whitespace + '?(.*)'),
	            adjacent: RegExp('^' + whitespace + '?\\+' + whitespace + '?(.*)'),
	            relative: RegExp('^' + whitespace + '?\\~' + whitespace + '?(.*)'),
	            ancestor: RegExp('^' + whitespace + '+(.*)'),
	            universal: RegExp('^\\*(.*)')
	        },

	        Tokens = {
	            prefixes: prefixes,
	            identifier: identifier,
	            attributes: attributes
	        },

	        QUIRKS_MODE,
	        XML_DOCUMENT,

	        GEBTN = 'getElementsByTagName' in doc,
	        GEBCN = 'getElementsByClassName' in doc,

	        IE_LT_9 = typeof doc.addEventListener != 'function',

	        LINK_NODES = { a: 1, A: 1, area: 1, AREA: 1, link: 1, LINK: 1 },

	        ATTR_BOOLEAN = {
	            checked: 1, disabled: 1, ismap: 1,
	            multiple: 1, readonly: 1, selected: 1
	        },

	        ATTR_DEFAULT = {
	            value: 'defaultValue',
	            checked: 'defaultChecked',
	            selected: 'defaultSelected'
	        },

	        ATTR_URIDATA = {
	            action: 2, cite: 2, codebase: 2, data: 2, href: 2,
	            longdesc: 2, lowsrc: 2, src: 2, usemap: 2
	        },

	        HTML_TABLE = {
	            'accept': 1, 'accept-charset': 1, 'align': 1, 'alink': 1, 'axis': 1,
	            'bgcolor': 1, 'charset': 1, 'checked': 1, 'clear': 1, 'codetype': 1, 'color': 1,
	            'compact': 1, 'declare': 1, 'defer': 1, 'dir': 1, 'direction': 1, 'disabled': 1,
	            'enctype': 1, 'face': 1, 'frame': 1, 'hreflang': 1, 'http-equiv': 1, 'lang': 1,
	            'language': 1, 'link': 1, 'media': 1, 'method': 1, 'multiple': 1, 'nohref': 1,
	            'noresize': 1, 'noshade': 1, 'nowrap': 1, 'readonly': 1, 'rel': 1, 'rev': 1,
	            'rules': 1, 'scope': 1, 'scrolling': 1, 'selected': 1, 'shape': 1, 'target': 1,
	            'text': 1, 'type': 1, 'valign': 1, 'valuetype': 1, 'vlink': 1
	        },

	        NATIVE_TRAVERSAL_API =
	            'nextElementSibling' in root &&
	            'previousElementSibling' in root,

	        Selectors = {},

	        Operators = {
	            '=': "n=='%m'",
	            '^=': "n.indexOf('%m')==0",
	            '*=': "n.indexOf('%m')>-1",
	            '|=': "(n+'-').indexOf('%m-')==0",
	            '~=': "(' '+n+' ').indexOf(' %m ')>-1",
	            '$=': "n.substr(n.length-'%m'.length)=='%m'"
	        },

	        concatCall =
	            function (data, elements, callback) {
	                var i = -1, element;
	                while ((element = elements[++i])) {
	                    if (false === callback(data[data.length] = element)) { break; }
	                }
	                return data;
	            },

	        switchContext =
	            function (from, force) {
	                var oldDoc = doc;
	                lastContext = from;
	                doc = from.ownerDocument || from;
	                if (force || oldDoc !== doc) {
	                    root = doc.documentElement;
	                    XML_DOCUMENT = doc.createElement('DiV').nodeName == 'DiV';
	                    QUIRKS_MODE = !XML_DOCUMENT &&
	                        typeof doc.compatMode == 'string' ?
	                        doc.compatMode.indexOf('CSS') < 0 :
	                        (function () {
	                            var style = doc.createElement('div').style;
	                            return style && (style.width = 1) && style.width == '1px';
	                        })();

	                    Config.CACHING && Dom.setCache(true, doc);
	                }
	            },

	        codePointToUTF16 =
	            function (codePoint) {
	                if (codePoint < 1 || codePoint > 0x10ffff ||
	                    (codePoint > 0xd7ff && codePoint < 0xe000)) {
	                    return '\\ufffd';
	                }
	                if (codePoint < 0x10000) {
	                    var lowHex = '000' + codePoint.toString(16);
	                    return '\\u' + lowHex.substr(lowHex.length - 4);
	                }
	                return '\\u' + (((codePoint - 0x10000) >> 0x0a) + 0xd800).toString(16) +
	                    '\\u' + (((codePoint - 0x10000) % 0x400) + 0xdc00).toString(16);
	            },

	        stringFromCodePoint =
	            function (codePoint) {
	                if (codePoint < 1 || codePoint > 0x10ffff ||
	                    (codePoint > 0xd7ff && codePoint < 0xe000)) {
	                    return '\ufffd';
	                }
	                if (codePoint < 0x10000) {
	                    return String.fromCharCode(codePoint);
	                }
	                return String.fromCodePoint ?
	                    String.fromCodePoint(codePoint) :
	                    String.fromCharCode(
	                        ((codePoint - 0x10000) >> 0x0a) + 0xd800,
	                        ((codePoint - 0x10000) % 0x400) + 0xdc00);
	            },

	        convertEscapes =
	            function (str) {
	                return str.replace(reEscapedChars,
	                    function (substring, p1, p2) {
	                        return p2 ? '\\' + p2 :
	                            (/^[0-9a-fA-F]/).test(p1) ? codePointToUTF16(parseInt(p1, 16)) :
	                                (/^[\\\x22\x27]/).test(p1) ? substring :
	                                    p1;
	                    }
	                );
	            },

	        unescapeIdentifier =
	            function (str) {
	                return str.replace(reEscapedChars,
	                    function (substring, p1, p2) {
	                        return p2 ? p2 :
	                            (/^[0-9a-fA-F]/).test(p1) ? stringFromCodePoint(parseInt(p1, 16)) :
	                                (/^[\\\x22\x27]/).test(p1) ? substring :
	                                    p1;
	                    }
	                );
	            },

	        byIdRaw =
	            function (id, elements) {
	                var i = -1, element;
	                while ((element = elements[++i])) {
	                    if (element.getAttribute('id') == id) {
	                        break;
	                    }
	                }
	                return element || null;
	            },

	        _byId = !IE_LT_9 ?
	            function (id, from) {
	                id = (/\\/).test(id) ? unescapeIdentifier(id) : id;
	                return from.getElementById && from.getElementById(id) ||
	                    byIdRaw(id, from.getElementsByTagName('*'));
	            } :
	            function (id, from) {
	                var element = null;
	                id = (/\\/).test(id) ? unescapeIdentifier(id) : id;
	                if (XML_DOCUMENT || from.nodeType != 9) {
	                    return byIdRaw(id, from.getElementsByTagName('*'));
	                }
	                if ((element = from.getElementById(id)) &&
	                    element.name == id && from.getElementsByName) {
	                    return byIdRaw(id, from.getElementsByName(id));
	                }
	                return element;
	            },

	        byId =
	            function (id, from) {
	                from || (from = doc);
	                if (lastContext !== from) { switchContext(from); }
	                return _byId(id, from);
	            },

	        byTagRaw =
	            function (tag, from) {
	                var any = tag == '*', element = from, elements = [], next = element.firstChild;
	                any || (tag = tag.toUpperCase());
	                while ((element = next)) {
	                    if (element.tagName > '@' && (any || element.tagName.toUpperCase() == tag)) {
	                        elements[elements.length] = element;
	                    }
	                    if ((next = element.firstChild || element.nextSibling)) continue;
	                    while (!next && (element = element.parentNode) && element !== from) {
	                        next = element.nextSibling;
	                    }
	                }
	                return elements;
	            },

	        contains = 'compareDocumentPosition' in root ?
	            function (container, element) {
	                return (container.compareDocumentPosition(element) & 16) == 16;
	            } : 'contains' in root ?
	                function (container, element) {
	                    return container !== element && container.contains(element);
	                } :
	                function (container, element) {
	                    while ((element = element.parentNode)) {
	                        if (element === container) return true;
	                    }
	                    return false;
	                },

	        getAttribute = !IE_LT_9 ?
	            function (node, attribute) {
	                return node.getAttribute(attribute);
	            } :
	            function (node, attribute) {
	                attribute = attribute.toLowerCase();
	                if (typeof node[attribute] == 'object') {
	                    return node.attributes[attribute] &&
	                        node.attributes[attribute].value;
	                }
	                return (
	                    attribute == 'type' ? node.getAttribute(attribute) :
	                        ATTR_URIDATA[attribute] ? node.getAttribute(attribute, 2) :
	                            ATTR_BOOLEAN[attribute] ? node.getAttribute(attribute) ? attribute : 'false' :
	                                (node = node.getAttributeNode(attribute)) && node.value);
	            },

	        hasAttribute = !IE_LT_9 && root.hasAttribute ?
	            function (node, attribute) {
	                return node.hasAttribute(attribute);
	            } :
	            function (node, attribute) {
	                var obj = node.getAttributeNode(attribute = attribute.toLowerCase());
	                return ATTR_DEFAULT[attribute] && attribute != 'value' ?
	                    node[ATTR_DEFAULT[attribute]] : obj && obj.specified;
	            },

	        isEmpty =
	            function (node) {
	                node = node.firstChild;
	                while (node) {
	                    if (node.nodeType == 3 || node.nodeName > '@') return false;
	                    node = node.nextSibling;
	                }
	                return true;
	            },

	        isLink =
	            function (element) {
	                return hasAttribute(element, 'href') && LINK_NODES[element.nodeName];
	            },

	        nthElement =
	            function (element, last) {
	                var count = 1, succ = last ? 'nextSibling' : 'previousSibling';
	                while ((element = element[succ])) {
	                    if (element.nodeName > '@') ++count;
	                }
	                return count;
	            },

	        nthOfType =
	            function (element, last) {
	                var count = 1, succ = last ? 'nextSibling' : 'previousSibling', type = element.nodeName;
	                while ((element = element[succ])) {
	                    if (element.nodeName == type) ++count;
	                }
	                return count;
	            },

	        configure =
	            function (option) {
	                if (typeof option == 'string') { return !!Config[option]; }
	                if (typeof option != 'object') { return Config; }
	                for (var i in option) {
	                    Config[i] = !!option[i];
	                    if (i == 'SIMPLENOT') {
	                        matchContexts = {};
	                        matchResolvers = {};
	                        selectContexts = {};
	                        selectResolvers = {};
	                    }
	                }
	                setIdentifierSyntax();
	                reValidator = RegExp(Config.SIMPLENOT ?
	                    standardValidator : extendedValidator);
	                return true;
	            },

	        emit =
	            function (message) {
	                if (Config.VERBOSITY) { throw Error(message); }
	                if (Config.LOGERRORS && console && console.log) {
	                    console.log(message);
	                }
	            },

	        Config = {
	            CACHING: false,
	            ESCAPECHR: true,
	            NON_ASCII: true,
	            SELECTOR3: true,
	            UNICODE16: true,
	            SHORTCUTS: false,
	            SIMPLENOT: true,
	            SVG_LCASE: false,
	            UNIQUE_ID: true,
	            USE_HTML5: true,
	            VERBOSITY: true,
	            LOGERRORS: true
	        },

	        initialize =
	            function (doc) {
	                setIdentifierSyntax();
	                switchContext(doc, true);
	            },

	        setIdentifierSyntax =
	            function () {

	                var syntax = '', start = Config['SELECTOR3'] ? '-{2}|' : '';

	                Config['NON_ASCII'] && (syntax += '|' + non_asc_chr);
	                Config['UNICODE16'] && (syntax += '|' + unicode_chr);
	                Config['ESCAPECHR'] && (syntax += '|' + escaped_chr);

	                syntax += (Config['UNICODE16'] || Config['ESCAPECHR']) ? '' : '|' + any_esc_chr;

	                identifier = '-?(?:' + start + alphalodash + syntax + ')(?:-|[0-9]|' + alphalodash + syntax + ')*';

	                attrcheck = '(' + quotedvalue + '|' + identifier + ')';
	                attributes = whitespace + '*(' + identifier + '(?::' + identifier + ')?)' +
	                    whitespace + '*(?:' + operators + whitespace + '*' + attrcheck + ')?' + whitespace + '*' + '(i)?' + whitespace + '*';
	                attrmatcher = attributes.replace(attrcheck, '([\\x22\\x27]*)((?:\\\\?.)*?)\\3');

	                pseudoclass = '((?:' +
	                    pseudoparms + '|' + quotedvalue + '|' +
	                    prefixes + identifier + '|' +
	                    '\\[' + attributes + '\\]|' +
	                    '\\(.+\\)|' + whitespace + '*|' +
	                    ',)+)';

	                standardValidator =
	                    '(?=[\\x20\\t\\n\\r\\f]*[^>+~(){}<>])' +
	                    '(' +
	                    '\\*' +
	                    '|(?:' + prefixes + identifier + ')' +
	                    '|' + combinators +
	                    '|\\[' + attributes + '\\]' +
	                    '|\\(' + pseudoclass + '\\)' +
	                    '|\\{' + extensions + '\\}' +
	                    '|(?:,|' + whitespace + '*)' +
	                    ')+';

	                reSimpleNot = RegExp('^(' +
	                    '(?!:not)' +
	                    '(' + prefixes + identifier +
	                    '|\\([^()]*\\))+' +
	                    '|\\[' + attributes + '\\]' +
	                    ')$');

	                reSplitToken = RegExp('(' +
	                    prefixes + identifier + '|' +
	                    '\\[' + attributes + '\\]|' +
	                    '\\(' + pseudoclass + '\\)|' +
	                    '\\\\.|[^\\x20\\t\\n\\r\\f>+~])+', 'g');

	                reOptimizeSelector = RegExp(identifier + '|^$');

	                Optimize = {
	                    ID: RegExp('^\\*?#(' + identifier + ')|' + skip_groups),
	                    TAG: RegExp('^(' + identifier + ')|' + skip_groups),
	                    CLASS: RegExp('^\\.(' + identifier + '$)|' + skip_groups)
	                };

	                Patterns.id = RegExp('^#(' + identifier + ')(.*)');
	                Patterns.tagName = RegExp('^(' + identifier + ')(.*)');
	                Patterns.className = RegExp('^\\.(' + identifier + ')(.*)');
	                Patterns.attribute = RegExp('^\\[' + attrmatcher + '\\](.*)');

	                Tokens.identifier = identifier;
	                Tokens.attributes = attributes;

	                extendedValidator = standardValidator.replace(pseudoclass, '.*');

	                reValidator = RegExp(standardValidator);
	            },

	        ACCEPT_NODE = 'r[r.length]=c[k];if(f&&false===f(c[k]))break main;else continue main;',
	        REJECT_NODE = IE_LT_9 ? 'if(e.nodeName<"A")continue;' : '',
	        TO_UPPER_CASE = IE_LT_9 ? '.toUpperCase()' : '',

	        compile =
	            function (selector, source, mode) {

	                var parts = typeof selector == 'string' ? selector.match(reSplitGroup) : selector;

	                typeof source == 'string' || (source = '');

	                if (parts.length == 1) {
	                    source += compileSelector(parts[0], mode ? ACCEPT_NODE : 'f&&f(k);return true;');
	                } else {
	                    var i = -1, seen = {}, token;
	                    while ((token = parts[++i])) {
	                        token = token.replace(reTrimSpaces, '');
	                        if (!seen[token] && (seen[token] = true)) {
	                            source += compileSelector(token, mode ? ACCEPT_NODE : 'f&&f(k);return true;');
	                        }
	                    }
	                }

	                if (mode) {
	                    return Function('c,s,d,h,g,f',
	                        'var N,n,x=0,k=-1,e,r=[];main:while((e=c[++k])){' + source + '}return r;');
	                } else {
	                    return Function('e,s,d,h,g,f',
	                        'var N,n,x=0,k=e;' + source + 'return false;');
	                }
	            },

	        compileSelector =
	            function (selector, source, mode) {

	                var a, b, n, k = 0, expr, match, result, status, test, type;

	                while (selector) {

	                    k++;

	                    if ((match = selector.match(Patterns.universal))) {
	                        expr = '';
	                    }

	                    else if ((match = selector.match(Patterns.id))) {
	                        match[1] = (/\\/).test(match[1]) ? convertEscapes(match[1]) : match[1];
	                        source = 'if(' + (XML_DOCUMENT ?
	                            's.getAttribute(e,"id")' :
	                            '(e.submit?s.getAttribute(e,"id"):e.id)') +
	                            '=="' + match[1] + '"' +
	                            '){' + source + '}';
	                    }

	                    else if ((match = selector.match(Patterns.tagName))) {
	                        test = Config.SVG_LCASE ? '||e.nodeName=="' + match[1].toLowerCase() + '"' : '';
	                        source = 'if(e.nodeName' + (XML_DOCUMENT ?
	                            '=="' + match[1] + '"' : TO_UPPER_CASE +
	                            '=="' + match[1].toUpperCase() + '"' + test) +
	                            '){' + source + '}';
	                    }

	                    else if ((match = selector.match(Patterns.className))) {
	                        match[1] = (/\\/).test(match[1]) ? convertEscapes(match[1]) : match[1];
	                        match[1] = QUIRKS_MODE ? match[1].toLowerCase() : match[1];
	                        source = 'if((n=' + (XML_DOCUMENT ?
	                            'e.getAttribute("class")' : 'e.className') +
	                            ')&&n.length&&(" "+' + (QUIRKS_MODE ? 'n.toLowerCase()' : 'n') +
	                            '.replace(/' + whitespace + '+/g," ")+" ").indexOf(" ' + match[1] + ' ")>-1' +
	                            '){' + source + '}';
	                    }

	                    else if ((match = selector.match(Patterns.attribute))) {
	                        expr = match[1].split(':');
	                        expr = expr.length == 2 ? expr[1] : expr[0] + '';

	                        if (match[2] && !Operators[match[2]]) {
	                            emit('Unsupported operator in attribute selectors "' + selector + '"');
	                            return '';
	                        }
	                        test = 'false';
	                        if (match[2] && match[4] && (test = Operators[match[2]])) {
	                            match[4] = (/\\/).test(match[4]) ? convertEscapes(match[4]) : match[4];
	                            type = match[5] == 'i' || HTML_TABLE[expr.toLowerCase()];
	                            test = test.replace(/\%m/g, type ? match[4].toLowerCase() : match[4]);
	                        } else if (match[2] == '!=' || match[2] == '=') {
	                            test = 'n' + match[2] + '=""';
	                        }
	                        source = 'if(n=s.hasAttribute(e,"' + match[1] + '")){' +
	                            (match[2] ? 'n=s.getAttribute(e,"' + match[1] + '")' : '') +
	                            (type && match[2] ? '.toLowerCase();' : ';') +
	                            'if(' + (match[2] ? test : 'n') + '){' + source + '}}';
	                    }

	                    else if ((match = selector.match(Patterns.adjacent))) {
	                        source = NATIVE_TRAVERSAL_API ?
	                            'var N' + k + '=e;if((e=e.previousElementSibling)){' + source + '}e=N' + k + ';' :
	                            'var N' + k + '=e;while((e=e.previousSibling)){if(e.nodeType==1){' + source + 'break;}}e=N' + k + ';';
	                    }

	                    else if ((match = selector.match(Patterns.relative))) {
	                        source = NATIVE_TRAVERSAL_API ?
	                            'var N' + k + '=e;while((e=e.previousElementSibling)){' + source + '}e=N' + k + ';' :
	                            'var N' + k + '=e;while((e=e.previousSibling)){if(e.nodeType==1){' + source + '}}e=N' + k + ';';
	                    }

	                    else if ((match = selector.match(Patterns.children))) {
	                        source = 'var N' + k + '=e;if((e=e.parentNode)&&e.nodeType==1){' + source + '}e=N' + k + ';';
	                    }

	                    else if ((match = selector.match(Patterns.ancestor))) {
	                        source = 'var N' + k + '=e;while((e=e.parentNode)&&e.nodeType==1){' + source + '}e=N' + k + ';';
	                    }

	                    else if ((match = selector.match(Patterns.spseudos)) && match[1]) {
	                        switch (match[1]) {
	                            case 'root':
	                                if (match[3]) {
	                                    source = 'if(e===h||s.contains(h,e)){' + source + '}';
	                                } else {
	                                    source = 'if(e===h){' + source + '}';
	                                }
	                                break;
	                            case 'empty':
	                                source = 'if(s.isEmpty(e)){' + source + '}';
	                                break;
	                            default:
	                                if (match[1] && match[2]) {
	                                    if (match[2] == 'n') {
	                                        source = 'if(e!==h){' + source + '}';
	                                        break;
	                                    } else if (match[2] == 'even') {
	                                        a = 2;
	                                        b = 0;
	                                    } else if (match[2] == 'odd') {
	                                        a = 2;
	                                        b = 1;
	                                    } else {
	                                        b = ((n = match[2].match(/(-?\d+)$/)) ? parseInt(n[1], 10) : 0);
	                                        a = ((n = match[2].match(/(-?\d*)n/i)) ? parseInt(n[1], 10) : 0);
	                                        if (n && n[1] == '-') a = -1;
	                                    }
	                                    test = a > 1 ?
	                                        (/last/i.test(match[1])) ? '(n-(' + b + '))%' + a + '==0' :
	                                            'n>=' + b + '&&(n-(' + b + '))%' + a + '==0' : a < -1 ?
	                                            (/last/i.test(match[1])) ? '(n-(' + b + '))%' + a + '==0' :
	                                                'n<=' + b + '&&(n-(' + b + '))%' + a + '==0' : a === 0 ?
	                                                'n==' + b : a == -1 ? 'n<=' + b : 'n>=' + b;
	                                    source =
	                                        'if(e!==h){' +
	                                        'n=s[' + (/-of-type/i.test(match[1]) ? '"nthOfType"' : '"nthElement"') + ']' +
	                                        '(e,' + (/last/i.test(match[1]) ? 'true' : 'false') + ');' +
	                                        'if(' + test + '){' + source + '}' +
	                                        '}';
	                                } else {
	                                    a = /first/i.test(match[1]) ? 'previous' : 'next';
	                                    n = /only/i.test(match[1]) ? 'previous' : 'next';
	                                    b = /first|last/i.test(match[1]);
	                                    type = /-of-type/i.test(match[1]) ? '&&n.nodeName!=e.nodeName' : '&&n.nodeName<"@"';
	                                    source = 'if(e!==h){' +
	                                        ('n=e;while((n=n.' + a + 'Sibling)' + type + ');if(!n){' + (b ? source :
	                                            'n=e;while((n=n.' + n + 'Sibling)' + type + ');if(!n){' + source + '}') + '}') + '}';
	                                }
	                                break;
	                        }
	                    }

	                    else if ((match = selector.match(Patterns.dpseudos)) && match[1]) {
	                        switch (match[1].match(/^\w+/)[0]) {
	                            case 'matches':
	                                expr = match[3].replace(reTrimSpaces, '');
	                                source = 'if(s.match(e, "' + expr.replace(/\x22/g, '\\"') + '",g)){' + source + '}';
	                                break;

	                            case 'not':
	                                expr = match[3].replace(reTrimSpaces, '');
	                                if (Config.SIMPLENOT && !reSimpleNot.test(expr)) {
	                                    emit('Negation pseudo-class only accepts simple selectors "' + selector + '"');
	                                    return '';
	                                } else {
	                                    if ('compatMode' in doc) {
	                                        source = 'if(!' + compile(expr, '', false) + '(e,s,d,h,g)){' + source + '}';
	                                    } else {
	                                        source = 'if(!s.match(e, "' + expr.replace(/\x22/g, '\\"') + '",g)){' + source + '}';
	                                    }
	                                }
	                                break;
	                            case 'checked':
	                                source = 'if((typeof e.form!=="undefined"&&(/^(?:radio|checkbox)$/i).test(e.type)&&e.checked)' +
	                                    (Config.USE_HTML5 ? '||(/^option$/i.test(e.nodeName)&&(e.selected||e.checked))' : '') +
	                                    '){' + source + '}';
	                                break;
	                            case 'disabled':
	                                source = 'if(((typeof e.form!=="undefined"' +
	                                    (Config.USE_HTML5 ? '' : '&&!(/^hidden$/i).test(e.type)') +
	                                    ')||s.isLink(e))&&e.disabled===true){' + source + '}';
	                                break;
	                            case 'enabled':
	                                source = 'if(((typeof e.form!=="undefined"' +
	                                    (Config.USE_HTML5 ? '' : '&&!(/^hidden$/i).test(e.type)') +
	                                    ')||s.isLink(e))&&e.disabled===false){' + source + '}';
	                                break;
	                            case 'lang':
	                                test = '';
	                                if (match[2]) test = match[2].substr(0, 2) + '-';
	                                source = 'do{(n=e.lang||"").toLowerCase();' +
	                                    'if((n==""&&h.lang=="' + match[2].toLowerCase() + '")||' +
	                                    '(n&&(n=="' + match[2].toLowerCase() +
	                                    '"||n.substr(0,3)=="' + test.toLowerCase() + '")))' +
	                                    '{' + source + 'break;}}while((e=e.parentNode)&&e!==g);';
	                                break;
	                            case 'target':
	                                source = 'if(e.id==d.location.hash.slice(1)){' + source + '}';
	                                break;
	                            case 'link':
	                                source = 'if(s.isLink(e)&&!e.visited){' + source + '}';
	                                break;
	                            case 'visited':
	                                source = 'if(s.isLink(e)&&e.visited){' + source + '}';
	                                break;
	                            case 'active':
	                                source = 'if(e===d.activeElement){' + source + '}';
	                                break;
	                            case 'hover':
	                                source = 'if(e===d.hoverElement){' + source + '}';
	                                break;
	                            case 'focus':
	                                source = 'hasFocus' in doc ?
	                                    'if(e===d.activeElement&&d.hasFocus()&&(e.type||e.href||typeof e.tabIndex=="number")){' + source + '}' :
	                                    'if(e===d.activeElement&&(e.type||e.href)){' + source + '}';
	                                break;
	                            case 'selected':
	                                source = 'if(/^option$/i.test(e.nodeName)&&(e.selected||e.checked)){' + source + '}';
	                                break;
	                        }
	                    }

	                    else if ((match = selector.match(Patterns.epseudos)) && match[1]) {
	                        source = 'if(!(/1|11/).test(e.nodeType)){' + source + '}';
	                    }

	                    else {

	                        expr = false;
	                        status = false;
	                        for (expr in Selectors) {
	                            if ((match = selector.match(Selectors[expr].Expression)) && match[1]) {
	                                result = Selectors[expr].Callback(match, source);
	                                if ('match' in result) { match = result.match; }
	                                source = result.source;
	                                status = result.status;
	                                if (status) { break; }
	                            }
	                        }

	                        if (!status) {
	                            emit('Unknown pseudo-class selector "' + selector + '"');
	                            return '';
	                        }

	                        if (!expr) {
	                            emit('Unknown token in selector "' + selector + '"');
	                            return '';
	                        }

	                    }

	                    if (!match) {
	                        emit('Invalid syntax in selector "' + selector + '"');
	                        return '';
	                    }

	                    selector = match && match[match.length - 1];
	                }

	                return source;
	            },

	        match =
	            function (element, selector, from, callback) {

	                var parts;

	                if (!(element && element.nodeType == 1)) {
	                    emit('Invalid element argument');
	                    return false;
	                } else if (typeof selector != 'string') {
	                    emit('Invalid selector argument');
	                    return false;
	                } else if (lastContext !== from) {
	                    switchContext(from || (from = element.ownerDocument));
	                }

	                selector = selector.
	                    replace(reTrimSpaces, '').
	                    replace(/\x00|\\$/g, '\ufffd');

	                Config.SHORTCUTS && (selector = Dom.shortcuts(selector, element, from));

	                if (lastMatcher != selector) {
	                    if ((parts = selector.match(reValidator)) && parts[0] == selector) {
	                        isSingleMatch = (parts = selector.match(reSplitGroup)).length < 2;
	                        lastMatcher = selector;
	                        lastPartsMatch = parts;
	                    } else {
	                        emit('The string "' + selector + '", is not a valid CSS selector');
	                        return false;
	                    }
	                } else parts = lastPartsMatch;

	                if (!matchResolvers[selector] || matchContexts[selector] !== from) {
	                    matchResolvers[selector] = compile(isSingleMatch ? [selector] : parts, '', false);
	                    matchContexts[selector] = from;
	                }

	                return matchResolvers[selector](element, Snapshot, doc, root, from, callback);
	            },

	        first =
	            function (selector, from) {
	                return select(selector, from, function () { return false; })[0] || null;
	            },

	        select =
	            function (selector, from, callback) {

	                var changed, element, elements, parts, token, original = selector;

	                if (arguments.length === 0) {
	                    emit('Not enough arguments');
	                    return [];
	                } else if (typeof selector != 'string') {
	                    return [];
	                } else if (from && !(/1|9|11/).test(from.nodeType)) {
	                    emit('Invalid or illegal context element');
	                    return [];
	                } else if (lastContext !== from) {
	                    switchContext(from || (from = doc));
	                }

	                if (Config.CACHING && (elements = Dom.loadResults(original, from, doc, root))) {
	                    return callback ? concatCall([], elements, callback) : elements;
	                }

	                selector = selector.
	                    replace(reTrimSpaces, '').
	                    replace(/\x00|\\$/g, '\ufffd');

	                Config.SHORTCUTS && (selector = Dom.shortcuts(selector, from));

	                if ((changed = lastSelector != selector)) {
	                    if ((parts = selector.match(reValidator)) && parts[0] == selector) {
	                        isSingleSelect = (parts = selector.match(reSplitGroup)).length < 2;
	                        lastSelector = selector;
	                        lastPartsSelect = parts;
	                    } else {
	                        emit('The string "' + selector + '", is not a valid CSS selector');
	                        return [];
	                    }
	                } else parts = lastPartsSelect;

	                if (from.nodeType == 11) {

	                    elements = byTagRaw('*', from);

	                } else if (isSingleSelect) {

	                    if (changed) {
	                        parts = selector.match(reSplitToken);
	                        token = parts[parts.length - 1];
	                        lastSlice = token.split(':not');
	                        lastSlice = lastSlice[lastSlice.length - 1];
	                        lastPosition = selector.length - token.length;
	                    }

	                    if (Config.UNIQUE_ID && lastSlice && (parts = lastSlice.match(Optimize.ID)) && (token = parts[1])) {
	                        if ((element = _byId(token, from))) {
	                            if (match(element, selector)) {
	                                callback && callback(element);
	                                elements = [element];
	                            } else elements = [];
	                        }
	                    }

	                    else if (Config.UNIQUE_ID && (parts = selector.match(Optimize.ID)) && (token = parts[1])) {
	                        if ((element = _byId(token, doc))) {
	                            if ('#' + token == selector) {
	                                callback && callback(element);
	                                elements = [element];
	                            } else if (/[>+~]/.test(selector)) {
	                                from = element.parentNode;
	                            } else {
	                                from = element;
	                            }
	                        } else elements = [];
	                    }

	                    if (elements) {
	                        Config.CACHING && Dom.saveResults(original, from, doc, elements);
	                        return elements;
	                    }

	                    if (!XML_DOCUMENT && GEBTN && lastSlice && (parts = lastSlice.match(Optimize.TAG)) && (token = parts[1])) {
	                        if ((elements = from.getElementsByTagName(token)).length === 0) { return []; }
	                        selector = selector.slice(0, lastPosition) + selector.slice(lastPosition).replace(token, '*');
	                    }

	                    else if (!XML_DOCUMENT && GEBCN && lastSlice && (parts = lastSlice.match(Optimize.CLASS)) && (token = parts[1])) {
	                        if ((elements = from.getElementsByClassName(unescapeIdentifier(token))).length === 0) { return []; }
	                        selector = selector.slice(0, lastPosition) + selector.slice(lastPosition).replace('.' + token,
	                            reOptimizeSelector.test(selector.charAt(selector.indexOf(token) - 1)) ? '' : '*');
	                    }

	                }

	                if (!elements) {
	                    if (IE_LT_9) {
	                        elements = /^(?:applet|object)$/i.test(from.nodeName) ? from.children : byTagRaw('*', from);
	                    } else {
	                        elements = from.getElementsByTagName('*');
	                    }
	                }

	                if (!selectResolvers[selector] || selectContexts[selector] !== from) {
	                    selectResolvers[selector] = compile(isSingleSelect ? [selector] : parts, REJECT_NODE, true);
	                    selectContexts[selector] = from;
	                }

	                elements = selectResolvers[selector](elements, Snapshot, doc, root, from, callback);

	                Config.CACHING && Dom.saveResults(original, from, doc, elements);

	                return elements;
	            },

	        FN = function (x) { return x; },

	        matchContexts = {},
	        matchResolvers = {},

	        selectContexts = {},
	        selectResolvers = {},

	        Snapshot = {
	            byId: _byId,
	            match: match,
	            select: select,
	            isLink: isLink,
	            isEmpty: isEmpty,
	            contains: contains,
	            nthOfType: nthOfType,
	            nthElement: nthElement,
	            getAttribute: getAttribute,
	            hasAttribute: hasAttribute
	        },

	        Dom = {

	            ACCEPT_NODE: ACCEPT_NODE,

	            byId: byId,
	            match: match,
	            first: first,
	            select: select,
	            compile: compile,
	            contains: contains,
	            configure: configure,
	            getAttribute: getAttribute,
	            hasAttribute: hasAttribute,

	            setCache: FN,
	            shortcuts: FN,
	            loadResults: FN,
	            saveResults: FN,

	            emit: emit,
	            Config: Config,
	            Snapshot: Snapshot,

	            Operators: Operators,
	            Selectors: Selectors,

	            Tokens: Tokens,

	            registerOperator:
	                function (symbol, resolver) {
	                    Operators[symbol] || (Operators[symbol] = resolver);
	                },

	            registerSelector:
	                function (name, rexp, func) {
	                    Selectors[name] || (Selectors[name] = {
	                        Expression: rexp,
	                        Callback: func
	                    });
	                }

	        };

	    initialize(doc);

	    return Dom
	}

	var DOMHelper = helper;

	var helper_1 = {
		DOMHelper: DOMHelper
	};

	var find = conventions.find;
	var NAMESPACE$2 = conventions.NAMESPACE;

	/**
	 * A prerequisite for `[].filter`, to drop elements that are empty
	 * @param {string} input
	 * @returns {boolean}
	 */
	function notEmptyString (input) {
		return input !== ''
	}
	/**
	 * @see https://infra.spec.whatwg.org/#split-on-ascii-whitespace
	 * @see https://infra.spec.whatwg.org/#ascii-whitespace
	 *
	 * @param {string} input
	 * @returns {string[]} (can be empty)
	 */
	function splitOnASCIIWhitespace(input) {
		// U+0009 TAB, U+000A LF, U+000C FF, U+000D CR, U+0020 SPACE
		return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : []
	}

	/**
	 * Adds element as a key to current if it is not already present.
	 *
	 * @param {Record<string, boolean | undefined>} current
	 * @param {string} element
	 * @returns {Record<string, boolean | undefined>}
	 */
	function orderedSetReducer (current, element) {
		if (!current.hasOwnProperty(element)) {
			current[element] = true;
		}
		return current;
	}

	/**
	 * @see https://infra.spec.whatwg.org/#ordered-set
	 * @param {string} input
	 * @returns {string[]}
	 */
	function toOrderedSet(input) {
		if (!input) return [];
		var list = splitOnASCIIWhitespace(input);
		return Object.keys(list.reduce(orderedSetReducer, {}))
	}

	/**
	 * Uses `list.indexOf` to implement something like `Array.prototype.includes`,
	 * which we can not rely on being available.
	 *
	 * @param {any[]} list
	 * @returns {function(any): boolean}
	 */
	function arrayIncludes (list) {
		return function(element) {
			return list && list.indexOf(element) !== -1;
		}
	}

	function copy(src,dest){
		for(var p in src){
			if (Object.prototype.hasOwnProperty.call(src, p)) {
				dest[p] = src[p];
			}
		}
	}

	/**
	^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
	^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
	 */
	function _extends(Class,Super){
		var pt = Class.prototype;
		if(!(pt instanceof Super)){
			function t(){}		t.prototype = Super.prototype;
			t = new t();
			copy(pt,t);
			Class.prototype = pt = t;
		}
		if(pt.constructor != Class){
			if(typeof Class != 'function'){
				console.error("unknown Class:"+Class);
			}
			pt.constructor = Class;
		}
	}

	// Node Types
	var NodeType = {};
	var ELEMENT_NODE                = NodeType.ELEMENT_NODE                = 1;
	var ATTRIBUTE_NODE              = NodeType.ATTRIBUTE_NODE              = 2;
	var TEXT_NODE                   = NodeType.TEXT_NODE                   = 3;
	var CDATA_SECTION_NODE          = NodeType.CDATA_SECTION_NODE          = 4;
	var ENTITY_REFERENCE_NODE       = NodeType.ENTITY_REFERENCE_NODE       = 5;
	var ENTITY_NODE                 = NodeType.ENTITY_NODE                 = 6;
	var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE                = NodeType.COMMENT_NODE                = 8;
	var DOCUMENT_NODE               = NodeType.DOCUMENT_NODE               = 9;
	var DOCUMENT_TYPE_NODE          = NodeType.DOCUMENT_TYPE_NODE          = 10;
	var DOCUMENT_FRAGMENT_NODE      = NodeType.DOCUMENT_FRAGMENT_NODE      = 11;
	var NOTATION_NODE               = NodeType.NOTATION_NODE               = 12;

	// ExceptionCode
	var ExceptionCode = {};
	var ExceptionMessage = {};
	ExceptionCode.INDEX_SIZE_ERR              = ((ExceptionMessage[1]="Index size error"),1);
	ExceptionCode.DOMSTRING_SIZE_ERR          = ((ExceptionMessage[2]="DOMString size error"),2);
	var HIERARCHY_REQUEST_ERR       = ExceptionCode.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage[3]="Hierarchy request error"),3);
	ExceptionCode.WRONG_DOCUMENT_ERR          = ((ExceptionMessage[4]="Wrong document"),4);
	ExceptionCode.INVALID_CHARACTER_ERR       = ((ExceptionMessage[5]="Invalid character"),5);
	ExceptionCode.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage[6]="No data allowed"),6);
	ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage[7]="No modification allowed"),7);
	var NOT_FOUND_ERR               = ExceptionCode.NOT_FOUND_ERR               = ((ExceptionMessage[8]="Not found"),8);
	ExceptionCode.NOT_SUPPORTED_ERR           = ((ExceptionMessage[9]="Not supported"),9);
	var INUSE_ATTRIBUTE_ERR         = ExceptionCode.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage[10]="Attribute in use"),10);
	//level2
	ExceptionCode.INVALID_STATE_ERR        	= ((ExceptionMessage[11]="Invalid state"),11);
	ExceptionCode.SYNTAX_ERR               	= ((ExceptionMessage[12]="Syntax error"),12);
	ExceptionCode.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage[13]="Invalid modification"),13);
	ExceptionCode.NAMESPACE_ERR           	= ((ExceptionMessage[14]="Invalid namespace"),14);
	ExceptionCode.INVALID_ACCESS_ERR      	= ((ExceptionMessage[15]="Invalid access"),15);

	/**
	 * DOM Level 2
	 * Object DOMException
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
	 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
	 */
	function DOMException(code, message) {
		if(message instanceof Error){
			var error = message;
		}else {
			error = this;
			Error.call(this, ExceptionMessage[code]);
			this.message = ExceptionMessage[code];
			if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
		}
		error.code = code;
		if(message) this.message = this.message + ": " + message;
		return error;
	}DOMException.prototype = Error.prototype;
	copy(ExceptionCode,DOMException);

	/**
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
	 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
	 * The items in the NodeList are accessible via an integral index, starting from 0.
	 */
	function NodeList() {
	}NodeList.prototype = {
		/**
		 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
		 * @standard level1
		 */
		length:0,
		/**
		 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
		 * @standard level1
		 * @param index  unsigned long
		 *   Index into the collection.
		 * @return Node
		 * 	The node at the indexth position in the NodeList, or null if that is not a valid index.
		 */
		item: function(index) {
			return this[index] || null;
		},
		toString:function(isHTML,nodeFilter){
			for(var buf = [], i = 0;i<this.length;i++){
				serializeToString(this[i],buf,isHTML,nodeFilter);
			}
			return buf.join('');
		},
		/**
		 * @private
		 * @param {function (Node):boolean} predicate
		 * @returns {Node[]}
		 */
		filter: function (predicate) {
			return Array.prototype.filter.call(this, predicate);
		},
		/**
		 * @private
		 * @param {Node} item
		 * @returns {number}
		 */
		indexOf: function (item) {
			return Array.prototype.indexOf.call(this, item);
		},
	};

	function LiveNodeList(node,refresh){
		this._node = node;
		this._refresh = refresh;
		_updateLiveList(this);
	}
	function _updateLiveList(list){
		var inc = list._node._inc || list._node.ownerDocument._inc;
		if(list._inc != inc){
			var ls = list._refresh(list._node);
			//console.log(ls.length)
			__set__(list,'length',ls.length);
			copy(ls,list);
			list._inc = inc;
		}
	}
	LiveNodeList.prototype.item = function(i){
		_updateLiveList(this);
		return this[i];
	};

	_extends(LiveNodeList,NodeList);

	/**
	 * Objects implementing the NamedNodeMap interface are used
	 * to represent collections of nodes that can be accessed by name.
	 * Note that NamedNodeMap does not inherit from NodeList;
	 * NamedNodeMaps are not maintained in any particular order.
	 * Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index,
	 * but this is simply to allow convenient enumeration of the contents of a NamedNodeMap,
	 * and does not imply that the DOM specifies an order to these Nodes.
	 * NamedNodeMap objects in the DOM are live.
	 * used for attributes or DocumentType entities
	 */
	function NamedNodeMap() {
	}
	function _findNodeIndex(list,node){
		var i = list.length;
		while(i--){
			if(list[i] === node){return i}
		}
	}

	function _addNamedNode(el,list,newAttr,oldAttr){
		if(oldAttr){
			list[_findNodeIndex(list,oldAttr)] = newAttr;
		}else {
			list[list.length++] = newAttr;
		}
		if(el){
			newAttr.ownerElement = el;
			var doc = el.ownerDocument;
			if(doc){
				oldAttr && _onRemoveAttribute(doc,el,oldAttr);
				_onAddAttribute(doc,el,newAttr);
			}
		}
	}
	function _removeNamedNode(el,list,attr){
		//console.log('remove attr:'+attr)
		var i = _findNodeIndex(list,attr);
		if(i>=0){
			var lastIndex = list.length-1;
			while(i<lastIndex){
				list[i] = list[++i];
			}
			list.length = lastIndex;
			if(el){
				var doc = el.ownerDocument;
				if(doc){
					_onRemoveAttribute(doc,el,attr);
					attr.ownerElement = null;
				}
			}
		}else {
			throw new DOMException(NOT_FOUND_ERR,new Error(el.tagName+'@'+attr))
		}
	}
	NamedNodeMap.prototype = {
		length:0,
		item:NodeList.prototype.item,
		getNamedItem: function(key) {
	//		if(key.indexOf(':')>0 || key == 'xmlns'){
	//			return null;
	//		}
			//console.log()
			var i = this.length;
			while(i--){
				var attr = this[i];
				//console.log(attr.nodeName,key)
				if(attr.nodeName == key){
					return attr;
				}
			}
		},
		setNamedItem: function(attr) {
			var el = attr.ownerElement;
			if(el && el!=this._ownerElement){
				throw new DOMException(INUSE_ATTRIBUTE_ERR);
			}
			var oldAttr = this.getNamedItem(attr.nodeName);
			_addNamedNode(this._ownerElement,this,attr,oldAttr);
			return oldAttr;
		},
		/* returns Node */
		setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
			var el = attr.ownerElement, oldAttr;
			if(el && el!=this._ownerElement){
				throw new DOMException(INUSE_ATTRIBUTE_ERR);
			}
			oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
			_addNamedNode(this._ownerElement,this,attr,oldAttr);
			return oldAttr;
		},

		/* returns Node */
		removeNamedItem: function(key) {
			var attr = this.getNamedItem(key);
			_removeNamedNode(this._ownerElement,this,attr);
			return attr;


		},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR

		//for level2
		removeNamedItemNS:function(namespaceURI,localName){
			var attr = this.getNamedItemNS(namespaceURI,localName);
			_removeNamedNode(this._ownerElement,this,attr);
			return attr;
		},
		getNamedItemNS: function(namespaceURI, localName) {
			var i = this.length;
			while(i--){
				var node = this[i];
				if(node.localName == localName && node.namespaceURI == namespaceURI){
					return node;
				}
			}
			return null;
		}
	};

	/**
	 * The DOMImplementation interface represents an object providing methods
	 * which are not dependent on any particular document.
	 * Such an object is returned by the `Document.implementation` property.
	 *
	 * __The individual methods describe the differences compared to the specs.__
	 *
	 * @constructor
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation MDN
	 * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490 DOM Level 1 Core (Initial)
	 * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-102161490 DOM Level 2 Core
	 * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-102161490 DOM Level 3 Core
	 * @see https://dom.spec.whatwg.org/#domimplementation DOM Living Standard
	 */
	function DOMImplementation$2() {
	}

	DOMImplementation$2.prototype = {
		/**
		 * The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given feature is supported.
		 * The different implementations fairly diverged in what kind of features were reported.
		 * The latest version of the spec settled to force this method to always return true, where the functionality was accurate and in use.
		 *
		 * @deprecated It is deprecated and modern browsers return true in all cases.
		 *
		 * @param {string} feature
		 * @param {string} [version]
		 * @returns {boolean} always true
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
		 * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
		 * @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
		 */
		hasFeature: function(feature, version) {
				return true;
		},
		/**
		 * Creates an XML Document object of the specified type with its document element.
		 *
		 * __It behaves slightly different from the description in the living standard__:
		 * - There is no interface/class `XMLDocument`, it returns a `Document` instance.
		 * - `contentType`, `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		 * - this implementation is not validating names or qualified names
		 *   (when parsing XML strings, the SAX parser takes care of that)
		 *
		 * @param {string|null} namespaceURI
		 * @param {string} qualifiedName
		 * @param {DocumentType=null} doctype
		 * @returns {Document}
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
		 * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM Level 2 Core (initial)
		 * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument  DOM Level 2 Core
		 *
		 * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
		 * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
		 * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
		 */
		createDocument: function(namespaceURI,  qualifiedName, doctype){
			var doc = new Document();
			doc.implementation = this;
			doc.childNodes = new NodeList();
			doc.doctype = doctype || null;
			if (doctype){
				doc.appendChild(doctype);
			}
			if (qualifiedName){
				var root = doc.createElementNS(namespaceURI, qualifiedName);
				doc.appendChild(root);
			}
			return doc;
		},
		/**
		 * Returns a doctype, with the given `qualifiedName`, `publicId`, and `systemId`.
		 *
		 * __This behavior is slightly different from the in the specs__:
		 * - this implementation is not validating names or qualified names
		 *   (when parsing XML strings, the SAX parser takes care of that)
		 *
		 * @param {string} qualifiedName
		 * @param {string} [publicId]
		 * @param {string} [systemId]
		 * @returns {DocumentType} which can either be used with `DOMImplementation.createDocument` upon document creation
		 * 				  or can be put into the document via methods like `Node.insertBefore()` or `Node.replaceChild()`
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType MDN
		 * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM Level 2 Core
		 * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living Standard
		 *
		 * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
		 * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
		 * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
		 */
		createDocumentType: function(qualifiedName, publicId, systemId){
			var node = new DocumentType();
			node.name = qualifiedName;
			node.nodeName = qualifiedName;
			node.publicId = publicId || '';
			node.systemId = systemId || '';

			return node;
		}
	};


	/**
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
	 */

	function Node() {
	}
	Node.prototype = {
		firstChild : null,
		lastChild : null,
		previousSibling : null,
		nextSibling : null,
		attributes : null,
		parentNode : null,
		childNodes : null,
		ownerDocument : null,
		nodeValue : null,
		namespaceURI : null,
		prefix : null,
		localName : null,
		// Modified in DOM Level 2:
		insertBefore:function(newChild, refChild){//raises
			return _insertBefore(this,newChild,refChild);
		},
		replaceChild:function(newChild, oldChild){//raises
			_insertBefore(this, newChild,oldChild, assertPreReplacementValidityInDocument);
			if(oldChild){
				this.removeChild(oldChild);
			}
		},
		removeChild:function(oldChild){
			return _removeChild(this,oldChild);
		},
		appendChild:function(newChild){
			return this.insertBefore(newChild,null);
		},
		hasChildNodes:function(){
			return this.firstChild != null;
		},
		cloneNode:function(deep){
			return cloneNode(this.ownerDocument||this,this,deep);
		},
		// Modified in DOM Level 2:
		normalize:function(){
			var child = this.firstChild;
			while(child){
				var next = child.nextSibling;
				if(next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE){
					this.removeChild(next);
					child.appendData(next.data);
				}else {
					child.normalize();
					child = next;
				}
			}
		},
	  	// Introduced in DOM Level 2:
		isSupported:function(feature, version){
			return this.ownerDocument.implementation.hasFeature(feature,version);
		},
	    // Introduced in DOM Level 2:
	    hasAttributes:function(){
	    	return this.attributes.length>0;
	    },
		/**
		 * Look up the prefix associated to the given namespace URI, starting from this node.
		 * **The default namespace declarations are ignored by this method.**
		 * See Namespace Prefix Lookup for details on the algorithm used by this method.
		 *
		 * _Note: The implementation seems to be incomplete when compared to the algorithm described in the specs._
		 *
		 * @param {string | null} namespaceURI
		 * @returns {string | null}
		 * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
		 * @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
		 * @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
		 * @see https://github.com/xmldom/xmldom/issues/322
		 */
	    lookupPrefix:function(namespaceURI){
	    	var el = this;
	    	while(el){
	    		var map = el._nsMap;
	    		//console.dir(map)
	    		if(map){
	    			for(var n in map){
							if (Object.prototype.hasOwnProperty.call(map, n) && map[n] === namespaceURI) {
								return n;
							}
	    			}
	    		}
	    		el = el.nodeType == ATTRIBUTE_NODE?el.ownerDocument : el.parentNode;
	    	}
	    	return null;
	    },
	    // Introduced in DOM Level 3:
	    lookupNamespaceURI:function(prefix){
	    	var el = this;
	    	while(el){
	    		var map = el._nsMap;
	    		//console.dir(map)
	    		if(map){
	    			if(Object.prototype.hasOwnProperty.call(map, prefix)){
	    				return map[prefix] ;
	    			}
	    		}
	    		el = el.nodeType == ATTRIBUTE_NODE?el.ownerDocument : el.parentNode;
	    	}
	    	return null;
	    },
	    // Introduced in DOM Level 3:
	    isDefaultNamespace:function(namespaceURI){
	    	var prefix = this.lookupPrefix(namespaceURI);
	    	return prefix == null;
	    }
	};


	function _xmlEncoder(c){
		return c == '<' && '&lt;' ||
	         c == '>' && '&gt;' ||
	         c == '&' && '&amp;' ||
	         c == '"' && '&quot;' ||
	         '&#'+c.charCodeAt()+';'
	}


	copy(NodeType,Node);
	copy(NodeType,Node.prototype);

	/**
	 * @param callback return true for continue,false for break
	 * @return boolean true: break visit;
	 */
	function _visitNode(node,callback){
		if(callback(node)){
			return true;
		}
		if(node = node.firstChild){
			do{
				if(_visitNode(node,callback)){return true}
	        }while(node=node.nextSibling)
	    }
	}



	function Document(){
		this.ownerDocument = this;
	}

	function _onAddAttribute(doc,el,newAttr){
		doc && doc._inc++;
		var ns = newAttr.namespaceURI ;
		if(ns === NAMESPACE$2.XMLNS){
			//update namespace
			el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value;
		}
	}

	function _onRemoveAttribute(doc,el,newAttr,remove){
		doc && doc._inc++;
		var ns = newAttr.namespaceURI ;
		if(ns === NAMESPACE$2.XMLNS){
			//update namespace
			delete el._nsMap[newAttr.prefix?newAttr.localName:''];
		}
	}

	/**
	 * Updates `el.childNodes`, updating the indexed items and it's `length`.
	 * Passing `newChild` means it will be appended.
	 * Otherwise it's assumed that an item has been removed,
	 * and `el.firstNode` and it's `.nextSibling` are used
	 * to walk the current list of child nodes.
	 *
	 * @param {Document} doc
	 * @param {Node} el
	 * @param {Node} [newChild]
	 * @private
	 */
	function _onUpdateChild (doc, el, newChild) {
		if(doc && doc._inc){
			doc._inc++;
			//update childNodes
			var cs = el.childNodes;
			if (newChild) {
				cs[cs.length++] = newChild;
			} else {
				var child = el.firstChild;
				var i = 0;
				while (child) {
					cs[i++] = child;
					child = child.nextSibling;
				}
				cs.length = i;
				delete cs[cs.length];
			}
		}
	}

	/**
	 * Removes the connections between `parentNode` and `child`
	 * and any existing `child.previousSibling` or `child.nextSibling`.
	 *
	 * @see https://github.com/xmldom/xmldom/issues/135
	 * @see https://github.com/xmldom/xmldom/issues/145
	 *
	 * @param {Node} parentNode
	 * @param {Node} child
	 * @returns {Node} the child that was removed.
	 * @private
	 */
	function _removeChild (parentNode, child) {
		var previous = child.previousSibling;
		var next = child.nextSibling;
		if (previous) {
			previous.nextSibling = next;
		} else {
			parentNode.firstChild = next;
		}
		if (next) {
			next.previousSibling = previous;
		} else {
			parentNode.lastChild = previous;
		}
		child.parentNode = null;
		child.previousSibling = null;
		child.nextSibling = null;
		_onUpdateChild(parentNode.ownerDocument, parentNode);
		return child;
	}

	/**
	 * Returns `true` if `node` can be a parent for insertion.
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function hasValidParentNodeType(node) {
		return (
			node &&
			(node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE)
		);
	}

	/**
	 * Returns `true` if `node` can be inserted according to it's `nodeType`.
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function hasInsertableNodeType(node) {
		return (
			node &&
			(isElementNode(node) ||
				isTextNode(node) ||
				isDocTypeNode(node) ||
				node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
				node.nodeType === Node.COMMENT_NODE ||
				node.nodeType === Node.PROCESSING_INSTRUCTION_NODE)
		);
	}

	/**
	 * Returns true if `node` is a DOCTYPE node
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function isDocTypeNode(node) {
		return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
	}

	/**
	 * Returns true if the node is an element
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function isElementNode(node) {
		return node && node.nodeType === Node.ELEMENT_NODE;
	}
	/**
	 * Returns true if `node` is a text node
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function isTextNode(node) {
		return node && node.nodeType === Node.TEXT_NODE;
	}

	/**
	 * Check if en element node can be inserted before `child`, or at the end if child is falsy,
	 * according to the presence and position of a doctype node on the same level.
	 *
	 * @param {Document} doc The document node
	 * @param {Node} child the node that would become the nextSibling if the element would be inserted
	 * @returns {boolean} `true` if an element can be inserted before child
	 * @private
	 * https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	 */
	function isElementInsertionPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) {
			return false;
		}
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}

	/**
	 * Check if en element node can be inserted before `child`, or at the end if child is falsy,
	 * according to the presence and position of a doctype node on the same level.
	 *
	 * @param {Node} doc The document node
	 * @param {Node} child the node that would become the nextSibling if the element would be inserted
	 * @returns {boolean} `true` if an element can be inserted before child
	 * @private
	 * https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	 */
	function isElementReplacementPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];

		function hasElementChildThatIsNotChild(node) {
			return isElementNode(node) && node !== child;
		}

		if (find(parentChildNodes, hasElementChildThatIsNotChild)) {
			return false;
		}
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}

	/**
	 * @private
	 * Steps 1-5 of the checks before inserting and before replacing a child are the same.
	 *
	 * @param {Node} parent the parent node to insert `node` into
	 * @param {Node} node the node to insert
	 * @param {Node=} child the node that should become the `nextSibling` of `node`
	 * @returns {Node}
	 * @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	 * @throws DOMException if `child` is provided but is not a child of `parent`.
	 * @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	 * @see https://dom.spec.whatwg.org/#concept-node-replace
	 */
	function assertPreInsertionValidity1to5(parent, node, child) {
		// 1. If `parent` is not a Document, DocumentFragment, or Element node, then throw a "HierarchyRequestError" DOMException.
		if (!hasValidParentNodeType(parent)) {
			throw new DOMException(HIERARCHY_REQUEST_ERR, 'Unexpected parent node type ' + parent.nodeType);
		}
		// 2. If `node` is a host-including inclusive ancestor of `parent`, then throw a "HierarchyRequestError" DOMException.
		// not implemented!
		// 3. If `child` is non-null and its parent is not `parent`, then throw a "NotFoundError" DOMException.
		if (child && child.parentNode !== parent) {
			throw new DOMException(NOT_FOUND_ERR, 'child not in parent');
		}
		if (
			// 4. If `node` is not a DocumentFragment, DocumentType, Element, or CharacterData node, then throw a "HierarchyRequestError" DOMException.
			!hasInsertableNodeType(node) ||
			// 5. If either `node` is a Text node and `parent` is a document,
			// the sax parser currently adds top level text nodes, this will be fixed in 0.9.0
			// || (node.nodeType === Node.TEXT_NODE && parent.nodeType === Node.DOCUMENT_NODE)
			// or `node` is a doctype and `parent` is not a document, then throw a "HierarchyRequestError" DOMException.
			(isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE)
		) {
			throw new DOMException(
				HIERARCHY_REQUEST_ERR,
				'Unexpected node type ' + node.nodeType + ' for parent node type ' + parent.nodeType
			);
		}
	}

	/**
	 * @private
	 * Step 6 of the checks before inserting and before replacing a child are different.
	 *
	 * @param {Document} parent the parent node to insert `node` into
	 * @param {Node} node the node to insert
	 * @param {Node | undefined} child the node that should become the `nextSibling` of `node`
	 * @returns {Node}
	 * @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	 * @throws DOMException if `child` is provided but is not a child of `parent`.
	 * @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	 * @see https://dom.spec.whatwg.org/#concept-node-replace
	 */
	function assertPreInsertionValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];

		// DocumentFragment
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			// If node has more than one element child or has a Text node child.
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'More than one element or text in fragment');
			}
			// Otherwise, if `node` has one element child and either `parent` has an element child,
			// `child` is a doctype, or `child` is non-null and a doctype is following `child`.
			if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Element in fragment can not be inserted before doctype');
			}
		}
		// Element
		if (isElementNode(node)) {
			// `parent` has an element child, `child` is a doctype,
			// or `child` is non-null and a doctype is following `child`.
			if (!isElementInsertionPossible(parent, child)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Only one element can be added and only after doctype');
			}
		}
		// DocumentType
		if (isDocTypeNode(node)) {
			// `parent` has a doctype child,
			if (find(parentChildNodes, isDocTypeNode)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Only one doctype is allowed');
			}
			var parentElementChild = find(parentChildNodes, isElementNode);
			// `child` is non-null and an element is preceding `child`,
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Doctype can only be inserted before an element');
			}
			// or `child` is null and `parent` has an element child.
			if (!child && parentElementChild) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Doctype can not be appended since element is present');
			}
		}
	}

	/**
	 * @private
	 * Step 6 of the checks before inserting and before replacing a child are different.
	 *
	 * @param {Document} parent the parent node to insert `node` into
	 * @param {Node} node the node to insert
	 * @param {Node | undefined} child the node that should become the `nextSibling` of `node`
	 * @returns {Node}
	 * @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	 * @throws DOMException if `child` is provided but is not a child of `parent`.
	 * @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	 * @see https://dom.spec.whatwg.org/#concept-node-replace
	 */
	function assertPreReplacementValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];

		// DocumentFragment
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			// If `node` has more than one element child or has a Text node child.
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'More than one element or text in fragment');
			}
			// Otherwise, if `node` has one element child and either `parent` has an element child that is not `child` or a doctype is following `child`.
			if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Element in fragment can not be inserted before doctype');
			}
		}
		// Element
		if (isElementNode(node)) {
			// `parent` has an element child that is not `child` or a doctype is following `child`.
			if (!isElementReplacementPossible(parent, child)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Only one element can be added and only after doctype');
			}
		}
		// DocumentType
		if (isDocTypeNode(node)) {
			function hasDoctypeChildThatIsNotChild(node) {
				return isDocTypeNode(node) && node !== child;
			}

			// `parent` has a doctype child that is not `child`,
			if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Only one doctype is allowed');
			}
			var parentElementChild = find(parentChildNodes, isElementNode);
			// or an element is preceding `child`.
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
				throw new DOMException(HIERARCHY_REQUEST_ERR, 'Doctype can only be inserted before an element');
			}
		}
	}

	/**
	 * @private
	 * @param {Node} parent the parent node to insert `node` into
	 * @param {Node} node the node to insert
	 * @param {Node=} child the node that should become the `nextSibling` of `node`
	 * @returns {Node}
	 * @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	 * @throws DOMException if `child` is provided but is not a child of `parent`.
	 * @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	 */
	function _insertBefore(parent, node, child, _inDocumentAssertion) {
		// To ensure pre-insertion validity of a node into a parent before a child, run these steps:
		assertPreInsertionValidity1to5(parent, node, child);

		// If parent is a document, and any of the statements below, switched on the interface node implements,
		// are true, then throw a "HierarchyRequestError" DOMException.
		if (parent.nodeType === Node.DOCUMENT_NODE) {
			(_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
		}

		var cp = node.parentNode;
		if(cp){
			cp.removeChild(node);//remove and update
		}
		if(node.nodeType === DOCUMENT_FRAGMENT_NODE){
			var newFirst = node.firstChild;
			if (newFirst == null) {
				return node;
			}
			var newLast = node.lastChild;
		}else {
			newFirst = newLast = node;
		}
		var pre = child ? child.previousSibling : parent.lastChild;

		newFirst.previousSibling = pre;
		newLast.nextSibling = child;


		if(pre){
			pre.nextSibling = newFirst;
		}else {
			parent.firstChild = newFirst;
		}
		if(child == null){
			parent.lastChild = newLast;
		}else {
			child.previousSibling = newLast;
		}
		do{
			newFirst.parentNode = parent;
		}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
		_onUpdateChild(parent.ownerDocument||parent, parent);
		//console.log(parent.lastChild.nextSibling == null)
		if (node.nodeType == DOCUMENT_FRAGMENT_NODE) {
			node.firstChild = node.lastChild = null;
		}
		return node;
	}

	/**
	 * Appends `newChild` to `parentNode`.
	 * If `newChild` is already connected to a `parentNode` it is first removed from it.
	 *
	 * @see https://github.com/xmldom/xmldom/issues/135
	 * @see https://github.com/xmldom/xmldom/issues/145
	 * @param {Node} parentNode
	 * @param {Node} newChild
	 * @returns {Node}
	 * @private
	 */
	function _appendSingleChild (parentNode, newChild) {
		if (newChild.parentNode) {
			newChild.parentNode.removeChild(newChild);
		}
		newChild.parentNode = parentNode;
		newChild.previousSibling = parentNode.lastChild;
		newChild.nextSibling = null;
		if (newChild.previousSibling) {
			newChild.previousSibling.nextSibling = newChild;
		} else {
			parentNode.firstChild = newChild;
		}
		parentNode.lastChild = newChild;
		_onUpdateChild(parentNode.ownerDocument, parentNode, newChild);
		return newChild;
	}

	Document.prototype = {
		//implementation : null,
		nodeName :  '#document',
		nodeType :  DOCUMENT_NODE,
		/**
		 * The DocumentType node of the document.
		 *
		 * @readonly
		 * @type DocumentType
		 */
		doctype :  null,
		documentElement :  null,
		_inc : 1,

		insertBefore :  function(newChild, refChild){//raises
			if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE){
				var child = newChild.firstChild;
				while(child){
					var next = child.nextSibling;
					this.insertBefore(child,refChild);
					child = next;
				}
				return newChild;
			}
			_insertBefore(this, newChild, refChild);
			newChild.ownerDocument = this;
			if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) {
				this.documentElement = newChild;
			}

			return newChild;
		},
		removeChild :  function(oldChild){
			if(this.documentElement == oldChild){
				this.documentElement = null;
			}
			return _removeChild(this,oldChild);
		},
		replaceChild: function (newChild, oldChild) {
			//raises
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			newChild.ownerDocument = this;
			if (oldChild) {
				this.removeChild(oldChild);
			}
			if (isElementNode(newChild)) {
				this.documentElement = newChild;
			}
		},
		// Introduced in DOM Level 2:
		importNode : function(importedNode,deep){
			return importNode(this,importedNode,deep);
		},
		// Introduced in DOM Level 2:
		getElementById :	function(id){
			var rtv = null;
			_visitNode(this.documentElement,function(node){
				if(node.nodeType == ELEMENT_NODE){
					if(node.getAttribute('id') == id){
						rtv = node;
						return true;
					}
				}
			});
			return rtv;
		},

		/**
		 * The `getElementsByClassName` method of `Document` interface returns an array-like object
		 * of all child elements which have **all** of the given class name(s).
		 *
		 * Returns an empty list if `classeNames` is an empty string or only contains HTML white space characters.
		 *
		 *
		 * Warning: This is a live LiveNodeList.
		 * Changes in the DOM will reflect in the array as the changes occur.
		 * If an element selected by this array no longer qualifies for the selector,
		 * it will automatically be removed. Be aware of this for iteration purposes.
		 *
		 * @param {string} classNames is a string representing the class name(s) to match; multiple class names are separated by (ASCII-)whitespace
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
		 * @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
		 */
		getElementsByClassName: function(classNames) {
			var classNamesSet = toOrderedSet(classNames);
			return new LiveNodeList(this, function(base) {
				var ls = [];
				if (classNamesSet.length > 0) {
					_visitNode(base.documentElement, function(node) {
						if(node !== base && node.nodeType === ELEMENT_NODE) {
							var nodeClassNames = node.getAttribute('class');
							// can be null if the attribute does not exist
							if (nodeClassNames) {
								// before splitting and iterating just compare them for the most common case
								var matches = classNames === nodeClassNames;
								if (!matches) {
									var nodeClassNamesSet = toOrderedSet(nodeClassNames);
									matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
								}
								if(matches) {
									ls.push(node);
								}
							}
						}
					});
				}
				return ls;
			});
		},

		//document factory method:
		createElement :	function(tagName){
			var node = new Element();
			node.ownerDocument = this;
			node.nodeName = tagName;
			node.tagName = tagName;
			node.localName = tagName;
			node.childNodes = new NodeList();
			var attrs	= node.attributes = new NamedNodeMap();
			attrs._ownerElement = node;
			return node;
		},
		createDocumentFragment :	function(){
			var node = new DocumentFragment();
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			return node;
		},
		createTextNode :	function(data){
			var node = new Text();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		createComment :	function(data){
			var node = new Comment();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		createCDATASection :	function(data){
			var node = new CDATASection();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		createProcessingInstruction :	function(target,data){
			var node = new ProcessingInstruction();
			node.ownerDocument = this;
			node.tagName = node.target = target;
			node.nodeValue= node.data = data;
			return node;
		},
		createAttribute :	function(name){
			var node = new Attr();
			node.ownerDocument	= this;
			node.name = name;
			node.nodeName	= name;
			node.localName = name;
			node.specified = true;
			return node;
		},
		createEntityReference :	function(name){
			var node = new EntityReference();
			node.ownerDocument	= this;
			node.nodeName	= name;
			return node;
		},
		// Introduced in DOM Level 2:
		createElementNS :	function(namespaceURI,qualifiedName){
			var node = new Element();
			var pl = qualifiedName.split(':');
			var attrs	= node.attributes = new NamedNodeMap();
			node.childNodes = new NodeList();
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.tagName = qualifiedName;
			node.namespaceURI = namespaceURI;
			if(pl.length == 2){
				node.prefix = pl[0];
				node.localName = pl[1];
			}else {
				//el.prefix = null;
				node.localName = qualifiedName;
			}
			attrs._ownerElement = node;
			return node;
		},
		// Introduced in DOM Level 2:
		createAttributeNS :	function(namespaceURI,qualifiedName){
			var node = new Attr();
			var pl = qualifiedName.split(':');
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.name = qualifiedName;
			node.namespaceURI = namespaceURI;
			node.specified = true;
			if(pl.length == 2){
				node.prefix = pl[0];
				node.localName = pl[1];
			}else {
				//el.prefix = null;
				node.localName = qualifiedName;
			}
			return node;
		}
	};
	_extends(Document,Node);


	function Element() {
		this._nsMap = {};
	}Element.prototype = {
		nodeType : ELEMENT_NODE,
		hasAttribute : function(name){
			return this.getAttributeNode(name)!=null;
		},
		getAttribute : function(name){
			var attr = this.getAttributeNode(name);
			return attr && attr.value || '';
		},
		getAttributeNode : function(name){
			return this.attributes.getNamedItem(name);
		},
		setAttribute : function(name, value){
			var attr = this.ownerDocument.createAttribute(name);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr);
		},
		removeAttribute : function(name){
			var attr = this.getAttributeNode(name);
			attr && this.removeAttributeNode(attr);
		},

		//four real opeartion method
		appendChild:function(newChild){
			if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
				return this.insertBefore(newChild,null);
			}else {
				return _appendSingleChild(this,newChild);
			}
		},
		setAttributeNode : function(newAttr){
			return this.attributes.setNamedItem(newAttr);
		},
		setAttributeNodeNS : function(newAttr){
			return this.attributes.setNamedItemNS(newAttr);
		},
		removeAttributeNode : function(oldAttr){
			//console.log(this == oldAttr.ownerElement)
			return this.attributes.removeNamedItem(oldAttr.nodeName);
		},
		//get real attribute name,and remove it by removeAttributeNode
		removeAttributeNS : function(namespaceURI, localName){
			var old = this.getAttributeNodeNS(namespaceURI, localName);
			old && this.removeAttributeNode(old);
		},

		hasAttributeNS : function(namespaceURI, localName){
			return this.getAttributeNodeNS(namespaceURI, localName)!=null;
		},
		getAttributeNS : function(namespaceURI, localName){
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			return attr && attr.value || '';
		},
		setAttributeNS : function(namespaceURI, qualifiedName, value){
			var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr);
		},
		getAttributeNodeNS : function(namespaceURI, localName){
			return this.attributes.getNamedItemNS(namespaceURI, localName);
		},

		getElementsByTagName : function(tagName){
			return new LiveNodeList(this,function(base){
				var ls = [];
				_visitNode(base,function(node){
					if(node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)){
						ls.push(node);
					}
				});
				return ls;
			});
		},
		getElementsByTagNameNS : function(namespaceURI, localName){
			return new LiveNodeList(this,function(base){
				var ls = [];
				_visitNode(base,function(node){
					if(node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)){
						ls.push(node);
					}
				});
				return ls;

			});
		}
	};
	Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
	Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;


	_extends(Element,Node);
	function Attr() {
	}Attr.prototype.nodeType = ATTRIBUTE_NODE;
	_extends(Attr,Node);


	function CharacterData() {
	}CharacterData.prototype = {
		data : '',
		substringData : function(offset, count) {
			return this.data.substring(offset, offset+count);
		},
		appendData: function(text) {
			text = this.data+text;
			this.nodeValue = this.data = text;
			this.length = text.length;
		},
		insertData: function(offset,text) {
			this.replaceData(offset,0,text);

		},
		appendChild:function(newChild){
			throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR])
		},
		deleteData: function(offset, count) {
			this.replaceData(offset,count,"");
		},
		replaceData: function(offset, count, text) {
			var start = this.data.substring(0,offset);
			var end = this.data.substring(offset+count);
			text = start + text + end;
			this.nodeValue = this.data = text;
			this.length = text.length;
		}
	};
	_extends(CharacterData,Node);
	function Text() {
	}Text.prototype = {
		nodeName : "#text",
		nodeType : TEXT_NODE,
		splitText : function(offset) {
			var text = this.data;
			var newText = text.substring(offset);
			text = text.substring(0, offset);
			this.data = this.nodeValue = text;
			this.length = text.length;
			var newNode = this.ownerDocument.createTextNode(newText);
			if(this.parentNode){
				this.parentNode.insertBefore(newNode, this.nextSibling);
			}
			return newNode;
		}
	};
	_extends(Text,CharacterData);
	function Comment() {
	}Comment.prototype = {
		nodeName : "#comment",
		nodeType : COMMENT_NODE
	};
	_extends(Comment,CharacterData);

	function CDATASection() {
	}CDATASection.prototype = {
		nodeName : "#cdata-section",
		nodeType : CDATA_SECTION_NODE
	};
	_extends(CDATASection,CharacterData);


	function DocumentType() {
	}DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
	_extends(DocumentType,Node);

	function Notation() {
	}Notation.prototype.nodeType = NOTATION_NODE;
	_extends(Notation,Node);

	function Entity() {
	}Entity.prototype.nodeType = ENTITY_NODE;
	_extends(Entity,Node);

	function EntityReference() {
	}EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
	_extends(EntityReference,Node);

	function DocumentFragment() {
	}DocumentFragment.prototype.nodeName =	"#document-fragment";
	DocumentFragment.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE;
	_extends(DocumentFragment,Node);


	function ProcessingInstruction() {
	}
	ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
	_extends(ProcessingInstruction,Node);
	function XMLSerializer$1(){}
	XMLSerializer$1.prototype.serializeToString = function(node,isHtml,nodeFilter){
		return nodeSerializeToString.call(node,isHtml,nodeFilter);
	};
	Node.prototype.toString = nodeSerializeToString;
	function nodeSerializeToString(isHtml,nodeFilter){
		var buf = [];
		var refNode = this.nodeType == 9 && this.documentElement || this;
		var prefix = refNode.prefix;
		var uri = refNode.namespaceURI;

		if(uri && prefix == null){
			//console.log(prefix)
			var prefix = refNode.lookupPrefix(uri);
			if(prefix == null){
				//isHTML = true;
				var visibleNamespaces=[
				{namespace:uri,prefix:null}
				//{namespace:uri,prefix:''}
				];
			}
		}
		serializeToString(this,buf,isHtml,nodeFilter,visibleNamespaces);
		//console.log('###',this.nodeType,uri,prefix,buf.join(''))
		return buf.join('');
	}

	function needNamespaceDefine(node, isHTML, visibleNamespaces) {
		var prefix = node.prefix || '';
		var uri = node.namespaceURI;
		// According to [Namespaces in XML 1.0](https://www.w3.org/TR/REC-xml-names/#ns-using) ,
		// and more specifically https://www.w3.org/TR/REC-xml-names/#nsc-NoPrefixUndecl :
		// > In a namespace declaration for a prefix [...], the attribute value MUST NOT be empty.
		// in a similar manner [Namespaces in XML 1.1](https://www.w3.org/TR/xml-names11/#ns-using)
		// and more specifically https://www.w3.org/TR/xml-names11/#nsc-NSDeclared :
		// > [...] Furthermore, the attribute value [...] must not be an empty string.
		// so serializing empty namespace value like xmlns:ds="" would produce an invalid XML document.
		if (!uri) {
			return false;
		}
		if (prefix === "xml" && uri === NAMESPACE$2.XML || uri === NAMESPACE$2.XMLNS) {
			return false;
		}

		var i = visibleNamespaces.length;
		while (i--) {
			var ns = visibleNamespaces[i];
			// get namespace prefix
			if (ns.prefix === prefix) {
				return ns.namespace !== uri;
			}
		}
		return true;
	}
	/**
	 * Well-formed constraint: No < in Attribute Values
	 * > The replacement text of any entity referred to directly or indirectly
	 * > in an attribute value must not contain a <.
	 * @see https://www.w3.org/TR/xml11/#CleanAttrVals
	 * @see https://www.w3.org/TR/xml11/#NT-AttValue
	 *
	 * Literal whitespace other than space that appear in attribute values
	 * are serialized as their entity references, so they will be preserved.
	 * (In contrast to whitespace literals in the input which are normalized to spaces)
	 * @see https://www.w3.org/TR/xml11/#AVNormalize
	 * @see https://w3c.github.io/DOM-Parsing/#serializing-an-element-s-attributes
	 */
	function addSerializedAttribute(buf, qualifiedName, value) {
		buf.push(' ', qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
	}

	function serializeToString(node,buf,isHTML,nodeFilter,visibleNamespaces){
		if (!visibleNamespaces) {
			visibleNamespaces = [];
		}

		if(nodeFilter){
			node = nodeFilter(node);
			if(node){
				if(typeof node == 'string'){
					buf.push(node);
					return;
				}
			}else {
				return;
			}
			//buf.sort.apply(attrs, attributeSorter);
		}

		switch(node.nodeType){
		case ELEMENT_NODE:
			var attrs = node.attributes;
			var len = attrs.length;
			var child = node.firstChild;
			var nodeName = node.tagName;

			isHTML = NAMESPACE$2.isHTML(node.namespaceURI) || isHTML;

			var prefixedNodeName = nodeName;
			if (!isHTML && !node.prefix && node.namespaceURI) {
				var defaultNS;
				// lookup current default ns from `xmlns` attribute
				for (var ai = 0; ai < attrs.length; ai++) {
					if (attrs.item(ai).name === 'xmlns') {
						defaultNS = attrs.item(ai).value;
						break
					}
				}
				if (!defaultNS) {
					// lookup current default ns in visibleNamespaces
					for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
						var namespace = visibleNamespaces[nsi];
						if (namespace.prefix === '' && namespace.namespace === node.namespaceURI) {
							defaultNS = namespace.namespace;
							break
						}
					}
				}
				if (defaultNS !== node.namespaceURI) {
					for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
						var namespace = visibleNamespaces[nsi];
						if (namespace.namespace === node.namespaceURI) {
							if (namespace.prefix) {
								prefixedNodeName = namespace.prefix + ':' + nodeName;
							}
							break
						}
					}
				}
			}

			buf.push('<', prefixedNodeName);

			for(var i=0;i<len;i++){
				// add namespaces for attributes
				var attr = attrs.item(i);
				if (attr.prefix == 'xmlns') {
					visibleNamespaces.push({ prefix: attr.localName, namespace: attr.value });
				}else if(attr.nodeName == 'xmlns'){
					visibleNamespaces.push({ prefix: '', namespace: attr.value });
				}
			}

			for(var i=0;i<len;i++){
				var attr = attrs.item(i);
				if (needNamespaceDefine(attr,isHTML, visibleNamespaces)) {
					var prefix = attr.prefix||'';
					var uri = attr.namespaceURI;
					addSerializedAttribute(buf, prefix ? 'xmlns:' + prefix : "xmlns", uri);
					visibleNamespaces.push({ prefix: prefix, namespace:uri });
				}
				serializeToString(attr,buf,isHTML,nodeFilter,visibleNamespaces);
			}

			// add namespace for current node
			if (nodeName === prefixedNodeName && needNamespaceDefine(node, isHTML, visibleNamespaces)) {
				var prefix = node.prefix||'';
				var uri = node.namespaceURI;
				addSerializedAttribute(buf, prefix ? 'xmlns:' + prefix : "xmlns", uri);
				visibleNamespaces.push({ prefix: prefix, namespace:uri });
			}

			if(child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)){
				buf.push('>');
				//if is cdata child node
				if(isHTML && /^script$/i.test(nodeName)){
					while(child){
						if(child.data){
							buf.push(child.data);
						}else {
							serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
						}
						child = child.nextSibling;
					}
				}else
				{
					while(child){
						serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
						child = child.nextSibling;
					}
				}
				buf.push('</',prefixedNodeName,'>');
			}else {
				buf.push('/>');
			}
			// remove added visible namespaces
			//visibleNamespaces.length = startVisibleNamespaces;
			return;
		case DOCUMENT_NODE:
		case DOCUMENT_FRAGMENT_NODE:
			var child = node.firstChild;
			while(child){
				serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
				child = child.nextSibling;
			}
			return;
		case ATTRIBUTE_NODE:
			return addSerializedAttribute(buf, node.name, node.value);
		case TEXT_NODE:
			/**
			 * The ampersand character (&) and the left angle bracket (<) must not appear in their literal form,
			 * except when used as markup delimiters, or within a comment, a processing instruction, or a CDATA section.
			 * If they are needed elsewhere, they must be escaped using either numeric character references or the strings
			 * `&amp;` and `&lt;` respectively.
			 * The right angle bracket (>) may be represented using the string " &gt; ", and must, for compatibility,
			 * be escaped using either `&gt;` or a character reference when it appears in the string `]]>` in content,
			 * when that string is not marking the end of a CDATA section.
			 *
			 * In the content of elements, character data is any string of characters
			 * which does not contain the start-delimiter of any markup
			 * and does not include the CDATA-section-close delimiter, `]]>`.
			 *
			 * @see https://www.w3.org/TR/xml/#NT-CharData
			 * @see https://w3c.github.io/DOM-Parsing/#xml-serializing-a-text-node
			 */
			return buf.push(node.data
				.replace(/[<&>]/g,_xmlEncoder)
			);
		case CDATA_SECTION_NODE:
			return buf.push( '<![CDATA[',node.data,']]>');
		case COMMENT_NODE:
			return buf.push( "<!--",node.data,"-->");
		case DOCUMENT_TYPE_NODE:
			var pubid = node.publicId;
			var sysid = node.systemId;
			buf.push('<!DOCTYPE ',node.name);
			if(pubid){
				buf.push(' PUBLIC ', pubid);
				if (sysid && sysid!='.') {
					buf.push(' ', sysid);
				}
				buf.push('>');
			}else if(sysid && sysid!='.'){
				buf.push(' SYSTEM ', sysid, '>');
			}else {
				var sub = node.internalSubset;
				if(sub){
					buf.push(" [",sub,"]");
				}
				buf.push(">");
			}
			return;
		case PROCESSING_INSTRUCTION_NODE:
			return buf.push( "<?",node.target," ",node.data,"?>");
		case ENTITY_REFERENCE_NODE:
			return buf.push( '&',node.nodeName,';');
		//case ENTITY_NODE:
		//case NOTATION_NODE:
		default:
			buf.push('??',node.nodeName);
		}
	}
	function importNode(doc,node,deep){
		var node2;
		switch (node.nodeType) {
		case ELEMENT_NODE:
			node2 = node.cloneNode(false);
			node2.ownerDocument = doc;
			//var attrs = node2.attributes;
			//var len = attrs.length;
			//for(var i=0;i<len;i++){
				//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
			//}
		case DOCUMENT_FRAGMENT_NODE:
			break;
		case ATTRIBUTE_NODE:
			deep = true;
			break;
		//case ENTITY_REFERENCE_NODE:
		//case PROCESSING_INSTRUCTION_NODE:
		////case TEXT_NODE:
		//case CDATA_SECTION_NODE:
		//case COMMENT_NODE:
		//	deep = false;
		//	break;
		//case DOCUMENT_NODE:
		//case DOCUMENT_TYPE_NODE:
		//cannot be imported.
		//case ENTITY_NODE:
		//case NOTATION_NODE：
		//can not hit in level3
		//default:throw e;
		}
		if(!node2){
			node2 = node.cloneNode(false);//false
		}
		node2.ownerDocument = doc;
		node2.parentNode = null;
		if(deep){
			var child = node.firstChild;
			while(child){
				node2.appendChild(importNode(doc,child,deep));
				child = child.nextSibling;
			}
		}
		return node2;
	}
	//
	//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
	//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
	function cloneNode(doc,node,deep){
		var node2 = new node.constructor();
		for (var n in node) {
			if (Object.prototype.hasOwnProperty.call(node, n)) {
				var v = node[n];
				if (typeof v != "object") {
					if (v != node2[n]) {
						node2[n] = v;
					}
				}
			}
		}
		if(node.childNodes){
			node2.childNodes = new NodeList();
		}
		node2.ownerDocument = doc;
		switch (node2.nodeType) {
		case ELEMENT_NODE:
			var attrs	= node.attributes;
			var attrs2	= node2.attributes = new NamedNodeMap();
			var len = attrs.length;
			attrs2._ownerElement = node2;
			for(var i=0;i<len;i++){
				node2.setAttributeNode(cloneNode(doc,attrs.item(i),true));
			}
			break;	case ATTRIBUTE_NODE:
			deep = true;
		}
		if(deep){
			var child = node.firstChild;
			while(child){
				node2.appendChild(cloneNode(doc,child,deep));
				child = child.nextSibling;
			}
		}
		return node2;
	}

	function __set__(object,key,value){
		object[key] = value;
	}
	//do dynamic
	try{
		if(Object.defineProperty){
			Object.defineProperty(LiveNodeList.prototype,'length',{
				get:function(){
					_updateLiveList(this);
					return this.$$length;
				}
			});

			Object.defineProperty(Node.prototype,'textContent',{
				get:function(){
					return getTextContent(this);
				},

				set:function(data){
					switch(this.nodeType){
					case ELEMENT_NODE:
					case DOCUMENT_FRAGMENT_NODE:
						while(this.firstChild){
							this.removeChild(this.firstChild);
						}
						if(data || String(data)){
							this.appendChild(this.ownerDocument.createTextNode(data));
						}
						break;

					default:
						this.data = data;
						this.value = data;
						this.nodeValue = data;
					}
				}
			});

			function getTextContent(node){
				switch(node.nodeType){
				case ELEMENT_NODE:
				case DOCUMENT_FRAGMENT_NODE:
					var buf = [];
					node = node.firstChild;
					while(node){
						if(node.nodeType!==7 && node.nodeType !==8){
							buf.push(getTextContent(node));
						}
						node = node.nextSibling;
					}
					return buf.join('');
				default:
					return node.nodeValue;
				}
			}

			__set__ = function(object,key,value){
				//console.log(value)
				object['$$'+key] = value;
			};
		}
	}catch(e){//ie8
	}

	var DOMhelper = helper_1.DOMHelper;

	[Document, DocumentFragment, Element].forEach(function (Class) {
		Class.prototype.querySelector = function (selectors) {
			return DOMhelper(this).first(String(selectors), this);
		};

		Class.prototype.querySelectorAll = function (selectors) {
			return DOMhelper(this).select(String(selectors), this);
		};
	});

	Element.prototype.matches = function (selectors) {
		return DOMhelper(this).match(this, selectors);
	};


	//if(typeof require == 'function'){
		var DocumentType_1 = DocumentType;
		var DOMException_1 = DOMException;
		var DOMImplementation_1 = DOMImplementation$2;
		var Element_1 = Element;
		var Node_1 = Node;
		var NodeList_1 = NodeList;
		var XMLSerializer_1 = XMLSerializer$1;
	//}

	var dom = {
		DocumentType: DocumentType_1,
		DOMException: DOMException_1,
		DOMImplementation: DOMImplementation_1,
		Element: Element_1,
		Node: Node_1,
		NodeList: NodeList_1,
		XMLSerializer: XMLSerializer_1
	};

	var entities = createCommonjsModule(function (module, exports) {
	var freeze = conventions.freeze;

	/**
	 * The entities that are predefined in every XML document.
	 *
	 * @see https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-predefined-ent W3C XML 1.1
	 * @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-predefined-ent W3C XML 1.0
	 * @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Predefined_entities_in_XML Wikipedia
	 */
	exports.XML_ENTITIES = freeze({amp:'&', apos:"'", gt:'>', lt:'<', quot:'"'});

	/**
	 * A map of currently 241 entities that are detected in an HTML document.
	 * They contain all entries from `XML_ENTITIES`.
	 *
	 * @see XML_ENTITIES
	 * @see DOMParser.parseFromString
	 * @see DOMImplementation.prototype.createHTMLDocument
	 * @see https://html.spec.whatwg.org/#named-character-references WHATWG HTML(5) Spec
	 * @see https://www.w3.org/TR/xml-entity-names/ W3C XML Entity Names
	 * @see https://www.w3.org/TR/html4/sgml/entities.html W3C HTML4/SGML
	 * @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Character_entity_references_in_HTML Wikipedia (HTML)
	 * @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Entities_representing_special_characters_in_XHTML Wikpedia (XHTML)
	 */
	exports.HTML_ENTITIES = freeze({
	       lt: '<',
	       gt: '>',
	       amp: '&',
	       quot: '"',
	       apos: "'",
	       Agrave: "À",
	       Aacute: "Á",
	       Acirc: "Â",
	       Atilde: "Ã",
	       Auml: "Ä",
	       Aring: "Å",
	       AElig: "Æ",
	       Ccedil: "Ç",
	       Egrave: "È",
	       Eacute: "É",
	       Ecirc: "Ê",
	       Euml: "Ë",
	       Igrave: "Ì",
	       Iacute: "Í",
	       Icirc: "Î",
	       Iuml: "Ï",
	       ETH: "Ð",
	       Ntilde: "Ñ",
	       Ograve: "Ò",
	       Oacute: "Ó",
	       Ocirc: "Ô",
	       Otilde: "Õ",
	       Ouml: "Ö",
	       Oslash: "Ø",
	       Ugrave: "Ù",
	       Uacute: "Ú",
	       Ucirc: "Û",
	       Uuml: "Ü",
	       Yacute: "Ý",
	       THORN: "Þ",
	       szlig: "ß",
	       agrave: "à",
	       aacute: "á",
	       acirc: "â",
	       atilde: "ã",
	       auml: "ä",
	       aring: "å",
	       aelig: "æ",
	       ccedil: "ç",
	       egrave: "è",
	       eacute: "é",
	       ecirc: "ê",
	       euml: "ë",
	       igrave: "ì",
	       iacute: "í",
	       icirc: "î",
	       iuml: "ï",
	       eth: "ð",
	       ntilde: "ñ",
	       ograve: "ò",
	       oacute: "ó",
	       ocirc: "ô",
	       otilde: "õ",
	       ouml: "ö",
	       oslash: "ø",
	       ugrave: "ù",
	       uacute: "ú",
	       ucirc: "û",
	       uuml: "ü",
	       yacute: "ý",
	       thorn: "þ",
	       yuml: "ÿ",
	       nbsp: "\u00a0",
	       iexcl: "¡",
	       cent: "¢",
	       pound: "£",
	       curren: "¤",
	       yen: "¥",
	       brvbar: "¦",
	       sect: "§",
	       uml: "¨",
	       copy: "©",
	       ordf: "ª",
	       laquo: "«",
	       not: "¬",
	       shy: "­­",
	       reg: "®",
	       macr: "¯",
	       deg: "°",
	       plusmn: "±",
	       sup2: "²",
	       sup3: "³",
	       acute: "´",
	       micro: "µ",
	       para: "¶",
	       middot: "·",
	       cedil: "¸",
	       sup1: "¹",
	       ordm: "º",
	       raquo: "»",
	       frac14: "¼",
	       frac12: "½",
	       frac34: "¾",
	       iquest: "¿",
	       times: "×",
	       divide: "÷",
	       forall: "∀",
	       part: "∂",
	       exist: "∃",
	       empty: "∅",
	       nabla: "∇",
	       isin: "∈",
	       notin: "∉",
	       ni: "∋",
	       prod: "∏",
	       sum: "∑",
	       minus: "−",
	       lowast: "∗",
	       radic: "√",
	       prop: "∝",
	       infin: "∞",
	       ang: "∠",
	       and: "∧",
	       or: "∨",
	       cap: "∩",
	       cup: "∪",
	       'int': "∫",
	       there4: "∴",
	       sim: "∼",
	       cong: "≅",
	       asymp: "≈",
	       ne: "≠",
	       equiv: "≡",
	       le: "≤",
	       ge: "≥",
	       sub: "⊂",
	       sup: "⊃",
	       nsub: "⊄",
	       sube: "⊆",
	       supe: "⊇",
	       oplus: "⊕",
	       otimes: "⊗",
	       perp: "⊥",
	       sdot: "⋅",
	       Alpha: "Α",
	       Beta: "Β",
	       Gamma: "Γ",
	       Delta: "Δ",
	       Epsilon: "Ε",
	       Zeta: "Ζ",
	       Eta: "Η",
	       Theta: "Θ",
	       Iota: "Ι",
	       Kappa: "Κ",
	       Lambda: "Λ",
	       Mu: "Μ",
	       Nu: "Ν",
	       Xi: "Ξ",
	       Omicron: "Ο",
	       Pi: "Π",
	       Rho: "Ρ",
	       Sigma: "Σ",
	       Tau: "Τ",
	       Upsilon: "Υ",
	       Phi: "Φ",
	       Chi: "Χ",
	       Psi: "Ψ",
	       Omega: "Ω",
	       alpha: "α",
	       beta: "β",
	       gamma: "γ",
	       delta: "δ",
	       epsilon: "ε",
	       zeta: "ζ",
	       eta: "η",
	       theta: "θ",
	       iota: "ι",
	       kappa: "κ",
	       lambda: "λ",
	       mu: "μ",
	       nu: "ν",
	       xi: "ξ",
	       omicron: "ο",
	       pi: "π",
	       rho: "ρ",
	       sigmaf: "ς",
	       sigma: "σ",
	       tau: "τ",
	       upsilon: "υ",
	       phi: "φ",
	       chi: "χ",
	       psi: "ψ",
	       omega: "ω",
	       thetasym: "ϑ",
	       upsih: "ϒ",
	       piv: "ϖ",
	       OElig: "Œ",
	       oelig: "œ",
	       Scaron: "Š",
	       scaron: "š",
	       Yuml: "Ÿ",
	       fnof: "ƒ",
	       circ: "ˆ",
	       tilde: "˜",
	       ensp: " ",
	       emsp: " ",
	       thinsp: " ",
	       zwnj: "‌",
	       zwj: "‍",
	       lrm: "‎",
	       rlm: "‏",
	       ndash: "–",
	       mdash: "—",
	       lsquo: "‘",
	       rsquo: "’",
	       sbquo: "‚",
	       ldquo: "“",
	       rdquo: "”",
	       bdquo: "„",
	       dagger: "†",
	       Dagger: "‡",
	       bull: "•",
	       hellip: "…",
	       permil: "‰",
	       prime: "′",
	       Prime: "″",
	       lsaquo: "‹",
	       rsaquo: "›",
	       oline: "‾",
	       euro: "€",
	       trade: "™",
	       larr: "←",
	       uarr: "↑",
	       rarr: "→",
	       darr: "↓",
	       harr: "↔",
	       crarr: "↵",
	       lceil: "⌈",
	       rceil: "⌉",
	       lfloor: "⌊",
	       rfloor: "⌋",
	       loz: "◊",
	       spades: "♠",
	       clubs: "♣",
	       hearts: "♥",
	       diams: "♦"
	});

	/**
	 * @deprecated use `HTML_ENTITIES` instead
	 * @see HTML_ENTITIES
	 */
	exports.entityMap = exports.HTML_ENTITIES;
	});
	entities.XML_ENTITIES;
	entities.HTML_ENTITIES;
	entities.entityMap;

	var NAMESPACE$1 = conventions.NAMESPACE;

	//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
	//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
	//[5]   	Name	   ::=   	NameStartChar (NameChar)*
	var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;//\u10000-\uEFFFF
	var nameChar = new RegExp("[\\-\\.0-9"+nameStartChar.source.slice(1,-1)+"\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
	var tagNamePattern = new RegExp('^'+nameStartChar.source+nameChar.source+'*(?:\:'+nameStartChar.source+nameChar.source+'*)?$');
	//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
	//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')

	//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
	//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
	var S_TAG = 0;//tag name offerring
	var S_ATTR = 1;//attr name offerring
	var S_ATTR_SPACE=2;//attr name end and space offer
	var S_EQ = 3;//=space?
	var S_ATTR_NOQUOT_VALUE = 4;//attr value(no quot value only)
	var S_ATTR_END = 5;//attr value end and no space(quot end)
	var S_TAG_SPACE = 6;//(attr value end || tag end ) && (space offer)
	var S_TAG_CLOSE = 7;//closed el<el />

	/**
	 * Creates an error that will not be caught by XMLReader aka the SAX parser.
	 *
	 * @param {string} message
	 * @param {any?} locator Optional, can provide details about the location in the source
	 * @constructor
	 */
	function ParseError$1(message, locator) {
		this.message = message;
		this.locator = locator;
		if(Error.captureStackTrace) Error.captureStackTrace(this, ParseError$1);
	}
	ParseError$1.prototype = new Error();
	ParseError$1.prototype.name = ParseError$1.name;

	function XMLReader$1(){

	}

	XMLReader$1.prototype = {
		parse:function(source,defaultNSMap,entityMap){
			var domBuilder = this.domBuilder;
			domBuilder.startDocument();
			_copy(defaultNSMap ,defaultNSMap = {});
			parse$2(source,defaultNSMap,entityMap,
					domBuilder,this.errorHandler);
			domBuilder.endDocument();
		}
	};
	function parse$2(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
		function fixedFromCharCode(code) {
			// String.prototype.fromCharCode does not supports
			// > 2 bytes unicode chars directly
			if (code > 0xffff) {
				code -= 0x10000;
				var surrogate1 = 0xd800 + (code >> 10)
					, surrogate2 = 0xdc00 + (code & 0x3ff);

				return String.fromCharCode(surrogate1, surrogate2);
			} else {
				return String.fromCharCode(code);
			}
		}
		function entityReplacer(a){
			var k = a.slice(1,-1);
			if (Object.hasOwnProperty.call(entityMap, k)) {
				return entityMap[k];
			}else if(k.charAt(0) === '#'){
				return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
			}else {
				errorHandler.error('entity not found:'+a);
				return a;
			}
		}
		function appendText(end){//has some bugs
			if(end>start){
				var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
				locator&&position(start);
				domBuilder.characters(xt,0,end-start);
				start = end;
			}
		}
		function position(p,m){
			while(p>=lineEnd && (m = linePattern.exec(source))){
				lineStart = m.index;
				lineEnd = lineStart + m[0].length;
				locator.lineNumber++;
				//console.log('line++:',locator,startPos,endPos)
			}
			locator.columnNumber = p-lineStart+1;
		}
		var lineStart = 0;
		var lineEnd = 0;
		var linePattern = /.*(?:\r\n?|\n)|.*$/g;
		var locator = domBuilder.locator;

		var parseStack = [{currentNSMap:defaultNSMapCopy}];
		var closeMap = {};
		var start = 0;
		while(true){
			try{
				var tagStart = source.indexOf('<',start);
				if(tagStart<0){
					if(!source.substr(start).match(/^\s*$/)){
						var doc = domBuilder.doc;
		    			var text = doc.createTextNode(source.substr(start));
		    			doc.appendChild(text);
		    			domBuilder.currentElement = text;
					}
					return;
				}
				if(tagStart>start){
					appendText(tagStart);
				}
				switch(source.charAt(tagStart+1)){
				case '/':
					var end = source.indexOf('>',tagStart+3);
					var tagName = source.substring(tagStart + 2, end).replace(/[ \t\n\r]+$/g, '');
					var config = parseStack.pop();
					if(end<0){

		        		tagName = source.substring(tagStart+2).replace(/[\s<].*/,'');
		        		errorHandler.error("end tag name: "+tagName+' is not complete:'+config.tagName);
		        		end = tagStart+1+tagName.length;
		        	}else if(tagName.match(/\s</)){
		        		tagName = tagName.replace(/[\s<].*/,'');
		        		errorHandler.error("end tag name: "+tagName+' maybe not complete');
		        		end = tagStart+1+tagName.length;
					}
					var localNSMap = config.localNSMap;
					var endMatch = config.tagName == tagName;
					var endIgnoreCaseMach = endMatch || config.tagName&&config.tagName.toLowerCase() == tagName.toLowerCase();
			        if(endIgnoreCaseMach){
			        	domBuilder.endElement(config.uri,config.localName,tagName);
						if(localNSMap){
							for (var prefix in localNSMap) {
								if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) {
									domBuilder.endPrefixMapping(prefix);
								}
							}
						}
						if(!endMatch){
			            	errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName ); // No known test case
						}
			        }else {
			        	parseStack.push(config);
			        }

					end++;
					break;
					// end elment
				case '?':// <?...?>
					locator&&position(tagStart);
					end = parseInstruction(source,tagStart,domBuilder);
					break;
				case '!':// <!doctype,<![CDATA,<!--
					locator&&position(tagStart);
					end = parseDCC(source,tagStart,domBuilder,errorHandler);
					break;
				default:
					locator&&position(tagStart);
					var el = new ElementAttributes();
					var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
					//elStartEnd
					var end = parseElementStartPart(source,tagStart,el,currentNSMap,entityReplacer,errorHandler);
					var len = el.length;


					if(!el.closed && fixSelfClosed(source,end,el.tagName,closeMap)){
						el.closed = true;
						if(!entityMap.nbsp){
							errorHandler.warning('unclosed xml attribute');
						}
					}
					if(locator && len){
						var locator2 = copyLocator(locator,{});
						//try{//attribute position fixed
						for(var i = 0;i<len;i++){
							var a = el[i];
							position(a.offset);
							a.locator = copyLocator(locator,{});
						}
						domBuilder.locator = locator2;
						if(appendElement$1(el,domBuilder,currentNSMap)){
							parseStack.push(el);
						}
						domBuilder.locator = locator;
					}else {
						if(appendElement$1(el,domBuilder,currentNSMap)){
							parseStack.push(el);
						}
					}

					if (NAMESPACE$1.isHTML(el.uri) && !el.closed) {
						end = parseHtmlSpecialContent(source,end,el.tagName,entityReplacer,domBuilder);
					} else {
						end++;
					}
				}
			}catch(e){
				if (e instanceof ParseError$1) {
					throw e;
				}
				errorHandler.error('element parse error: '+e);
				end = -1;
			}
			if(end>start){
				start = end;
			}else {
				//TODO: 这里有可能sax回退，有位置错误风险
				appendText(Math.max(tagStart,start)+1);
			}
		}
	}
	function copyLocator(f,t){
		t.lineNumber = f.lineNumber;
		t.columnNumber = f.columnNumber;
		return t;
	}

	/**
	 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
	 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
	 */
	function parseElementStartPart(source,start,el,currentNSMap,entityReplacer,errorHandler){

		/**
		 * @param {string} qname
		 * @param {string} value
		 * @param {number} startIndex
		 */
		function addAttribute(qname, value, startIndex) {
			if (el.attributeNames.hasOwnProperty(qname)) {
				errorHandler.fatalError('Attribute ' + qname + ' redefined');
			}
			el.addValue(
				qname,
				// @see https://www.w3.org/TR/xml/#AVNormalize
				// since the xmldom sax parser does not "interpret" DTD the following is not implemented:
				// - recursive replacement of (DTD) entity references
				// - trimming and collapsing multiple spaces into a single one for attributes that are not of type CDATA
				value.replace(/[\t\n\r]/g, ' ').replace(/&#?\w+;/g, entityReplacer),
				startIndex
			);
		}
		var attrName;
		var value;
		var p = ++start;
		var s = S_TAG;//status
		while(true){
			var c = source.charAt(p);
			switch(c){
			case '=':
				if(s === S_ATTR){//attrName
					attrName = source.slice(start,p);
					s = S_EQ;
				}else if(s === S_ATTR_SPACE){
					s = S_EQ;
				}else {
					//fatalError: equal must after attrName or space after attrName
					throw new Error('attribute equal must after attrName'); // No known test case
				}
				break;
			case '\'':
			case '"':
				if(s === S_EQ || s === S_ATTR //|| s == S_ATTR_SPACE
					){//equal
					if(s === S_ATTR){
						errorHandler.warning('attribute value must after "="');
						attrName = source.slice(start,p);
					}
					start = p+1;
					p = source.indexOf(c,start);
					if(p>0){
						value = source.slice(start, p);
						addAttribute(attrName, value, start-1);
						s = S_ATTR_END;
					}else {
						//fatalError: no end quot match
						throw new Error('attribute value no end \''+c+'\' match');
					}
				}else if(s == S_ATTR_NOQUOT_VALUE){
					value = source.slice(start, p);
					addAttribute(attrName, value, start);
					errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
					start = p+1;
					s = S_ATTR_END;
				}else {
					//fatalError: no equal before
					throw new Error('attribute value must after "="'); // No known test case
				}
				break;
			case '/':
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));
				case S_ATTR_END:
				case S_TAG_SPACE:
				case S_TAG_CLOSE:
					s =S_TAG_CLOSE;
					el.closed = true;
				case S_ATTR_NOQUOT_VALUE:
				case S_ATTR:
					break;
					case S_ATTR_SPACE:
						el.closed = true;
					break;
				//case S_EQ:
				default:
					throw new Error("attribute invalid close char('/')") // No known test case
				}
				break;
			case ''://end document
				errorHandler.error('unexpected end of input');
				if(s == S_TAG){
					el.setTagName(source.slice(start,p));
				}
				return p;
			case '>':
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));
				case S_ATTR_END:
				case S_TAG_SPACE:
				case S_TAG_CLOSE:
					break;//normal
				case S_ATTR_NOQUOT_VALUE://Compatible state
				case S_ATTR:
					value = source.slice(start,p);
					if(value.slice(-1) === '/'){
						el.closed  = true;
						value = value.slice(0,-1);
					}
				case S_ATTR_SPACE:
					if(s === S_ATTR_SPACE){
						value = attrName;
					}
					if(s == S_ATTR_NOQUOT_VALUE){
						errorHandler.warning('attribute "'+value+'" missed quot(")!');
						addAttribute(attrName, value, start);
					}else {
						if(!NAMESPACE$1.isHTML(currentNSMap['']) || !value.match(/^(?:disabled|checked|selected)$/i)){
							errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!');
						}
						addAttribute(value, value, start);
					}
					break;
				case S_EQ:
					throw new Error('attribute value missed!!');
				}
	//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
				return p;
			/*xml space '\x20' | #x9 | #xD | #xA; */
			case '\u0080':
				c = ' ';
			default:
				if(c<= ' '){//space
					switch(s){
					case S_TAG:
						el.setTagName(source.slice(start,p));//tagName
						s = S_TAG_SPACE;
						break;
					case S_ATTR:
						attrName = source.slice(start,p);
						s = S_ATTR_SPACE;
						break;
					case S_ATTR_NOQUOT_VALUE:
						var value = source.slice(start, p);
						errorHandler.warning('attribute "'+value+'" missed quot(")!!');
						addAttribute(attrName, value, start);
					case S_ATTR_END:
						s = S_TAG_SPACE;
						break;
					//case S_TAG_SPACE:
					//case S_EQ:
					//case S_ATTR_SPACE:
					//	void();break;
					//case S_TAG_CLOSE:
						//ignore warning
					}
				}else {//not space
	//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
	//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
					switch(s){
					//case S_TAG:void();break;
					//case S_ATTR:void();break;
					//case S_ATTR_NOQUOT_VALUE:void();break;
					case S_ATTR_SPACE:
						el.tagName;
						if (!NAMESPACE$1.isHTML(currentNSMap['']) || !attrName.match(/^(?:disabled|checked|selected)$/i)) {
							errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead2!!');
						}
						addAttribute(attrName, attrName, start);
						start = p;
						s = S_ATTR;
						break;
					case S_ATTR_END:
						errorHandler.warning('attribute space is required"'+attrName+'"!!');
					case S_TAG_SPACE:
						s = S_ATTR;
						start = p;
						break;
					case S_EQ:
						s = S_ATTR_NOQUOT_VALUE;
						start = p;
						break;
					case S_TAG_CLOSE:
						throw new Error("elements closed character '/' and '>' must be connected to");
					}
				}
			}//end outer switch
			//console.log('p++',p)
			p++;
		}
	}
	/**
	 * @return true if has new namespace define
	 */
	function appendElement$1(el,domBuilder,currentNSMap){
		var tagName = el.tagName;
		var localNSMap = null;
		//var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
		var i = el.length;
		while(i--){
			var a = el[i];
			var qName = a.qName;
			var value = a.value;
			var nsp = qName.indexOf(':');
			if(nsp>0){
				var prefix = a.prefix = qName.slice(0,nsp);
				var localName = qName.slice(nsp+1);
				var nsPrefix = prefix === 'xmlns' && localName;
			}else {
				localName = qName;
				prefix = null;
				nsPrefix = qName === 'xmlns' && '';
			}
			//can not set prefix,because prefix !== ''
			a.localName = localName ;
			//prefix == null for no ns prefix attribute
			if(nsPrefix !== false){//hack!!
				if(localNSMap == null){
					localNSMap = {};
					//console.log(currentNSMap,0)
					_copy(currentNSMap,currentNSMap={});
					//console.log(currentNSMap,1)
				}
				currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
				a.uri = NAMESPACE$1.XMLNS;
				domBuilder.startPrefixMapping(nsPrefix, value);
			}
		}
		var i = el.length;
		while(i--){
			a = el[i];
			var prefix = a.prefix;
			if(prefix){//no prefix attribute has no namespace
				if(prefix === 'xml'){
					a.uri = NAMESPACE$1.XML;
				}if(prefix !== 'xmlns'){
					a.uri = currentNSMap[prefix || ''];

					//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
				}
			}
		}
		var nsp = tagName.indexOf(':');
		if(nsp>0){
			prefix = el.prefix = tagName.slice(0,nsp);
			localName = el.localName = tagName.slice(nsp+1);
		}else {
			prefix = null;//important!!
			localName = el.localName = tagName;
		}
		//no prefix element has default namespace
		var ns = el.uri = currentNSMap[prefix || ''];
		domBuilder.startElement(ns,localName,tagName,el);
		//endPrefixMapping and startPrefixMapping have not any help for dom builder
		//localNSMap = null
		if(el.closed){
			domBuilder.endElement(ns,localName,tagName);
			if(localNSMap){
				for (prefix in localNSMap) {
					if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) {
						domBuilder.endPrefixMapping(prefix);
					}
				}
			}
		}else {
			el.currentNSMap = currentNSMap;
			el.localNSMap = localNSMap;
			//parseStack.push(el);
			return true;
		}
	}
	function parseHtmlSpecialContent(source,elStartEnd,tagName,entityReplacer,domBuilder){
		if(/^(?:script|textarea)$/i.test(tagName)){
			var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
			var text = source.substring(elStartEnd+1,elEndStart);
			if(/[&<]/.test(text)){
				if(/^script$/i.test(tagName)){
					//if(!/\]\]>/.test(text)){
						//lexHandler.startCDATA();
						domBuilder.characters(text,0,text.length);
						//lexHandler.endCDATA();
						return elEndStart;
					//}
				}//}else{//text area
					text = text.replace(/&#?\w+;/g,entityReplacer);
					domBuilder.characters(text,0,text.length);
					return elEndStart;
				//}

			}
		}
		return elStartEnd+1;
	}
	function fixSelfClosed(source,elStartEnd,tagName,closeMap){
		//if(tagName in closeMap){
		var pos = closeMap[tagName];
		if(pos == null){
			//console.log(tagName)
			pos =  source.lastIndexOf('</'+tagName+'>');
			if(pos<elStartEnd){//忘记闭合
				pos = source.lastIndexOf('</'+tagName);
			}
			closeMap[tagName] =pos;
		}
		return pos<elStartEnd;
		//}
	}

	function _copy (source, target) {
		for (var n in source) {
			if (Object.prototype.hasOwnProperty.call(source, n)) {
				target[n] = source[n];
			}
		}
	}

	function parseDCC(source,start,domBuilder,errorHandler){//sure start with '<!'
		var next= source.charAt(start+2);
		switch(next){
		case '-':
			if(source.charAt(start + 3) === '-'){
				var end = source.indexOf('-->',start+4);
				//append comment source.substring(4,end)//<!--
				if(end>start){
					domBuilder.comment(source,start+4,end-start-4);
					return end+3;
				}else {
					errorHandler.error("Unclosed comment");
					return -1;
				}
			}else {
				//error
				return -1;
			}
		default:
			if(source.substr(start+3,6) == 'CDATA['){
				var end = source.indexOf(']]>',start+9);
				domBuilder.startCDATA();
				domBuilder.characters(source,start+9,end-start-9);
				domBuilder.endCDATA();
				return end+3;
			}
			//<!DOCTYPE
			//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId)
			var matchs = split(source,start);
			var len = matchs.length;
			if(len>1 && /!doctype/i.test(matchs[0][0])){
				var name = matchs[1][0];
				var pubid = false;
				var sysid = false;
				if(len>3){
					if(/^public$/i.test(matchs[2][0])){
						pubid = matchs[3][0];
						sysid = len>4 && matchs[4][0];
					}else if(/^system$/i.test(matchs[2][0])){
						sysid = matchs[3][0];
					}
				}
				var lastMatch = matchs[len-1];
				domBuilder.startDTD(name, pubid, sysid);
				domBuilder.endDTD();

				return lastMatch.index+lastMatch[0].length
			}
		}
		return -1;
	}



	function parseInstruction(source,start,domBuilder){
		var end = source.indexOf('?>',start);
		if(end){
			var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
			if(match){
				match[0].length;
				domBuilder.processingInstruction(match[1], match[2]) ;
				return end+2;
			}else {//error
				return -1;
			}
		}
		return -1;
	}

	function ElementAttributes(){
		this.attributeNames = {};
	}
	ElementAttributes.prototype = {
		setTagName:function(tagName){
			if(!tagNamePattern.test(tagName)){
				throw new Error('invalid tagName:'+tagName)
			}
			this.tagName = tagName;
		},
		addValue:function(qName, value, offset) {
			if(!tagNamePattern.test(qName)){
				throw new Error('invalid attribute:'+qName)
			}
			this.attributeNames[qName] = this.length;
			this[this.length++] = {qName:qName,value:value,offset:offset};
		},
		length:0,
		getLocalName:function(i){return this[i].localName},
		getLocator:function(i){return this[i].locator},
		getQName:function(i){return this[i].qName},
		getURI:function(i){return this[i].uri},
		getValue:function(i){return this[i].value}
	//	,getIndex:function(uri, localName)){
	//		if(localName){
	//
	//		}else{
	//			var qName = uri
	//		}
	//	},
	//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
	//	getType:function(uri,localName){}
	//	getType:function(i){},
	};



	function split(source,start){
		var match;
		var buf = [];
		var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
		reg.lastIndex = start;
		reg.exec(source);//skip <
		while(match = reg.exec(source)){
			buf.push(match);
			if(match[1])return buf;
		}
	}

	var XMLReader_1 = XMLReader$1;
	var ParseError_1 = ParseError$1;

	var sax = {
		XMLReader: XMLReader_1,
		ParseError: ParseError_1
	};

	var DOMImplementation$1 = dom.DOMImplementation;

	var NAMESPACE = conventions.NAMESPACE;

	var ParseError = sax.ParseError;
	var XMLReader = sax.XMLReader;

	/**
	 * Normalizes line ending according to https://www.w3.org/TR/xml11/#sec-line-ends:
	 *
	 * > XML parsed entities are often stored in computer files which,
	 * > for editing convenience, are organized into lines.
	 * > These lines are typically separated by some combination
	 * > of the characters CARRIAGE RETURN (#xD) and LINE FEED (#xA).
	 * >
	 * > To simplify the tasks of applications, the XML processor must behave
	 * > as if it normalized all line breaks in external parsed entities (including the document entity)
	 * > on input, before parsing, by translating all of the following to a single #xA character:
	 * >
	 * > 1. the two-character sequence #xD #xA
	 * > 2. the two-character sequence #xD #x85
	 * > 3. the single character #x85
	 * > 4. the single character #x2028
	 * > 5. any #xD character that is not immediately followed by #xA or #x85.
	 *
	 * @param {string} input
	 * @returns {string}
	 */
	function normalizeLineEndings(input) {
		return input
			.replace(/\r[\n\u0085]/g, '\n')
			.replace(/[\r\u0085\u2028]/g, '\n')
	}

	/**
	 * @typedef Locator
	 * @property {number} [columnNumber]
	 * @property {number} [lineNumber]
	 */

	/**
	 * @typedef DOMParserOptions
	 * @property {DOMHandler} [domBuilder]
	 * @property {Function} [errorHandler]
	 * @property {(string) => string} [normalizeLineEndings] used to replace line endings before parsing
	 * 						defaults to `normalizeLineEndings`
	 * @property {Locator} [locator]
	 * @property {Record<string, string>} [xmlns]
	 *
	 * @see normalizeLineEndings
	 */

	/**
	 * The DOMParser interface provides the ability to parse XML or HTML source code
	 * from a string into a DOM `Document`.
	 *
	 * _xmldom is different from the spec in that it allows an `options` parameter,
	 * to override the default behavior._
	 *
	 * @param {DOMParserOptions} [options]
	 * @constructor
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
	 * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-parsing-and-serialization
	 */
	function DOMParser$2(options){
		this.options = options ||{locator:{}};
	}

	DOMParser$2.prototype.parseFromString = function(source,mimeType){
		var options = this.options;
		var sax =  new XMLReader();
		var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
		var errorHandler = options.errorHandler;
		var locator = options.locator;
		var defaultNSMap = options.xmlns||{};
		var isHTML = /\/x?html?$/.test(mimeType);//mimeType.toLowerCase().indexOf('html') > -1;
	  	var entityMap = isHTML ? entities.HTML_ENTITIES : entities.XML_ENTITIES;
		if(locator){
			domBuilder.setDocumentLocator(locator);
		}

		sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
		sax.domBuilder = options.domBuilder || domBuilder;
		if(isHTML){
			defaultNSMap[''] = NAMESPACE.HTML;
		}
		defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
		var normalize = options.normalizeLineEndings || normalizeLineEndings;
		if (source && typeof source === 'string') {
			sax.parse(
				normalize(source),
				defaultNSMap,
				entityMap
			);
		} else {
			sax.errorHandler.error('invalid doc source');
		}
		return domBuilder.doc;
	};
	function buildErrorHandler(errorImpl,domBuilder,locator){
		if(!errorImpl){
			if(domBuilder instanceof DOMHandler){
				return domBuilder;
			}
			errorImpl = domBuilder ;
		}
		var errorHandler = {};
		var isCallback = errorImpl instanceof Function;
		locator = locator||{};
		function build(key){
			var fn = errorImpl[key];
			if(!fn && isCallback){
				fn = errorImpl.length == 2?function(msg){errorImpl(key,msg);}:errorImpl;
			}
			errorHandler[key] = fn && function(msg){
				fn('[xmldom '+key+']\t'+msg+_locator(locator));
			}||function(){};
		}
		build('warning');
		build('error');
		build('fatalError');
		return errorHandler;
	}

	//console.log('#\n\n\n\n\n\n\n####')
	/**
	 * +ContentHandler+ErrorHandler
	 * +LexicalHandler+EntityResolver2
	 * -DeclHandler-DTDHandler
	 *
	 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
	 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
	 */
	function DOMHandler() {
	    this.cdata = false;
	}
	function position(locator,node){
		node.lineNumber = locator.lineNumber;
		node.columnNumber = locator.columnNumber;
	}
	/**
	 * @see org.xml.sax.ContentHandler#startDocument
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
	 */
	DOMHandler.prototype = {
		startDocument : function() {
	    	this.doc = new DOMImplementation$1().createDocument(null, null, null);
	    	if (this.locator) {
	        	this.doc.documentURI = this.locator.systemId;
	    	}
		},
		startElement:function(namespaceURI, localName, qName, attrs) {
			var doc = this.doc;
		    var el = doc.createElementNS(namespaceURI, qName||localName);
		    var len = attrs.length;
		    appendElement(this, el);
		    this.currentElement = el;

			this.locator && position(this.locator,el);
		    for (var i = 0 ; i < len; i++) {
		        var namespaceURI = attrs.getURI(i);
		        var value = attrs.getValue(i);
		        var qName = attrs.getQName(i);
				var attr = doc.createAttributeNS(namespaceURI, qName);
				this.locator &&position(attrs.getLocator(i),attr);
				attr.value = attr.nodeValue = value;
				el.setAttributeNode(attr);
		    }
		},
		endElement:function(namespaceURI, localName, qName) {
			var current = this.currentElement;
			current.tagName;
			this.currentElement = current.parentNode;
		},
		startPrefixMapping:function(prefix, uri) {
		},
		endPrefixMapping:function(prefix) {
		},
		processingInstruction:function(target, data) {
		    var ins = this.doc.createProcessingInstruction(target, data);
		    this.locator && position(this.locator,ins);
		    appendElement(this, ins);
		},
		ignorableWhitespace:function(ch, start, length) {
		},
		characters:function(chars, start, length) {
			chars = _toString.apply(this,arguments);
			//console.log(chars)
			if(chars){
				if (this.cdata) {
					var charNode = this.doc.createCDATASection(chars);
				} else {
					var charNode = this.doc.createTextNode(chars);
				}
				if(this.currentElement){
					this.currentElement.appendChild(charNode);
				}else if(/^\s*$/.test(chars)){
					this.doc.appendChild(charNode);
					//process xml
				}
				this.locator && position(this.locator,charNode);
			}
		},
		skippedEntity:function(name) {
		},
		endDocument:function() {
			this.doc.normalize();
		},
		setDocumentLocator:function (locator) {
		    if(this.locator = locator){// && !('lineNumber' in locator)){
		    	locator.lineNumber = 0;
		    }
		},
		//LexicalHandler
		comment:function(chars, start, length) {
			chars = _toString.apply(this,arguments);
		    var comm = this.doc.createComment(chars);
		    this.locator && position(this.locator,comm);
		    appendElement(this, comm);
		},

		startCDATA:function() {
		    //used in characters() methods
		    this.cdata = true;
		},
		endCDATA:function() {
		    this.cdata = false;
		},

		startDTD:function(name, publicId, systemId) {
			var impl = this.doc.implementation;
		    if (impl && impl.createDocumentType) {
		        var dt = impl.createDocumentType(name, publicId, systemId);
		        this.locator && position(this.locator,dt);
		        appendElement(this, dt);
						this.doc.doctype = dt;
		    }
		},
		/**
		 * @see org.xml.sax.ErrorHandler
		 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
		 */
		warning:function(error) {
			console.warn('[xmldom warning]\t'+error,_locator(this.locator));
		},
		error:function(error) {
			console.error('[xmldom error]\t'+error,_locator(this.locator));
		},
		fatalError:function(error) {
			throw new ParseError(error, this.locator);
		}
	};
	function _locator(l){
		if(l){
			return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
		}
	}
	function _toString(chars,start,length){
		if(typeof chars == 'string'){
			return chars.substr(start,length)
		}else {//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
			if(chars.length >= start+length || start){
				return new java.lang.String(chars,start,length)+'';
			}
			return chars;
		}
	}

	/*
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
	 * used method of org.xml.sax.ext.LexicalHandler:
	 *  #comment(chars, start, length)
	 *  #startCDATA()
	 *  #endCDATA()
	 *  #startDTD(name, publicId, systemId)
	 *
	 *
	 * IGNORED method of org.xml.sax.ext.LexicalHandler:
	 *  #endDTD()
	 *  #startEntity(name)
	 *  #endEntity(name)
	 *
	 *
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
	 * IGNORED method of org.xml.sax.ext.DeclHandler
	 * 	#attributeDecl(eName, aName, type, mode, value)
	 *  #elementDecl(name, model)
	 *  #externalEntityDecl(name, publicId, systemId)
	 *  #internalEntityDecl(name, value)
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
	 * IGNORED method of org.xml.sax.EntityResolver2
	 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
	 *  #resolveEntity(publicId, systemId)
	 *  #getExternalSubset(name, baseURI)
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
	 * IGNORED method of org.xml.sax.DTDHandler
	 *  #notationDecl(name, publicId, systemId) {};
	 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
	 */
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
		DOMHandler.prototype[key] = function(){return null};
	});

	/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
	function appendElement (hander,node) {
	    if (!hander.currentElement) {
	        hander.doc.appendChild(node);
	    } else {
	        hander.currentElement.appendChild(node);
	    }
	}//appendChild and setAttributeNS are preformance key

	var __DOMHandler = DOMHandler;
	var normalizeLineEndings_1 = normalizeLineEndings;
	var DOMParser_1 = DOMParser$2;

	var domParser = {
		__DOMHandler: __DOMHandler,
		normalizeLineEndings: normalizeLineEndings_1,
		DOMParser: DOMParser_1
	};

	var DOMImplementation = dom.DOMImplementation;
	var XMLSerializer = dom.XMLSerializer;
	var DOMParser$1 = domParser.DOMParser;

	var lib = {
		DOMImplementation: DOMImplementation,
		XMLSerializer: XMLSerializer,
		DOMParser: DOMParser$1
	};

	var {
	  DOMParser
	} = lib;
	var parse$1 = function (cdata) {
	  var attributes = {};
	  // var html = cdata.substring('<![CDATA['.length, cdata.length - ']]>'.length)

	  var descriptionDom = new DOMParser().parseFromString(cdata, 'text/html');
	  if (!descriptionDom) return attributes;
	  var descriptionDocument = descriptionDom.documentElement;
	  if (!descriptionDocument) return attributes;
	  var tds = descriptionDocument.querySelectorAll('td>table td');
	  if (!tds) return attributes;
	  for (var i = 0; i < tds.length; i += 2) {
	    var key = tds[i].textContent;
	    var value = tds[i + 1].textContent;
	    // skip empty value
	    if (!value || value === '&lt;空&gt;') {
	      continue;
	    }
	    attributes[key] = value;
	  }
	  return attributes;
	};
	var description$1 = {
	  parse: parse$1
	};

	var terraformer = createCommonjsModule(function (module, exports) {
	(function (root, factory) {

	  // Node.
	  {
	    module.exports = factory();
	  }

	  // Browser Global.
	  if(typeof window === "object") {
	    root.Terraformer = factory();
	  }

	}(commonjsGlobal, function(){

	  var exports = {},
	      EarthRadius = 6378137,
	      DegreesPerRadian = 57.295779513082320,
	      RadiansPerDegree =  0.017453292519943,
	      MercatorCRS = {
	        "type": "link",
	        "properties": {
	          "href": "http://spatialreference.org/ref/sr-org/6928/ogcwkt/",
	          "type": "ogcwkt"
	        }
	      },
	      GeographicCRS = {
	        "type": "link",
	        "properties": {
	          "href": "http://spatialreference.org/ref/epsg/4326/ogcwkt/",
	          "type": "ogcwkt"
	        }
	      };

	  /*
	  Internal: isArray function
	  */
	  function isArray(obj) {
	    return Object.prototype.toString.call(obj) === "[object Array]";
	  }

	  /*
	  Internal: safe warning
	  */
	  function warn() {
	    var args = Array.prototype.slice.apply(arguments);

	    if (typeof console !== undefined && console.warn) {
	      console.warn.apply(console, args);
	    }
	  }

	  /*
	  Internal: Extend one object with another.
	  */
	  function extend(destination, source) {
	    for (var k in source) {
	      if (source.hasOwnProperty(k)) {
	        destination[k] = source[k];
	      }
	    }
	    return destination;
	  }

	  /*
	  Public: Calculate an bounding box for a geojson object
	  */
	  function calculateBounds (geojson) {
	    if(geojson.type){
	      switch (geojson.type) {
	        case 'Point':
	          return [ geojson.coordinates[0], geojson.coordinates[1], geojson.coordinates[0], geojson.coordinates[1]];

	        case 'MultiPoint':
	          return calculateBoundsFromArray(geojson.coordinates);

	        case 'LineString':
	          return calculateBoundsFromArray(geojson.coordinates);

	        case 'MultiLineString':
	          return calculateBoundsFromNestedArrays(geojson.coordinates);

	        case 'Polygon':
	          return calculateBoundsFromNestedArrays(geojson.coordinates);

	        case 'MultiPolygon':
	          return calculateBoundsFromNestedArrayOfArrays(geojson.coordinates);

	        case 'Feature':
	          return geojson.geometry? calculateBounds(geojson.geometry) : null;

	        case 'FeatureCollection':
	          return calculateBoundsForFeatureCollection(geojson);

	        case 'GeometryCollection':
	          return calculateBoundsForGeometryCollection(geojson);

	        default:
	          throw new Error("Unknown type: " + geojson.type);
	      }
	    }
	    return null;
	  }

	  /*
	  Internal: Calculate an bounding box from an nested array of positions
	  [
	    [
	      [ [lng, lat],[lng, lat],[lng, lat] ]
	    ]
	    [
	      [lng, lat],[lng, lat],[lng, lat]
	    ]
	    [
	      [lng, lat],[lng, lat],[lng, lat]
	    ]
	  ]
	  */
	  function calculateBoundsFromNestedArrays (array) {
	    var x1 = null, x2 = null, y1 = null, y2 = null;

	    for (var i = 0; i < array.length; i++) {
	      var inner = array[i];

	      for (var j = 0; j < inner.length; j++) {
	        var lonlat = inner[j];

	        var lon = lonlat[0];
	        var lat = lonlat[1];

	        if (x1 === null) {
	          x1 = lon;
	        } else if (lon < x1) {
	          x1 = lon;
	        }

	        if (x2 === null) {
	          x2 = lon;
	        } else if (lon > x2) {
	          x2 = lon;
	        }

	        if (y1 === null) {
	          y1 = lat;
	        } else if (lat < y1) {
	          y1 = lat;
	        }

	        if (y2 === null) {
	          y2 = lat;
	        } else if (lat > y2) {
	          y2 = lat;
	        }
	      }
	    }

	    return [x1, y1, x2, y2 ];
	  }

	  /*
	  Internal: Calculate a bounding box from an array of arrays of arrays
	  [
	    [ [lng, lat],[lng, lat],[lng, lat] ]
	    [ [lng, lat],[lng, lat],[lng, lat] ]
	    [ [lng, lat],[lng, lat],[lng, lat] ]
	  ]
	  */
	  function calculateBoundsFromNestedArrayOfArrays (array) {
	    var x1 = null, x2 = null, y1 = null, y2 = null;

	    for (var i = 0; i < array.length; i++) {
	      var inner = array[i];

	      for (var j = 0; j < inner.length; j++) {
	        var innerinner = inner[j];
	        for (var k = 0; k < innerinner.length; k++) {
	          var lonlat = innerinner[k];

	          var lon = lonlat[0];
	          var lat = lonlat[1];

	          if (x1 === null) {
	            x1 = lon;
	          } else if (lon < x1) {
	            x1 = lon;
	          }

	          if (x2 === null) {
	            x2 = lon;
	          } else if (lon > x2) {
	            x2 = lon;
	          }

	          if (y1 === null) {
	            y1 = lat;
	          } else if (lat < y1) {
	            y1 = lat;
	          }

	          if (y2 === null) {
	            y2 = lat;
	          } else if (lat > y2) {
	            y2 = lat;
	          }
	        }
	      }
	    }

	    return [x1, y1, x2, y2];
	  }

	  /*
	  Internal: Calculate a bounding box from an array of positions
	  [
	    [lng, lat],[lng, lat],[lng, lat]
	  ]
	  */
	  function calculateBoundsFromArray (array) {
	    var x1 = null, x2 = null, y1 = null, y2 = null;

	    for (var i = 0; i < array.length; i++) {
	      var lonlat = array[i];
	      var lon = lonlat[0];
	      var lat = lonlat[1];

	      if (x1 === null) {
	        x1 = lon;
	      } else if (lon < x1) {
	        x1 = lon;
	      }

	      if (x2 === null) {
	        x2 = lon;
	      } else if (lon > x2) {
	        x2 = lon;
	      }

	      if (y1 === null) {
	        y1 = lat;
	      } else if (lat < y1) {
	        y1 = lat;
	      }

	      if (y2 === null) {
	        y2 = lat;
	      } else if (lat > y2) {
	        y2 = lat;
	      }
	    }

	    return [x1, y1, x2, y2 ];
	  }

	  /*
	  Internal: Calculate an bounding box for a feature collection
	  */
	  function calculateBoundsForFeatureCollection(featureCollection){
	    var extents = [], extent;
	    for (var i = featureCollection.features.length - 1; i >= 0; i--) {
	      extent = calculateBounds(featureCollection.features[i].geometry);
	      extents.push([extent[0],extent[1]]);
	      extents.push([extent[2],extent[3]]);
	    }

	    return calculateBoundsFromArray(extents);
	  }

	  /*
	  Internal: Calculate an bounding box for a geometry collection
	  */
	  function calculateBoundsForGeometryCollection(geometryCollection){
	    var extents = [], extent;

	    for (var i = geometryCollection.geometries.length - 1; i >= 0; i--) {
	      extent = calculateBounds(geometryCollection.geometries[i]);
	      extents.push([extent[0],extent[1]]);
	      extents.push([extent[2],extent[3]]);
	    }

	    return calculateBoundsFromArray(extents);
	  }

	  function calculateEnvelope(geojson){
	    var bounds = calculateBounds(geojson);
	    return {
	      x: bounds[0],
	      y: bounds[1],
	      w: Math.abs(bounds[0] - bounds[2]),
	      h: Math.abs(bounds[1] - bounds[3])
	    };
	  }

	  /*
	  Internal: Convert radians to degrees. Used by spatial reference converters.
	  */
	  function radToDeg(rad) {
	    return rad * DegreesPerRadian;
	  }

	  /*
	  Internal: Convert degrees to radians. Used by spatial reference converters.
	  */
	  function degToRad(deg) {
	    return deg * RadiansPerDegree;
	  }

	  /*
	  Internal: Loop over each array in a geojson object and apply a function to it. Used by spatial reference converters.
	  */
	  function eachPosition(coordinates, func) {
	    for (var i = 0; i < coordinates.length; i++) {
	      // we found a number so lets convert this pair
	      if(typeof coordinates[i][0] === "number"){
	        coordinates[i] = func(coordinates[i]);
	      }
	      // we found an coordinates array it again and run THIS function against it
	      if(typeof coordinates[i] === "object"){
	        coordinates[i] = eachPosition(coordinates[i], func);
	      }
	    }
	    return coordinates;
	  }

	  /*
	  Public: Convert a GeoJSON Position object to Geographic (4326)
	  */
	  function positionToGeographic(position) {
	    var x = position[0];
	    var y = position[1];
	    return [radToDeg(x / EarthRadius) - (Math.floor((radToDeg(x / EarthRadius) + 180) / 360) * 360), radToDeg((Math.PI / 2) - (2 * Math.atan(Math.exp(-1.0 * y / EarthRadius))))];
	  }

	  /*
	  Public: Convert a GeoJSON Position object to Web Mercator (102100)
	  */
	  function positionToMercator(position) {
	    var lng = position[0];
	    var lat = Math.max(Math.min(position[1], 89.99999), -89.99999);
	    return [degToRad(lng) * EarthRadius, EarthRadius/2.0 * Math.log( (1.0 + Math.sin(degToRad(lat))) / (1.0 - Math.sin(degToRad(lat))) )];
	  }

	  /*
	  Public: Apply a function agaist all positions in a geojson object. Used by spatial reference converters.
	  */
	  function applyConverter(geojson, converter, noCrs){
	    if(geojson.type === "Point") {
	      geojson.coordinates = converter(geojson.coordinates);
	    } else if(geojson.type === "Feature") {
	      geojson.geometry = applyConverter(geojson.geometry, converter, true);
	    } else if(geojson.type === "FeatureCollection") {
	      for (var f = 0; f < geojson.features.length; f++) {
	        geojson.features[f] = applyConverter(geojson.features[f], converter, true);
	      }
	    } else if(geojson.type === "GeometryCollection") {
	      for (var g = 0; g < geojson.geometries.length; g++) {
	        geojson.geometries[g] = applyConverter(geojson.geometries[g], converter, true);
	      }
	    } else {
	      geojson.coordinates = eachPosition(geojson.coordinates, converter);
	    }

	    if(!noCrs){
	      if(converter === positionToMercator){
	        geojson.crs = MercatorCRS;
	      }
	    }

	    if(converter === positionToGeographic){
	      delete geojson.crs;
	    }

	    return geojson;
	  }

	  /*
	  Public: Convert a GeoJSON object to ESRI Web Mercator (102100)
	  */
	  function toMercator(geojson) {
	    return applyConverter(geojson, positionToMercator);
	  }

	  /*
	  Convert a GeoJSON object to Geographic coordinates (WSG84, 4326)
	  */
	  function toGeographic(geojson) {
	    return applyConverter(geojson, positionToGeographic);
	  }


	  /*
	  Internal: -1,0,1 comparison function
	  */
	  function cmp(a, b) {
	    if(a < b) {
	      return -1;
	    } else if(a > b) {
	      return 1;
	    } else {
	      return 0;
	    }
	  }

	  /*
	  Internal: used for sorting
	  */
	  function compSort(p1, p2) {
	    if (p1[0] > p2[0]) {
	      return -1;
	    } else if (p1[0] < p2[0]) {
	      return 1;
	    } else if (p1[1] > p2[1]) {
	      return -1;
	    } else if (p1[1] < p2[1]) {
	      return 1;
	    } else {
	      return 0;
	    }
	  }


	  /*
	  Internal: used to determine turn
	  */
	  function turn(p, q, r) {
	    // Returns -1, 0, 1 if p,q,r forms a right, straight, or left turn.
	    return cmp((q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1]), 0);
	  }

	  /*
	  Internal: used to determine euclidean distance between two points
	  */
	  function euclideanDistance(p, q) {
	    // Returns the squared Euclidean distance between p and q.
	    var dx = q[0] - p[0];
	    var dy = q[1] - p[1];

	    return dx * dx + dy * dy;
	  }

	  function nextHullPoint(points, p) {
	    // Returns the next point on the convex hull in CCW from p.
	    var q = p;
	    for(var r in points) {
	      var t = turn(p, q, points[r]);
	      if(t === -1 || t === 0 && euclideanDistance(p, points[r]) > euclideanDistance(p, q)) {
	        q = points[r];
	      }
	    }
	    return q;
	  }

	  function convexHull(points) {
	    // implementation of the Jarvis March algorithm
	    // adapted from http://tixxit.wordpress.com/2009/12/09/jarvis-march/

	    if(points.length === 0) {
	      return [];
	    } else if(points.length === 1) {
	      return points;
	    }

	    // Returns the points on the convex hull of points in CCW order.
	    var hull = [points.sort(compSort)[0]];

	    for(var p = 0; p < hull.length; p++) {
	      var q = nextHullPoint(points, hull[p]);

	      if(q !== hull[0]) {
	        hull.push(q);
	      }
	    }

	    return hull;
	  }

	  function isConvex(points) {
	    var ltz;

	    for (var i = 0; i < points.length - 3; i++) {
	      var p1 = points[i];
	      var p2 = points[i + 1];
	      var p3 = points[i + 2];
	      var v = [p2[0] - p1[0], p2[1] - p1[1]];

	      // p3.x * v.y - p3.y * v.x + v.x * p1.y - v.y * p1.x
	      var res = p3[0] * v[1] - p3[1] * v[0] + v[0] * p1[1] - v[1] * p1[0];

	      if (i === 0) {
	        if (res < 0) {
	          ltz = true;
	        } else {
	          ltz = false;
	        }
	      } else {
	        if (ltz && (res > 0) || !ltz && (res < 0)) {
	          return false;
	        }
	      }
	    }

	    return true;
	  }

	  function coordinatesContainPoint(coordinates, point) {
	    var contains = false;
	    for(var i = -1, l = coordinates.length, j = l - 1; ++i < l; j = i) {
	      if (((coordinates[i][1] <= point[1] && point[1] < coordinates[j][1]) ||
	           (coordinates[j][1] <= point[1] && point[1] < coordinates[i][1])) &&
	          (point[0] < (coordinates[j][0] - coordinates[i][0]) * (point[1] - coordinates[i][1]) / (coordinates[j][1] - coordinates[i][1]) + coordinates[i][0])) {
	        contains = !contains;
	      }
	    }
	    return contains;
	  }

	  function polygonContainsPoint(polygon, point) {
	    if (polygon && polygon.length) {
	      if (polygon.length === 1) { // polygon with no holes
	        return coordinatesContainPoint(polygon[0], point);
	      } else { // polygon with holes
	        if (coordinatesContainPoint(polygon[0], point)) {
	          for (var i = 1; i < polygon.length; i++) {
	            if (coordinatesContainPoint(polygon[i], point)) {
	              return false; // found in hole
	            }
	          }

	          return true;
	        } else {
	          return false;
	        }
	      }
	    } else {
	      return false;
	    }
	  }

	  function edgeIntersectsEdge(a1, a2, b1, b2) {
	    var ua_t = (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
	    var ub_t = (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
	    var u_b  = (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);

	    if ( u_b !== 0 ) {
	      var ua = ua_t / u_b;
	      var ub = ub_t / u_b;

	      if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
	        return true;
	      }
	    }

	    return false;
	  }

	  function isNumber(n) {
	    return !isNaN(parseFloat(n)) && isFinite(n);
	  }

	  function arraysIntersectArrays(a, b) {
	    if (isNumber(a[0][0])) {
	      if (isNumber(b[0][0])) {
	        for (var i = 0; i < a.length - 1; i++) {
	          for (var j = 0; j < b.length - 1; j++) {
	            if (edgeIntersectsEdge(a[i], a[i + 1], b[j], b[j + 1])) {
	              return true;
	            }
	          }
	        }
	      } else {
	        for (var k = 0; k < b.length; k++) {
	          if (arraysIntersectArrays(a, b[k])) {
	            return true;
	          }
	        }
	      }
	    } else {
	      for (var l = 0; l < a.length; l++) {
	        if (arraysIntersectArrays(a[l], b)) {
	          return true;
	        }
	      }
	    }
	    return false;
	  }

	  /*
	  Internal: Returns a copy of coordinates for s closed polygon
	  */
	  function closedPolygon(coordinates) {
	    var outer = [ ];

	    for (var i = 0; i < coordinates.length; i++) {
	      var inner = coordinates[i].slice();
	      if (pointsEqual(inner[0], inner[inner.length - 1]) === false) {
	        inner.push(inner[0]);
	      }

	      outer.push(inner);
	    }

	    return outer;
	  }

	  function pointsEqual(a, b) {
	    for (var i = 0; i < a.length; i++) {

	      if (a[i] !== b[i]) {
	        return false;
	      }
	    }

	    return true;
	  }

	  function coordinatesEqual(a, b) {
	    if (a.length !== b.length) {
	      return false;
	    }

	    var na = a.slice().sort(compSort);
	    var nb = b.slice().sort(compSort);

	    for (var i = 0; i < na.length; i++) {
	      if (na[i].length !== nb[i].length) {
	        return false;
	      }
	      for (var j = 0; j < na.length; j++) {
	        if (na[i][j] !== nb[i][j]) {
	          return false;
	        }
	      }
	    }

	    return true;
	  }

	  /*
	  Internal: An array of variables that will be excluded form JSON objects.
	  */
	  var excludeFromJSON = ["length"];

	  /*
	  Internal: Base GeoJSON Primitive
	  */
	  function Primitive(geojson){
	    if(geojson){
	      switch (geojson.type) {
	      case 'Point':
	        return new Point(geojson);

	      case 'MultiPoint':
	        return new MultiPoint(geojson);

	      case 'LineString':
	        return new LineString(geojson);

	      case 'MultiLineString':
	        return new MultiLineString(geojson);

	      case 'Polygon':
	        return new Polygon(geojson);

	      case 'MultiPolygon':
	        return new MultiPolygon(geojson);

	      case 'Feature':
	        return new Feature(geojson);

	      case 'FeatureCollection':
	        return new FeatureCollection(geojson);

	      case 'GeometryCollection':
	        return new GeometryCollection(geojson);

	      default:
	        throw new Error("Unknown type: " + geojson.type);
	      }
	    }
	  }

	  Primitive.prototype.toMercator = function(){
	    return toMercator(this);
	  };

	  Primitive.prototype.toGeographic = function(){
	    return toGeographic(this);
	  };

	  Primitive.prototype.envelope = function(){
	    return calculateEnvelope(this);
	  };

	  Primitive.prototype.bbox = function(){
	    return calculateBounds(this);
	  };

	  Primitive.prototype.convexHull = function(){
	    var coordinates = [ ], i, j;
	    if (this.type === 'Point') {
	      return null;
	    } else if (this.type === 'LineString' || this.type === 'MultiPoint') {
	      if (this.coordinates && this.coordinates.length >= 3) {
	        coordinates = this.coordinates;
	      } else {
	        return null;
	      }
	    } else if (this.type === 'Polygon' || this.type === 'MultiLineString') {
	      if (this.coordinates && this.coordinates.length > 0) {
	        for (i = 0; i < this.coordinates.length; i++) {
	          coordinates = coordinates.concat(this.coordinates[i]);
	        }
	        if(coordinates.length < 3){
	          return null;
	        }
	      } else {
	        return null;
	      }
	    } else if (this.type === 'MultiPolygon') {
	      if (this.coordinates && this.coordinates.length > 0) {
	        for (i = 0; i < this.coordinates.length; i++) {
	          for (j = 0; j < this.coordinates[i].length; j++) {
	            coordinates = coordinates.concat(this.coordinates[i][j]);
	          }
	        }
	        if(coordinates.length < 3){
	          return null;
	        }
	      } else {
	        return null;
	      }
	    } else if(this.type === "Feature"){
	      var primitive = new Primitive(this.geometry);
	      return primitive.convexHull();
	    }

	    return new Polygon({
	      type: 'Polygon',
	      coordinates: closedPolygon([convexHull(coordinates)])
	    });
	  };

	  Primitive.prototype.toJSON = function(){
	    var obj = {};
	    for (var key in this) {
	      if (this.hasOwnProperty(key) && excludeFromJSON.indexOf(key) === -1) {
	        obj[key] = this[key];
	      }
	    }
	    obj.bbox = calculateBounds(this);
	    return obj;
	  };

	  Primitive.prototype.contains = function(primitive){
	    return new Primitive(primitive).within(this);
	  };

	  Primitive.prototype.within = function(primitive) {
	    var coordinates, i, j, contains;

	    // if we are passed a feature, use the polygon inside instead
	    if (primitive.type === 'Feature') {
	      primitive = primitive.geometry;
	    }

	    // point.within(point) :: equality
	    if (primitive.type === "Point") {
	      if (this.type === "Point") {
	        return pointsEqual(this.coordinates, primitive.coordinates);

	      }
	    }

	    // point.within(multilinestring)
	    if (primitive.type === "MultiLineString") {
	      if (this.type === "Point") {
	        for (i = 0; i < primitive.coordinates.length; i++) {
	          var linestring = { type: "LineString", coordinates: primitive.coordinates[i] };

	          if (this.within(linestring)) {
	            return true;
	          }
	        }
	      }
	    }

	    // point.within(linestring), point.within(multipoint)
	    if (primitive.type === "LineString" || primitive.type === "MultiPoint") {
	      if (this.type === "Point") {
	        for (i = 0; i < primitive.coordinates.length; i++) {
	          if (this.coordinates.length !== primitive.coordinates[i].length) {
	            return false;
	          }

	          if (pointsEqual(this.coordinates, primitive.coordinates[i])) {
	            return true;
	          }
	        }
	      }
	    }

	    if (primitive.type === "Polygon") {
	      // polygon.within(polygon)
	      if (this.type === "Polygon") {
	        // check for equal polygons
	        if (primitive.coordinates.length === this.coordinates.length) {
	          for (i = 0; i < this.coordinates.length; i++) {
	            if (coordinatesEqual(this.coordinates[i], primitive.coordinates[i])) {
	              return true;
	            }
	          }
	        }

	        if (this.coordinates.length && polygonContainsPoint(primitive.coordinates, this.coordinates[0][0])) {
	          return !arraysIntersectArrays(closedPolygon(this.coordinates), closedPolygon(primitive.coordinates));
	        } else {
	          return false;
	        }

	      // point.within(polygon)
	      } else if (this.type === "Point") {
	        return polygonContainsPoint(primitive.coordinates, this.coordinates);

	      // linestring/multipoint withing polygon
	      } else if (this.type === "LineString" || this.type === "MultiPoint") {
	        if (!this.coordinates || this.coordinates.length === 0) {
	          return false;
	        }

	        for (i = 0; i < this.coordinates.length; i++) {
	          if (polygonContainsPoint(primitive.coordinates, this.coordinates[i]) === false) {
	            return false;
	          }
	        }

	        return true;

	      // multilinestring.within(polygon)
	      } else if (this.type === "MultiLineString") {
	        for (i = 0; i < this.coordinates.length; i++) {
	          var ls = new LineString(this.coordinates[i]);

	          if (ls.within(primitive) === false) {
	            contains++;
	            return false;
	          }
	        }

	        return true;

	      // multipolygon.within(polygon)
	      } else if (this.type === "MultiPolygon") {
	        for (i = 0; i < this.coordinates.length; i++) {
	          var p1 = new Primitive({ type: "Polygon", coordinates: this.coordinates[i] });

	          if (p1.within(primitive) === false) {
	            return false;
	          }
	        }

	        return true;
	      }

	    }

	    if (primitive.type === "MultiPolygon") {
	      // point.within(multipolygon)
	      if (this.type === "Point") {
	        if (primitive.coordinates.length) {
	          for (i = 0; i < primitive.coordinates.length; i++) {
	            coordinates = primitive.coordinates[i];
	            if (polygonContainsPoint(coordinates, this.coordinates) && arraysIntersectArrays([this.coordinates], primitive.coordinates) === false) {
	              return true;
	            }
	          }
	        }

	        return false;
	      // polygon.within(multipolygon)
	      } else if (this.type === "Polygon") {
	        for (i = 0; i < this.coordinates.length; i++) {
	          if (primitive.coordinates[i].length === this.coordinates.length) {
	            for (j = 0; j < this.coordinates.length; j++) {
	              if (coordinatesEqual(this.coordinates[j], primitive.coordinates[i][j])) {
	                return true;
	              }
	            }
	          }
	        }

	        if (arraysIntersectArrays(this.coordinates, primitive.coordinates) === false) {
	          if (primitive.coordinates.length) {
	            for (i = 0; i < primitive.coordinates.length; i++) {
	              coordinates = primitive.coordinates[i];
	              if (polygonContainsPoint(coordinates, this.coordinates[0][0]) === false) {
	                contains = false;
	              } else {
	                contains = true;
	              }
	            }

	            return contains;
	          }
	        }

	      // linestring.within(multipolygon), multipoint.within(multipolygon)
	      } else if (this.type === "LineString" || this.type === "MultiPoint") {
	        for (i = 0; i < primitive.coordinates.length; i++) {
	          var p = { type: "Polygon", coordinates: primitive.coordinates[i] };

	          if (this.within(p)) {
	            return true;
	          }

	          return false;
	        }

	      // multilinestring.within(multipolygon)
	      } else if (this.type === "MultiLineString") {
	        for (i = 0; i < this.coordinates.length; i++) {
	          var lines = new LineString(this.coordinates[i]);

	          if (lines.within(primitive) === false) {
	            return false;
	          }
	        }

	        return true;

	      // multipolygon.within(multipolygon)
	      } else if (this.type === "MultiPolygon") {
	        for (i = 0; i < primitive.coordinates.length; i++) {
	          var mpoly = { type: "Polygon", coordinates: primitive.coordinates[i] };

	          if (this.within(mpoly) === false) {
	            return false;
	          }
	        }

	        return true;
	      }
	    }

	    // default to false
	    return false;
	  };

	  Primitive.prototype.intersects = function(primitive) {
	    // if we are passed a feature, use the polygon inside instead
	    if (primitive.type === 'Feature') {
	      primitive = primitive.geometry;
	    }

	    var p = new Primitive(primitive);
	    if (this.within(primitive) || p.within(this)) {
	      return true;
	    }


	    if (this.type !== 'Point' && this.type !== 'MultiPoint' &&
	        primitive.type !== 'Point' && primitive.type !== 'MultiPoint') {
	      return arraysIntersectArrays(this.coordinates, primitive.coordinates);
	    } else if (this.type === 'Feature') {
	      // in the case of a Feature, use the internal primitive for intersection
	      var inner = new Primitive(this.geometry);
	      return inner.intersects(primitive);
	    }

	    warn("Type " + this.type + " to " + primitive.type + " intersection is not supported by intersects");
	    return false;
	  };


	  /*
	  GeoJSON Point Class
	    new Point();
	    new Point(x,y,z,wtf);
	    new Point([x,y,z,wtf]);
	    new Point([x,y]);
	    new Point({
	      type: "Point",
	      coordinates: [x,y]
	    });
	  */
	  function Point(input){
	    var args = Array.prototype.slice.call(arguments);

	    if(input && input.type === "Point" && input.coordinates){
	      extend(this, input);
	    } else if(input && isArray(input)) {
	      this.coordinates = input;
	    } else if(args.length >= 2) {
	      this.coordinates = args;
	    } else {
	      throw "Terraformer: invalid input for Terraformer.Point";
	    }

	    this.type = "Point";
	  }

	  Point.prototype = new Primitive();
	  Point.prototype.constructor = Point;

	  /*
	  GeoJSON MultiPoint Class
	      new MultiPoint();
	      new MultiPoint([[x,y], [x1,y1]]);
	      new MultiPoint({
	        type: "MultiPoint",
	        coordinates: [x,y]
	      });
	  */
	  function MultiPoint(input){
	    if(input && input.type === "MultiPoint" && input.coordinates){
	      extend(this, input);
	    } else if(isArray(input)) {
	      this.coordinates = input;
	    } else {
	      throw "Terraformer: invalid input for Terraformer.MultiPoint";
	    }

	    this.type = "MultiPoint";
	  }

	  MultiPoint.prototype = new Primitive();
	  MultiPoint.prototype.constructor = MultiPoint;
	  MultiPoint.prototype.forEach = function(func){
	    for (var i = 0; i < this.coordinates.length; i++) {
	      func.apply(this, [this.coordinates[i], i, this.coordinates]);
	    }
	    return this;
	  };
	  MultiPoint.prototype.addPoint = function(point){
	    this.coordinates.push(point);
	    return this;
	  };
	  MultiPoint.prototype.insertPoint = function(point, index){
	    this.coordinates.splice(index, 0, point);
	    return this;
	  };
	  MultiPoint.prototype.removePoint = function(remove){
	    if(typeof remove === "number"){
	      this.coordinates.splice(remove, 1);
	    } else {
	      this.coordinates.splice(this.coordinates.indexOf(remove), 1);
	    }
	    return this;
	  };
	  MultiPoint.prototype.get = function(i){
	    return new Point(this.coordinates[i]);
	  };

	  /*
	  GeoJSON LineString Class
	      new LineString();
	      new LineString([[x,y], [x1,y1]]);
	      new LineString({
	        type: "LineString",
	        coordinates: [x,y]
	      });
	  */
	  function LineString(input){
	    if(input && input.type === "LineString" && input.coordinates){
	      extend(this, input);
	    } else if(isArray(input)) {
	      this.coordinates = input;
	    } else {
	      throw "Terraformer: invalid input for Terraformer.LineString";
	    }

	    this.type = "LineString";
	  }

	  LineString.prototype = new Primitive();
	  LineString.prototype.constructor = LineString;
	  LineString.prototype.addVertex = function(point){
	    this.coordinates.push(point);
	    return this;
	  };
	  LineString.prototype.insertVertex = function(point, index){
	    this.coordinates.splice(index, 0, point);
	    return this;
	  };
	  LineString.prototype.removeVertex = function(remove){
	    this.coordinates.splice(remove, 1);
	    return this;
	  };

	  /*
	  GeoJSON MultiLineString Class
	      new MultiLineString();
	      new MultiLineString([ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ]);
	      new MultiLineString({
	        type: "MultiLineString",
	        coordinates: [ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ]
	      });
	  */
	  function MultiLineString(input){
	    if(input && input.type === "MultiLineString" && input.coordinates){
	      extend(this, input);
	    } else if(isArray(input)) {
	      this.coordinates = input;
	    } else {
	      throw "Terraformer: invalid input for Terraformer.MultiLineString";
	    }

	    this.type = "MultiLineString";
	  }

	  MultiLineString.prototype = new Primitive();
	  MultiLineString.prototype.constructor = MultiLineString;
	  MultiLineString.prototype.forEach = function(func){
	    for (var i = 0; i < this.coordinates.length; i++) {
	      func.apply(this, [this.coordinates[i], i, this.coordinates ]);
	    }
	  };
	  MultiLineString.prototype.get = function(i){
	    return new LineString(this.coordinates[i]);
	  };

	  /*
	  GeoJSON Polygon Class
	      new Polygon();
	      new Polygon([ [[x,y], [x1,y1], [x2,y2]] ]);
	      new Polygon({
	        type: "Polygon",
	        coordinates: [ [[x,y], [x1,y1], [x2,y2]] ]
	      });
	  */
	  function Polygon(input){
	    if(input && input.type === "Polygon" && input.coordinates){
	      extend(this, input);
	    } else if(isArray(input)) {
	      this.coordinates = input;
	    } else {
	      throw "Terraformer: invalid input for Terraformer.Polygon";
	    }

	    this.type = "Polygon";
	  }

	  Polygon.prototype = new Primitive();
	  Polygon.prototype.constructor = Polygon;
	  Polygon.prototype.addVertex = function(point){
	    this.insertVertex(point, this.coordinates[0].length - 1);
	    return this;
	  };
	  Polygon.prototype.insertVertex = function(point, index){
	    this.coordinates[0].splice(index, 0, point);
	    return this;
	  };
	  Polygon.prototype.removeVertex = function(remove){
	    this.coordinates[0].splice(remove, 1);
	    return this;
	  };
	  Polygon.prototype.close = function() {
	    this.coordinates = closedPolygon(this.coordinates);
	  };
	  Polygon.prototype.hasHoles = function() {
	    return this.coordinates.length > 1;
	  };
	  Polygon.prototype.holes = function() {
	    var holes = [];
	    if (this.hasHoles()) {
	      for (var i = 1; i < this.coordinates.length; i++) {
	        holes.push(new Polygon([this.coordinates[i]]));
	      }
	    }
	    return holes;
	  };

	  /*
	  GeoJSON MultiPolygon Class
	      new MultiPolygon();
	      new MultiPolygon([ [ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ] ]);
	      new MultiPolygon({
	        type: "MultiPolygon",
	        coordinates: [ [ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ] ]
	      });
	  */
	  function MultiPolygon(input){
	    if(input && input.type === "MultiPolygon" && input.coordinates){
	      extend(this, input);
	    } else if(isArray(input)) {
	      this.coordinates = input;
	    } else {
	      throw "Terraformer: invalid input for Terraformer.MultiPolygon";
	    }

	    this.type = "MultiPolygon";
	  }

	  MultiPolygon.prototype = new Primitive();
	  MultiPolygon.prototype.constructor = MultiPolygon;
	  MultiPolygon.prototype.forEach = function(func){
	    for (var i = 0; i < this.coordinates.length; i++) {
	      func.apply(this, [this.coordinates[i], i, this.coordinates ]);
	    }
	  };
	  MultiPolygon.prototype.get = function(i){
	    return new Polygon(this.coordinates[i]);
	  };
	  MultiPolygon.prototype.close = function(){
	    var outer = [];
	    this.forEach(function(polygon){
	      outer.push(closedPolygon(polygon));
	    });
	    this.coordinates = outer;
	    return this;
	  };

	  /*
	  GeoJSON Feature Class
	      new Feature();
	      new Feature({
	        type: "Feature",
	        geometry: {
	          type: "Polygon",
	          coordinates: [ [ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ] ]
	        }
	      });
	      new Feature({
	        type: "Polygon",
	        coordinates: [ [ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ] ]
	      });
	  */
	  function Feature(input){
	    if(input && input.type === "Feature"){
	      extend(this, input);
	    } else if(input && input.type && input.coordinates) {
	      this.geometry = input;
	    } else {
	      throw "Terraformer: invalid input for Terraformer.Feature";
	    }

	    this.type = "Feature";
	  }

	  Feature.prototype = new Primitive();
	  Feature.prototype.constructor = Feature;

	  /*
	  GeoJSON FeatureCollection Class
	      new FeatureCollection();
	      new FeatureCollection([feature, feature1]);
	      new FeatureCollection({
	        type: "FeatureCollection",
	        coordinates: [feature, feature1]
	      });
	  */
	  function FeatureCollection(input){
	    if(input && input.type === "FeatureCollection" && input.features){
	      extend(this, input);
	    } else if(isArray(input)) {
	      this.features = input;
	    } else {
	      throw "Terraformer: invalid input for Terraformer.FeatureCollection";
	    }

	    this.type = "FeatureCollection";
	  }

	  FeatureCollection.prototype = new Primitive();
	  FeatureCollection.prototype.constructor = FeatureCollection;
	  FeatureCollection.prototype.forEach = function(func){
	    for (var i = 0; i < this.features.length; i++) {
	      func.apply(this, [this.features[i], i, this.features]);
	    }
	  };
	  FeatureCollection.prototype.get = function(id){
	    var found;
	    this.forEach(function(feature){
	      if(feature.id === id){
	        found = feature;
	      }
	    });
	    return new Feature(found);
	  };

	  /*
	  GeoJSON GeometryCollection Class
	      new GeometryCollection();
	      new GeometryCollection([geometry, geometry1]);
	      new GeometryCollection({
	        type: "GeometryCollection",
	        coordinates: [geometry, geometry1]
	      });
	  */
	  function GeometryCollection(input){
	    if(input && input.type === "GeometryCollection" && input.geometries){
	      extend(this, input);
	    } else if(isArray(input)) {
	      this.geometries = input;
	    } else if(input.coordinates && input.type){
	      this.type = "GeometryCollection";
	      this.geometries = [input];
	    } else {
	      throw "Terraformer: invalid input for Terraformer.GeometryCollection";
	    }

	    this.type = "GeometryCollection";
	  }

	  GeometryCollection.prototype = new Primitive();
	  GeometryCollection.prototype.constructor = GeometryCollection;
	  GeometryCollection.prototype.forEach = function(func){
	    for (var i = 0; i < this.geometries.length; i++) {
	      func.apply(this, [this.geometries[i], i, this.geometries]);
	    }
	  };
	  GeometryCollection.prototype.get = function(i){
	    return new Primitive(this.geometries[i]);
	  };

	  function createCircle(center, radius, interpolate){
	    var mercatorPosition = positionToMercator(center);
	    var steps = interpolate || 64;
	    var polygon = {
	      type: "Polygon",
	      coordinates: [[]]
	    };
	    for(var i=1; i<=steps; i++) {
	      var radians = i * (360/steps) * Math.PI / 180;
	      polygon.coordinates[0].push([mercatorPosition[0] + radius * Math.cos(radians), mercatorPosition[1] + radius * Math.sin(radians)]);
	    }
	    polygon.coordinates = closedPolygon(polygon.coordinates);

	    return toGeographic(polygon);
	  }

	  function Circle (center, radius, interpolate) {
	    var steps = interpolate || 64;
	    var rad = radius || 250;

	    if(!center || center.length < 2 || !rad || !steps) {
	      throw new Error("Terraformer: missing parameter for Terraformer.Circle");
	    }

	    extend(this, new Feature({
	      type: "Feature",
	      geometry: createCircle(center, rad, steps),
	      properties: {
	        radius: rad,
	        center: center,
	        steps: steps
	      }
	    }));
	  }

	  Circle.prototype = new Primitive();
	  Circle.prototype.constructor = Circle;
	  Circle.prototype.recalculate = function(){
	    this.geometry = createCircle(this.properties.center, this.properties.radius, this.properties.steps);
	    return this;
	  };
	  Circle.prototype.center = function(coordinates){
	    if(coordinates){
	      this.properties.center = coordinates;
	      this.recalculate();
	    }
	    return this.properties.center;
	  };
	  Circle.prototype.radius = function(radius){
	    if(radius){
	      this.properties.radius = radius;
	      this.recalculate();
	    }
	    return this.properties.radius;
	  };
	  Circle.prototype.steps = function(steps){
	    if(steps){
	      this.properties.steps = steps;
	      this.recalculate();
	    }
	    return this.properties.steps;
	  };

	  Circle.prototype.toJSON = function() {
	    var output = Primitive.prototype.toJSON.call(this);
	    return output;
	  };

	  exports.Primitive = Primitive;
	  exports.Point = Point;
	  exports.MultiPoint = MultiPoint;
	  exports.LineString = LineString;
	  exports.MultiLineString = MultiLineString;
	  exports.Polygon = Polygon;
	  exports.MultiPolygon = MultiPolygon;
	  exports.Feature = Feature;
	  exports.FeatureCollection = FeatureCollection;
	  exports.GeometryCollection = GeometryCollection;
	  exports.Circle = Circle;

	  exports.toMercator = toMercator;
	  exports.toGeographic = toGeographic;

	  exports.Tools = {};
	  exports.Tools.positionToMercator = positionToMercator;
	  exports.Tools.positionToGeographic = positionToGeographic;
	  exports.Tools.applyConverter = applyConverter;
	  exports.Tools.toMercator = toMercator;
	  exports.Tools.toGeographic = toGeographic;
	  exports.Tools.createCircle = createCircle;

	  exports.Tools.calculateBounds = calculateBounds;
	  exports.Tools.calculateEnvelope = calculateEnvelope;

	  exports.Tools.coordinatesContainPoint = coordinatesContainPoint;
	  exports.Tools.polygonContainsPoint = polygonContainsPoint;
	  exports.Tools.arraysIntersectArrays = arraysIntersectArrays;
	  exports.Tools.coordinatesContainPoint = coordinatesContainPoint;
	  exports.Tools.coordinatesEqual = coordinatesEqual;
	  exports.Tools.convexHull = convexHull;
	  exports.Tools.isConvex = isConvex;

	  exports.MercatorCRS = MercatorCRS;
	  exports.GeographicCRS = GeographicCRS;

	  return exports;
	}));
	});

	var terraformerArcgisParser = createCommonjsModule(function (module, exports) {
	/* globals Terraformer */
	(function (root, factory) {

	  // Node.
	  {
	    module.exports = factory(terraformer);
	  }

	  // Browser Global.
	  if(typeof root.navigator === "object") {
	    if (!root.Terraformer){
	      throw new Error("Terraformer.ArcGIS requires the core Terraformer library. https://github.com/esri/Terraformer");
	    }
	    root.Terraformer.ArcGIS = factory(root.Terraformer);
	  }

	}(commonjsGlobal, function(Terraformer) {
	  var exports = {};

	  // https://github.com/Esri/terraformer-arcgis-parser/issues/10
	  function decompressGeometry(str) {
	    var xDiffPrev = 0;
	    var yDiffPrev = 0;
	    var points = [];
	    var x, y;
	    var strings;
	    var coefficient;

	    // Split the string into an array on the + and - characters
	    strings = str.match(/((\+|\-)[^\+\-]+)/g);

	    // The first value is the coefficient in base 32
	    coefficient = parseInt(strings[0], 32);

	    for (var j = 1; j < strings.length; j += 2) {
	      // j is the offset for the x value
	      // Convert the value from base 32 and add the previous x value
	      x = (parseInt(strings[j], 32) + xDiffPrev);
	      xDiffPrev = x;

	      // j+1 is the offset for the y value
	      // Convert the value from base 32 and add the previous y value
	      y = (parseInt(strings[j + 1], 32) + yDiffPrev);
	      yDiffPrev = y;

	      points.push([x / coefficient, y / coefficient]);
	    }

	    return points;
	  }

	  // checks if the first and last points of a ring are equal and closes the ring
	  function closeRing(coordinates) {
	    if (!pointsEqual(coordinates[0], coordinates[coordinates.length - 1])) {
	      coordinates.push(coordinates[0]);
	    }
	    return coordinates;
	  }

	  // checks if 2 x,y points are equal
	  function pointsEqual(a, b) {
	    for (var i = 0; i < a.length; i++) {
	      if (a[i] !== b[i]) {
	        return false;
	      }
	    }
	    return true;
	  }

	  // shallow object clone for feature properties and attributes
	  // from http://jsperf.com/cloning-an-object/2
	  function clone(obj) {
	    var target = {};
	    for (var i in obj) {
	      if (obj.hasOwnProperty(i)) {
	        target[i] = obj[i];
	      }
	    }
	    return target;
	  }

	  // determine if polygon ring coordinates are clockwise. clockwise signifies outer ring, counter-clockwise an inner ring
	  // or hole. this logic was found at http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-
	  // points-are-in-clockwise-order
	  function ringIsClockwise(ringToTest) {
	    var total = 0,i = 0;
	    var rLength = ringToTest.length;
	    var pt1 = ringToTest[i];
	    var pt2;
	    for (i; i < rLength - 1; i++) {
	      pt2 = ringToTest[i + 1];
	      total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1]);
	      pt1 = pt2;
	    }
	    return (total >= 0);
	  }

	  // This function ensures that rings are oriented in the right directions
	  // outer rings are clockwise, holes are counterclockwise
	  function orientRings(poly){
	    var output = [];
	    var polygon = poly.slice(0);
	    var outerRing = closeRing(polygon.shift().slice(0));
	    if(outerRing.length >= 4){
	      if(!ringIsClockwise(outerRing)){
	        outerRing.reverse();
	      }

	      output.push(outerRing);

	      for (var i = 0; i < polygon.length; i++) {
	        var hole = closeRing(polygon[i].slice(0));
	        if(hole.length >= 4){
	          if(ringIsClockwise(hole)){
	            hole.reverse();
	          }
	          output.push(hole);
	        }
	      }
	    }

	    return output;
	  }

	  // This function flattens holes in multipolygons to one array of polygons
	  // [
	  //   [
	  //     [ array of outer coordinates ]
	  //     [ hole coordinates ]
	  //     [ hole coordinates ]
	  //   ],
	  //   [
	  //     [ array of outer coordinates ]
	  //     [ hole coordinates ]
	  //     [ hole coordinates ]
	  //   ],
	  // ]
	  // becomes
	  // [
	  //   [ array of outer coordinates ]
	  //   [ hole coordinates ]
	  //   [ hole coordinates ]
	  //   [ array of outer coordinates ]
	  //   [ hole coordinates ]
	  //   [ hole coordinates ]
	  // ]
	  function flattenMultiPolygonRings(rings){
	    var output = [];
	    for (var i = 0; i < rings.length; i++) {
	      var polygon = orientRings(rings[i]);
	      for (var x = polygon.length - 1; x >= 0; x--) {
	        var ring = polygon[x].slice(0);
	        output.push(ring);
	      }
	    }
	    return output;
	  }

	  function coordinatesContainCoordinates(outer, inner){
	    var intersects = Terraformer.Tools.arraysIntersectArrays(outer, inner);
	    var contains = Terraformer.Tools.coordinatesContainPoint(outer, inner[0]);
	    if(!intersects && contains){
	      return true;
	    }
	    return false;
	  }

	  // do any polygons in this array contain any other polygons in this array?
	  // used for checking for holes in arcgis rings
	  function convertRingsToGeoJSON(rings){
	    var outerRings = [];
	    var holes = [];
	    var x; // iterator
	    var outerRing; // current outer ring being evaluated
	    var hole; // current hole being evaluated

	    // for each ring
	    for (var r = 0; r < rings.length; r++) {
	      var ring = closeRing(rings[r].slice(0));
	      if(ring.length < 4){
	        continue;
	      }
	      // is this ring an outer ring? is it clockwise?
	      if(ringIsClockwise(ring)){
	        var polygon = [ ring.slice().reverse() ]; // wind outer rings counterclockwise for RFC 7946 compliance
	        outerRings.push(polygon); // push to outer rings
	      } else {
	        holes.push(ring.slice().reverse()); // wind inner rings clockwise for RFC 7946 compliance
	      }
	    }

	    var uncontainedHoles = [];

	    // while there are holes left...
	    while(holes.length){
	      // pop a hole off out stack
	      hole = holes.pop();

	      // loop over all outer rings and see if they contain our hole.
	      var contained = false;
	      for (x = outerRings.length - 1; x >= 0; x--) {
	        outerRing = outerRings[x][0];
	        if(coordinatesContainCoordinates(outerRing, hole)){
	          // the hole is contained push it into our polygon
	          outerRings[x].push(hole);
	          contained = true;
	          break;
	        }
	      }

	      // ring is not contained in any outer ring
	      // sometimes this happens https://github.com/Esri/esri-leaflet/issues/320
	      if(!contained){
	        uncontainedHoles.push(hole);
	      }
	    }

	    // if we couldn't match any holes using contains we can now try intersects...
	    while(uncontainedHoles.length){
	      // pop a hole off out stack
	      hole = uncontainedHoles.pop();

	      // loop over all outer rings and see if any intersect our hole.
	      var intersects = false;
	      for (x = outerRings.length - 1; x >= 0; x--) {
	        outerRing = outerRings[x][0];
	        if(Terraformer.Tools.arraysIntersectArrays(outerRing, hole)){
	          // the hole intersects the outer ring push it into our polygon
	          outerRings[x].push(hole);
	          intersects = true;
	          break;
	        }
	      }

	      // hole does not intersect ANY outer ring at this point
	      // make it an outer ring.
	      if(!intersects) {
	        outerRings.push([hole.reverse()]);
	      }
	    }

	    if(outerRings.length === 1){
	      return {
	        type: 'Polygon',
	        coordinates: outerRings[0]
	      };
	    } else {
	      return {
	        type: 'MultiPolygon',
	        coordinates: outerRings
	      };
	    }
	  }

	  // ArcGIS -> GeoJSON
	  function parse(arcgis, options){
	    var geojson = {};

	    options = options || {};
	    options.idAttribute = options.idAttribute || undefined;

	    if (arcgis.spatialReference && (arcgis.spatialReference.wkid === 3857 || arcgis.spatialReference.wkid === 102100)) {
	      geojson.crs = Terraformer.MercatorCRS;
	    }

	    if(typeof arcgis.x === 'number' && typeof arcgis.y === 'number'){
	      geojson.type = "Point";
	      geojson.coordinates = [arcgis.x, arcgis.y];
	      if (arcgis.z || arcgis.m){
	        geojson.coordinates.push(arcgis.z);
	      }
	      if (arcgis.m){
	        geojson.coordinates.push(arcgis.m);
	      }
	    }

	    if(arcgis.points){
	      geojson.type = "MultiPoint";
	      geojson.coordinates = arcgis.points.slice(0);
	    }

	    if(arcgis.paths) {
	      if(arcgis.paths.length === 1){
	        geojson.type = "LineString";
	        geojson.coordinates = arcgis.paths[0].slice(0);
	      } else {
	        geojson.type = "MultiLineString";
	        geojson.coordinates = arcgis.paths.slice(0);
	      }
	    }

	    if(arcgis.rings) {
	      geojson = convertRingsToGeoJSON(arcgis.rings.slice(0));
	    }

	    if(
	      typeof arcgis.xmin === "number" &&
	      typeof arcgis.ymin === "number" &&
	      typeof arcgis.xmax === "number" &&
	      typeof arcgis.ymax === "number"
	    ) {
	      geojson.type = "Polygon";
	      geojson.coordinates = [[
	        [arcgis.xmax, arcgis.ymax],
	        [arcgis.xmin, arcgis.ymax],
	        [arcgis.xmin, arcgis.ymin],
	        [arcgis.xmax, arcgis.ymin],
	        [arcgis.xmax, arcgis.ymax]
	      ]];
	    }

	    if(arcgis.compressedGeometry || arcgis.geometry || arcgis.attributes) {
	      geojson.type = "Feature";

	      if(arcgis.compressedGeometry){
	        arcgis.geometry = {
	          paths: [
	            decompressGeometry(arcgis.compressedGeometry)
	          ]
	        };
	      }

	      geojson.geometry = (arcgis.geometry) ? parse(arcgis.geometry) : null;
	      geojson.properties = (arcgis.attributes) ? clone(arcgis.attributes) : null;
	      if(arcgis.attributes) {
	        geojson.id =  arcgis.attributes[options.idAttribute] || arcgis.attributes.OBJECTID || arcgis.attributes.FID;
	      }
	    }

	    return new Terraformer.Primitive(geojson);
	  }

	  // GeoJSON -> ArcGIS
	  function convert(geojson, options){
	    var spatialReference;

	    options = options || {};
	    var idAttribute = options.idAttribute || "OBJECTID";

	    if(options.sr){
	      spatialReference = { wkid: options.sr };
	    } else if (geojson && geojson.crs && geojson.crs.properties.name != "urn:ogc:def:crs:OGC:1.3:CRS84") {
	      spatialReference = null;
	    } else {
	      spatialReference = { wkid: 4326 };
	    }

	    var result = {};
	    var i;

	    switch(geojson.type){
	    case "Point":
	      result.x = geojson.coordinates[0];
	      result.y = geojson.coordinates[1];
	      if(geojson.coordinates[2]) {
	        result.z = geojson.coordinates[2];
	      }
	      if(geojson.coordinates[3]) {
	        result.m = geojson.coordinates[3];
	      }
	      result.spatialReference = spatialReference;
	      break;
	    case "MultiPoint":
	      result.points = geojson.coordinates.slice(0);
	      result.spatialReference = spatialReference;
	      break;
	    case "LineString":
	      result.paths = [geojson.coordinates.slice(0)];
	      result.spatialReference = spatialReference;
	      break;
	    case "MultiLineString":
	      result.paths = geojson.coordinates.slice(0);
	      result.spatialReference = spatialReference;
	      break;
	    case "Polygon":
	      result.rings = orientRings(geojson.coordinates.slice(0));
	      result.spatialReference = spatialReference;
	      break;
	    case "MultiPolygon":
	      result.rings = flattenMultiPolygonRings(geojson.coordinates.slice(0));
	      result.spatialReference = spatialReference;
	      break;
	    case "Feature":
	      if(geojson.geometry) {
	        result.geometry = convert(geojson.geometry, options);
	      }
	      result.attributes = (geojson.properties) ? clone(geojson.properties) : {};
	      if(geojson.id) {
	        result.attributes[idAttribute] = geojson.id;
	      }
	      break;
	    case "FeatureCollection":
	      result = [];
	      for (i = 0; i < geojson.features.length; i++){
	        result.push(convert(geojson.features[i], options));
	      }
	      break;
	    case "GeometryCollection":
	      result = [];
	      for (i = 0; i < geojson.geometries.length; i++){
	        result.push(convert(geojson.geometries[i], options));
	      }
	      break;
	    }

	    return result;
	  }

	  function parseCompressedGeometry(string){
	    return new Terraformer.LineString(decompressGeometry(string));
	  }

	  exports.parse   = parse;
	  exports.convert = convert;
	  exports.toGeoJSON = parse;
	  exports.fromGeoJSON = convert;
	  exports.parseCompressedGeometry = parseCompressedGeometry;

	  return exports;
	}));
	});

	var DEFAULT_SYMBOLS = constants.DEFAULT_SYMBOLS;

	/**
	 * 
	 * @param {String} color rgb/#rgb/rrggbb/#rrggbb
	 * @param {Number} opacity [0, 1]
	 */
	function rgba(color, opacity) {
	  var r, g, b, a;
	  if (color[0] === '#') {
	    // #rrggbb
	    color = color.substr(1);
	  }
	  if (color.length === 3) {
	    // rgb
	    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
	  }
	  if (color.length === 6) ;
	  r = parseInt(color.substr(0, 2), 16);
	  g = parseInt(color.substr(2, 2), 16);
	  b = parseInt(color.substr(4, 2), 16);
	  a = opacity === undefined ? 255 : Math.round(opacity * 255);
	  return [r, g, b, a];
	}
	function simpleLineSymbol(properties) {
	  return {
	    type: 'esriSLS',
	    style: 'esriSLSSolid',
	    color: properties['stroke'] ? rgba(properties['stroke'], properties['stroke-opacity']) : DEFAULT_SYMBOLS.polyline.color,
	    width: properties['stroke-width'] || DEFAULT_SYMBOLS.polyline.width
	  };
	}
	function simpleFillSymbol(properties) {
	  return {
	    type: 'esriSFS',
	    style: 'esriSFSSolid',
	    color: properties['fill'] ? rgba(properties['fill'], properties['fill-opacity']) : DEFAULT_SYMBOLS.polygon.color,
	    outline: simpleLineSymbol(properties)
	  };
	}

	/**
	 * there is no symbol styles mapping from kml point to arcgis symbol,
	 * so here we just returns a default marker symbol
	 */
	function simpleMarkerSymbol(properties) {
	  return DEFAULT_SYMBOLS.marker;
	}
	var symbol_1 = function (feature) {
	  var geoType = feature.geometry.type === 'GeometryCollection' ? feature.geometry.geometries[0].type : feature.geometry.type;
	  if (['LineString', 'MultiLineString'].includes(geoType)) {
	    return simpleLineSymbol(feature.properties);
	  } else if (['Polygon', 'MultiPolygon'].includes(geoType)) {
	    return simpleFillSymbol(feature.properties);
	  } else if (['Point', 'MultiPoint'].includes(geoType)) {
	    return simpleMarkerSymbol(feature.properties);
	  }
	};
	var symbol$2 = {
	  symbol: symbol_1
	};

	const convert$1 = terraformerArcgisParser.convert;
	const symbol$1 = symbol$2.symbol;
	const defaultOptions = {
	  spatialReference: {
	    wkid: 4326
	  },
	  // default to wgs84
	  geometryCollection: {
	    mergePoint: true,
	    mergePolyline: true,
	    mergePolygon: true
	  }
	};

	/** geojson转graphicjson
	 * GeometryCollection, 将相同类型的要素合并
	 * Feature: { type, properties, geometry: { type, coordinates }}
	 * Point
	 * MultiPoint
	 * LineString
	 * MultiLineString
	 * Polygon
	 * MultiPolygon
	 * GeometryCollection
	 *  */
	function graphicJSON$1(feature, options) {
	  let {
	    spatialReference,
	    geometryCollection
	  } = {
	    ...defaultOptions,
	    ...options
	  };
	  let isGeoCollection = feature.geometry.type === 'GeometryCollection';
	  let geometry;
	  if (isGeoCollection) {
	    let _features = feature.geometry.geometries.reduce((s, a, i) => {
	      a = JSON.parse(JSON.stringify(a));
	      if (geometryCollection.mergePoint && ['Point', 'MultiPoint'].includes(a.type)) {
	        return pushCoords(s, 'MultiPoint', a, feature);
	      } else if (geometryCollection.mergePolyline && ['LineString', 'MultiLineString'].includes(a.type)) {
	        return pushCoords(s, 'MultiLineString', a, feature);
	      } else if (geometryCollection.mergePolygon && ['Polygon', 'MultiPolygon'].includes(a.type)) {
	        return pushCoords(s, 'MultiPolygon', a, feature);
	      } else {
	        console.log('geometry.type error = ', a.type);
	      }
	      return s;
	    }, []);
	    return _features.map(_feature => graphicJSON$1(_feature, options));
	  } else {
	    geometry = convert$1(feature.geometry);
	    geometry.spatialReference = spatialReference;
	  }
	  return {
	    attributes: feature.properties,
	    geometry,
	    symbol: symbol$1(feature)
	  };
	}
	function pushCoords(s, gtype, a, feature) {
	  let index = s.findIndex(b => b.geometry.type === gtype);
	  if (index >= 0) {
	    s[index].geometry.coordinates.push(a.coordinates);
	    return s;
	  } else {
	    if (a.type !== gtype) {
	      a.type = gtype;
	      a.coordinates = [a.coordinates];
	    }
	    let _feature = {
	      ...JSON.parse(JSON.stringify(feature)),
	      geometry: a
	    };
	    s.push(_feature);
	    return s;
	  }
	}
	var graphicJSON_1 = graphicJSON$1;
	var graphic = {
	  graphicJSON: graphicJSON_1
	};

	var graphicJSON = graphic.graphicJSON;
	var symbol = symbol$2.symbol;
	var arcgis = {
	  graphicJSON,
	  symbol
	};
	arcgis.graphicJSON;
	arcgis.symbol;

	/**
	 * @module helpers
	 */
	/**
	 * Earth Radius used with the Harvesine formula and approximates using a spherical (non-ellipsoid) Earth.
	 *
	 * @memberof helpers
	 * @type {number}
	 */
	var earthRadius = 6371008.8;
	/**
	 * Unit of measurement factors using a spherical (non-ellipsoid) earth radius.
	 *
	 * @memberof helpers
	 * @type {Object}
	 */
	var factors = {
	    centimeters: earthRadius * 100,
	    centimetres: earthRadius * 100,
	    degrees: earthRadius / 111325,
	    feet: earthRadius * 3.28084,
	    inches: earthRadius * 39.37,
	    kilometers: earthRadius / 1000,
	    kilometres: earthRadius / 1000,
	    meters: earthRadius,
	    metres: earthRadius,
	    miles: earthRadius / 1609.344,
	    millimeters: earthRadius * 1000,
	    millimetres: earthRadius * 1000,
	    nauticalmiles: earthRadius / 1852,
	    radians: 1,
	    yards: earthRadius * 1.0936,
	};
	/**
	 * Units of measurement factors based on 1 meter.
	 *
	 * @memberof helpers
	 * @type {Object}
	 */
	var unitsFactors = {
	    centimeters: 100,
	    centimetres: 100,
	    degrees: 1 / 111325,
	    feet: 3.28084,
	    inches: 39.37,
	    kilometers: 1 / 1000,
	    kilometres: 1 / 1000,
	    meters: 1,
	    metres: 1,
	    miles: 1 / 1609.344,
	    millimeters: 1000,
	    millimetres: 1000,
	    nauticalmiles: 1 / 1852,
	    radians: 1 / earthRadius,
	    yards: 1.0936133,
	};
	/**
	 * Area of measurement factors based on 1 square meter.
	 *
	 * @memberof helpers
	 * @type {Object}
	 */
	var areaFactors = {
	    acres: 0.000247105,
	    centimeters: 10000,
	    centimetres: 10000,
	    feet: 10.763910417,
	    hectares: 0.0001,
	    inches: 1550.003100006,
	    kilometers: 0.000001,
	    kilometres: 0.000001,
	    meters: 1,
	    metres: 1,
	    miles: 3.86e-7,
	    millimeters: 1000000,
	    millimetres: 1000000,
	    yards: 1.195990046,
	};
	/**
	 * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
	 *
	 * @name feature
	 * @param {Geometry} geometry input geometry
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature} a GeoJSON Feature
	 * @example
	 * var geometry = {
	 *   "type": "Point",
	 *   "coordinates": [110, 50]
	 * };
	 *
	 * var feature = turf.feature(geometry);
	 *
	 * //=feature
	 */
	function feature$2(geom, properties, options) {
	    if (options === void 0) { options = {}; }
	    var feat = { type: "Feature" };
	    if (options.id === 0 || options.id) {
	        feat.id = options.id;
	    }
	    if (options.bbox) {
	        feat.bbox = options.bbox;
	    }
	    feat.properties = properties || {};
	    feat.geometry = geom;
	    return feat;
	}
	/**
	 * Creates a GeoJSON {@link Geometry} from a Geometry string type & coordinates.
	 * For GeometryCollection type use `helpers.geometryCollection`
	 *
	 * @name geometry
	 * @param {string} type Geometry Type
	 * @param {Array<any>} coordinates Coordinates
	 * @param {Object} [options={}] Optional Parameters
	 * @returns {Geometry} a GeoJSON Geometry
	 * @example
	 * var type = "Point";
	 * var coordinates = [110, 50];
	 * var geometry = turf.geometry(type, coordinates);
	 * // => geometry
	 */
	function geometry$1(type, coordinates, _options) {
	    switch (type) {
	        case "Point":
	            return point(coordinates).geometry;
	        case "LineString":
	            return lineString(coordinates).geometry;
	        case "Polygon":
	            return polygon(coordinates).geometry;
	        case "MultiPoint":
	            return multiPoint(coordinates).geometry;
	        case "MultiLineString":
	            return multiLineString(coordinates).geometry;
	        case "MultiPolygon":
	            return multiPolygon(coordinates).geometry;
	        default:
	            throw new Error(type + " is invalid");
	    }
	}
	/**
	 * Creates a {@link Point} {@link Feature} from a Position.
	 *
	 * @name point
	 * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<Point>} a Point feature
	 * @example
	 * var point = turf.point([-75.343, 39.984]);
	 *
	 * //=point
	 */
	function point(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    if (!coordinates) {
	        throw new Error("coordinates is required");
	    }
	    if (!Array.isArray(coordinates)) {
	        throw new Error("coordinates must be an Array");
	    }
	    if (coordinates.length < 2) {
	        throw new Error("coordinates must be at least 2 numbers long");
	    }
	    if (!isNumber(coordinates[0]) || !isNumber(coordinates[1])) {
	        throw new Error("coordinates must contain numbers");
	    }
	    var geom = {
	        type: "Point",
	        coordinates: coordinates,
	    };
	    return feature$2(geom, properties, options);
	}
	/**
	 * Creates a {@link Point} {@link FeatureCollection} from an Array of Point coordinates.
	 *
	 * @name points
	 * @param {Array<Array<number>>} coordinates an array of Points
	 * @param {Object} [properties={}] Translate these properties to each Feature
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
	 * associated with the FeatureCollection
	 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
	 * @returns {FeatureCollection<Point>} Point Feature
	 * @example
	 * var points = turf.points([
	 *   [-75, 39],
	 *   [-80, 45],
	 *   [-78, 50]
	 * ]);
	 *
	 * //=points
	 */
	function points(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    return featureCollection(coordinates.map(function (coords) {
	        return point(coords, properties);
	    }), options);
	}
	/**
	 * Creates a {@link Polygon} {@link Feature} from an Array of LinearRings.
	 *
	 * @name polygon
	 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<Polygon>} Polygon Feature
	 * @example
	 * var polygon = turf.polygon([[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]], { name: 'poly1' });
	 *
	 * //=polygon
	 */
	function polygon(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    for (var _i = 0, coordinates_1 = coordinates; _i < coordinates_1.length; _i++) {
	        var ring = coordinates_1[_i];
	        if (ring.length < 4) {
	            throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");
	        }
	        for (var j = 0; j < ring[ring.length - 1].length; j++) {
	            // Check if first point of Polygon contains two numbers
	            if (ring[ring.length - 1][j] !== ring[0][j]) {
	                throw new Error("First and last Position are not equivalent.");
	            }
	        }
	    }
	    var geom = {
	        type: "Polygon",
	        coordinates: coordinates,
	    };
	    return feature$2(geom, properties, options);
	}
	/**
	 * Creates a {@link Polygon} {@link FeatureCollection} from an Array of Polygon coordinates.
	 *
	 * @name polygons
	 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygon coordinates
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
	 * @returns {FeatureCollection<Polygon>} Polygon FeatureCollection
	 * @example
	 * var polygons = turf.polygons([
	 *   [[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]],
	 *   [[[-15, 42], [-14, 46], [-12, 41], [-17, 44], [-15, 42]]],
	 * ]);
	 *
	 * //=polygons
	 */
	function polygons(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    return featureCollection(coordinates.map(function (coords) {
	        return polygon(coords, properties);
	    }), options);
	}
	/**
	 * Creates a {@link LineString} {@link Feature} from an Array of Positions.
	 *
	 * @name lineString
	 * @param {Array<Array<number>>} coordinates an array of Positions
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<LineString>} LineString Feature
	 * @example
	 * var linestring1 = turf.lineString([[-24, 63], [-23, 60], [-25, 65], [-20, 69]], {name: 'line 1'});
	 * var linestring2 = turf.lineString([[-14, 43], [-13, 40], [-15, 45], [-10, 49]], {name: 'line 2'});
	 *
	 * //=linestring1
	 * //=linestring2
	 */
	function lineString(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    if (coordinates.length < 2) {
	        throw new Error("coordinates must be an array of two or more positions");
	    }
	    var geom = {
	        type: "LineString",
	        coordinates: coordinates,
	    };
	    return feature$2(geom, properties, options);
	}
	/**
	 * Creates a {@link LineString} {@link FeatureCollection} from an Array of LineString coordinates.
	 *
	 * @name lineStrings
	 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
	 * associated with the FeatureCollection
	 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
	 * @returns {FeatureCollection<LineString>} LineString FeatureCollection
	 * @example
	 * var linestrings = turf.lineStrings([
	 *   [[-24, 63], [-23, 60], [-25, 65], [-20, 69]],
	 *   [[-14, 43], [-13, 40], [-15, 45], [-10, 49]]
	 * ]);
	 *
	 * //=linestrings
	 */
	function lineStrings(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    return featureCollection(coordinates.map(function (coords) {
	        return lineString(coords, properties);
	    }), options);
	}
	/**
	 * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
	 *
	 * @name featureCollection
	 * @param {Feature[]} features input features
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {FeatureCollection} FeatureCollection of Features
	 * @example
	 * var locationA = turf.point([-75.343, 39.984], {name: 'Location A'});
	 * var locationB = turf.point([-75.833, 39.284], {name: 'Location B'});
	 * var locationC = turf.point([-75.534, 39.123], {name: 'Location C'});
	 *
	 * var collection = turf.featureCollection([
	 *   locationA,
	 *   locationB,
	 *   locationC
	 * ]);
	 *
	 * //=collection
	 */
	function featureCollection(features, options) {
	    if (options === void 0) { options = {}; }
	    var fc = { type: "FeatureCollection" };
	    if (options.id) {
	        fc.id = options.id;
	    }
	    if (options.bbox) {
	        fc.bbox = options.bbox;
	    }
	    fc.features = features;
	    return fc;
	}
	/**
	 * Creates a {@link Feature<MultiLineString>} based on a
	 * coordinate array. Properties can be added optionally.
	 *
	 * @name multiLineString
	 * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<MultiLineString>} a MultiLineString feature
	 * @throws {Error} if no coordinates are passed
	 * @example
	 * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
	 *
	 * //=multiLine
	 */
	function multiLineString(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    var geom = {
	        type: "MultiLineString",
	        coordinates: coordinates,
	    };
	    return feature$2(geom, properties, options);
	}
	/**
	 * Creates a {@link Feature<MultiPoint>} based on a
	 * coordinate array. Properties can be added optionally.
	 *
	 * @name multiPoint
	 * @param {Array<Array<number>>} coordinates an array of Positions
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<MultiPoint>} a MultiPoint feature
	 * @throws {Error} if no coordinates are passed
	 * @example
	 * var multiPt = turf.multiPoint([[0,0],[10,10]]);
	 *
	 * //=multiPt
	 */
	function multiPoint(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    var geom = {
	        type: "MultiPoint",
	        coordinates: coordinates,
	    };
	    return feature$2(geom, properties, options);
	}
	/**
	 * Creates a {@link Feature<MultiPolygon>} based on a
	 * coordinate array. Properties can be added optionally.
	 *
	 * @name multiPolygon
	 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<MultiPolygon>} a multipolygon feature
	 * @throws {Error} if no coordinates are passed
	 * @example
	 * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
	 *
	 * //=multiPoly
	 *
	 */
	function multiPolygon(coordinates, properties, options) {
	    if (options === void 0) { options = {}; }
	    var geom = {
	        type: "MultiPolygon",
	        coordinates: coordinates,
	    };
	    return feature$2(geom, properties, options);
	}
	/**
	 * Creates a {@link Feature<GeometryCollection>} based on a
	 * coordinate array. Properties can be added optionally.
	 *
	 * @name geometryCollection
	 * @param {Array<Geometry>} geometries an array of GeoJSON Geometries
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
	 * @example
	 * var pt = turf.geometry("Point", [100, 0]);
	 * var line = turf.geometry("LineString", [[101, 0], [102, 1]]);
	 * var collection = turf.geometryCollection([pt, line]);
	 *
	 * // => collection
	 */
	function geometryCollection(geometries, properties, options) {
	    if (options === void 0) { options = {}; }
	    var geom = {
	        type: "GeometryCollection",
	        geometries: geometries,
	    };
	    return feature$2(geom, properties, options);
	}
	/**
	 * Round number to precision
	 *
	 * @param {number} num Number
	 * @param {number} [precision=0] Precision
	 * @returns {number} rounded number
	 * @example
	 * turf.round(120.4321)
	 * //=120
	 *
	 * turf.round(120.4321, 2)
	 * //=120.43
	 */
	function round(num, precision) {
	    if (precision === void 0) { precision = 0; }
	    if (precision && !(precision >= 0)) {
	        throw new Error("precision must be a positive number");
	    }
	    var multiplier = Math.pow(10, precision || 0);
	    return Math.round(num * multiplier) / multiplier;
	}
	/**
	 * Convert a distance measurement (assuming a spherical Earth) from radians to a more friendly unit.
	 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
	 *
	 * @name radiansToLength
	 * @param {number} radians in radians across the sphere
	 * @param {string} [units="kilometers"] can be degrees, radians, miles, inches, yards, metres,
	 * meters, kilometres, kilometers.
	 * @returns {number} distance
	 */
	function radiansToLength(radians, units) {
	    if (units === void 0) { units = "kilometers"; }
	    var factor = factors[units];
	    if (!factor) {
	        throw new Error(units + " units is invalid");
	    }
	    return radians * factor;
	}
	/**
	 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into radians
	 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
	 *
	 * @name lengthToRadians
	 * @param {number} distance in real units
	 * @param {string} [units="kilometers"] can be degrees, radians, miles, inches, yards, metres,
	 * meters, kilometres, kilometers.
	 * @returns {number} radians
	 */
	function lengthToRadians(distance, units) {
	    if (units === void 0) { units = "kilometers"; }
	    var factor = factors[units];
	    if (!factor) {
	        throw new Error(units + " units is invalid");
	    }
	    return distance / factor;
	}
	/**
	 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into degrees
	 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, centimeters, kilometres, feet
	 *
	 * @name lengthToDegrees
	 * @param {number} distance in real units
	 * @param {string} [units="kilometers"] can be degrees, radians, miles, inches, yards, metres,
	 * meters, kilometres, kilometers.
	 * @returns {number} degrees
	 */
	function lengthToDegrees(distance, units) {
	    return radiansToDegrees(lengthToRadians(distance, units));
	}
	/**
	 * Converts any bearing angle from the north line direction (positive clockwise)
	 * and returns an angle between 0-360 degrees (positive clockwise), 0 being the north line
	 *
	 * @name bearingToAzimuth
	 * @param {number} bearing angle, between -180 and +180 degrees
	 * @returns {number} angle between 0 and 360 degrees
	 */
	function bearingToAzimuth(bearing) {
	    var angle = bearing % 360;
	    if (angle < 0) {
	        angle += 360;
	    }
	    return angle;
	}
	/**
	 * Converts an angle in radians to degrees
	 *
	 * @name radiansToDegrees
	 * @param {number} radians angle in radians
	 * @returns {number} degrees between 0 and 360 degrees
	 */
	function radiansToDegrees(radians) {
	    var degrees = radians % (2 * Math.PI);
	    return (degrees * 180) / Math.PI;
	}
	/**
	 * Converts an angle in degrees to radians
	 *
	 * @name degreesToRadians
	 * @param {number} degrees angle between 0 and 360 degrees
	 * @returns {number} angle in radians
	 */
	function degreesToRadians(degrees) {
	    var radians = degrees % 360;
	    return (radians * Math.PI) / 180;
	}
	/**
	 * Converts a length to the requested unit.
	 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
	 *
	 * @param {number} length to be converted
	 * @param {Units} [originalUnit="kilometers"] of the length
	 * @param {Units} [finalUnit="kilometers"] returned unit
	 * @returns {number} the converted length
	 */
	function convertLength(length, originalUnit, finalUnit) {
	    if (originalUnit === void 0) { originalUnit = "kilometers"; }
	    if (finalUnit === void 0) { finalUnit = "kilometers"; }
	    if (!(length >= 0)) {
	        throw new Error("length must be a positive number");
	    }
	    return radiansToLength(lengthToRadians(length, originalUnit), finalUnit);
	}
	/**
	 * Converts a area to the requested unit.
	 * Valid units: kilometers, kilometres, meters, metres, centimetres, millimeters, acres, miles, yards, feet, inches, hectares
	 * @param {number} area to be converted
	 * @param {Units} [originalUnit="meters"] of the distance
	 * @param {Units} [finalUnit="kilometers"] returned unit
	 * @returns {number} the converted area
	 */
	function convertArea(area, originalUnit, finalUnit) {
	    if (originalUnit === void 0) { originalUnit = "meters"; }
	    if (finalUnit === void 0) { finalUnit = "kilometers"; }
	    if (!(area >= 0)) {
	        throw new Error("area must be a positive number");
	    }
	    var startFactor = areaFactors[originalUnit];
	    if (!startFactor) {
	        throw new Error("invalid original units");
	    }
	    var finalFactor = areaFactors[finalUnit];
	    if (!finalFactor) {
	        throw new Error("invalid final units");
	    }
	    return (area / startFactor) * finalFactor;
	}
	/**
	 * isNumber
	 *
	 * @param {*} num Number to validate
	 * @returns {boolean} true/false
	 * @example
	 * turf.isNumber(123)
	 * //=true
	 * turf.isNumber('foo')
	 * //=false
	 */
	function isNumber(num) {
	    return !isNaN(num) && num !== null && !Array.isArray(num);
	}
	/**
	 * isObject
	 *
	 * @param {*} input variable to validate
	 * @returns {boolean} true/false
	 * @example
	 * turf.isObject({elevation: 10})
	 * //=true
	 * turf.isObject('foo')
	 * //=false
	 */
	function isObject(input) {
	    return !!input && input.constructor === Object;
	}
	/**
	 * Validate BBox
	 *
	 * @private
	 * @param {Array<number>} bbox BBox to validate
	 * @returns {void}
	 * @throws Error if BBox is not valid
	 * @example
	 * validateBBox([-180, -40, 110, 50])
	 * //=OK
	 * validateBBox([-180, -40])
	 * //=Error
	 * validateBBox('Foo')
	 * //=Error
	 * validateBBox(5)
	 * //=Error
	 * validateBBox(null)
	 * //=Error
	 * validateBBox(undefined)
	 * //=Error
	 */
	function validateBBox(bbox) {
	    if (!bbox) {
	        throw new Error("bbox is required");
	    }
	    if (!Array.isArray(bbox)) {
	        throw new Error("bbox must be an Array");
	    }
	    if (bbox.length !== 4 && bbox.length !== 6) {
	        throw new Error("bbox must be an Array of 4 or 6 numbers");
	    }
	    bbox.forEach(function (num) {
	        if (!isNumber(num)) {
	            throw new Error("bbox must only contain numbers");
	        }
	    });
	}
	/**
	 * Validate Id
	 *
	 * @private
	 * @param {string|number} id Id to validate
	 * @returns {void}
	 * @throws Error if Id is not valid
	 * @example
	 * validateId([-180, -40, 110, 50])
	 * //=Error
	 * validateId([-180, -40])
	 * //=Error
	 * validateId('Foo')
	 * //=OK
	 * validateId(5)
	 * //=OK
	 * validateId(null)
	 * //=Error
	 * validateId(undefined)
	 * //=Error
	 */
	function validateId(id) {
	    if (!id) {
	        throw new Error("id is required");
	    }
	    if (["string", "number"].indexOf(typeof id) === -1) {
	        throw new Error("id must be a number or a string");
	    }
	}

	var es$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		earthRadius: earthRadius,
		factors: factors,
		unitsFactors: unitsFactors,
		areaFactors: areaFactors,
		feature: feature$2,
		geometry: geometry$1,
		point: point,
		points: points,
		polygon: polygon,
		polygons: polygons,
		lineString: lineString,
		lineStrings: lineStrings,
		featureCollection: featureCollection,
		multiLineString: multiLineString,
		multiPoint: multiPoint,
		multiPolygon: multiPolygon,
		geometryCollection: geometryCollection,
		round: round,
		radiansToLength: radiansToLength,
		lengthToRadians: lengthToRadians,
		lengthToDegrees: lengthToDegrees,
		bearingToAzimuth: bearingToAzimuth,
		radiansToDegrees: radiansToDegrees,
		degreesToRadians: degreesToRadians,
		convertLength: convertLength,
		convertArea: convertArea,
		isNumber: isNumber,
		isObject: isObject,
		validateBBox: validateBBox,
		validateId: validateId
	});

	/**
	 * Callback for coordEach
	 *
	 * @callback coordEachCallback
	 * @param {Array<number>} currentCoord The current coordinate being processed.
	 * @param {number} coordIndex The current index of the coordinate being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
	 * @param {number} geometryIndex The current index of the Geometry being processed.
	 */

	/**
	 * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
	 *
	 * @name coordEach
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (currentCoord, coordIndex, featureIndex, multiFeatureIndex)
	 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
	 * @returns {void}
	 * @example
	 * var features = turf.featureCollection([
	 *   turf.point([26, 37], {"foo": "bar"}),
	 *   turf.point([36, 53], {"hello": "world"})
	 * ]);
	 *
	 * turf.coordEach(features, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
	 *   //=currentCoord
	 *   //=coordIndex
	 *   //=featureIndex
	 *   //=multiFeatureIndex
	 *   //=geometryIndex
	 * });
	 */
	function coordEach(geojson, callback, excludeWrapCoord) {
	  // Handles null Geometry -- Skips this GeoJSON
	  if (geojson === null) return;
	  var j,
	    k,
	    l,
	    geometry,
	    stopG,
	    coords,
	    geometryMaybeCollection,
	    wrapShrink = 0,
	    coordIndex = 0,
	    isGeometryCollection,
	    type = geojson.type,
	    isFeatureCollection = type === "FeatureCollection",
	    isFeature = type === "Feature",
	    stop = isFeatureCollection ? geojson.features.length : 1;

	  // This logic may look a little weird. The reason why it is that way
	  // is because it's trying to be fast. GeoJSON supports multiple kinds
	  // of objects at its root: FeatureCollection, Features, Geometries.
	  // This function has the responsibility of handling all of them, and that
	  // means that some of the `for` loops you see below actually just don't apply
	  // to certain inputs. For instance, if you give this just a
	  // Point geometry, then both loops are short-circuited and all we do
	  // is gradually rename the input until it's called 'geometry'.
	  //
	  // This also aims to allocate as few resources as possible: just a
	  // few numbers and booleans, rather than any temporary arrays as would
	  // be required with the normalization approach.
	  for (var featureIndex = 0; featureIndex < stop; featureIndex++) {
	    geometryMaybeCollection = isFeatureCollection
	      ? geojson.features[featureIndex].geometry
	      : isFeature
	      ? geojson.geometry
	      : geojson;
	    isGeometryCollection = geometryMaybeCollection
	      ? geometryMaybeCollection.type === "GeometryCollection"
	      : false;
	    stopG = isGeometryCollection
	      ? geometryMaybeCollection.geometries.length
	      : 1;

	    for (var geomIndex = 0; geomIndex < stopG; geomIndex++) {
	      var multiFeatureIndex = 0;
	      var geometryIndex = 0;
	      geometry = isGeometryCollection
	        ? geometryMaybeCollection.geometries[geomIndex]
	        : geometryMaybeCollection;

	      // Handles null Geometry -- Skips this geometry
	      if (geometry === null) continue;
	      coords = geometry.coordinates;
	      var geomType = geometry.type;

	      wrapShrink =
	        excludeWrapCoord &&
	        (geomType === "Polygon" || geomType === "MultiPolygon")
	          ? 1
	          : 0;

	      switch (geomType) {
	        case null:
	          break;
	        case "Point":
	          if (
	            callback(
	              coords,
	              coordIndex,
	              featureIndex,
	              multiFeatureIndex,
	              geometryIndex
	            ) === false
	          )
	            return false;
	          coordIndex++;
	          multiFeatureIndex++;
	          break;
	        case "LineString":
	        case "MultiPoint":
	          for (j = 0; j < coords.length; j++) {
	            if (
	              callback(
	                coords[j],
	                coordIndex,
	                featureIndex,
	                multiFeatureIndex,
	                geometryIndex
	              ) === false
	            )
	              return false;
	            coordIndex++;
	            if (geomType === "MultiPoint") multiFeatureIndex++;
	          }
	          if (geomType === "LineString") multiFeatureIndex++;
	          break;
	        case "Polygon":
	        case "MultiLineString":
	          for (j = 0; j < coords.length; j++) {
	            for (k = 0; k < coords[j].length - wrapShrink; k++) {
	              if (
	                callback(
	                  coords[j][k],
	                  coordIndex,
	                  featureIndex,
	                  multiFeatureIndex,
	                  geometryIndex
	                ) === false
	              )
	                return false;
	              coordIndex++;
	            }
	            if (geomType === "MultiLineString") multiFeatureIndex++;
	            if (geomType === "Polygon") geometryIndex++;
	          }
	          if (geomType === "Polygon") multiFeatureIndex++;
	          break;
	        case "MultiPolygon":
	          for (j = 0; j < coords.length; j++) {
	            geometryIndex = 0;
	            for (k = 0; k < coords[j].length; k++) {
	              for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
	                if (
	                  callback(
	                    coords[j][k][l],
	                    coordIndex,
	                    featureIndex,
	                    multiFeatureIndex,
	                    geometryIndex
	                  ) === false
	                )
	                  return false;
	                coordIndex++;
	              }
	              geometryIndex++;
	            }
	            multiFeatureIndex++;
	          }
	          break;
	        case "GeometryCollection":
	          for (j = 0; j < geometry.geometries.length; j++)
	            if (
	              coordEach(geometry.geometries[j], callback, excludeWrapCoord) ===
	              false
	            )
	              return false;
	          break;
	        default:
	          throw new Error("Unknown Geometry Type");
	      }
	    }
	  }
	}

	/**
	 * Returns a cloned copy of the passed GeoJSON Object, including possible 'Foreign Members'.
	 * ~3-5x faster than the common JSON.parse + JSON.stringify combo method.
	 *
	 * @name clone
	 * @param {GeoJSON} geojson GeoJSON Object
	 * @returns {GeoJSON} cloned GeoJSON Object
	 * @example
	 * var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]], {color: 'red'});
	 *
	 * var lineCloned = turf.clone(line);
	 */
	function clone(geojson) {
	    if (!geojson) {
	        throw new Error("geojson is required");
	    }
	    switch (geojson.type) {
	        case "Feature":
	            return cloneFeature(geojson);
	        case "FeatureCollection":
	            return cloneFeatureCollection(geojson);
	        case "Point":
	        case "LineString":
	        case "Polygon":
	        case "MultiPoint":
	        case "MultiLineString":
	        case "MultiPolygon":
	        case "GeometryCollection":
	            return cloneGeometry(geojson);
	        default:
	            throw new Error("unknown GeoJSON type");
	    }
	}
	/**
	 * Clone Feature
	 *
	 * @private
	 * @param {Feature<any>} geojson GeoJSON Feature
	 * @returns {Feature<any>} cloned Feature
	 */
	function cloneFeature(geojson) {
	    var cloned = { type: "Feature" };
	    // Preserve Foreign Members
	    Object.keys(geojson).forEach(function (key) {
	        switch (key) {
	            case "type":
	            case "properties":
	            case "geometry":
	                return;
	            default:
	                cloned[key] = geojson[key];
	        }
	    });
	    // Add properties & geometry last
	    cloned.properties = cloneProperties(geojson.properties);
	    cloned.geometry = cloneGeometry(geojson.geometry);
	    return cloned;
	}
	/**
	 * Clone Properties
	 *
	 * @private
	 * @param {Object} properties GeoJSON Properties
	 * @returns {Object} cloned Properties
	 */
	function cloneProperties(properties) {
	    var cloned = {};
	    if (!properties) {
	        return cloned;
	    }
	    Object.keys(properties).forEach(function (key) {
	        var value = properties[key];
	        if (typeof value === "object") {
	            if (value === null) {
	                // handle null
	                cloned[key] = null;
	            }
	            else if (Array.isArray(value)) {
	                // handle Array
	                cloned[key] = value.map(function (item) {
	                    return item;
	                });
	            }
	            else {
	                // handle generic Object
	                cloned[key] = cloneProperties(value);
	            }
	        }
	        else {
	            cloned[key] = value;
	        }
	    });
	    return cloned;
	}
	/**
	 * Clone Feature Collection
	 *
	 * @private
	 * @param {FeatureCollection<any>} geojson GeoJSON Feature Collection
	 * @returns {FeatureCollection<any>} cloned Feature Collection
	 */
	function cloneFeatureCollection(geojson) {
	    var cloned = { type: "FeatureCollection" };
	    // Preserve Foreign Members
	    Object.keys(geojson).forEach(function (key) {
	        switch (key) {
	            case "type":
	            case "features":
	                return;
	            default:
	                cloned[key] = geojson[key];
	        }
	    });
	    // Add features
	    cloned.features = geojson.features.map(function (feature) {
	        return cloneFeature(feature);
	    });
	    return cloned;
	}
	/**
	 * Clone Geometry
	 *
	 * @private
	 * @param {Geometry<any>} geometry GeoJSON Geometry
	 * @returns {Geometry<any>} cloned Geometry
	 */
	function cloneGeometry(geometry) {
	    var geom = { type: geometry.type };
	    if (geometry.bbox) {
	        geom.bbox = geometry.bbox;
	    }
	    if (geometry.type === "GeometryCollection") {
	        geom.geometries = geometry.geometries.map(function (g) {
	            return cloneGeometry(g);
	        });
	        return geom;
	    }
	    geom.coordinates = deepSlice(geometry.coordinates);
	    return geom;
	}
	/**
	 * Deep Slice coordinates
	 *
	 * @private
	 * @param {Coordinates} coords Coordinates
	 * @returns {Coordinates} all coordinates sliced
	 */
	function deepSlice(coords) {
	    var cloned = coords;
	    if (typeof cloned[0] !== "object") {
	        return cloned.slice();
	    }
	    return cloned.map(function (coord) {
	        return deepSlice(coord);
	    });
	}

	/**
	 * Converts a WGS84 GeoJSON object into Mercator (EPSG:900913) projection
	 *
	 * @name toMercator
	 * @param {GeoJSON|Position} geojson WGS84 GeoJSON object
	 * @param {Object} [options] Optional parameters
	 * @param {boolean} [options.mutate=false] allows GeoJSON input to be mutated (significant performance increase if true)
	 * @returns {GeoJSON} Projected GeoJSON
	 * @example
	 * var pt = turf.point([-71,41]);
	 * var converted = turf.toMercator(pt);
	 *
	 * //addToMap
	 * var addToMap = [pt, converted];
	 */
	function toMercator(geojson, options) {
	    if (options === void 0) { options = {}; }
	    return convert(geojson, "mercator", options);
	}
	/**
	 * Converts a Mercator (EPSG:900913) GeoJSON object into WGS84 projection
	 *
	 * @name toWgs84
	 * @param {GeoJSON|Position} geojson Mercator GeoJSON object
	 * @param {Object} [options] Optional parameters
	 * @param {boolean} [options.mutate=false] allows GeoJSON input to be mutated (significant performance increase if true)
	 * @returns {GeoJSON} Projected GeoJSON
	 * @example
	 * var pt = turf.point([-7903683.846322424, 5012341.663847514]);
	 * var converted = turf.toWgs84(pt);
	 *
	 * //addToMap
	 * var addToMap = [pt, converted];
	 */
	function toWgs84$1(geojson, options) {
	    if (options === void 0) { options = {}; }
	    return convert(geojson, "wgs84", options);
	}
	/**
	 * Converts a GeoJSON coordinates to the defined `projection`
	 *
	 * @private
	 * @param {GeoJSON} geojson GeoJSON Feature or Geometry
	 * @param {string} projection defines the projection system to convert the coordinates to
	 * @param {Object} [options] Optional parameters
	 * @param {boolean} [options.mutate=false] allows GeoJSON input to be mutated (significant performance increase if true)
	 * @returns {GeoJSON} Converted GeoJSON
	 */
	function convert(geojson, projection, options) {
	    if (options === void 0) { options = {}; }
	    // Optional parameters
	    options = options || {};
	    var mutate = options.mutate;
	    // Validation
	    if (!geojson)
	        throw new Error("geojson is required");
	    // Handle Position
	    if (Array.isArray(geojson) && isNumber(geojson[0]))
	        geojson =
	            projection === "mercator"
	                ? convertToMercator(geojson)
	                : convertToWgs84(geojson);
	    // Handle GeoJSON
	    else {
	        // Handle possible data mutation
	        if (mutate !== true)
	            geojson = clone(geojson);
	        coordEach(geojson, function (coord) {
	            var newCoord = projection === "mercator"
	                ? convertToMercator(coord)
	                : convertToWgs84(coord);
	            coord[0] = newCoord[0];
	            coord[1] = newCoord[1];
	        });
	    }
	    return geojson;
	}
	/**
	 * Convert lon/lat values to 900913 x/y.
	 * (from https://github.com/mapbox/sphericalmercator)
	 *
	 * @private
	 * @param {Array<number>} lonLat WGS84 point
	 * @returns {Array<number>} Mercator [x, y] point
	 */
	function convertToMercator(lonLat) {
	    var D2R = Math.PI / 180, 
	    // 900913 properties
	    A = 6378137.0, MAXEXTENT = 20037508.342789244;
	    // compensate longitudes passing the 180th meridian
	    // from https://github.com/proj4js/proj4js/blob/master/lib/common/adjust_lon.js
	    var adjusted = Math.abs(lonLat[0]) <= 180 ? lonLat[0] : lonLat[0] - sign(lonLat[0]) * 360;
	    var xy = [
	        A * adjusted * D2R,
	        A * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * lonLat[1] * D2R)),
	    ];
	    // if xy value is beyond maxextent (e.g. poles), return maxextent
	    if (xy[0] > MAXEXTENT)
	        xy[0] = MAXEXTENT;
	    if (xy[0] < -MAXEXTENT)
	        xy[0] = -MAXEXTENT;
	    if (xy[1] > MAXEXTENT)
	        xy[1] = MAXEXTENT;
	    if (xy[1] < -MAXEXTENT)
	        xy[1] = -MAXEXTENT;
	    return xy;
	}
	/**
	 * Convert 900913 x/y values to lon/lat.
	 * (from https://github.com/mapbox/sphericalmercator)
	 *
	 * @private
	 * @param {Array<number>} xy Mercator [x, y] point
	 * @returns {Array<number>} WGS84 [lon, lat] point
	 */
	function convertToWgs84(xy) {
	    // 900913 properties.
	    var R2D = 180 / Math.PI;
	    var A = 6378137.0;
	    return [
	        (xy[0] * R2D) / A,
	        (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D,
	    ];
	}
	/**
	 * Returns the sign of the input, or zero
	 *
	 * @private
	 * @param {number} x input
	 * @returns {number} -1|0|1 output
	 */
	function sign(x) {
	    return x < 0 ? -1 : x > 0 ? 1 : 0;
	}

	var es = /*#__PURE__*/Object.freeze({
		__proto__: null,
		toMercator: toMercator,
		toWgs84: toWgs84$1
	});

	var Point = es$1.point;
	var toWgs84 = es.toWgs84;
	function isPoint(_) {
	  return _.type === 'Point' || _.type === 'MultiPoint';
	}
	function isPolygon(_) {
	  return _.type === 'Polygon' || _.type === 'MultiPolygon';
	}
	function isLine(_) {
	  return _.type === 'LineString' || _.type === 'MultiLineString';
	}
	function valid(_) {
	  return _ && _.type && (_.coordinates || _.type === 'GeometryCollection' && _.geometries && _.geometries.every(valid));
	}
	function mecatorToWgs84(point) {
	  var pt = Point(point);
	  return toWgs84(pt).geometry.coordinates;
	}
	function toWgs84Geometry(geometry) {
	  if (geometry.spatialReference && geometry.spatialReference.wkid === 4326) {
	    return geometry;
	  }

	  // by default, consider the projection is mecator, try to convert it to wgs84
	  if (geometry.rings) {
	    // polygon
	    geometry.rings = geometry.rings.map(function (ring) {
	      return ring.map(function (point) {
	        return mecatorToWgs84(point);
	      });
	    });
	  } else if (geometry.paths) {
	    // polyline
	    geometry.paths = geometry.paths.map(function (path) {
	      return path.map(function (point) {
	        return mecatorToWgs84(point);
	      });
	    });
	  } else if (geometry.points) {
	    // multipoint
	    geometry.points = geometry.points.map(function (point) {
	      return mecatorToWgs84(point);
	    });
	  } else {
	    // point
	    var x = geometry.x;
	    var y = geometry.y;
	    var p = mecatorToWgs84([x, y]);
	    geometry.x = p[0];
	    geometry.y = p[1];
	  }
	  geometry.spatialReference = {
	    wkid: 4326
	  };
	  return geometry;
	}
	var geometry = {
	  isPoint: isPoint,
	  isPolygon: isPolygon,
	  isLine: isLine,
	  valid: valid,
	  toWgs84Geometry: toWgs84Geometry
	};

	var numberToHex = color.numberToHex;

	/**
	 * 
	 * @param {Array} color [r, g, b, a]
	 * @return {Object} { stroke(rrggbb), opacity([0,1]) }
	 */
	function colorArrToHexAndOpacity(color) {
	  var r = numberToHex(color[0]);
	  var g = numberToHex(color[1]);
	  var b = numberToHex(color[2]);
	  var a = (color.length > 3 ? color[3] : 255) / 255;
	  return {
	    hex: r + g + b,
	    opacity: a
	  };
	}
	var styleProperties = function (graphicJSON) {
	  var geometry = graphicJSON.geometry;
	  var symbol = graphicJSON.symbol || {};
	  var properties = {};
	  if (geometry.rings) {
	    var fso = colorArrToHexAndOpacity(symbol.color);
	    var oso = colorArrToHexAndOpacity(symbol.outline.color);
	    properties['fill'] = fso.hex;
	    properties['fill-opacity'] = fso.opacity;
	    properties['stroke'] = oso.hex;
	    properties['stroke-opacity'] = oso.opacity;
	    properties['stroke-width'] = symbol.outline.width;
	  } else if (geometry.paths) {
	    var so = colorArrToHexAndOpacity(symbol.color);
	    properties['stroke'] = so.hex;
	    properties['stroke-opacity'] = so.opacity;
	    properties['stroke-width'] = symbol.width;
	  } else ;
	  return properties;
	};
	var properties = {
	  styleProperties: styleProperties
	};

	var feature$1 = createCommonjsModule(function (module, exports) {
	  var parse = terraformerArcgisParser.parse;
	  var styleProperties = properties.styleProperties;
	  exports.toFeature = function (graphicJSON) {
	    return {
	      type: 'Feature',
	      geometry: parseEsriGeometry(geometry.toWgs84Geometry(graphicJSON.geometry)),
	      properties: Object.assign({}, graphicJSON.attributes, styleProperties(graphicJSON))
	    };
	  };
	  exports.toFeatureCollection = function (graphicJSONs) {
	    var features = (graphicJSONs || []).map(exports.toFeature);
	    return {
	      type: 'FeatureCollection',
	      features
	    };
	  };

	  // INFO: 修复 terraformer-arcgis-parser bug
	  function parseEsriGeometry(geometry$1) {
	    var _geometry = parse(geometry.toWgs84Geometry(geometry$1));
	    // 挖洞：单个 ring 需要转换成 polygon
	    if (geometry$1.hasOwnProperty('rings') && _geometry.type === 'MultiPolygon') {
	      _geometry.type = 'Polygon';
	      _geometry.coordinates = [_geometry.coordinates[0][0], _geometry.coordinates[1][0]];
	    }
	    return _geometry;
	  }
	});
	feature$1.toFeature;
	feature$1.toFeatureCollection;

	var geojson = {
	  toFeature: feature$1.toFeature,
	  toFeatureCollection: feature$1.toFeatureCollection
	};
	geojson.toFeature;
	geojson.toFeatureCollection;

	var xmlEscape = createCommonjsModule(function (module) {
	var escape = module.exports = function escape(string, ignore) {
	  var pattern;

	  if (string === null || string === undefined) return;

	  ignore = (ignore || '').replace(/[^&"<>\']/g, '');
	  pattern = '([&"<>\'])'.replace(new RegExp('[' + ignore + ']', 'g'), '');

	  return string.replace(new RegExp(pattern, 'g'), function(str, item) {
	            return escape.map[item];
	          })
	};

	escape.map = {
	    '>': '&gt;'
	  , '<': '&lt;'
	  , "'": '&apos;'
	  , '"': '&quot;'
	  , '&': '&amp;'
	};
	});

	var attr_1 = attr;
	var tagClose_1 = tagClose;
	var tag_1 = tag$1;

	/**
	 * @param {array} _ an array of attributes
	 * @returns {string}
	 */
	function attr(attributes) {
	    if (!Object.keys(attributes).length) return '';
	    return ' ' + Object.keys(attributes).map(function(key) {
	        return key + '="' + xmlEscape(attributes[key]) + '"';
	    }).join(' ');
	}

	/**
	 * @param {string} el element name
	 * @param {array} attributes array of pairs
	 * @returns {string}
	 */
	function tagClose(el, attributes) {
	    return '<' + el + attr(attributes) + '/>';
	}

	/**
	 * @param {string} el element name
	 * @param {string} contents innerXML
	 * @param {array} attributes array of pairs
	 * @returns {string}
	 */
	function tag$1(el, attributes, contents) {
	    if (Array.isArray(attributes) || typeof attributes === 'string') {
	        contents = attributes;
	        attributes = {};
	    }
	    if (Array.isArray(contents)) contents = '\n' + contents.map(function(content) {
	        return '  ' + content;
	    }).join('\n') + '\n';
	    return '<' + el + attr(attributes) + '>' + contents + '</' + el + '>';
	}

	var strxml = {
		attr: attr_1,
		tagClose: tagClose_1,
		tag: tag_1
	};

	function hasPolygonAndLineStyle(_) {
	  var styleFields = {
	    'stroke': true,
	    'stroke-opacity': true,
	    'stroke-width': true,
	    'fill': true,
	    'fill-opacity': true
	  };
	  for (var key in _) {
	    if (styleFields[key]) {
	      return true;
	    }
	  }
	}
	function hashStyle(_) {
	  var hash = '';
	  if (_['marker-symbol']) {
	    hash = hash + 'ms' + _['marker-symbol'];
	  }
	  if (_['marker-color']) {
	    hash = hash + 'mc' + _['marker-color'].replace('#', '');
	  }
	  if (_['marker-size']) {
	    hash = hash + 'ms' + _['marker-size'];
	  }
	  if (_['stroke']) {
	    hash = hash + 's' + _['stroke'].replace('#', '');
	  }
	  if (_['stroke-width']) {
	    hash = hash + 'sw' + _['stroke-width'].toString().replace('.', '');
	  }
	  if (_['stroke-opacity']) {
	    hash = hash + 'mo' + _['stroke-opacity'].toString().replace('.', '');
	  }
	  if (_['fill']) {
	    hash = hash + 'f' + _['fill'].replace('#', '');
	  }
	  if (_['fill-opacity']) {
	    hash = hash + 'fo' + _['fill-opacity'].toString().replace('.', '');
	  }
	  return hash;
	}
	function hasMarkerStyle(_) {
	  return !!(_['marker-size'] || _['marker-symbol'] || _['marker-color']);
	}
	function iconUrl(_) {
	  var size = _['marker-size'] || 'medium';
	  var symbol = _['marker-symbol'] ? '-' + _['marker-symbol'] : '';
	  var color = (_['marker-color'] || '7e7e7e').replace('#', '');
	  return 'https://api.tiles.mapbox.com/v3/marker/' + 'pin-' + size.charAt(0) + symbol + '+' + color + '.png';
	}
	var style = {
	  hasPolygonAndLineStyle: hasPolygonAndLineStyle,
	  hashStyle: hashStyle,
	  hasMarkerStyle: hasMarkerStyle,
	  iconUrl: iconUrl
	};

	function isNum$1(a) {
	  return !isNaN(Number(a));
	}
	function isArr$1(a) {
	  return Object.prototype.toString.call(a) === '[object Array]';
	}
	function isObj$1(a) {
	  return Object.prototype.toString.call(a) === '[object Object]';
	}
	var type = {
	  isNum: isNum$1,
	  isArr: isArr$1,
	  isObj: isObj$1
	};

	var toFeatureCollection = geojson.toFeatureCollection;
	var isNum = type.isNum;
	var isArr = type.isArr;
	var isObj = type.isObj;
	function tag(el, attributes, contents) {
	  if (!isArr(attributes) && !isObj(attributes) && typeof attributes !== 'string') {
	    attributes = '';
	  }
	  return strxml.tag(el, attributes, contents);
	}
	var kmlify = function kmlify(geoJSON, folderTree, options) {
	  options = Object.assign({
	    documentName: undefined,
	    documentDescription: undefined,
	    name: 'name',
	    description: 'description',
	    simpleStyle: true,
	    timestamp: 'timestamp',
	    folder: 'folder',
	    dataType: 'geojson' // arcjson
	  }, options);
	  folderTree = folderTree || [];
	  geoJSON = options.dataType === 'geojson' ? geoJSON : toFeatureCollection(geoJSON);
	  return '<?xml version="1.0" encoding="UTF-8"?>' + tag('kml', {
	    xmlns: 'http://www.opengis.net/kml/2.2'
	  }, tag('Document', documentName(options) + documentDescription(options) + root(geoJSON, folderTree, options)));
	};
	function root(geoJSON, folderTree, options) {
	  if (!geoJSON.type) {
	    return '';
	  }
	  var styleHashesArray = [];
	  switch (geoJSON.type) {
	    case 'FeatureCollection':
	      if (!geoJSON.features) {
	        return '';
	      }
	      if (folderTree.length > 0 && options.folder) {
	        return folder(folderTree, geoJSON.features, styleHashesArray, options);
	      } else {
	        return geoJSON.features.map(feature(options, styleHashesArray)).join('');
	      }
	    case 'Feature':
	      return feature(options, styleHashesArray)(geoJSON);
	    default:
	      return feature(options, styleHashesArray)({
	        type: 'Feature',
	        geometry: geoJSON,
	        properties: {}
	      });
	  }
	}
	function documentName(options) {
	  return options.documentName !== undefined ? tag('name', options.documentName) : '';
	}
	function documentDescription(options) {
	  return options.documentDescription !== undefined ? tag('description', options.documentDescription) : '';
	}
	function name(_, options) {
	  return _[options.name] ? tag('name', _[options.name]) : '';
	}
	function description(_, options) {
	  return _[options.description] ? tag('description', _[options.description]) : '';
	}
	function timestamp(_, options) {
	  return _[options.timestamp] ? tag('TimeStamp', tag('when', _[options.timestamp])) : '';
	}
	function folder(folderTree, features, styleHashesArray, options) {
	  function _process(folders) {
	    folders = folders || [];
	    if (folders.length === 0) {
	      return '';
	    }
	    return folders.map(function (folder) {
	      var folderFeatures = features.filter(function (feature) {
	        return feature.properties[options.folder] === folder.key;
	      });
	      var descTag = folder.desc ? tag('desc', folder.desc) : '';
	      var valueTag = folder.value ? tag('value', folder.value) : '';
	      return tag('Folder', tag('name', folder.name) + descTag + valueTag + _process(folder.children) + folderFeatures.map(feature(options, styleHashesArray)).join(''));
	    }).join('');
	  }
	  return _process(folderTree);
	}
	function feature(options, styleHashesArray) {
	  return function (_) {
	    if (!_.properties || !geometry.valid(_.geometry)) {
	      return '';
	    }
	    var geometryString = any(_.geometry);
	    if (!geometryString) {
	      return '';
	    }
	    var styleDefinition = '';
	    var styleReference = '';
	    if (options.simpleStyle) {
	      var styleHash = style.hashStyle(_.properties);
	      if (styleHash) {
	        if (geometry.isPoint(_.geometry) && style.hasMarkerStyle(_.properties)) {
	          if (styleHashesArray.indexOf(styleHash) === -1) {
	            styleDefinition = markerStyle(_.properties, styleHash);
	            styleHashesArray.push(styleHash);
	          }
	          styleReference = tag('styleUrl', '#' + styleHash);
	        } else if ((geometry.isPolygon(_.geometry) || geometry.isLine(_.geometry)) && style.hasPolygonAndLineStyle(_.properties)) {
	          if (styleHashesArray.indexOf(styleHash) === -1) {
	            styleDefinition = polygonAndLineStyle(_.properties, styleHash);
	            styleHashesArray.push(styleHash);
	          }
	          styleReference = tag('styleUrl', '#' + styleHash);
	        }
	        // Note that style of GeometryCollection / MultiGeometry is not supported
	      }
	    }
	    return styleDefinition + tag('Placemark', name(_.properties, options) + description(_.properties, options) + extendeddata(_.properties) + timestamp(_.properties, options) + geometryString + styleReference);
	  };
	}
	function linearring(_) {
	  return _.map(function (cds) {
	    return cds.join(',');
	  }).join(' ');
	}

	// ## Data
	function extendeddata(_) {
	  return tag('ExtendedData', pairs(_).map(data).join(''));
	}
	function data(_) {
	  return tag('Data', {
	    name: _[0]
	  }, tag('value',
	  // 显示声明 attributes 为空对象，否则 tag 函数会在第二个参数不为 string 时，当 attributes 处理，会导致数字型的值处理成了 attributes，而 value 变成了 undefined
	  // 比如：tag('value', 1) 会被处理成 tag('value', 1, undefined)
	  {}, _[1] || ''));
	}

	// ## Marker style
	function markerStyle(_, styleHash) {
	  return tag('Style', {
	    id: styleHash
	  }, tag('IconStyle', tag('Icon', tag('href', style.iconUrl(_)))) + iconSize());
	}
	function iconSize(_) {
	  return tag('hotSpot', {
	    xunits: 'fraction',
	    yunits: 'fraction',
	    x: 0.5,
	    y: 0.5
	  }, '');
	}

	// ## Polygon and Line style
	function polygonAndLineStyle(_, styleHash) {
	  var lineStyleList = [];
	  var color$1 = color.hexToKmlColor(_['stroke'], _['stroke-opacity']) || constants.lineStyleColor;
	  if (color$1) {
	    lineStyleList.push(color$1);
	  }
	  var width = (isNum(_['stroke-width']) ? _['stroke-width'] : constants.lineWidth) + '';
	  if (width) {
	    lineStyleList.push(width);
	  }
	  var lineStyle = '';
	  if (lineStyleList.length) {
	    lineStyle = tag('LineStyle', lineStyleList);
	  }
	  var polyStyle = '';
	  if (_['fill'] || _['fill-opacity']) {
	    polyStyle = tag('PolyStyle', [tag('color', color.hexToKmlColor(_['fill'], _['fill-opacity']) || constants.polySyleColor)]);
	  }
	  return tag('Style', {
	    id: styleHash
	  }, lineStyle + polyStyle);
	}

	// ## General helpers
	function pairs(_) {
	  var o = [];
	  for (var i in _) {
	    o.push([i, _[i]]);
	  }
	  return o;
	}

	// ## Geometry Types
	//
	// https://developers.google.com/kml/documentation/kmlreference#geometry
	var GeometryTypes = {
	  Point: function (_) {
	    return tag('Point', tag('coordinates', _.coordinates.join(',')));
	  },
	  LineString: function (_) {
	    return tag('LineString', tag('coordinates', linearring(_.coordinates)));
	  },
	  Polygon: function (_) {
	    if (!_.coordinates.length) {
	      return '';
	    }
	    var outer = _.coordinates[0];
	    var inner = _.coordinates.slice(1);
	    var outerRing = tag('outerBoundaryIs', tag('LinearRing', tag('coordinates', linearring(outer))));
	    var innerRings = inner.map(function (i) {
	      return tag('innerBoundaryIs', tag('LinearRing', tag('coordinates', linearring(i))));
	    }).join('');
	    return tag('Polygon', outerRing + innerRings);
	  },
	  MultiPoint: function (_) {
	    if (!_.coordinates.length) {
	      return '';
	    }
	    return tag('MultiGeometry', _.coordinates.map(function (c) {
	      return GeometryTypes.Point({
	        coordinates: c
	      });
	    }).join(''));
	  },
	  MultiPolygon: function (_) {
	    if (!_.coordinates.length) {
	      return '';
	    }
	    return tag('MultiGeometry', _.coordinates.map(function (c) {
	      return GeometryTypes.Polygon({
	        coordinates: c
	      });
	    }).join(''));
	  },
	  MultiLineString: function (_) {
	    if (!_.coordinates.length) {
	      return '';
	    }
	    return tag('MultiGeometry', _.coordinates.map(function (c) {
	      return GeometryTypes.LineString({
	        coordinates: c
	      });
	    }).join(''));
	  },
	  GeometryCollection: function (_) {
	    return tag('MultiGeometry', _.geometries.map(any).join(''));
	  }
	};
	function any(_) {
	  if (GeometryTypes[_.type]) {
	    return GeometryTypes[_.type](_);
	  } else {
	    return '';
	  }
	}

	var parseStyle = style$1.parse;
	var parsePlacemark = placemark.parse;
	var parseFolder = folder$1.parse;
	var parseDescription = description$1.parse;

	/**
	 * 
	 * @param {*} doc kmlDom object
	 * @param {Object} options { style, callbackAttrs }
	 */
	function parseGeoJSON(doc, options) {
	  options = Object.assign({
	    style: true,
	    propertyCallbacks: null
	  }, options);
	  var features = [];
	  var placemarks = dom$1.get(doc, 'Placemark');
	  var stylePropertiesSetter = options && options.style ? parseStyle(doc, {
	    returnPropertiesSetter: true
	  }) : null;
	  for (var j = 0; j < placemarks.length; j++) {
	    features.push(parsePlacemark(placemarks[j], stylePropertiesSetter, options));
	  }
	  return {
	    type: 'FeatureCollection',
	    features: features
	  };
	}
	function parse(kmlDocument, options) {
	  var defaultOptions = {
	    folderElements: ['Folder']
	  };
	  options = Object.assign(defaultOptions, options || {});
	  var folders = parseFolder(kmlDocument, options);
	  var featureCollection = parseGeoJSON(kmlDocument, options);
	  return {
	    geoJSON: featureCollection,
	    folders: folders
	  };
	}
	var parse_1 = parse;
	var parseFolder_1 = parseFolder;
	var parseGeoJSON_1 = parseGeoJSON;
	var arcgisConvertor_1 = arcgis;
	var geoJSONConvertor_1 = geojson;
	var kmlify_1 = kmlify;
	var parseDescription_1 = parseDescription;
	var src = {
	  parse: parse_1,
	  parseFolder: parseFolder_1,
	  parseGeoJSON: parseGeoJSON_1,
	  arcgisConvertor: arcgisConvertor_1,
	  geoJSONConvertor: geoJSONConvertor_1,
	  kmlify: kmlify_1,
	  parseDescription: parseDescription_1
	};

	exports.arcgisConvertor = arcgisConvertor_1;
	exports["default"] = src;
	exports.geoJSONConvertor = geoJSONConvertor_1;
	exports.kmlify = kmlify_1;
	exports.parse = parse_1;
	exports.parseDescription = parseDescription_1;
	exports.parseFolder = parseFolder_1;
	exports.parseGeoJSON = parseGeoJSON_1;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
