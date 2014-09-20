chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");

    if (request.action == "scrollDown") {
        scrollDown();
        sendResponse({status: "OK"});
    } else if (request.action == "scrollUp") {
        scrollUp();
        sendResponse({status: "OK"});
    }
});

function scrollDown() {
    window.scrollBy(0, 150);
}

function scrollUp() {
    window.scrollBy(0, -150);
}