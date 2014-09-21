//Address where the Myo Web Socket API is listening for requests
var host = "ws://127.0.0.1:7204/myo/1";

//Regex to differentiate regular windows from the background script window
var bgPattern = /Developer Tools - chrome-extension/;

var myoID = -1;
var armUsed;

//Global booleans for the state of the Myo
chrome.browserAction.setIcon({path : "img/windowsMode_locked.png"});
chrome.browserAction.setPopup({popup: ""});

//Timestamp of the last unlocked gesture
var lastGestureTimeStamp = 0;

//How many seconds to wait after a gesture before locking the myo again
var restLockSeconds = 3;


var scrollPx;
var lockTime;
var delayTime;
var oneScreen;
var windowArray = new Array();

// Setting page stuff
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
        if (key == "scrollPx") {
            scrollPx = changes[key];
        }
        else if (key == "lockTime") {
            lockTime = changes[key];
        }
        else if (key == "delayTime") {
            delayTime = changes[key];
        }
        else if (key == "oneScreen") {
            oneScreen = changes[key];
        }
    }
  });
console.log("Host:", host);

var s = new WebSocket(host);
var manager = new ModeManager();

//Window Array/Tab Stack
chrome.browserAction.onCreated.addListener(function (window) {
	//adds window.id to the array.
	var closeStack = [];
	var openStack = [];
	windowArray.push({id:window.id, closeTabStack: closeStack, openTabStack: openStack});
});

chrome.browserAction.onRemoved.addListener(function (windowID) {
	for (var i = 0; i < windowArray.length; i++){
		if (windowArray[i].id === windowID){
			windowArray.splice(i-1, 1);
			break;
		}
	}
});

getCurrentWindowArrayElement = function () {
	var currentWindowArrayElement;

	chrome.windows.getLastFocused({populate: true}, function(window){
		var windowID = window.id;
	}

	for (var i = 0; i < windowArray.length; i++){
		if (windowArray[i].id === windowID){
			currentWindowArrayElement = windowArray[i];
			break;
		}
	}
};

chrome.tabs.onCreated.addListener(function (tab) {
	currentWindowArrayElement = getCurrentWindowArrayElement();

	currentWindowArrayElement.openStack.push(tab);
})

chrome.tabs.onRemoved.addListener(function (tabID) {
	var currentWindowArrayElement = getCurrentWindowArrayElement();
	var lastOpenedTab;

	for (var i = 0; i < currentWindowArrayElement.openTabStack.length; i++){
		if (currentWindowArrayElement.openTabStack[i].id === tabID){
			lastOpenedTab = currentWindowArrayElement.openTabStack[i];
			break;
		}
	}

	currentWindowArrayElement.closeTabStack.push(lastOpenedTab);
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
	if (manager.mode.resting && manager.mode.getModeName() !== "Locked" && (parseInt(data.timestamp) - lastGestureTimeStamp) / 1000000 > restLockSeconds){
		console.log("Locking!");
		manager.changeMode(new LockedBrowserMode(manager));
		chrome.browserAction.setIcon({path : "img/locked.png"});
		requestVibrate();
	}

	if (data.type === "arm_recognized"){
		armUsed = data.arm;
		console.log(armUsed);
	}

	if (data.type !== "orientation"){
		console.log(e.data);
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
