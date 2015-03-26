
// get cast set up in the background once the page has loaded
$(document).ready(function(){
	angular.element($('#controller')).scope().setBaseURL(document.URL);

	var loadCastInterval = setInterval(function(){
        if (chrome.cast.isAvailable) {
            console.log('Cast has loaded.');
            clearInterval(loadCastInterval);
            angular.element($('#controller')).scope().initializeCastApi();
        } 
        else {
            console.log('Unavailable');
        }
	}, 1000);
});

$(document).on("click", ".select", function() {
	var file = $(this).parent().parent().find(".file");
	file.trigger("click");
});



// constants

// var DEVICE_STATE = {
// 	"IDLE": 	0,
// 	"ACTIVE": 	1,
// 	"WARNING": 	2,
// 	"ERROR": 	3
// };

var PLAYER_STATE = {
	"BUFFERING" : "BUFFERING", 
	"IDLE" 		: "IDLE", 
	"PAUSED" 	: "PAUSED", 
	"PLAYING" 	: "PLAYING"
};



angular.module('codycast', [

])
.controller('pageController', function($scope) {

// variables

	$scope.pageState = {
		selected: false,
		title: "CODYCAST",
		device: "",
		isSeeking: false,
		currentTime: null,
		isCounting: false,
		customTime: null
	};

	$scope.queue = {
		files: []
	}

	$scope.cast = {
		// boolean
		receivers_available: false,

		// 
		baseURL: "",
		currentURL: "",

		// the chrome.cast.Session object
		session: null,
		// // the state of the device
		// deviceState: DEVICE_STATE.IDLE,
		// the state of the player
		playerState: PLAYER_STATE.IDLE,

		// which video in my queue is being played
		currentMediaIndex: -1,
		// a chrome.cast.media.Media ojbect
		currentMediaObject: null,
	};


// page functions

	$scope.setBaseURL = function(url) {
		$scope.cast.baseURL = url + "media/";
		console.log("Set base url to: " + $scope.cast.baseURL);
	}

	$scope.handlePlayVideo = function(element) {
		var video = element.files[0];
		$scope.pageState.selected = true;
		$scope.pageState.title = video.name.split(".mp4")[0];
		$scope.cast.currentURL = $scope.cast.baseURL + video.name;
		console.log(video);

		$scope.handleQueueVideo(video.name);

		this.launchApp();
	}

	$scope.addQueueItem = function(element) {debugger;
		var video = element.files[0];
		var url = $scope.cast.baseURL + video.name;
		element.value = '';
		console.log(video);



		$scope.handleQueueVideo(video.name);
	}

	$scope.handleQueueVideo = function(filename) {debugger;
		var name = filename.split(".mp4")[0];

		// handle duplicates
		if ($scope.queue.files.indexOf(name) > -1) {
			var i = 1;
			name += ' (' + i++ + ')';
			do {
				name = name.slice(0, -4);
				name += ' (' + i++ + ')';
			} while ($scope.queue.files.indexOf(name) > -1);
		}
		
		$scope.queue.files.push(name);
		$scope.$apply();
	};

	$scope.removeQueueItem = function(i) {
		console.log("Remove queue item: " + i);
		$scope.queue.files.splice(i, 1);
		// TODO: remove item from chromecast queue
	}


// cast functions

	$scope.launchApp = function() {
		console.log("Launching the Chromecast App...");
		chrome.cast.requestSession($scope.onRequestSessionSuccess, $scope.onLaunchError);
	}

	$scope.initializeCastApi = function() {   

		console.log("initializing Cast API");

		// request session
		var appID = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
		var sessionRequest = new chrome.cast.SessionRequest(appID);
		var apiConfig = new chrome.cast.ApiConfig(sessionRequest, 
												$scope.sessionListener, 
												$scope.receiverListener);
		chrome.cast.initialize(apiConfig, $scope.onInitSuccess, $scope.onError);
	};

	$scope.sessionListener = function(e) {
		$scope.cast.session = e;
		$scope.cast.session.addUpdateListener($scope.sessionUpdateListener.bind(this));
		$scope.pageState.device = $scope.cast.session.receiver.friendlyName;

		if ($scope.cast.session.media.length != 0) {
			$scope.pageState.selected = true;
			for (m in $scope.cast.session.media) {
				// add chromecast queued videos to angular queue
				var video = $scope.cast.session.media[m];
				$scope.handleQueueVideo(video.media.contentId.replace($scope.cast.baseURL, ""));
				if ($scope.isCurrentVideo(video.playerState)) {
					// this is the one that's currently playing
					$scope.cast.playerState = video.playerState;
					$scope.cast.currentMediaIndex = parseInt(m);
					$scope.pageState.title = $scope.getTitleFromURL(video.media.contentId);
					$scope.pageState.currentTime = video.currentTime;
					video.addUpdateListener($scope.onMediaStatusUpdate);
				}
			}

			var text = "Found " + $scope.cast.session.media.length + $scope.plurality($scope.cast.session.media.length, " video.", " videos.");
			console.log(text);
		}

		$scope.timerInterval();
		$scope.$apply();
	};

	$scope.sessionUpdateListener = function(isAlive) {
		var message = isAlive ? "Session updated." : "Session removed." ;
		console.log(message);
		if (!isAlive) {
			$scope.cast.session = null;
		}

		$scope.$apply();
	}

	$scope.onMediaStatusUpdate = function(isAlive) {
		console.log("Updated media.");
		if (!$scope.pageState.isSeeking) {
			for (m in $scope.cast.session.media) {
				var video = $scope.cast.session.media[m];
				if ($scope.isCurrentVideo(video.playerState)) {
					$scope.pageState.currentTime = video.currentTime;
					$scope.cast.playerState = video.playerState;
					break;
				}
			}
		}
		$scope.timerInterval();

		$scope.$apply();
	}

	$scope.receiverListener = function(e) {
		if (e === "available") {
			console.log("receiver found");
		}
		else {
			console.log("no receivers available")
		}
	};

	$scope.onInitSuccess = function(e) {
		console.log("init success");
	};

	$scope.onError = function(e) {
		console.log("error: " + e.code);
	};

	$scope.onRequestSessionSuccess = function(e) {
        console.log("Successfully created session: " + e.sessionId);
        $scope.cast.session = e;
        $scope.pageState.device = $scope.cast.session.receiver.friendlyName;
        $scope.$apply();
        $scope.loadMedia();
	};

	$scope.onLaunchError = function(e) {
        console.log("Error connecting to the Chromecast.");
	};

	
// media stuff

	$scope.loadMedia = function() {
		if (!$scope.cast.session) {
			console.log("No session.");
			return;
		}

		console.log("Playing video from url: " + $scope.cast.currentURL);
		var mediaInfo = new chrome.cast.media.MediaInfo($scope.cast.currentURL);
		mediaInfo.contentType = 'video/mp4';

		var request = new chrome.cast.media.LoadRequest(mediaInfo);
		request.autoplay = true;

		$scope.cast.session.loadMedia(request, $scope.onLoadSuccess, $scope.onLoadError);
	}

	$scope.onLoadSuccess = function() {
		$scope.cast.session.addUpdateListener($scope.sessionUpdateListener.bind(this));
		for (m in $scope.cast.session.media) {
			var video = $scope.cast.session.media[m];
			if ($scope.isCurrentVideo(video.playerState)) {
				video.addUpdateListener($scope.onMediaStatusUpdate);
				$scope.cast.currentMediaIndex = parseInt(m);
			}
		}

		// $scope.cast.playerState = PLAYER_STATE.PLAYING;
		// $scope.pageState.currentTime = 0.00001;
		// $scope.$apply();

		// don't need this - chromecast auto updates when a new video begins playing
		// $scope.timerInterval();

		console.log("Successfully loaded video.");	
	}

	$scope.onLoadError = function(e) {
		$scope.pageState.selected = false;
		$scope.pageState.title = "CODYCAST";
		$scope.$apply();

		console.log("Failed to send media to Chromecast.");
		console.log(e);
		alert("The Chromecast couldn't find the video you wanted to play!\n\nBe sure to select a file from the {server}/codycast/media directory!");
	}

// 	$scope.queueMedia = function(URL) {
// debugger;
// 		if (!$scope.cast.session) {
// 			console.log("No session.");
// 			return;
// 		}

// 		console.log("Queueing video from url: " + URL);
// 		var mediaInfo = new chrome.cast.media.MediaInfo(URL);
// 		mediaInfo.contentType = 'video/mp4';

// 		var request = new chrome.cast.media.LoadRequest(mediaInfo);
// 		request.autoplay = false;

// 		$scope.cast.session.loadMedia(request, $scope.onLoadSuccess, $scope.onLoadError);
// 	}


// button/interaction stuff

	$scope.playPause = function() {
		for (m in $scope.cast.session.media) {
			var video = $scope.cast.session.media[m];
			if ($scope.isCurrentVideo(video.playerState)) {
				if ($scope.cast.playerState === PLAYER_STATE.PLAYING) {
					// send pause request
					video.pause(video.PauseRequest,
						$scope.onInteractionSuccess("Paused video.", PLAYER_STATE.PAUSED),
						$scope.onInteractionError);
					break;
				}
				else if ($scope.cast.playerState === PLAYER_STATE.PAUSED) {
					// send play request
					video.play(video.PlayRequest,
						$scope.onInteractionSuccess("Playing video.", PLAYER_STATE.PLAYING),
						$scope.onInteractionError);
					break;
				}
				// // reach this state from STOP button
				// else if ($scope.cast.playerState === PLAYER_STATE.IDLE && $scope.pageState.selected) {
				// 	// TODO: play video at current spot in queue
				// 	video.play(video.PlayRequest,
				// 		$scope.onInteractionSuccess("Playing video.", PLAYER_STATE.PLAYING),
				// 		$scope.onInteractionError);
				// 	break;
				// }
			}
		}
	}

	// $scope.stop = function() {
	// 	for (m in $scope.cast.session.media) {
	// 		var video = $scope.cast.session.media[m];
	// 		if ($scope.isCurrentVideo(video.playerState)) {
	// 			$scope.cast.session.stop($scope.onStopSuccess, $scope.onInteractionError);
	// 		}
	// 	}
	// }

	// $scope.onStopSuccess = function() {
	// 	$scope.pageState.title = "CODYCAST";
	// 	$scope.cast.playerState = PLAYER_STATE.IDLE;
	// 	$scope.$apply();
	// 	console.log("Stopped playback.");
	// }

	$scope.jumpForward = function(sec) {
		for (m in $scope.cast.session.media) {
			var video = $scope.cast.session.media[m];
			if ($scope.isCurrentVideo(video.playerState)) {
				var currentTime = $scope.pageState.currentTime;
				var newTime = currentTime + sec;
				var maxTime = video.media.duration;
				newTime = ( (maxTime < newTime) ? maxTime : newTime );

				var seekRequest = new chrome.cast.media.SeekRequest();
				seekRequest.currentTime = newTime;
				video.seek(seekRequest,
					$scope.onInteractionSuccess("Successfully performed a seek to time " + $scope.humanReadableTime(newTime)),
					$scope.onInteractionError);

				break;
			}
		}
	}

	$scope.jumpBack = function(sec) {
		for (m in $scope.cast.session.media) {
			var video = $scope.cast.session.media[m];
			if ($scope.isCurrentVideo(video.playerState)) {
				var currentTime = $scope.pageState.currentTime;
				var newTime = currentTime - sec;
				newTime = ( (newTime < 0) ? 0 : newTime );

				var seekRequest = new chrome.cast.media.SeekRequest();
				seekRequest.currentTime = newTime;
				video.seek(seekRequest,
					$scope.onInteractionSuccess("Successfully performed a seek to time " + $scope.humanReadableTime(newTime)),
					$scope.onInteractionError);

				break;
			}
		}
	}

	$scope.seekMediaByTime = function() {
		for (m in $scope.cast.session.media) {
			var video = $scope.cast.session.media[m];
			if ($scope.isCurrentVideo(video.playerState)) {
				var newTime = parseInt($scope.pageState.customTime);
				var maxTime = video.media.duration;
				newTime = ( (maxTime < newTime) ? maxTime : newTime );
				newTime = ( (0 > newTime) ? 0 : newTime );

				var seekRequest = new chrome.cast.media.SeekRequest();
				seekRequest.currentTime = newTime;
				video.seek(seekRequest,
					$scope.onInteractionSuccess("Successfully performed a seek by text input to time " + $scope.humanReadableTime(newTime)),
					$scope.onInteractionError);

				break;
			}
		}
	}

	$scope.seeking = function() {
		$scope.pageState.isSeeking = true;
	}

	$scope.seekMediaByBar = function() {
		$scope.pageState.isSeeking = true;
		for (m in $scope.cast.session.media) {
			var video = $scope.cast.session.media[m];
			if ($scope.isCurrentVideo(video.playerState)) {
				$scope.pageState.currentTime = parseInt($scope.pageState.currentTime);
				var newTime = $scope.pageState.currentTime;
				var maxTime = video.media.duration;
				newTime = ( (maxTime < newTime) ? maxTime : newTime );
				newTime = ( (0 > newTime) ? 0 : newTime );

				var seekRequest = new chrome.cast.media.SeekRequest();
				seekRequest.currentTime = newTime;
				video.seek(seekRequest,
					$scope.onInteractionSuccess("Successfully performed a seek by bar to time " + $scope.humanReadableTime(newTime)),
					$scope.onInteractionError);

				break;
			}
		}
		$scope.pageState.isSeeking = false;
	}

	$scope.disconnect = function() {
		$scope.cast.session.stop($scope.onDisconnectSuccess, $scope.onInteractionError);
	}

	$scope.onDisconnectSuccess = function() {
		$scope.pageState.selected = false;
		$scope.pageState.title = "CODYCAST";
		$scope.pageState.device = "";
		$scope.pageState.currentTime = null;
		$scope.queue.files = [];
		$scope.cast.playerState = PLAYER_STATE.IDLE;
		$scope.$apply();
		console.log("Disconnected.");
	}

	$scope.onInteractionSuccess = function(str, STATE) {
		console.log(str);
		$scope.cast.playerState = STATE;
	}

	$scope.onInteractionError = function(e) {
		console.log(e);
	}


// util functions

	$scope.plurality = function(count, singular, plural) {
		return (count == 1) ? singular : plural ;
	}

	$scope.isCurrentVideo = function(state) {
		switch(state) {
			case PLAYER_STATE.PLAYING:
				return true;
			case PLAYER_STATE.PAUSED:
				return true;
			case PLAYER_STATE.BUFFERING:
				return true;
			default:
				return false;
		}
	}

	$scope.getTitleFromURL = function(URL) {
		var title = $scope.cast.session.media[m].media.contentId.split("/");
		title = title[title.length-1].split(".mp4")[0];
		return title;
	}

	$scope.timerInterval = function() {
		if ($scope.pageState.isCounting) return;
		$scope.pageState.isCounting = true;
		var incrementTimerInterval = setInterval(function(){
	        if ($scope.cast.playerState != PLAYER_STATE.PLAYING || !$scope.pageState.currentTime) {
	            // console.log('Do not increment timer.');
	            $scope.pageState.isCounting = false;
	            clearInterval(incrementTimerInterval);
	        } 
	        else if (!$scope.pageState.isSeeking) {
	            $scope.pageState.currentTime += 1;
	            $scope.$apply();
	        }
		}, 1000);
	}

	$scope.humanReadableTime = function(sec) {
		var hours = Math.floor(sec/3600);
		hours = (hours < 10) ? "0" + hours + ":" : hours + ":" ;

		sec = sec % 3600;

		var minutes = Math.floor(sec/60);
		minutes = (minutes < 10) ? "0" + minutes + ":" : minutes + ":" ;

		sec = sec % 60;

		var seconds = Math.round(sec);
		seconds = (seconds < 10) ? "0" + seconds : seconds ;

		return hours+minutes+seconds;
	}

});