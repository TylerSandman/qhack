var host = "ws://127.0.0.1:7204/myo/1";
var myoID = -1;
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
	
	if (data.type !== "orientation"){
		console.log(json[1]);
		if (data.type === "pose" && data.pose === "thumb_to_pinky" && myoID != -1){
			requestVibrate();
		}
		if (data.type === "pose" && data.pose === "wave_in" && myoID != -1){
			//TODO;
		}
		if (data.type === "pose" && data.pose === "wave_out" && myoID != -1){
			//TODO;
		}
		if (data.type === "pose" && data.pose === "fist" && myoID != -1){
			var pattern = /Developer Tools - chrome-extension/;
			var idToClose = -1;
			chrome.windows.getLastFocused({populate: true}, function(window){
				var tabs = window.tabs;
				for (var j = 0; j < tabs.length; ++j){
					if (tabs[j].active && tabs[j].title.search(/Developer Tools/) === -1){
						idToClose = tabs[j].id;
					}
					console.log(tabs[j]);
					console.log(tabs[j].title.search(/Developer Tools/));
				}
				chrome.tabs.remove(idToClose);
			});
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