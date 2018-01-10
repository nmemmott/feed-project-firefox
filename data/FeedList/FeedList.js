//A list that is used to store feed entries


function FeedList(feedTabl){
	var feedTable = feedTabl;
	
	//Drag and Drop functions																												//Still need to clean these functions up and remove any specific references 
	function allowDrop(ev){ev.preventDefault();}
	function dragStart(ev){
		ev.dataTransfer.setData("feedName", ev.target.feedName);
	}
	function drop(ev)
	{
		if(document.getElementsByClassName("isClicked")[0])return;
		ev.preventDefault();
		var feedTd = ev.target;
		while(feedTd.tagName !== "TD") feedTd = feedTd.parentNode;

		var draggedFeed = ev.dataTransfer.getData("feedName"),
			droppedOnFeed = feedTd.feedName;
		
		chrome.storage.local.get("listOfFeeds", function(value){
			var newList = value.listOfFeeds.split('\\'),
				offIndx = newList.indexOf(draggedFeed),
				onIndx = newList.indexOf(droppedOnFeed);
			if(offIndx < onIndx){
				for(var i = offIndx; i < onIndx; i++){
					newList[i] = newList [i+1];
				}
				newList[onIndx] = draggedFeed;
			}else{
				for(var i = offIndx; i > onIndx; i--){
					newList[i] = newList [i-1];
				}
				newList[onIndx] = draggedFeed;
			}
			newList = newList.join("\\");
			chrome.storage.local.set({listOfFeeds: newList});
			feedTd.parentNode.parentNode.innerHTML = "";
			addRSSCreationElement();
			populateRSSList();
		});
	}
	function dragEnter(ev){
		if(document.getElementsByClassName("isClicked")[0])return;
		var feedTd = ev.target;
		while(feedTd.tagName != "TD")feedTd = feedTd.parentNode;
		feedTd.style.backgroundColor = "#efe";
	}
	function dragLeave(ev){
		var feedTd = ev.target;
		while(feedTd.tagName != "TD")feedTd = feedTd.parentNode;
		feedTd.style.backgroundColor = "#eee";
	}
	
	
	
	this.addNewFeedEntry = function(entryName, onClick, draggable){
		var trElement = document.createElement("tr"),
			tdElement = document.createElement("td"),
			feedNode=document.createTextNode(entryName),
			feedNodeSpan = document.createElement("span"),
			feedProperties = document.createElement("div");
		
		//Set entry's properties
		tdElement.feedName = entryName;
		feedNodeSpan.className = "feedTitleSpan";
		feedProperties.className = "feedPropertyFields";
		trElement.addEventListener('click', onClick);
		
		//Set up drag and drop
		if(draggable){
			tdElement.draggable = true;
			tdElement.addEventListener("dragover", allowDrop, false); 												//Should this be false (bubbling) or true (capturing)? //I changed these from "on*" functions to "addEventListeners", so I need to make sure nothing broke
			tdElement.addEventListener("dragstart", dragStart, false);													//"
			tdElement.addEventListener("ondrop", drop, false);															//"
			tdElement.addEventListener("dragenter", dragEnter, false);												//"
			tdElement.addEventListener("dragleave", dragLeave, false);												//"
		}
		
		//Build entry
		feedNodeSpan.appendChild(feedNode);
		tdElement.appendChild(feedNodeSpan);
		tdElement.appendChild(feedProperties);
		trElement.appendChild(tdElement);
		feedTable.appendChild(trElement);
	}
}