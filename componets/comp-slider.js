/** 
*	comp-slider.js
*	@description POC of using x-tag and web worker to render html template
*/

(function (window, factory) {
    'use strict';
	if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        factory();
    }
}(window, function () {
	'use strict';

	xtag.register('comp-slider', {
	  lifecycle: {
		created: function(){
			var self = this,
				_this = this.xtag;
				
			_this.config = this.getAttribute('config');
			_this.config = parseStringToJson(_this.config);
			
			if (typeof _this.config.templatePath !== 'string' || typeof _this.config.data !== 'string') {
				return;
			}
			// create web worker
			_this.worker = new Worker('js/worker.js'); // path is relative to index.html
			
			// cache this element jquery object
			_this.$el = $(this);
			
			$.when( $.get( _this.config.templatePath ), $.get( _this.config.data ) ).done(function( tmplXhr, dataXhr ) {
				_this.tpl = tmplXhr[0]; // this is string including template tag itself
				_this.tmplData = dataXhr[0];
				self.bindTemplate(_this.tmplData);
			});	
		}
	  },
	  methods: {
		bindTemplate: function(tmplData){
			var self = this,
				_this = this.xtag;
				
			console.log('bindTemplate with data: ', tmplData);
			/*
			// no web worker
			console.time('template-process');
			var result = tmpl(_this.tpl, tmplData);
			self.innerHTML = $(result).filter('template').html();
			console.timeEnd('template-process');
			*/
			console.time('workerProcess');
			_this.worker.postMessage({cmd: 'compileTemplate', template: _this.tpl, data:tmplData });
			
			// on template compiled by web worker
			_this.worker.addEventListener('message', function(e) {
				console.timeEnd('workerProcess');
				console.log('worker: compiled template ');
				// revive string content inside the 'template' tag to html
				self.innerHTML = $(e.data).filter('template').html();
				
				// test dom search in web worker.
				var bodyHtml = $('body').html();
				_this.worker.postMessage({cmd: 'createVdom', html: bodyHtml });
				
				// TODO: make slider / carousel as web component and self execute binding on creation
				self.bindSlider();
			}, false);

		},
		// TODO: make slider logic as another self contain web component
		bindSlider: function() {
			var self = this,
				_this = this.xtag;
				
			if ($.fn.carousel){
				_this.$el.find('.carousel-body').carousel();
			}
		},
		update: function() {

		}
	  },
	  events: {
		tap: function() {

			}
		}
	});
	
	/** 
	*	parseStringToJson
	*	@description parse JSON like string to JSON like object.
	*	@param [dataStr] string
	*	@return JSON like object
	*/
	function parseStringToJson(dataStr) {
		var regexObject = /^[\{].*[\}]$/gm,
			fn,
			ret = {};
		if (typeof dataStr === 'string') {
			dataStr = dataStr.replace(/(\r\n|\n|\r)/gm,"");
			dataStr = $.trim(dataStr);
			if (regexObject.test(dataStr)){
				fn = new Function('return ' + dataStr );
				ret = fn();
			}
		}
		return ret;
	}

}));