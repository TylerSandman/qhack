function save_options() {
  var scrollPx = document.getElementById('scrollPx').value;
  var lockTime = document.getElementById('lockTime').value;
  var delayTime = document.getElementById('delayTime').value;
  var oneScreen = document.getElementById('oneScreen').checked;
  chrome.storage.sync.set({
    scrollPx: scrollPx,
    lockTime: lockTime,
    delayTime: delayTime,
    oneScreen: oneScreen
  }, function() {
      console.log("Options Saved");
  });
}

document.getElementById("save").onclick = function(){
    save_options();
};

document.getElementById("oneScreen").onchange = function(event) {
  var checkbox = event.target;
  if (checkbox.checked) {
      document.getElementById("scrollPx").disabled = true;
  }
  else {
      document.getElementById("scrollPx").disabled = false;
  }
};

//var oneScreen = document.getElementById("oneScreen");
//oneScreen.onchange = onOneScreenCheck;*/
