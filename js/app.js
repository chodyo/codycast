
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

		// this.cast.session.media.push(name);
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

	// TODO
	$scope.onInitSuccess = function(e) {
		console.log("init success");
	};

	// TODO
	$scope.onError = function(e) {
		console.log("error: " + e.code);
	};





/*



	// the google example app loads in a bunch of media from a file
	// this method scans the file to see which movie we're on
	// i don't need it because i don't intend on doing it that way
	// $scope.syncCurrentMedia = function(curerntMediaURL) {

	// }

	$scope.sessionUpdateListener = function(isAlive) {
		if (!isAlive) {
			this.cast.session = null;
			this.cast.deviceState = DEVICE_STATE.IDLE;
			this.cast.playerState = PLAYER_STATE.IDLE;
			this.currentMediaSession = null;
			clearInterval(this.cast.timer);
			this.updateDisplayMessage();
		}
	}

	$scope.updateDisplayMessage = function() {
		if (this.cast.deviceState != DEVICE_STATE.ACTIVE || this.cast.playerState == PLAYER_STATE.IDLE || this.cast.playerState == PLAYER_STATE.STOPPED) {
			this.pageState.title = "CODYCAST";
			this.pageState.device = "";
		}
		else {
			this.pageState.title = this.cast.mediaContents[this.cast.currentMediaIndex]['title'];
			this.pageState.device = this.cast.playerState + " on " + this.cast.session.receiver.friendlyName;
		}
	}

	// TODO
	$scope.discoverDevices = function() {
		console.log("discovering devices");

		$scope.requestSession();
	};

	// TODO
	$scope.requestSession = function() {
		console.log("requesting session");
		chrome.cast.requestSession($scope.onRequestSessionSuccess, $scope.onLaunchError);
	};

	// TODO
	$scope.onRequestSessionSuccess = function(e) {
		console.log("session request success");
		$scope.cast.session = e;
	};

	*/

});