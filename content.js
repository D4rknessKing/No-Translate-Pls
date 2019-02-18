console.debug("Starting extension...");

//Until i fully understand how the Youtube API limits works, and how many requests can be made, i am not providing the api key.
//Feel free to talk to me in discord @D4rk#0693 if you want me to teach you how to get you own key tho
//IMPORTANT: This code sucks, i know. I have never developed anything with js before and i still dont know how this ended up working.
//I would like to thanks @Nathata#1957 and Stack Overflow for helping me with basic js.

const apiKey = "";
let cache = {};

setInterval(function() {
	let hashmap = {};

	let nonCachedIds = [];
	let cachedIds = [];

	//Gets all videos in the HTML Document and registers them
    [].forEach.call(document.querySelectorAll('#video-title'), (yt)=>{
		try{
			//this is what i should have used from the beginning
			if(yt.search){
				let id = yt.search.match(/.*[?&]v=([^&]+).*/)[1];
				hashmap[id] = yt;
				if(cache[id]){
					cachedIds[cachedIds.length] = id;
				}else{
					nonCachedIds[nonCachedIds.length] = id;
					i++;
				}
			//this is what i used instead
			}else if(yt.href){
				let id = yt.href.match(/.*[?&]v=([^&]+).*/)[1];
				hashmap[id] = yt;
				if(cache[id]){
					cachedIds[cachedIds.length] = id;
				}else{
					nonCachedIds[nonCachedIds.length] = id;
				}
			//this is youtube's fault™
			}else if(yt.offsetParent.children[0].children[0].children[0].href){
				let id = yt.offsetParent.children[0].children[0].children[0].href.match(/.*[?&]v=([^&]+).*/)[1];
				hashmap[id]	= yt;
				if(cache[id]){
					cachedIds[cachedIds.length] = id;
				}else{
					nonCachedIds[nonCachedIds.length] = id;
				}
			}else{
				console.debug("Could not find a valid video id");
			}
		}catch (err){}
	});

	//Gets the channel trailer in the HTML Document and registers it
	if(window.location.href.includes("user") || window.location.href.includes("channel")){
		try{
			let trailerDoc = document.getElementsByTagName("ytd-channel-video-player-renderer")[0];
			let id = trailerDoc.children[1].children[0].children[0].children[0].href.match(/.*[?&]v=([^&]+).*/)[1];
			hashmap[id] = trailerDoc.children[1].children[0].children[0].children[0];
			if(cache[id]){
				cachedIds[cachedIds.length] = id;
			}else{
				nonCachedIds[nonCachedIds.length] = id;
			}
		}catch (err) {}
	}
	
	//Gets the main video in the HTML Document and registers it
	if(window.location.href.includes("watch?v=")){
		try{
			let mainDoc = document.getElementsByClassName("title ytd-video-primary-info-renderer")[0];
			let id = mainDoc.baseURI.match(/.*[?&]v=([^&]+).*/)[1];
			hashmap[id] = mainDoc.children[0];
			if(cache[id]){
				cachedIds[cachedIds.length] = id;
			}else{
				nonCachedIds[nonCachedIds.length] = id;
			}
		}catch (err) {}
	}
	
	//If there are new non-cached ids we make an api request and cache them.
	if(nonCachedIds.length > 0){
		while(nonCachedIds.length > 45){
			apiRequest(hashmap, nonCachedIds.slice(0, 45));
			nonCachedIds = nonCachedIds.slice(45, nonCachedIds.length)
		}
		apiRequest(hashmap, nonCachedIds)
	}
	
	//Checks all the cachedIds and change the video properties
	if(cachedIds.length > 0){
		[].forEach.call(cachedIds, (videoId)=> {
			let videoObj = hashmap[videoId];
			if(videoObj.innerText !== cache[videoId].snippet.title) {
				console.debug("Updating "+videoId+" properties.");
				videoObj.innerText = cache[videoId].snippet.title;

				switch(videoObj.parentElement.parentElement.id) {
					case "title-wrapper":
						videoObj.parentElement.parentElement.parentElement.parentElement.children[1].innerText = cache[videoId].snippet.description;
						break;
					case "metadata-container":
						videoObj.parentElement.parentElement.parentElement.children[1].children[0].children[0].innerText = cache[videoId].snippet.description
						break;
					case "container":
						videoObj.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[10].children[2].children[0].children[0].children[2].children[0].innerText = cache[videoId].snippet.description;
						break;
					default:
				}
			}
		});
	}
	

}, 1000);

function apiRequest(hashmap, ids) {
	let xhr = new XMLHttpRequest();
	console.debug("Requesting "+ids.length+" videos information from youtube api...");
	xhr.open("GET", "https://www.googleapis.com/youtube/v3/videos?id="+ids.join(",")+"&part=snippet&key="+apiKey, true);
	xhr.onload = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				let json = JSON.parse(xhr.responseText);
				[].forEach.call(json.items, (videoJson)=> {
					cache[videoJson.id] = videoJson;
				});
			}else{
				console.debug("Unknown error while requesting the Youtube API.");
				console.error(xhr.statusText);
			}
		}
	};
	xhr.onerror = function () {
		console.debug("Unknown error while requesting the Youtube API.");
    	console.error(xhr.statusText);
	};
	xhr.send(null);
}