function save_options() {
  var scrollPx = document.getElementById('scrollPx').value;
  var lockTime = document.getElementById('lockTime').value;
  var delayTime = document.getElementById('delayTime').value;
  var oneScreen = document.getElementById('oneScreen').checked;
  chrome.storage.sync.set({
    scrollPx: srcollPx,
    lockTime: lockTime,
    delayTime: delayTime,
    oneScreen: oneScreen
  }, function() {
      console.log("Options Saved");
  });
}

//var oneScreen = document.getElementById("oneScreen");
//oneScreen.onchange = onOneScreenCheck;*/
