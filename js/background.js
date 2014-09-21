//Address where the Myo Web Socket API is listening for requests
var host = "ws://127.0.0.1:7204/myo/1";

//Regex to differentiate regular windows from the background script window
var bgPattern = /Developer Tools - chrome-extension/;

var myoID = -1;
var armUsed;

//Timestamp of the last unlocked gesture
var lastGestureTimeStamp = 0;

//How many seconds to wait after a gesture before locking the myo again
var restLockSeconds = 3;

console.log("Host:", host);

var s = new WebSocket(host);
var manager = new ModeManager();

s.onopen = function (e) {
	console.log("Socket opened.");
};

s.onclose = function (e) {
	console.log("Socket closed.");
};

s.onmessage = function (e) {

	var json = JSON.parse(e.data);
	var data = json[1];
	var lastOpentab;
	var tabStack = new Array();

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