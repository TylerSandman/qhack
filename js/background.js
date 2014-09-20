//Address where the Myo Web Socket API is listening for requests
var host = "ws://127.0.0.1:7204/myo/1";

//Regex to differentiate regular windows from the background script window
var bgPattern = /Developer Tools - chrome-extension/;

var myoID = -1;

//Global booleans for the state of the Myo
var unlocked = false;
var resting = true;

//Timestamp of the last unlocked gesture
var lastGestureTimeStamp = 0;

//How many seconds to wait after a gesture before locking the myo again
var restLockSeconds = 3;

console.log("Host:", host);

var s = new WebSocket(host);

s.onopen = function (e) {
	console.log("Socket opened.");
};

s.onclose = function (e) {
	console.log("Socket closed.");
};

s.onmessage = function (e) {

	var json = JSON.parse(e.data);
	var data = json[1];
	var armUsed;
	
	console.log(parseInt(data.timestamp - lastGestureTimeStamp) / 1000000);
	if (unlocked && resting && (parseInt(data.timestamp) - lastGestureTimeStamp) / 1000000 > restLockSeconds){
		console.log("Locking!");
		unlocked = false;
		requestVibrate();
	}

	if (data.type === "arm_recognized"){
		armUsed = data.arm;
	}
	
	if (data.type !== "orientation"){
		console.log(e.data);
	}
	
	if (data.type === "pose" && myoID != -1){
	
		if (data.pose === "rest"){
			onRest(data);
		}
		else if (data.pose === "thumb_to_pinky"){
			onThumbToPinky(data);
		}
		
		else if (unlocked){
			lastGestureTimeStamp = parseInt(data.timestamp);
			if (data.pose === "wave_in"){
				if (armUsed === "left"){
					onWaveOut(data);
				}
				else {
					onWaveIn(data);
				}
			}
				
			else if (data.pose === "wave_out")
				if (armUsed === "left"){
					onWaveIn(data);
				}
				else {
					onWaveOut(data);
				}
			else if (data.pose === "fist")
				onFist(data);
			else if (data.pose === "fingers_spread")
				onFingersSpread(data);
		}
	}
	
	if (data.type === "connected"){
		myoID = data.myo;
	}
};

s.onerror = function (e) {
	console.log("Socket error:", e);
};

function onThumbToPinky(data){
	if (!unlocked){
		lastGestureTimeStamp = parseInt(data.timestamp);
		unlocked = true;
		chrome.browserAction.setIcon({path : "img/unlocked.png"});
	}
	else{
		unlocked = false;
		chrome.browserAction.setIcon({path : "img/locked.png"});
	}
	requestVibrate();
}

function onWaveIn(data){
	chrome.windows.getLastFocused({populate: true}, function(window){
		var tabs = window.tabs;
		var selectedIndex;
		for (var i = 0; i < tabs.length; ++i){
		    if (tabs[i].active && tabs[i].title.search(bgPattern === -1)){
			    selectedIndex = i;
			}
		}
		chrome.tabs.highlight({windowId: window.id, tabs: (selectedIndex === 0) ? tabs.length - 1 : selectedIndex - 1}, function(window){});
	});
	resting = false;
}

function onWaveOut(data){
	chrome.windows.getLastFocused({populate: true}, function(window){
		var tabs = window.tabs;
		var selectedIndex;
		for (var i = 0; i < tabs.length; ++i){
		    if (tabs[i].active && tabs[i].title.search(bgPattern === -1)){
			    selectedIndex = i;
			}
		}
		chrome.tabs.highlight({windowId: window.id, tabs: (selectedIndex === tabs.length - 1) ? 0 : selectedIndex + 1}, function(window){});
	});
	resting = false;
}

function onFist(data){
	var idToClose = -1;
	chrome.windows.getLastFocused({populate: true}, function(window){
		var tabs = window.tabs;
		for (var j = 0; j < tabs.length; ++j){
			if (tabs[j].active && tabs[j].title.search(bgPattern) === -1){
				idToClose = tabs[j].id;
			}
		}
		chrome.tabs.remove(idToClose);
	});
	resting = false;
}

function onFingersSpread(data){
	chrome.windows.getLastFocused({populate: true}, function(window){
		chrome.tabs.create({windowId: window.id, active: true});
	});
	resting = false;
}

function onRest(data){
    resting = true;
}

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