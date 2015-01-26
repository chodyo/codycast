
// get cast set up in the background once the page has loaded
$(document).ready(function(){
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
	"IDLE" : "IDLE", 
	"LOADING" : "LOADING", 
	"LOADED" : "LOADED", 
	"PLAYING" : "PLAYING",
	"PAUSED" : "PAUSED",
	"STOPPED" : "STOPPED",
	"SEEKING" : "SEEKING",
	"ERROR" : "ERROR"
};




angular.module('codycast', [

])
.controller('pageController', function($scope) {

	// variables

	$scope.pageState = {
		selected: false,
		queueOpen: true,
		title: "CODYCAST",
		device: ""
	};

	$scope.queue = {
		files: []
	}

	$scope.cast = {
		// boolean
		receivers_available: false,

		// the chrome.cast.Session object
		session: null,
		// the state of the device
		deviceState: DEVICE_STATE.IDLE,
		// the state of the player
		playerState: PLAYER_STATE.IDLE,

		// 
		currentMediaIndex: -1,
		// a chrome.cast.media.Media ojbect
		currentMediaSession: null,
		// a timer for tracking progress of media
		timer: 0
	};


	// page functions

	$scope.handleSelectedVideo = function(element) {
		this.addVideoToQueue(element);
		this.launchApp();
	}

	$scope.addVideoToQueue = function(element) {
		var movie = element.files[0];
		$scope.pageState.selected = true;
		$scope.pageState.title = movie.name.split(".mp4")[0];
		$scope.queue.files.push(movie);
		$scope.$apply();
		console.log(movie);
	};


	// cast functions

	$scope.launchApp = function() {
		console.log("Launching the Chromecast App...");
		chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
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
		
		// can do UI stuff here
	};

	$scope.sessionListener = function(e) {
		console.log("New session.");

		this.cast.session = e;
		if (session.media.length != 0) {
			console.log("Found " + $scope.session.media.length + "sessions.");
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

	function onRequestSessionSuccess(e) {
        console.log("Successfully created session: " + e.sessionId);
        $scope.cast.session = e;
	}

	function onLaunchError() {
        console.log("Error connecting to the Chromecast.");
	}

});