function save_options() {
  var lockTime = document.getElementById('lockTime').value;
  chrome.storage.sync.set({
    'lockTime': lockTime
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
      }, 3000);
  });
}

document.getElementById("save").onclick = function(){
    save_options();
};
