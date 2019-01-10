/*Copyright (c) 2017 Dominik Homberger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

https://webpjs.appspot.com
WebPImageViewer dominikhlbg@gmail.com
*/

function _decodeWithWorker (response, src_off, src_size, frame, callback) {
	var webPWorker = null;

	if (window.Worker) {
		var t0 = performance.now();

		webPWorker = new Worker('js/webp-utils.worker.js');
		webPWorker.postMessage({'cmd': 'init'});
		webPWorker.postMessage({'cmd': 'decode', 'response': response, 'src_off': src_off, 'src_size': src_size});

		webPWorker.onmessage = function (e) {
			var params = e.data;
			
			switch(params.cmd) {
				case 'initComplete':
					console.log('init complete: ' + (performance.now() - t0) + ' ms');
					break;

				case 'decodeComplete':
					if (params.success && params.res) {
						callback(params.res, params.width, params.height, frame);
					} else {
						callback(-1);
					}
					break;
			}
		}
	}
}

function WebPImageViewer(imagearray,image) {
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
	var response=imagearray['response'];
	var header=imagearray['header']?imagearray['header']:null;
	var frames=imagearray['frames']?imagearray['frames']:null;

	if(header) {
		header['loop_counter']=header['loop_count'];
		canvas.height=header['canvas_height'];
		canvas.width=header['canvas_width'];
		var blend=false;
		for(var f=0;f<frames.length;f++)
		if(frames[f]['blend']==0) {blend=true;break;}
	}
	
	var interval=null;
	var stopsignal=false;

	var stopdrawing= this['stopdrawing']= function() {
		stopsignal=true;
		clearInterval(interval);
	}

	var framesRemaining = (frames && frames.length) ? frames.length : 1;

	for(var f=0;f<frames.length;f++) {
		//var height=[0];
		//var width=[0];
		var frame=frames[f];

		//var rgba = webpdecoder.WebPDecodeRGBA(response,frame['src_off'],frame['src_size'],width,height);
		_decodeWithWorker(response,frame['src_off'],frame['src_size'], frame, function (rgba, w, h, tgtFrame) {
			//console.log('frame: ' + tgtFrame);
			//console.log('worker reponse: ' + rgba);
			var width = [w];
			var height = [h];

			if (rgba != -1) {
				//_draw (tgtFrame, rgba, [width], [height]);
				tgtFrame['rgba']=rgba;
				tgtFrame['imgwidth']=width[0];
				tgtFrame['imgheight']=height[0];
				if(!header) {
					canvas.height=height[0];
					canvas.width=width[0];
				} else {
					if(blend) {
						var oldimagedata;
						var oldimagedata=[];
						var oldimagedata_=ctx.getImageData(tgtFrame['offset_x'], tgtFrame['offset_y'],width[0], height[0]);
						for(var i=0;i<width[0]*height[0]*4;i++)
							oldimagedata[i]=oldimagedata_.data[i];
					}
				}
				var imagedata = ctx.createImageData(width[0], height[0]);		
					
				if((frames.length==1&& typeof tgtFrame['blend']==='undefined') || tgtFrame['blend']==1) {
					for(var i=0;i<width[0]*height[0]*4;i++)
						imagedata.data[i]=rgba[i];
				} else {
					for(var i=0;i<width[0]*height[0]*4;i+=4) {
						if(rgba[i+3]>0) {
							imagedata.data[i+3]=rgba[i+3];
							imagedata.data[i]=rgba[i];
							imagedata.data[i+1]=rgba[i+1];
							imagedata.data[i+2]=rgba[i+2];
						} else {
							imagedata.data[i+3]=oldimagedata[i+3];
							imagedata.data[i]=oldimagedata[i];
							imagedata.data[i+1]=oldimagedata[i+1];
							imagedata.data[i+2]=oldimagedata[i+2];
						}
					}
				}
				if(frames.length==1)
				ctx.putImageData(imagedata, 0, 0); else
				ctx.putImageData(imagedata, tgtFrame['offset_x'], tgtFrame['offset_y']);
				
				if(imagearray['dataurl'])
				tgtFrame['dataurl']=canvas.toDataURL();
				//canvas.toBlob(function(blob) {tgtFrame['dataurl']=URL.createObjectURL(blob);});
				tgtFrame['rgbaoutput']=tgtFrame['rgba']?(header?ctx.getImageData(0,0,header['canvas_width'],header['canvas_height']).data:rgba):null;

				if(tgtFrame['dispose']==1)
				ctx.clearRect(tgtFrame['offset_x'],tgtFrame['offset_y'],width[0],height[0]);
			} else {
				//error decoding frame
				console.log("error frame");
			}

			framesRemaining--;
			if (framesRemaining == 0) {
				drawframes(imagearray,0,image);
			}
		});
		//console.log("time taken to decode frame " + (f + 1)  + ": " + (performance.now() - t0));
	}

	function drawframes(imagearray,frame,image) {
		var header=imagearray['header']?imagearray['header']:null;
		var frames=imagearray['frames']?imagearray['frames']:null;

		if(frames.length==1) { try{image(frames[frame]);}catch(e) {stopdrawing();} return; }
		if(frames.length<=frame) {frame=0;if(header['loop_count']!=0)header['loop_counter']--}

		if((header['loop_count']==0 || (header['loop_count']!=0&&header['loop_counter']>0)) && !stopsignal)	{
			interval=setTimeout(function() { 
				try{
					image(frames[frame]);
				}catch(e) {
					console.log("Error drawing frame: ");
					console.log(e);
					stopdrawing();
				} 
				drawframes(imagearray,frame+=1,image)
			}, frames[frame]['duration']>0?frames[frame]['duration']:100 );
		}
	}
}

window['WebPImageViewer']=WebPImageViewer;