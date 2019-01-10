importScripts('libwebp-0.6.0.min.js');

var webpdecoder;

self.onmessage = function (e) {
	var param = e.data;
	switch (param.cmd) {
		case 'init':
			//console.log('webp worker init--------');
			webpdecoder=new WebPDecoder();
			self.postMessage({cmd: 'initComplete'});
			break;
		case 'decode':
			//var res = _decode(param.data);
			var width = [0];
			var height = [0];
			var rgba = webpdecoder.WebPDecodeRGBA(param.response,param.src_off,param.src_size,width,height);
			
			/*if (res.success) {
				self.postMessage({cmd: 'decodeCompleted', success: true, msg: res.msg, res: res.res});
			} else {
				self.postMessage({cmd: 'decodeCompleted', success: false, msg: res.msg, res: -1});
			}*/

			self.postMessage({cmd: 'decodeComplete', success: true, res: rgba, width: width[0], height: height[0]});
			self.close();
			break;
		case 'close':
			self.close();
			console.log('webp worker stop--------');
			break;
	}
};