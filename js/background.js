//Address where the Myo Web Socket API is listening for requests
var host = "ws://127.0.0.1:7204/myo/1";

//Regex to differentiate regular windows from the background script window
var bgPattern = /Developer Tools - chrome-extension/;

var myoID = -1;
var armUsed;

//Global booleans for the state of the Myo
chrome.browserAction.setPopup({popup: ""});

//Timestamp of the last unlocked gesture
var lastGestureTimeStamp = 0;

//How many seconds to wait after a gesture before locking the myo again
var lockTime = 3

//If our accelerometer Z value is larger than this we will scroll
var accThreshold = 1;

var oneScreen;

// Setting page stuff
chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (key in changes) {
	    if (key == "scrollPx") {
	        scrollPx = changes[key];
	    }
	    else if (key == "lockTime") {
	        lockTime = changes[key];
	    }
	    else if (key == "oneScreen") {
	        oneScreen = changes[key];
	    }
	}
});
console.log("Host:", host);

var s = new WebSocket(host);
var manager = new ModeManager();
manager.windowArray = [];

//Window Array/Tab Stack
chrome.windows.onCreated.addListener(function (window) {
	/*
	//adds window.id to the array.
	var closeStack = [];
	var openStack = [];
	manager.windowArray.push({id:window.id, closeTabStack: closeStack, openTabStack: openStack});
	*/
});

chrome.windows.onRemoved.addListener(function (windowID) {
	/*
	for (var i = 0; i < manager.windowArray.length; i++){
		if (manager.windowArray[i].id === windowID){
			manager.windowArray.splice(i-1, 1);
			break;
		}
	}
	*/
});

//WiP tab stacks
chrome.tabs.onCreated.addListener(function (tab) {
	/*
	chrome.windows.getLastFocused({populate: true}, function(window){
		var windowID = window.id;
		for (var i = 0; i < manager.windowArray.length; i++){
			if (manager.windowArray[i].id === windowID){
				manager.windowArray[i].openTabStack.push(tab);
				break;
			}
		}
	});
	*/
});

//WiP tab stacks
chrome.tabs.onUpdated.addListener(function(tabID, changeInfo, tab){

	/*
	chrome.windows.getLastFocused({populate: true}, function(window){
		var windowID = window.id;
		var currentWindowArrayElement;
		var changeEle;
		for (var i = 0; i < manager.windowArray.length; i++){
			if (manager.windowArray[i].id === windowID){
				currentWindowArrayElement = manager.windowArray[i];
				changeEle = i;
				break;
			}
		}
		for (var i = 0; i < currentWindowArrayElement.openTabStack.length; i++){
			if (currentWindowArrayElement.openTabStack[i].id === tabID){
				manager.windowArray[changeEle].openTabStack[i].url = changeInfo.url;
				return;
			}
		}
	});
	*/
});

//WiP tab stacks
chrome.tabs.onRemoved.addListener(function (tabID) {
	/*
	chrome.windows.getLastFocused({populate: true}, function(window){
		var windowID = window.id;
		var currentWindowArrayElement;
		for (var i = 0; i < manager.windowArray.length; i++){
			if (manager.windowArray[i].id === windowID){
				currentWindowArrayElement = manager.windowArray[i];
				break;
			}
		}
		for (var i = 0; i < currentWindowArrayElement.openTabStack.length; i++){
			if (currentWindowArrayElement.openTabStack[i].id === tabID){
				lastOpenedTab = currentWindowArrayElement.openTabStack[i];
				currentWindowArrayElement.closeTabStack.push(lastOpenedTab);
				return;
			}
		}
	});
	*/
});


s.onopen = function (e) {
	console.log("Socket opened.");
};

s.onclose = function (e) {
	console.log("Socket closed.");
};

s.onmessage = function (e) {

	var json = JSON.parse(e.data);
	var data = json[1];

	//console.log(parseInt(data.timestamp - lastGestureTimeStamp) / 1000000);
	if (manager.mode.getModeName() !== "Locked" && (parseInt(data.timestamp) - lastGestureTimeStamp) / 1000000 > lockTime){
		console.log("Locking!");
		manager.changeMode(new LockedBrowserMode(manager));
		chrome.browserAction.setIcon({path : "img/locked.png"});
		requestVibrate();
	}

	if (data.type === "arm_recognized"){
		armUsed = data.arm;
		console.log(armUsed);
	}

	if (data.type === "pose" && myoID != -1){

		if (data.pose === "thumb_to_pinky"){
			manager.onThumbToPinky(data);
			if (manager.mode.getModeName() !== "Locked"){
				lastGestureTimeStamp = parseInt(data.timestamp);
			}
			requestVibrate();
		}

		else if (manager.mode.getModeName() !== "Locked"){
			lastGestureTimeStamp = parseInt(data.timestamp);
			if (data.pose === "wave_in"){
				if (armUsed === "left"){
					manager.onWaveOut(data);
				}
				else {
					manager.onWaveIn(data);
				}
			}

			else if (data.pose === "wave_out")
				if (armUsed === "left"){
					manager.onWaveIn(data);
				}
				else {
					manager.onWaveOut(data);
				}
			else if (data.pose === "fist")
				manager.onFist(data);
			else if (data.pose === "fingers_spread")
				manager.onFingersSpread(data);
		}

		else if (data.pose === "rest"){
			manager.onRest(data);
		}
	}

	if (data.type === "connected"){
		myoID = data.myo;
	}
};

s.onerror = function (e) {
	console.log("Socket error:", e);
};

function requestVibrate(){
	var data = [
		"command",
		{
			"command": "vibrate",
			"myo": myoID,
			"type": "short"
		}
	];
	console.log("Sending vibration...", JSON.stringify(data));
	s.send(JSON.stringify(data) + "\n");
}
