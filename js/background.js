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

function processUrl(tabId, url) {
    // Get the host part of the URL. 
    var host = /^(?:ht|f)tps?:\/\/([^/]+)/.exec(url);

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
                setPopupInfo(tabId);
             }
         };
         x.send();
    }

    // Set popup info, with currently (un)known information
    setPopupInfo(tabId);
}
function setPopupInfo(tabId) { // Notify all popups
    chrome.extension.getViews({type:'popup'}).forEach(function(global) {
        global.IPKIT.website.notify(tabId);
    });
}

// Remove entry from tabToIp when the tab is closed.
chrome.tabs.onRemoved.addListener(function(tabId) {
    delete tabToHost[tabId];
});
// Add entries: Using method 1 ( `onUpdated` )
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading' && changeInfo.url) {
        processUrl(tabId, tab.url); // or changeInfo.url, does not matter
    }
});

// Init: Get all windows and tabs, to fetch info for current hosts
chrome.windows.getAll({populate: true}, function(windows) {
    windows.forEach(function(win) {
        if (win.type == 'normal' && win.tabs) {
            for (var i=0; i<win.tabs.length; i++) {
                processUrl(win.tabs[i].id, win.tabs[i].url);
            }
        }
    });
});