
//------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------Format Data into an RSS Feed---------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------
function toTimeString(dateTime){
	var dateObj = new Date(dateTime),
		hours = dateObj.getHours(),
		minutes =  dateObj.getMinutes();
	return (hours > 12? hours-12:hours) + ":" + (minutes < 10? "0" + minutes : minutes) + " " + (hours > 12? "PM" : "AM");
}

function toDateString(dateTime){
	var dateStr = "",
		dateObj = new Date(dateTime);
	
	switch(dateObj.getDay()){
		case 0:
			dateStr += "Sun";
			break;
		case 1:
			dateStr += "Mon";
			break;
		case 2:
			dateStr += "Tue";
			break;
		case 3:
			dateStr += "Wed";
			break;
		case 4:
			dateStr += "Thu";
			break;
		case 5:
			dateStr += "Fri";
			break;
		case 6:
			dateStr += "Sat";
			break;
	}
	dateStr += " ";
	switch(dateObj.getMonth()){
		case 0:
			dateStr += "Jan";
			break;
		case 1:
			dateStr += "Feb";
			break;
		case 1:
			dateStr += "Mar";
			break;
		case 3:
			dateStr += "Apr";
			break;
		case 4:
			dateStr += "May";
			break;
		case 5:
			dateStr += "Jun";
			break;
		case 6:
			dateStr += "Jul";
			break;
		case 7:
			dateStr += "Aug";
			break;
		case 8:
			dateStr += "Sep";
			break;
		case 9:
			dateStr += "Oct";
			break;
		case 10:
			dateStr += "Nov";
			break;
		case 11:
			dateStr += "Dec";
			break;
	}
	dateStr += " " + dateObj.getDate() + ", " + (dateObj.getYear() + 1900);
	return dateStr;
}

//Converts to HTML
function formatDataIntoFeed(){																							//Can this be written better with JQuery? //Possibly rename to give more implication that this is generating html for the selected feed and displaying it (Redisplay the currentFeed)
	if(!feedData.lastFeedDisplayed) return;
	var feedTitle = feedData.lastFeedDisplayed,																		//Probably need better variable names
		feed = feedData[feedTitle],
		fLink = feed.feedLink,
		fDptn = feed.feedDescription,
		iTtl = feed.itemTitle,
		iLnk = feed.itemLink,
		iDptn = feed.itemDescription,
		itemData = feed.itemData,
		numNItm = feed.numNItm,
		rvrseItm = feed.reverseItm,
		fHTML = '<table><tr><th><h1>',
		sHTML = "", bHTML = "";
	//Link & Title
	if(fLink !== ""){
		fHTML += '<a href="';
		fHTML += fLink;
		fHTML += '">';
		fHTML += feedTitle;
		fHTML += '</a>';
	}else{
		fHTML += feedTitle;
	}
	//Description
	if(fDptn!=""){
		fHTML += ' - <span>' ;
		fHTML += fDptn;
		fHTML += '</span>';
	}
	fHTML += '</h1>';
	if(numNItm && numNItm != 0)
		fHTML += '<div id = "markAll" feedTitle="' + feedTitle.split(' ').join('-') + '">Mark all items as read</div>';
	fHTML += '</th></tr>';
	for(var fItmN in itemData){
		var curItemTitle = iTtl,
			curItemLink = iLnk,
			curItemDescription = iDptn,
			fItm = itemData[fItmN],
			nItm = fItm.nItm,
			j = 1,
			fDate = fItm.date;
		for(var fTrtN in fItm){
			if(fTrtN.indexOf("trait") == -1) continue;
			var fTrt = fItm[fTrtN],
				cMac = "{%" + j + "}";
			curItemTitle = curItemTitle.split(cMac).join(fTrt);
			curItemLink = curItemLink.split(cMac).join(fTrt);
			curItemDescription = curItemDescription.split(cMac).join(fTrt);
			j++;
		}
		sHTML += '<tr><td>';
		if(nItm) sHTML += "<span class='newTag' feedTitle='" + feedTitle + "' itemNum = '" + fItmN + "'>NEW</span>";
		if(curItemTitle !== ""){
			sHTML += '<h2>';
			if(curItemLink !== ""){
				sHTML += '<a href="';
				sHTML += curItemLink;
				sHTML += '">';
				sHTML += curItemTitle;
				sHTML += '</a>';
			}else{
				sHTML += curItemTitle;
			}
			sHTML += '</h2>';
		}
		sHTML += '<div>';
		sHTML += curItemDescription;
		sHTML += '</div>';
		if(fDate){
			sHTML += '<div class="date" title="' + toTimeString(fDate) + '">'
			sHTML += toDateString(fDate);
			sHTML += '</div>'
		}
		sHTML += '</td></tr>';
		if(rvrseItm){
			bHTML = sHTML + bHTML;
		}else{
			bHTML += sHTML;
		}
		sHTML = "";
	}
	fHTML += bHTML + '</table>';
	feedDisp.innerHTML = fHTML;
	addListenerToNewItms()
}

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------


//Add new Item to Feed-table
function addNewFeedEntry(entryName){
		var trElement = document.createElement("tr"),
			tdElement = document.createElement("td"),
			feedNode = document.createTextNode(entryName);
		tdElement.appendChild(feedNode);
		tdElement.setAttribute("feedTitle",entryName.split(' ').join('-'));
		trElement.appendChild(tdElement);
		feedTable.appendChild(trElement);
		trElement.addEventListener('click', changeFeed);
		trElement.myParam = entryName;
}

//Changes feed when a feed is clicked on
function changeFeed(ev){																											//This will be handled in the FeedList object

	//From here
	var fTd = ev.target;
	while(fTd.tagName != "TD")fTd=fTd.parentNode;
	var feedTitle= fTd.getAttribute("feedTitle").split('-').join(' '),
		allFeeds = document.querySelectorAll("[feedTitle]");
	for(var i = 0, len = allFeeds.length; i<len;i++)
		allFeeds[i].style.background = "initial";
	fTd.style.background = "rgb(245, 200, 200)";
	//To here is what will need to be moved to the FeedList object
	
	onChangeFeed(feedTitle);
}

//This will be initiated on an event released by the FeedList object
function onChangeFeed(feedTitle){
	feedData.lastFeedDisplayed = feedTitle;
	formatDataIntoFeed();
	
	feedDisp.scrollTop = 0;
	self.port.emit("setFeedData", feedData);
}

function updateCurrentFeed(){
	if(loadingBar.style.display == "")return;
	loadingBar.value = 60;
	loadingBar.style.display = "";
	var lastFeedDisplayed = feedData.lastFeedDisplayed;
	if(lastFeedDisplayed){
		self.port.emit("updateFeedData", lastFeedDisplayed);
	}else{
		feedDisp.innerHTML = "No feed selected";
	}
}

function markAllRead(ev){
	var feedTitle = ev.target.getAttribute("feedTitle").split('-').join(' '),													//Can this be changed to lastFeedDisplayed?
		newItms = document.getElementsByClassName("newTag");
	for(var i = 0, len = newItms.length; i < len; i++){
		newItms[0].parentNode.removeChild(newItms[0]);
	}
	var feed = feedData[feedTitle];
	for(var feedItm in feed.itemData){
		feed.itemData[feedItm].nItm = false;
	}
	feed.numNItm = 0;
	self.port.emit("setFeedData", feedData);
	ev.target.parentNode.removeChild(ev.target);
	displayNewItemNum();
}

function markRead(ev){
	var feedTitle = ev.target.getAttribute("feedTitle");																				//Can this be cahnged to lastFeedDisplayed?
	feedData[feedTitle].itemData[ev.target.getAttribute("itemNum")].nItm = false;
	feedData[feedTitle].numNItm--;
	if(feedData[feedTitle].numNItm == 0)
		markAll.parentNode.removeChild(markAll);
	self.port.emit("setFeedData", feedData);
	ev.target.parentNode.removeChild(ev.target);
	displayNewItemNum();
}

//Adds functionality to the new tag
function addListenerToNewItms(){
	var newItms = document.getElementsByClassName("newTag"),
		markAll = document.getElementById("markAll");
	if(markAll)
		markAll.addEventListener('click', markAllRead);
	for(var i = 0, len = newItms.length; i < len; i++){
		newItms[i].addEventListener('click', markRead);
	}
}

function displayNewItemNum(){
	if(feedData.listOfFeeds){
		var fLst = feedData.listOfFeeds.split("\\"),
			fTr = feedTable.getElementsByTagName("TD");
		for(var i = 1, len = fLst.length; i < len; i++){
			var curItm = feedData[fLst[i]];
				fNItm = curItm.numNItm,
				span = fTr[i-1].getElementsByTagName("span")[0];
			if(span)
				fTr[i-1].removeChild(span);
			if(fNItm && fNItm != 0){
				var span = document.createElement("span"),
					num = document.createTextNode(fNItm.toString());
				if(curItm.notificationOff){
					span.className = "hiddenNotification";
				}else{
					span.className = "notification";
				}
				span.appendChild(num);
				fTr[i-1].appendChild(span);
			}
		}
	}
}

function populateFeedList(){																											//Find a better place to put this
	if(!feedData.listOfFeeds)
		return;
	var theFeeds = feedData.listOfFeeds.split("\\");
	for(var i=1, len = theFeeds.length;i<len;i++){
		addNewFeedEntry(theFeeds[i]);
	}
}

//-----------------------USING THE FUNCTIONS-------------------------------

//-------Global variables																																						//Add More!
//Variables for permanent html tags
var feedDisp = document.getElementById("RSS-display");
var loadingBar = document.getElementById("loadingBar");
var feedTable = document.getElementById("RSS-table");
//This is the feedData that is used for all functions. It is updated every time the main.js sends out a returnFeedData message. 
var feedData = self.options.feedData;


//Display Last Feed
document.getElementById("updateCurrentFeedLink").addEventListener('click', function(){													//Add functionality
	self.port.emit("updateFeedData", feedData.lastFeedDisplayed);
});
document.getElementById("updateAllFeedsLink").addEventListener('click', function(){														//Add functionality
	self.port.emit("updateAllFeeds");
});
document.getElementById("manageFeedsLink").addEventListener('click', function(){
	self.port.emit("manageFeeds");
});

function startup(){
	populateFeedList();
	displayNewItemNum()
	formatDataIntoFeed();
	
	var lastFeedDisplayed = feedData.lastFeedDisplayed;
	if(lastFeedDisplayed){
		var feedElm = document.querySelector("[feedtitle=" + lastFeedDisplayed.split(' ').join('-') + "]");
		feedElm.style.background = "rgb(245, 200, 200)";
	}else{
		feedDisp.innerHTML = "No feed selected.";
	}
}

//				---port listeners---

//Loading Bar listens for updates
self.port.on("loadProgress", function(progress) {
	loadingBar.style.display = "";
	loadingBar.value = progress;
	if(loadingBar.value == 100){																						//Can this be streamlined to returnFeedData (Should it?)
		setTimeout(function(){loadingBar.style.display = "none";loadingBar.value = 0;},500);
	}
});

self.port.on("returnFeedData", function(returnFeedData){
	console.log("returnFeedData called!");
	feedData = returnFeedData;
	//Redisplay the currentFeed
	formatDataIntoFeed(feedData.lastFeedDisplayed);
	displayNewItemNum();
});
startup();