InheritanceManager = {};   

InheritanceManager.extend = function (subClass, baseClass) { 
	function inheritance() { }
	inheritance.prototype = baseClass.prototype;
	subClass.prototype = new inheritance();
	subClass.prototype.constructor = subClass;
	subClass.baseConstructor = baseClass;
	subClass.superClass = baseClass.prototype;
}   

ModeManager = function(){
	this.mode = new LockedBrowserMode(this);
	this.windowArray = new Array();
}

ModeManager.prototype = {

	nextMode : function(){
	
		if (this.mode.getModeName() === "Locked"){
			this.mode = new TabBrowserMode(this);
		}
		else if (this.mode.getModeName() === "Tab"){
			this.mode = new WindowBrowserMode(this);
		}
		
		else if (this.mode.getModeName() === "Window"){
			this.mode = new LockedBrowserMode(this);
		}
	},
	
	changeMode : function(mode){
		this.mode = mode;
	},
	
	onThumbToPinky : function(data){ this.mode.onThumbToPinky(data); },
	onWaveIn : function(data){ this.mode.onWaveIn(data); },
	onWaveOut : function(data){ this.mode.onWaveOut(data); },
	onWaveUp : function(data){ this.mode.onWaveUp(data); },
	onWaveDown : function(data){ this.mode.onWaveDown(data); },
	onFist : function(data){ this.mode.onFist(data); },
	onFingersSpread : function(data){ this.mode.onFingersSpread(data); },
	onRest : function(data){ this.mode.onRest(data); }
}

BrowserMode = function(manager){
	this.resting = true;
	this.manager = manager;
}

BrowserMode.prototype = {

	onThumbToPinky : function(data){},
	onWaveIn : function(data){},
	onWaveOut : function(data){},
	onWaveUp : function(data){},
	onWaveDown : function(data){},
	onFist : function(data){},
	onFingersSpread : function(data){},
	onRest : function(data){ this.resting = true; },
	getModeName : function(){ return ""; }

}

/*Locked Browser Mode */
LockedBrowserMode = function(manager){
	LockedBrowserMode.baseConstructor.call(this, manager);
}
InheritanceManager.extend(LockedBrowserMode, BrowserMode);

LockedBrowserMode.prototype = {

	/* Unlock gesture */
	onThumbToPinky : function(data){
		chrome.browserAction.setIcon({path : "img/tabsMode.png"});		
		this.manager.nextMode();
	},
	
	onWaveIn : function(data){},
	onWaveOut : function(data){},
	onWaveUp : function(data){},
	onWaveDown : function(data){},
	onFist : function(data){},
	onFingersSpread : function(data){},
	onRest : function(){ this.resting = true; },
	getModeName : function(){ return "Locked"; }
}

/* Tab Browser Mode */
TabBrowserMode = function(manager){
	TabBrowserMode.baseConstructor.call(this, manager);
}
InheritanceManager.extend(TabBrowserMode, BrowserMode);

TabBrowserMode.prototype = {

	/* Mode change gesture */
	onThumbToPinky : function(data){
		chrome.browserAction.setIcon({path : "img/windowsMode.png"});
		this.manager.nextMode();
	},
	
	/* Tab change gesture */
	onWaveIn : function(data){
		chrome.windows.getLastFocused({populate: true}, function(window){
			var tabs = window.tabs;
			var selectedIndex;
			for (var i = 0; i < tabs.length; ++i){
				if (tabs[i].active && tabs[i].title.search(bgPattern === -1)){
					selectedIndex = i;
				}
			}
			chrome.tabs.highlight({windowId: window.id, tabs: (selectedIndex === 0) ? tabs.length - 1 : selectedIndex - 1}, function(window){});
		})
		this.resting = false;
	},
	
	/* Tab change gesture */
	onWaveOut : function(data){
		chrome.windows.getLastFocused({populate: true}, function(window){
			var tabs = window.tabs;
			var selectedIndex;
			for (var i = 0; i < tabs.length; ++i){
				if (tabs[i].active && tabs[i].title.search(bgPattern === -1)){
					selectedIndex = i;
				}
			}
			chrome.tabs.highlight({windowId: window.id, tabs: (selectedIndex === tabs.length - 1) ? 0 : selectedIndex + 1}, function(window){});
		})
		this.resting = false;
	},
	
	onWaveUp : function(data){
		chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs){
			chrome.tabs.executeScript(tabs[0].id, {code: 'window.scrollBy(0, -150);'});
		});
		this.resting = false;
	},
	
	onWaveDown : function(data){
		chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs){
			chrome.tabs.executeScript(tabs[0].id, {code: 'window.scrollBy(0, 150);'});
		});
		this.resting = false;
	},
	
	/* Tab close gesture */
	onFist : function(data){
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
		this.resting = false;
	},
	
	/* Tab open gesture */
	onFingersSpread : function(data){	
		chrome.windows.getLastFocused({populate: true}, function(window){
			chrome.tabs.create({windowId: window.id, active: true});
		});
		this.resting = false;
	},
	
	onRest : function(){ this.resting = true; },
	
	getModeName : function(){ return "Tab"; }
}

/* Window Browser Mode */
WindowBrowserMode = function(manager){
	WindowBrowserMode.baseConstructor.call(this, manager);
}
InheritanceManager.extend(WindowBrowserMode, BrowserMode);

WindowBrowserMode.prototype = {

	/* Mode change gesture */
	onThumbToPinky : function(data){
		chrome.browserAction.setIcon({path : "img/locked.png"});
		this.manager.nextMode();
	},
	
	/* Window change gesture */
	onWaveIn : function(data){
		chrome.windows.getAll({populate: false}, function(windows){
			var selectedIndex;
			for (var i = 0; windows.length; ++i){
				if (windows[i].focused){
					selectedIndex = i;
					break;
				}
			}
			selectedIndex = (selectedIndex == 0) ? windows.length - 1 : selectedIndex - 1;
			var focusId = windows[selectedIndex].id;
			chrome.windows.update(focusId, {focused : true}, function(window){});
		})
		this.resting = false;
	},
	
	/* Window change gesture */
	onWaveOut : function(data){
		chrome.windows.getAll({populate: false}, function(windows){
			var selectedIndex;
			for (var i = 0; windows.length; ++i){
				if (windows[i].focused){
					selectedIndex = i;
					break;
				}
			}
			selectedIndex = (selectedIndex == (windows.length - 1)) ? 0 : selectedIndex + 1;
			var focusId = windows[selectedIndex].id;
			chrome.windows.update(focusId, {focused : true}, function(window){});
		})
		this.resting = false;
	},
	
	onWaveUp : function(data){
		chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs){
			chrome.tabs.executeScript(tabs[0].id, {code: 'window.scrollBy(0, -document.height / 10);'});
		});
		this.resting = false;
	},
	
	onWaveDown : function(data){
		chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs){
			chrome.tabs.executeScript(tabs[0].id, {code: 'window.scrollBy(0, document.height / 10);'});
		});
		this.resting = false;
	},
	
	/* Window close gesture */
	onFist : function(data){
		var idToClose = -1;
		chrome.windows.getLastFocused({populate: true}, function(window){
			idToClose = window.id;
			chrome.windows.remove(idToClose, function(){});
		});
		this.resting = false;
	},
	
	/* Window open gesture */
	onFingersSpread : function(data){
		var focusId = -1;
		chrome.windows.create({}, function(window){
			focusId = window.id;
			chrome.windows.update(focusId, {focused : true}, function(window){});
		});	
	},
	
	onRest : function(){ this.resting = true; },
	
	getModeName : function(){ return "Window"; }
}