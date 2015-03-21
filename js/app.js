
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



// constants

var DEVICE_STATE = {
	"IDLE": 	0,
	"ACTIVE": 	1,
	"WARNING": 	2,
	"ERROR": 	3
};

var PLAYER_STATE = {
	"IDLE" 		: "IDLE", 
	"LOADING" 	: "LOADING", 
	"LOADED" 	: "LOADED", 
	"PLAYING" 	: "PLAYING",
	"PAUSED" 	: "PAUSED",
	"STOPPED" 	: "STOPPED",
	"SEEKING" 	: "SEEKING",
	"ERROR" 	: "ERROR"
};




angular.module('codycast', [

])
.controller('pageController', function($scope) {

// variables

	$scope.pageState = {
		selected: false,
		title: "CODYCAST",
		device: ""
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
		// the state of the device
		deviceState: DEVICE_STATE.IDLE,
		// the state of the player
		playerState: PLAYER_STATE.IDLE,

		// which video in my queue is being played
		currentMediaIndex: -1,
		// a chrome.cast.media.Media ojbect
		currentMediaSession: null,
		// a timer for tracking progress of media
		timer: 0
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
		console.log("Playing video: " + video);

		this.handleQueueVideo(video.name);

		$scope.$apply();

		this.launchApp();
	}

	$scope.handleQueueVideo = function(t) {
		$scope.queue.files.push({title: t.split(".mp4")[0]});
		$scope.$apply();
	};


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
		console.log("Setting up session.");

		$scope.cast.session = e;
		if ($scope.cast.session.media.length != 0) {
			$scope.pageState.selected = true;
			for (m in $scope.cast.session.media) {
				// add chromecast queued videos to angular queue
				var video = $scope.cast.session.media[m];
				$scope.handleQueueVideo(video.media.contentId.replace($scope.cast.baseURL, ""));
				if ($scope.isCurrentVideo(video.playerState)) {
					// this is the one that's currently playing
					$scope.pageState.title = $scope.getTitleFromURL(video.media.contentId);
				}
			}

			var text = "Found " + $scope.cast.session.media.length + $scope.plurality($scope.cast.session.media.length, " video.", " videos.");
			console.log(text);

			$scope.$apply();
		}
	};

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
			case PLAYER_STATE.SEEKING:
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

});