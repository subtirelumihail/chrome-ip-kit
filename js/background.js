var tabToHost = {};
var hostToIP = {};
var IP;

function USERIP(){
    this.get();
}

USERIP.prototype.get = function(){
    var user, _self=this;
    if(!IP){
        var x = new XMLHttpRequest();
        x.open('GET', 'https://jsonip.appspot.com/');
        x.onload = function() {
            var result = JSON.parse(x.responseText);
            if (result && result.ip) {
                IP = result.ip;
                return IP;
             }
         };
         x.send();  
    }
    else return IP;
}

var USER = new USERIP();

function TABWEBSITE(c){
    this.chrome = c
    this.init();
}

TABWEBSITE.prototype.processUrl = function(tabId, url) {
    // Get the host part of the URL. 
    var host = /^(?:ht|f)tps?:\/\/([^/]+)/.exec(url);
    var _self = this;
    // Map tabId to host
    tabToHost[tabId] = host ? host=host[1] : '';

    if (host && !hostToIP[host]) { // Known host, unknown IP
        hostToIP[host] = 'N/A';    // Set N/A, to prevent multiple requests
        // Get IP from a host-to-IP web service
        var x = new XMLHttpRequest();
        x.open('GET', 'http://www.fileformat.info/tool/rest/dns.json?q=' + host);
        x.onload = function() {
            var result = JSON.parse(x.responseText);
            if (result && result.answer && result.answer.values && result.answer.values[0]) {
                // Lookup successful, save address
                hostToIP[host] = result.answer.values[0].address;
                _self.setPopupInfo(tabId);
             }
         };
         x.send();
    }

    // Set popup info, with currently (un)known information
    this.setPopupInfo(tabId);
}

TABWEBSITE.prototype.setPopupInfo = function(tabId) { // Notify all popups
    this.chrome.extension.getViews({type:'popup'}).forEach(function(global) {
        global.IPKIT.website.notify(tabId);
    });
}

TABWEBSITE.prototype.onRemoved = function(){
    // Remove entry from tabToIp when the tab is closed.
    this.chrome.tabs.onRemoved.addListener(function(tabId) {
        delete tabToHost[tabId];
    });
}

TABWEBSITE.prototype.onUpdated = function(){
    var _self = this;
    // Add entries: Using method 1 ( `onUpdated` )
    this.chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status === 'loading' && changeInfo.url) {
            _self.processUrl(tabId, tab.url); // or changeInfo.url, does not matter
        }
    });
}

TABWEBSITE.prototype.getAllz = function(callback){
    var _self = this;
    // Init: Get all windows and tabs, to fetch info for current hosts
    this.chrome.windows.getAll({populate: true}, function(w) {
        w.forEach(function(win) {
            if (win.type == 'normal' && win.tabs) {
                for (var i=0; i<win.tabs.length; i++) {
                    _self.processUrl(win.tabs[i].id, win.tabs[i].url);
                }
            }
        });
    });
    
}

TABWEBSITE.prototype.init = function(){
    this.getAllz( );
    this.listen();
}

TABWEBSITE.prototype.listen = function(){
    this.onRemoved();
    this.onUpdated();
}

var tab = new TABWEBSITE(chrome);





