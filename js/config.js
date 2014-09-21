function save_options() {
  var scrollPx = document.getElementById('scrollPx').value;
  var lockTime = document.getElementById('lockTime').value;
  var oneScreen = document.getElementById('oneScreen').checked;
  chrome.storage.sync.set({
    scrollPx: scrollPx,
    lockTime: lockTime,
    oneScreen: oneScreen
  }, function() {
      console.log("Options Saved");
      var saveText = document.getElementById('saved');
      saveText.style.display = "inline";
      setTimeout(function () {
        saveText.className = "fadeOut";
      }, 1500);
      setTimeout(function () {
        saveText.className = "";
        saveText.style.display = "none";
      }, 1505);
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
