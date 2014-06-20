var USERIP, tabId;


function USER(){
	this.Container = $('#myip .ip');
	this.get();
}

USER.prototype.get = function(){
	var user, _self=this;
	if(!USERIP)
		$.getJSON( "https://jsonip.appspot.com/",
	        function(data){
	        	USERIP = data.ip;
	        	_self.setView(USERIP)
	        }
	    );
}

USER.prototype.setView = function(user){
	$('#myip .ip').text(user)
}


function SITE(){
	this.Container = $('#myip .website-ip');
	this.background = chrome.extension.getBackgroundPage();
	this.get();
}

SITE.prototype.get = function(){
	var windowId, _self=this;
	chrome.tabs.query({active:true, currentWindow:true, windowType:'normal'},
	  function(tabs) {
	    if (tabs[0]) {
	        // Found current tab
	        window.tabId = tabs[0].id;
	        windowId = tabs[0].windowId;
	        _self.requestUpdate();
	    }
	});

	this.windowId = windowId;
	this.update();
}

SITE.prototype.update = function(){
	// Receive tab ID updates
	var _self = this;
	chrome.tabs.onActivated.addListener(function(activeInfo) {
	    if (activeInfo.windowId === _self.windowId) {
	        _self.requestUpdate();
	    }
	});
}


SITE.prototype.requestUpdate = function(){
	console.log('a:'+tabId);
	 // tabId is the current active tab in this window
    var host = this.background.tabToHost[tabId] || '';
    var ip = host && this.background.hostToIP[host] || 'N/A';
    // Now, do something. For example:
    //document.getElementById('host').textContent = host;
    this.Container.text(ip);
}

SITE.prototype.setView = function(ip){
	this.Container.text(ip);
}

// Backgrounds calls notify()
SITE.prototype.notify = function(tabId, url, ip) {
    if (tabId === window.tabId) { // Tab == current active tab
        this.requestUpdate();
    }
}


function IP(){
	this.init();
}

IP.prototype.init = function(){
	this.user 	 = new USER();
	this.website = new SITE();
}


var IPKIT = new IP();