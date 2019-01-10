/*Copyright (c) 2017 Dominik Homberger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

https://webpjs.appspot.com
WebPRiffParser dominikhlbg@gmail.com
*/

function memcmp(data, data_off, str, size) {
	for(var i=0;i<size;i++)
		if(data[data_off+i]!=str.charCodeAt(i))
			return true;
	return false;
}

function GetTag(data, data_off) {
	var str='';
	for(var i=0;i<4;i++)
		str +=String.fromCharCode(data[data_off++]);
	return str;
}

function GetLE16(data,data_off) {
  return (data[data_off+0] << 0) | (data[data_off+1] << 8);
}

function GetLE24(data,data_off) {
  return ((data[data_off+0] << 0) | (data[data_off+1] << 8) | (data[data_off+2] << 16))>>>0;
}

function GetLE32(data,data_off) {
  return ((data[data_off+0] << 0) | (data[data_off+1] << 8) | (data[data_off+2] << 16) | (data[data_off+3] << 24))>>>0;
}

function WebPRiffParser(src,src_off) {

	var imagearray={};
	var i=0;
	var alpha_chunk=false;
	var alpha_size=0;
	var alpha_offset=0;

	imagearray['frames']=[];

	if(memcmp(src,src_off,'RIFF',4)) return;
	src_off +=4;
	var riff_size = GetLE32(src, src_off)+8;
	src_off +=8;
	
	while(src_off<src.length) {
		var fourcc=GetTag(src,src_off);
		src_off +=4;
		
		var payload_size = GetLE32(src, src_off);
		src_off +=4;
		var payload_size_padded = payload_size + (payload_size & 1);
		
		switch(fourcc) {
			case "VP8 ":
			case "VP8L":
				if(typeof imagearray['frames'][i]==='undefined') imagearray['frames'][i]={};
				var obj=imagearray['frames'][i];
				var height=[0];
				var width=[0];
				obj['src_off']=alpha_chunk?alpha_offset:src_off-8;
				obj['src_size']=alpha_size+payload_size+8;
				//var rgba = webpdecoder.WebPDecodeRGBA(src,(alpha_chunk?alpha_offset:src_off-8),alpha_size+payload_size+8,width,height);
				//imagearray[i]={'rgba':rgba,'width':width[0],'height':height[0]};
				i++;
				if(alpha_chunk) {
					alpha_chunk=false;
					alpha_size=0;
					alpha_offset=0;
				}
				break;
			case "VP8X":
				var obj=imagearray['header']={};
				var feature_flags=obj['feature_flags']=src[src_off];
				var src_off_ =src_off+4;
				var canvas_width=obj['canvas_width']= 1 + GetLE24(src,src_off_);
				src_off_ +=3;
				var canvas_height=obj['canvas_height']= 1 + GetLE24(src,src_off_);
				src_off_ +=3;
				break;
			case "ALPH":
				alpha_chunk=true;
				alpha_size=payload_size_padded+8;
				alpha_offset=src_off-8;
				break;
			
			case "ANIM":
				var obj=imagearray['header'];
				var bgcolor=obj['bgcolor']=GetLE32(src,src_off);
				src_off_ =src_off+4;
				
				var loop_count=obj['loop_count']=GetLE16(src,src_off_);
				src_off_ +=2;
				break;
			case "ANMF":
				var offset_x=0, offset_y=0, width=0, height=0, duration=0, blend=0, dispose=0, temp=0;
				var obj=imagearray['frames'][i]={};
				obj['offset_x']=offset_x = 2 * GetLE24(src,src_off); src_off +=3;
				obj['offset_y']=offset_y = 2 * GetLE24(src,src_off); src_off +=3;
				obj['width']=width = 1 + GetLE24(src,src_off); src_off +=3;
				obj['height']=height = 1 + GetLE24(src,src_off); src_off +=3;
				obj['duration']=duration = GetLE24(src,src_off); src_off +=3;
				temp = src[src_off++];
				obj['dispose']=dispose = temp & 1;
				obj['blend']=blend = (temp >> 1) & 1;
				break;
			default:
		}
		if(fourcc!="ANMF")
		src_off+=payload_size_padded;
	}
	return imagearray;
}

//window['WebPRiffParser']=WebPRiffParser;

function createRequestObject() {
	var ro;
	var browser = navigator.appName;
	if(browser == "Microsoft Internet Explorer"){
		ro = new ActiveXObject("Microsoft.XMLHTTP");
	}else{
		ro = new XMLHttpRequest();
	}
	return ro;
}

function convertResponseBodyToText(IEByteArray) {
	var ByteMapping = {};
	for ( var i = 0; i < 256; i++ ) {
		for ( var j = 0; j < 256; j++ ) {
			ByteMapping[ String.fromCharCode( i + j * 256 ) ] = 
				String.fromCharCode(i) + String.fromCharCode(j);
		}
	}
	var rawBytes = IEBinaryToArray_ByteStr(IEByteArray);
	var lastChr = IEBinaryToArray_ByteStr_Last(IEByteArray);
	return rawBytes.replace(/[\s\S]/g, 
		function( match ) { return ByteMapping[match]; }) + lastChr;
}
 
var IEBinaryToArray_ByteStr_Script = 
	"<!-- IEBinaryToArray_ByteStr -->\r\n"+
	"<script type='text/vbscript'>\r\n"+
	"Function IEBinaryToArray_ByteStr(Binary)\r\n"+
	"	IEBinaryToArray_ByteStr = CStr(Binary)\r\n"+
	"End Function\r\n"+
	"Function IEBinaryToArray_ByteStr_Last(Binary)\r\n"+
	"	Dim lastIndex\r\n"+
	"	lastIndex = LenB(Binary)\r\n"+
	"	if lastIndex mod 2 Then\r\n"+
	"		IEBinaryToArray_ByteStr_Last = Chr( AscB( MidB( Binary, lastIndex, 1 ) ) )\r\n"+
	"	Else\r\n"+
	"		IEBinaryToArray_ByteStr_Last = "+'""'+"\r\n"+
	"	End If\r\n"+
	"End Function\r\n"+
	"</script>\r\n";
document.write(IEBinaryToArray_ByteStr_Script);

function loadfile(filename, type, callback) {
	console.log('load file: ' + filename);

	var http = createRequestObject();

	if (!filename) return -1;
	if (typeof type==='undefined') type='dec';
	//document.getElementById('testbild').innerHTML='server query....';
	if (type==='dec') {	
		http.open('get', filename); 
		
		if (http.overrideMimeType)
			http.overrideMimeType('text/plain; charset=x-user-defined');
		else
			http.setRequestHeader('Accept-Charset', 'x-user-defined');
	
		http.onreadystatechange = function() {
			if(http.readyState == 4){
				if (typeof http.responseBody=='undefined') {
					var response = http.responseText.split('').map(function(e){return String.fromCharCode(e.charCodeAt(0) & 0xff)}).join('');
				} else {
					var response = convertResponseBodyToText(http.responseBody);
				}
				//console.log(response);
				if (type==='dec')
					WebPDecodeAndDraw(response, callback); 
			} //else alert('Cannot load file. Please, try again');
		};
		http.send(null);
		
	} //else
	//if (type==='enc')
		//encode webp
		//ImageToCanvas('/images-enc/'+filename)
}

/*function EventListener(obj,evt,fnc,useCapture){
	if (!useCapture) useCapture=false;
	if (obj.addEventListener){
		obj.addEventListener(evt,fnc,useCapture);
		return true;
	} else if (obj.attachEvent) return obj.attachEvent("on"+evt,fnc);
	else{
		MyAttachEvent(obj,evt,fnc);
		obj['on'+evt]=function(){ MyFireEvent(obj,evt) };
	}
} 

function MyAttachEvent(obj,evt,fnc){
	if (!obj.myEvents) obj.myEvents={};
	if (!obj.myEvents[evt]) obj.myEvents[evt]=[];
	var evts = obj.myEvents[evt];
	evts[evts.length]=fnc;
}
function MyFireEvent(obj,evt){
	if (!obj || !obj.myEvents || !obj.myEvents[evt]) return;
	var evts = obj.myEvents[evt];
	for (var i=0,len=evts.length;i<len;i++) evts[i]();
} 

////------------------------------------------------------------------------

function WebPDecDemo() {
	var canvas = document.getElementById("outputDecoderCanvas"),
	context = canvas.getContext("2d"),
	outputData = null,
	output = null,
	active = null,
	img = document.createElement("img"),
	decSpeedResult = document.getElementById("decSpeedResult"),
	decSaveButtons = document.getElementById("decSaveButtons");
	
	clearCanvas = function () {
		context.clearRect(0, 0, canvas.width, canvas.height);
	};
	resizeCanvas = function () {
		canvas.width=img.width;
		canvas.height=img.height;
	}
	if (typeof FileReader !== "undefined")	
	context.fillText("Drop an *.WEBP image here and wait", 60, 80);
	else
	context.fillText("Choose on an sample image 1 - 5.webp", 56, 80);
		
	EventListener(img, "load", function () {
		clearCanvas();
		resizeCanvas();
		context.drawImage(img, 0, 0);
		finishInit();
	}, false);
	
	EventListener(canvas, "dragenter", function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
	}, false);

	EventListener(canvas, "dragover", function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
	}, false);

	EventListener(canvas, "drop", function (evt) {
		var files = evt.dataTransfer.files;
		if (files.length > 0) {
			evt.preventDefault();
			evt.stopPropagation();
			var file = files[0];
			if (typeof FileReader !== "undefined") {
				var freader = new FileReader();
				freader.onload = function (evt) {
					if (WebPDecodeAndDraw(evt.target.result)) {
						finishDecoding(); 
					} else {
						//alert('This isn\'t a webp image.');
					}
				};
				freader.readAsBinaryString(file);
			} else {
				alert('Your Browser don\'t support the Filereader API');
			}
		}
			
	}, false);
	
	createSaveButtons = function () {
		if (decSaveButtons.innerHTML=='') {
			var imageOptions=new Array('PNG','png','JPEG','jpeg','Bitmap','bmp');//
			
			for(var i=0; i<imageOptions.length;i +=2) {
				var saveImage = document.createElement("button");
				saveImage.innerHTML = "Save as "+imageOptions[i+1];
				EventListener(saveImage,"click", function (evt) {
					window.open(canvas.toDataURL("image/"+evt.target.innerHTML.split(" ")[2]));
					evt.preventDefault();
				}, false);
				decSaveButtons.appendChild(saveImage);
			}
		}
	};*/

	
	//img = document.createElement("img")
	/*
	clearCanvas = function () {
		context.clearRect(0, 0, canvas.width, canvas.height);
	};*/
	/*
	resizeCanvas = function () {
		canvas.width=img.width;
		canvas.height=img.height;
	}
	*/
	finishDecoding = function () {
		//createSaveButtons();
		//console.log('decode finished');
		
	};
	
	function convertBinaryToArray(binary) {
		var arr = new Array();
		var num=binary.length;
		var i;
		for(i=0;i<num;++i)
			arr.push(binary.charCodeAt(i));
		return arr;
	}

	WebPDecodeAndDraw = function (response, callback) {
		var firstFrameCompleted = false;

		//var webpdecoder;
		var viewer;

		var canvas = document.createElement("canvas");//document.getElementById("outputDecoderCanvas"),
		var context = canvas.getContext("2d");

		//if (!webpdecoder) webpdecoder=new WebPDecoder();
		
		//var stop=false;
		
		if(viewer) { 
			//stop=true;
			viewer.stopdrawing();
		}
		
		var start = new Date();

		response=convertBinaryToArray(response);//unkonvertierung in char

		///--------- libwebpjs 0.6.0 decoder code start ---------------------------------------------
		
		var imagearray=WebPRiffParser(response,0);
		imagearray['response']=response;
		imagearray['rgbaoutput']=true;
		imagearray['dataurl']=false;

		viewer = new WebPImageViewer(imagearray,function(frame){
			var ctx = canvas.getContext('2d');
			var width=imagearray['header']?imagearray['header']['canvas_width']:frame['imgwidth'];
			var height=imagearray['header']?imagearray['header']['canvas_height']:frame['imgheight'];
			canvas.height=height;
			canvas.width=width;
			var imagedata = ctx.createImageData(width, height);	
			var rgba=frame['rgbaoutput'];
			for(var i=0;i<width*height*4;i++)
				imagedata.data[i]=rgba[i];
			ctx.putImageData(imagedata, 0, 0);
			/*var img = new Image();
			img.onload = function(){
				canvas.height=img.height;
				canvas.width=img.width;
				ctx.drawImage(img,0,0);
			};
			img.src = frame['dataurl'];*/
			if (!firstFrameCompleted) {
				finishDecoding();
				callback(canvas);
				firstFrameCompleted = true;
			}
		});
		var end = new Date();
		var bench_libwebp=(end-start);
		//decSpeedResult.innerHTML='Speed result:<br />libwebpjs: finish in '+bench_libwebp+'ms'+(imagearray['frames'].length>1?' ('+imagearray['frames'].length+' frames)':''); 

		console.log('Speed result (main thread):<br />libwebpjs: finish in '+bench_libwebp+'ms'+(imagearray['frames'].length>1?' ('+imagearray['frames'].length+' frames)':''));



		//var height=[0];
		//var width=[0];
		//var bitmap = webpdecoder.WebPDecodeRGBA(response,0,response.length,width,height);
		
		///--------- libwebpjs 0.6.0 decoder code end ---------------------------------------------
		
		/*if (bitmap) {
			//Draw Image
			var start = new Date();
			var biHeight=height[0]; var biWidth=width[0];
			
			canvas.height=biHeight;
			canvas.width=biWidth;
			
			var context = canvas.getContext('2d');
			var output = context.createImageData(canvas.width, canvas.height);
			var outputData = output.data;
			
			for (var h=0;h<biHeight;h++) {			
				for (var w=0;w<biWidth;w++) {
					outputData[0+w*4+(biWidth*4)*h] = bitmap[0+w*4+(biWidth*4)*h];
					outputData[1+w*4+(biWidth*4)*h] = bitmap[1+w*4+(biWidth*4)*h];
					outputData[2+w*4+(biWidth*4)*h] = bitmap[2+w*4+(biWidth*4)*h];
					outputData[3+w*4+(biWidth*4)*h] = bitmap[3+w*4+(biWidth*4)*h];
	
				};			
			}
			
			context.putImageData(output, 0, 0);
			var end = new Date();
			var bench_canvas=(end-start);*/
		/*}*/
	};
//}

function replaceWebPImgWithCanvas (ele) {
	var t0 = performance.now();

	loadfile(ele.src, "dec", function (resElement) {
		ele.parentNode.replaceChild(resElement, ele);
		var save = document.createElement("a");
		save.href = "javascript:void(0)";
		save.onclick = function () {
			window.open(resElement.toDataURL("image/png"));
			return false;
		}
		save.innerHTML = "<< Save image";
		resElement.parentNode.insertBefore(save, resElement.nextSibling);

		var t1 = performance.now();
		console.log(ele.src + ' decoded in: ' + (t1 - t0) + 'ms');
	});
}

function findAllWebPAndReplace () {
	var allImgs = document.getElementsByTagName("img");

	for (var i=0; i<allImgs.length; i++) {
		var src = allImgs[i].src;
		if (src.indexOf("webp") >= 0) {
			replaceWebPImgWithCanvas(allImgs[i]);
		}
	}
}

var holder = document.getElementById("convertedImageHolder");
var _t0 = performance.now();

loadfile(document.getElementsByTagName("img")[1].src, "dec", function (resElement) {
	while (holder.firstChild) {
		holder.removeChild(holder.firstChild);
	}
	//not correct for animated frames
	//console.log(resElement.toDataURL());
	//console.log(resElement.toDataURL());
	holder.appendChild(resElement);
	//holder.innerHTML = "<img src='" + resElement.toDataURL() + "' />";
	var _t1 = performance.now();
	console.log(document.getElementsByTagName("img")[1].src + ' decoded in: ' + (_t1 - _t0) + 'ms');
});

//findAllWebPAndReplace();
//replaceWebPImgWithCanvas(document.getElementsByTagName("img")[0]);
//replaceWebPImgWithCanvas(document.getElementsByTagName("img")[1]);
//replaceWebPImgWithCanvas(document.getElementsByTagName("img")[2]);
//replaceWebPImgWithCanvas(document.getElementsByTagName("img")[3]);
