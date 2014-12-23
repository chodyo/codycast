
// DOM manipulation

// document.addEventListener("DOMContentLoaded", function() {
// 	$("#selectFile").addEventListener("change", angular.element(this).scope().addVideoToQueue(this));
// });


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

	$scope.selectedVideo = "";

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

	$scope.addVideoToQueue = function(element, scope) {
		var name = element.files[0];
		// console.log(name);

		this.initializeCast();
	};


	// cast functions

	$scope.initializeCast = function() {
		// if (!chrome.cast || !chrome.cast.isAvailable) {
		// 	setTimeout($scope.initializeCast.bind(this), 1000);
		// 	return;
		// }

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

});