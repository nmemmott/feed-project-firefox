////Functions Used for Multiple scripts
//Outline:
//    Extract data from Web Page
//        Follows instructions given by pattern and stores extracted data in itemData
//    Other functions
//
//There is an outline, because this used to be more complicated

//------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------Set up variables-------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------
var ss = require("sdk/simple-storage"),
	{Request} = require("sdk/request"),
	{emit, on} = require("sdk/event/core");


//------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------Extract Data from Web Page-----------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------
function toHex(num){
	num = num.toString(16);
	while(num.length < 3)num="0"+num;
	return num;
}
//Goes through an html string and finds all 
function extractDataFromWebPage(htmlString, ptrn){
	var regExp = new RegExp(ptrn, "g"),
		cItm = 0, regRes, itemData ={};
	while((regRes = regExp.exec(htmlString)) != null){
		cItm++;
		var itmNm = "item" +toHex(cItm);
		itemData[itmNm] = {};
		for(var i = 0, len = regRes.length; i<len; i++){
			itemData[itmNm]["trait" + toHex(i)] = regRes[i];
		}
	}
	return itemData;
}
//------------------------------------------------------------------------------------------------------------------------------------------------



//------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------Other Functions-------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------
//Show how many new items you have in the badge and systemTray
function updateBadge(){																											//@TRAY
	var fList = ss.storage.feedData.listOfFeeds.split('\\'),
		numNItm = 0;
	for(var i = 1, len = fList.length; i < len; i++){
		var curItm = ss.storage.feedData[fList[i]];
		if(!curItm.notificationOff)
			numNItm += curItm.numNItm;
	}
	if(numNItm != 0){
		emit(exports, "updateBadge", numNItm);
	}else{
		emit(exports, "updateBadge", null);
	}
	/*chrome.storage.local.get(null, function(item){																		//@STORAGE
		var fList = item.listOfFeeds.split('\\'),
			numNItm = 0;
		var canvas = document.createElement('canvas');
		var cw=19;
		var ch=19;
		canvas.width = cw;
		canvas.height = ch;
		var canvas_context = canvas.getContext('2d');
		canvas_context.clearRect(0, 0, cw, ch);
		for(var i = 1, len = fList.length; i < len; i++){
			var curItm = item[fList[i]];
			if(!curItm.notificationOff)
				numNItm += curItm.numNItm;
		}
		if(numNItm != 0){
			chrome.browserAction.setBadgeText({text: numNItm.toString()});									//@BADGE
			var grd=canvas_context.createLinearGradient(0,2,0,14);
			grd.addColorStop(0,'#C80016');
			grd.addColorStop(1,'#87000E');
			canvas_context.fillStyle = grd;
			canvas_context.fillRect(0, 1, cw+1, 15);
			//bad
			canvas_context.clearRect(0, 1, 1, 1);
			canvas_context.clearRect(0, 14, 1, 1);
			canvas_context.clearRect(18, 1, 1, 1);
			canvas_context.clearRect(18, 14, 1, 1);
			canvas_context.font="13.5px Sergoe UI";
			canvas_context.fillStyle = '#FFFFFF';
			canvas_context.fillText(numNItm.toString(), 9-3*numNItm.toString().length, 13);
		}else{
			chrome.browserAction.setBadgeText({text: ""});
			canvas_context.fillStyle = "#000000";
			canvas_context.font="13.5px Sergoe UI";
			canvas_context.fillText("O", 8, 13);
		}
		var data = canvas_context.getImageData(0, 0, cw, ch);
		chrome.systemIndicator.setIcon({ imageData: data },chrome.systemIndicator.enable);		//@TRAY
	});*/
}

//Get all data and start the extraction process
function updateFeedData(feedTitle, callback){
	var feed = ss.storage.feedData[feedTitle];
	var webURL = feed.webpageURL;
	console.log("Updating Feed Data");
	httpGet(webURL, function(htmlString){
		var ptrn = feed.pattern,
			nData = extractDataFromWebPage(htmlString, ptrn),
			numNItm = 0;	//Number of new items
		if(feedTitle){
			//Check if the item already exists
			oData = feed.itemData;
			for(var Nprty in nData){
				var pNew = true;
				for(var Oprty in oData){
					if(itmEql(nData[Nprty], oData[Oprty])){
						pNew = false;
						break;
					}
				}
				//If it doesn't exist, mark it as new
				if(pNew){
					numNItm++;
					nData[Nprty].nItm = true;
					nData[Nprty].date = Date.now();
				}else{
					if(oData[Oprty].nItm){
						nData[Nprty].nItm = true;
						numNItm++;
					}
					if(oData[Oprty].date)
						nData[Nprty].date = oData[Oprty].date;
					delete oData[Oprty];
				}
			}
		}else{	//This is a new feed, so mark them all as new
			for(var Nprty in nData){
				nData[Nprty].nItm = true;
				nData[Nprty].date = Date.now();
			}
		}
		feed.itemData = nData;
		feed.numNItm = numNItm;
		updateBadge();
		if (callback !== undefined)
			callback();
		emit(exports, "returnFeedData");																							//How bad is it to return the feedData every update
	});
}

//Runs updateFeedData for each feed
function updateAllFeeds(){																					//@MESSAGE
	if(!ss.storage.feedData)
			return;
	var feedData = ss.storage.feedData,
		listOfFeeds = feedData.listOfFeeds.split("\\"),
		lastFeedDisplayed = feedData.lastFeedDisplayed,
		loadProgress = 0;
	emit(exports, "loadProgress", 0);
	for(var i = 1, len = listOfFeeds.length; i < len; i++){
		updateFeedData(listOfFeeds[i], function(){
			loadProgress += 1;
			emit(exports, "loadProgress", loadProgress*100/(len-1));
		});
	}
}

function httpGet(theUrl, callback)																								//Rename
{
	Request({
		url: theUrl,
		onComplete: function(response){
			if(response.status == 200)
				callback(response.text);																							//Could the Json property be of any use?
		}
	}).get();
}

//Tests if two items are equivalent (only if it2 doesn't have traits that it1 doesn't have, and if it1 doesn't contain any objects)
function itmEql(it1, it2)
{
	var num = 0, 
		tr1 = it1.trait000,
		tr2 = it2.trait000;
	while(tr1 !== undefined){
		if(tr1 !== tr2)
			return false;
		num++;
		tr1 = it1["trait" + toHex(num)];
		tr2 = it2["trait" + toHex(num)];
	}
	return true;	
}

/*																																				//EXPORT AND IMPORT DATA NEEDS TO BE REWRITTEN AND USED (needs to be placed in ManageFeeds.js)
function exportData(callback){																									//@STORAGE
	var retString = "";
	chrome.storage.local.get(null, function(item){																			//@STORAGE
		var feedList = item.listOfFeeds.split("\\");
		retString += escape(item.listOfFeeds);
		retString += " ";
		for(var i = 1, len = feedList.length; i < len; i++){
			retString +=escape(feedList[i]);
			retString += "\\\\";
			retString += escape(item[feedList[i]].webpageURL);
			retString += "\\\\";
			retString += escape(item[feedList[i]].pattern);
			retString += "\\\\";
			retString += escape(item[feedList[i]].feedLink);
			retString += "\\\\";
			retString += escape(item[feedList[i]].feedDescription);
			retString += "\\\\";
			retString += escape(item[feedList[i]].itemTitle);
			retString += "\\\\";
			retString += escape(item[feedList[i]].itemLink);
			retString += "\\\\";
			retString += escape(item[feedList[i]].itemDescription);
			retString += " ";
		}
		callback(retString);
	});
}*/

/*
A possibly better export function
function exportData(callback){
	chrome.storage.local.get(null, function(item){
		var feedList = item.listOfFeeds.split("\\");
		for(var i = 1, len = feedList.length; i < len; i++){
			delete item[feedList[i]].itemData;
		}
		callback(escape(JSON.stringify(item)));
	});
}
*/
function importData(str){
	var retObj = {},
		itemList = str.split(" "),
		listOfFeeds = itemList[0];
	retObj.listOfFeeds = unescape(listOfFeeds);
	for(var i = 1, len = itemList.length - 1; i < len; i++){
		var itmTraits = itemList[i].split("\\"),
			feedName = unescape(itmTraits[0]);
		retObj[feedName] = {
			webpageURL: unescape(itmTraits[1]) === "undefined"? "":unescape(itmTraits[1]),
			pattern: unescape(itmTraits[2]) === "undefined"? "":unescape(itmTraits[2]),
			feedLink: unescape(itmTraits[3]) === "undefined"? "":unescape(itmTraits[3]),
			feedDescription: unescape(itmTraits[4]) === "undefined"? "":unescape(itmTraits[4]),
			itemTitle: unescape(itmTraits[5]) === "undefined"? "":unescape(itmTraits[5]),
			itemLink: unescape(itmTraits[6]) === "undefined"? "":unescape(itmTraits[6]),
			itemDescription: unescape(itmTraits[7]) === "undefined"? "":unescape(itmTraits[7])
		}
	}
	return retObj;
}


//exported functions
exports.updateAllFeeds = updateAllFeeds;
exports.updateFeedData = updateFeedData;
exports.updateBadge = updateBadge;
exports.on = on.bind(null, exports);
//exports.setWorker = function(woker){worker = woker;};
