var buttons = require('sdk/ui/button/action'),
	tabs = require("sdk/tabs"),
	self = require("sdk/self"),
	extractData = require("./ExtractData.js"),
	{setInterval} = require("sdk/timers"),
	ss = require("sdk/simple-storage"),
	//trayicon = require("trayicon"),
	workers = {};

const manageFeedsPage = self.data.url("ManageFeeds/ManageFeeds.html"),
	viewFeedsPage =  self.data.url("ViewFeeds/ViewFeeds.html");

//Create a tray icon
/*trayBadge = trayicon.TrayIcon({
	label: "Feed Project",
	onClick: handleClick
});*/

//Create a button
var button = buttons.ActionButton({
	id: "feed-button",
	label: "View Feeds",
	icon: {
		"16": "./Images/icon16.png",
		"32": "./Images/icon32.png",
		"64": "./Images/icon64.png"
	},
	onClick: handleClick
});


function handleClick() {
	//Search for an already open tab of the ViewFeeds page
	for each (var tab in tabs){
		if(tab.url.indexOf(viewFeedsPage) != -1){
			tab.activate();
			return;
		}
	}
	//Open the View Feeds page and attach the ViewFeeds.js
	tabs.open({
		url: viewFeedsPage,
		onOpen: attachScript,
		onClose: removeScript
	});
}

//Attach ViewFeeds.js to ViewFeeds.html and listen for requests from it
function attachScript(tab){
	tab.on("ready", function(feedTab){
		//Attach corresponding script
		var worker
		if(tab.url == manageFeedsPage){
			worker =  feedTab.attach({
				contentScriptFile: [self.data.url("jquery-2.1.3.min.js"), self.data.url("ManageFeeds/ItemPropertyFields.js"), self.data.url("ManageFeeds/FeedPropertyFields.js"), self.data.url("ManageFeeds/ManageFeeds.js")],
				contentScriptOptions: {feedData: ss.storage.feedData}
			});
		}else if(tab.url  == viewFeedsPage){
			worker =  feedTab.attach({
				contentScriptFile: [self.data.url("jquery-2.1.3.min.js"), self.data.url("ViewFeeds/ViewFeeds.js")],
				contentScriptOptions: {feedData: ss.storage.feedData}
			});
		}else return;
		//Add the page to the list of workers to be contacted when an event occurs
		workers[feedTab.id] = worker;
		//-----------------Add listeners for events sent from the scripts
		//-------Set the feed data
		worker.port.on("setFeedData",function(feedData){
			ss.storage.feedData = feedData;
			extractData.updateBadge();
		});
		//-------Update feeds
		worker.port.on("updateFeedData", function(feedTitle){																									//This isn't functional right now. Need to figure out what I was doing
			extractData.updateFeedData(feedTitle);
		});
		worker.port.on("updateAllFeeds", function(feedTitle){
			extractData.updateAllFeeds();
		});
		//-------Change pages
		worker.port.on("manageFeeds", function(feedTitle){
			removeScript(feedTab);
			feedTab.url = manageFeedsPage;
		});
		worker.port.on("viewFeeds", function(feedTitle){
			removeScript(feedTab);
			feedTab.url = viewFeedsPage;
		});
	});
}
function removeScript(tab){
	workers[tab.id].destroy();
	delete workers[tab.id];
}




//Add listeners for extractData
extractData.on("loadProgress", function(value){																				//These two are similar. Maybe there is a way to simplify
	for(var tabId in workers){
		var worker = workers[tabId];
		worker.port.emit("loadProgress", value);
	}
});
extractData.on("returnFeedData", function(){																					//These two are similar. Maybe there is a way to simplify
	for(var tabId in workers){
		var worker = workers[tabId];
		worker.port.emit("returnFeedData", ss.storage.feedData);
	}
});
extractData.on("updateBadge", function(value){
	button.badge = value;
});

//Update feeds every ten minutes
extractData.updateAllFeeds();
setInterval(extractData.updateAllFeeds, 1000*15);//10*60*1000);
