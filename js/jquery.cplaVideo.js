(function ($) {
	var codeString = '<div class="capella-media"><div class="media-control"><div class="control-play"><input type="image" class="play-button button-paused" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAFxJREFUeNpi/P//PwOtARMDHcCoJaOWYAVngDiNYltA+QQPhoEzQJxGQC1OTKwlFFlGqiVkWUauJSRZRqklRFk2qH1C0zihaeqiaT6hyHAYZhytGUctGdqWAAQYAEx5MEoHr+MWAAAAAElFTkSuQmCC" alt="Play"></div><div class="control-scrubber"><div class="scrubber-buffer"></div><div class="scrubber-slider"></div></div><div class="control-time"><span class="time-current">00:00</span> / <span class="time-duration">00:00</span></div><div class="control-volume"><input type="image" class="volume-button" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQZJREFUeNpi/P//PwOtARMDHcCoJXS3JBWIM6hpyUwsYq+AOBiIa3HqAiVhIvHM/xAA4/sAsQ2UbQbEu4E4A5teUi2AWSIHxC1AvAeIY6Bi/kC8F4g1yLEE2YL/aHJRUItgPpoDxEXoZmCLkzNoOA2LmgVAbAHEy4D4BBAHQcX3ALEdsRFvjISxgfdIKWorEDtB2aeB2ICYiD/zHz8AqZEH4g9QNjsQ/4SyWYD4DzHBRQwoAOINULYREF+HsuWB+Am6YhYchpxFCzp0IAjEM6BsbyDeB2WbAvEFcvIJxalr0OQTuuV4ZIvQxfyhFtTi0sdIheoXVAozIyUEDMA4WsePTEsAAgwAH/KfyD1bU44AAAAASUVORK5CYII=" alt="Mute"><div class="volume-rail"></div><div class="volume-slider"></div></div></div></div>';
	var nativePlayer, scrubbing = false;

	var testVideo = !!(document.createElement('video').canPlayType);
	if (testVideo && document.createElement('video').canPlayType('video/mp4; codecs=avc1.42E01E,mp4a.40.2')) {
		nativePlayer = true;
		console.log("line8 - nativePlayer = " + nativePlayer)
	}

	//
	// plugin definition
	//
	$.fn.cplaVideo = function(options) {
		// debug(this); // calls the private function defined below
		// build main options before element iteration
		var opts = $.extend({}, $.fn.cplaVideo.defaults, options);
		// iterate each matched element
		return this.each(function() {
			var objID = $(this).attr("id");
			var $this = $("#" + objID);
			var videoDuration = $this.attr("data-media-duration");

			$this.after(codeString); // add above string, which is skeleton of video controls, after the <video> tag

			if (!nativePlayer) {
				$this.cplaVideo.load($this); // if we need a Flash fall-back, replace the <video> with an <object> containing the Flash player
				$this = $("#" + objID); // IE needs to have $this redefined once the <video> is replaced with the Flash <object>
			}

			if (nativePlayer) {
				console.log("line 29 - nativePlayer is true");
				$this.get(0).addEventListener('timeupdate', setNativeTime, false);
				$this.get(0).addEventListener('progress', setNativeBuffer, false);
				$this.get(0).addEventListener('ended', doNativeEnd, false);
				var mediaWidth = $("#" + objID).next().width() - 155;
				$("#" + objID).next().find(".scrubber-slider").css('width', mediaWidth + 'px');
			}

			$this.next().find(".scrubber-slider").slider({ // create the time scrubber
				range: 'min'//*
				,
				start: function(e, ui) {
					//console.log("start event.target: " + $(e.target).parents(".capella-media").attr("class"))
					if (nativePlayer) {
						$(e.target).parents(".capella-media").prev().get(0).removeEventListener('timeupdate', setNativeTime, false);
					}
					scrubbing = true;
				},
				stop: function(e, ui) {
					var newTime 
					//console.log("stop event.target: " + $(e.target).attr("class"))
					if (nativePlayer) {
						newTime = Math.floor($(e.target).parents(".capella-media").prev().get(0).duration * (ui.value/100));
						$(e.target).parents(".capella-media").prev().get(0).currentTime = newTime;
						$(e.target).parents(".capella-media").prev().get(0).addEventListener('timeupdate', setNativeTime, false);
					} else {
						//console.log($(e.target).parents(".capella-media").prev().attr("id"));
						$(e.target).parents(".capella-media").prev().cplaVideo.setLocation($(e.target).parents(".capella-media").prev(),(ui.value/100));
					}
					scrubbing = false;
				},
				slide: function (e, ui) {
					//console.log("slide event: " + $(e.target).attr("class"));
					$(e.target).parents(".media-control").find(".time-current").text(formatTime(videoDuration * (ui.value/100)));
				}// */ // commented out while building
			});

			$this.next().find(".play-button").click(function (e) {
				var el = $(e.target).parents(".capella-media").prev();
				if ($("body").data("vol")) {
					el.cplaVideo.setVolume(el, $("body").data("vol"));
				}
				if ($(this).hasClass("button-paused")) {
					if ($(".button-paused").length > 1 && $(".play-button").not(".button-paused").length > 0) {
						//console.log("plug-in pause other. length: " + $(".play-button").not(".button-paused").length);
						$(".play-button").not(".button-paused").click();
					}
					$this.cplaVideo.play(el);
				} else {
					$this.cplaVideo.pause(el)
				}
			});

			$this.next().find(".volume-slider").slider({ // create the volume slider
				orientation: 'vertical',
				range: 'min',
				value: 100//*
				,
				stop: function(e, ui) {
					$(e.target).parents(".capella-media").prev().cplaVideo.setVolume($(e.target).parents(".capella-media").prev(), ui.value/100);
				},
				slide: function(e, ui) {
					$(e.target).parents(".capella-media").prev().cplaVideo.setVolume($(e.target).parents(".capella-media").prev(), ui.value/100);
				}// */ // commented out while building
			});

			$this.next().find(".volume-button").click(function (e) {
				var audioVolume;
				//*
				var el = $(e.target).parents(".capella-media").prev();
				if ("playerVolume" in el.get(0)) {
					audioVolume = el.get(0).playerVolume();
				} else {
					audioVolume = el.get(0).volume;
				}
				//*
				if (audioVolume > 0) {
					$("body").data("vol",audioVolume);
					el.cplaVideo.setVolume(el, 0);
				} else {
					el.cplaVideo.setVolume(el, $("body").data("vol"));
				} // */
			});

			$this.next().find(".control-volume").focusin(function(e) {
				//console.log("event.target = " + $(e.target).attr("class"));
				$(e.target).parents(".control-volume").find(".volume-rail").show();
				$(e.target).parents(".control-volume").find(".volume-slider").show();
			});
			$this.next().find(".control-volume").focusout(function(e) {
				$(e.target).parents(".control-volume").find(".volume-rail").hide();
				$(e.target).parents(".control-volume").find(".volume-slider").hide();
			});
			$this.next().find(".control-volume").mouseenter(function(e) {
				//console.log("mouse in: " + $this.attr("id"));
				$(e.target).parents(".control-volume").find(".volume-rail").show();
				$(e.target).parents(".control-volume").find(".volume-slider").show();
			});
			$this.next().find(".control-volume").mouseleave(function(e) {
				$(this).blur();
				$(e.target).parents(".control-volume").find(".volume-rail").hide();
				$(e.target).parents(".control-volume").find(".volume-slider").hide();
			});

		});
	}

	//
	// define private functions
	/*
	function debug($obj) {
		if (window.console && window.console.log)
			window.console.log('cplaVideo selection count: ' + $obj.size());
	};
	// */

	function formatTime (secs) {
		var time="";
		var mins = ( Math.floor( secs / 60 ) < 10 ) ? "0" + Math.floor( secs / 60 ) : Math.floor( secs / 60 );
		var secs = ( secs % 60 < 10 ) ? "0" + Math.floor(secs % 60) : Math.floor(secs % 60);
		time = mins + ":" + secs;
		return time;
	}

	function setNativeTime (e) {
		//console.log("native time set: " + formatTime(e.target.currentTime));
		$(e.target).next().find(".time-duration").text(formatTime(e.target.duration));
		$(e.target).next().find(".time-current").text(formatTime(e.target.currentTime));
		setSliderHandle($(e.target), (e.target.currentTime / e.target.duration) * 100); // commented out during build
	}

	function setNativeBuffer (e) {
		var percentBuffered = parseInt((e.target.buffered.end(0) / e.target.duration) * 100);
		var mediaWidth = $(e.target).next().width();
		$(e.target).next().find(".scrubber-buffer").css('width', ( (percentBuffered / 100)  * (mediaWidth - 155) ) + 'px'); //* 155 is hard-coded for width of other controls */
	}

	function setSliderHandle (obj, val) {
		//console.log("setSliderHandle: " + val);
		obj.next().find(".scrubber-slider").slider('option', 'value', val);
	}
	
	function doNativeEnd (e) {
		//console.log("native player ended");
		$(e.target).next().find(".play-button").click();
		setSliderHandle($(e.target),0);
		if ($.fn.cplaVideo.defaults.playAll) {
			//console.log("do playAll functionality");
			playNext($(e.target));
		}
	}

	function getElement (swfID) {
		if (window.document[swfID]) {
			return window.document.getElementById(swfID);
		} else {
			if (navigator.appName.indexOf("Microsoft") != -1) {
				return window[swfID];
			} else {
				return document[swfID];
			}
		}
	};

	function volumeActual (obj, vol) {
		//*
		var volumeControl = obj.nextAll(".capella-media").find(".volume-slider");
		var volumeButton = obj.nextAll(".capella-media").find(".volume-button");
		var el = getElement(obj.attr("id"));
		if (el && "playerVolume" in el)  { 
			el.playerVolume( vol );
		}
		obj.get(0).volume = vol;
		volumeControl.slider("value",100 * vol);
		//console.log("vol = " + vol);
		if (vol > 0) {
			//console.log("volume button should show 'on' state.")
			volumeButton.attr("src","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQZJREFUeNpi/P//PwOtARMDHcCoJXS3JBWIM6hpyUwsYq+AOBiIa3HqAiVhIvHM/xAA4/sAsQ2UbQbEu4E4A5teUi2AWSIHxC1AvAeIY6Bi/kC8F4g1yLEE2YL/aHJRUItgPpoDxEXoZmCLkzNoOA2LmgVAbAHEy4D4BBAHQcX3ALEdsRFvjISxgfdIKWorEDtB2aeB2ICYiD/zHz8AqZEH4g9QNjsQ/4SyWYD4DzHBRQwoAOINULYREF+HsuWB+Am6YhYchpxFCzp0IAjEM6BsbyDeB2WbAvEFcvIJxalr0OQTuuV4ZIvQxfyhFtTi0sdIheoXVAozIyUEDMA4WsePTEsAAgwAH/KfyD1bU44AAAAASUVORK5CYII=");
		} else {
			//console.log("volume button should show 'mute' state.")
			volumeButton.attr("src","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGJJREFUeNpi/P//PwOtAeOoJSPTEiYS1c8kyxaQT4jEM/9DAAOpmFQLaGYJsgVkWYIt4s+g8Y3REwupUcKCQ9x4IFPX4LWELnFCl9Q1aPIJxTmehYSQTR8t6kctGXyWAAQYAHC3/P3A+1v/AAAAAElFTkSuQmCC");
		}
		// */
	}

	function playNext (obj) {
		var $control = obj.next();
		var controlIndex = $(".capella-media").index($control);
		//console.log("controlIndex: " + controlIndex);
		if (controlIndex + 1 < $(".capella-media").length) {
			$(".capella-media").eq(controlIndex + 1).find(".play-button").click();
		}
	}

	// define and expose our public functions
	//
	$.fn.cplaVideo.load = function(obj) {
		console.log("line 49 - load function called");
		var mediaWidth = obj.next().width() - 155;
		var objID = obj.attr("id");
		$("#" + objID).next().find(".scrubber-slider").css('width', mediaWidth + 'px');
		var videoDuration = obj.attr("data-media-duration");
		var videosrc = obj.attr("src");
		var videoURL = videosrc.substring(0,videosrc.lastIndexOf('/') + 1);
		var videoSource = videosrc.substring(videosrc.lastIndexOf('/') + 1,videosrc.length);
		console.log("223: " + videoURL + " " + videoSource);
		var flashvars = {};
			flashvars.trackingPlayerName = "WebStandardsTest | VideoPlayer";
			flashvars.trackingTitle = "WebStandardsTest | VideoPlayer | Controlled by Javascript";
			flashvars.trackingSuite = "capelladev";
			flashvars.duration = videoDuration;
			flashvars.URL = videoURL;
			flashvars.source = videoSource;
			flashvars.objID = objID;
		var params = {};
			params.allowfullscreen = "true";
			params.allowscriptaccess = "always";
			params.scale = "exactfit";
		var attributes = {};
			attributes.id = objID;
			attributes.name = objID;
		swfobject.embedSWF("CVP2_dynJS_021610_wControls.swf", objID, "480", "360", "10.0.0","expressInstall.swf", flashvars, params, attributes); // */
		console.log("id for embed: " + objID);
	};

	$.fn.cplaVideo.play = function (obj) {
		var el = getElement(obj.attr("id"));
		if (el && "playerPlay" in el)  {
			//console.log("el has playerPlay");
			el.playerPlay();
		} else if (obj.get(0).paused) {
			obj.get(0).play()
			//console.log($(obj).attr("id") + " was paused");
		}// */
		$playButton = obj.next().find(".play-button");
		$playButton.removeClass('button-paused');
		$playButton.attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADpJREFUeNpi/P//PwOtARMDHcCoJSPUEhYi1CCncUYixEfjZNSSUUtGixUCgJFE8dE4GbWEjpYABBgAYz0FNT7sTB4AAAAASUVORK5CYII=');
		$playButton.attr('alt', 'Pause');//*/
	}

	$.fn.cplaVideo.pause = function (obj) {
		var el = getElement(obj.attr("id"));
		if (el && "playerPause" in el)  {
			//console.log("el has playerPause");
			el.playerPause();
		} else if (!obj.get(0).paused) {
			obj.get(0).pause()
			//console.log($(obj).attr("id") + " was playing");
		}
		$playButton = obj.next().find(".play-button");
		$playButton.addClass('button-paused');
		$playButton.attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAFxJREFUeNpi/P//PwOtARMDHcCoJaOWYAVngDiNYltA+QQPhoEzQJxGQC1OTKwlFFlGqiVkWUauJSRZRqklRFk2qH1C0zihaeqiaT6hyHAYZhytGUctGdqWAAQYAEx5MEoHr+MWAAAAAElFTkSuQmCC');
		$playButton.attr('alt', 'Play');
	}

	$.fn.cplaVideo.setVolume = function (obj, vol) {
		//console.log("setting vol " + vol + " on : " + obj.attr("id"));
		if ($.fn.cplaVideo.defaults.muteAll) {
			$(obj.get(0).tagName).each(function (i,e) {
				//*
				volumeActual($(e),vol);
				//*/
			});
		} else {
			volumeActual(obj, vol);
		}
	}

	$.fn.cplaVideo.setCurrentTime  = function ( objID, position, duration ) {
		//console.log("setCurrentTime: objID, position, duration = " + objID + ", " + position + ", " + duration);
		//console.log(scrubbing);
		if (!scrubbing) { 
			$("#" + objID).next().find(".time-current").text(formatTime(position)).end().find(".time-duration").text(formatTime(duration));
			setSliderHandle($("#" + objID), (position / duration) * 100);
		}
	}
	
	$.fn.cplaVideo.setBufferProgress = function ( objID, loadProgress ) {
		//console.log("setBufferProgress: " + loadProgress);
		//var percentBuffered = parseInt((e.target.buffered.end(0) / e.target.duration) * 100);
		var mediaWidth = $("#" + objID).next().width() - 155;
		$("#" + objID).next().find(".scrubber-buffer").css('width', ( loadProgress  * mediaWidth) + 'px');
	}

	$.fn.cplaVideo.setLocation = function(obj,location) {
		var el = getElement(obj.attr("id"));
		var mediaWidth = obj.next().width() - 155;
		var loaded = $(el).next().find(".scrubber-buffer").width() / mediaWidth;
		//console.log("percent loaded: " + ($(el).next().find(".scrubber-buffer").width() / 65) +  " location passed: " + location);
		if (el && "playerSetLocation" in el)  {
			if (location < loaded) {
				el.playerSetLocation(location);
			} else {
				el.playerSetLocation((loaded - 0.08))
			}
			//el.playerPlay();
		}
	}

	$.fn.cplaVideo.doEnded = function (objID) {
		var sel = "#" + objID;
		//console.log("plug-in knows " + objID + " ended, it exists?: " + $(sel).length);
		// click play button to toggle to "play" enabled.
		// set currentTime to 0;
		$(sel).next().find(".play-button").click();
		$(sel).cplaVideo.setLocation($(sel),0);
		if ($.fn.cplaVideo.defaults.playAll) {
			//console.log("do plug-in playAll functionality");
			playNext($(sel));
		}
	}
	//
	// plugin defaults
	//
	$.fn.cplaVideo.defaults = {
		addFooter : false,
		muteAll : true,
		playAll : false
	};

})(jQuery);