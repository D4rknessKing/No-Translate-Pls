console.debug("Starting extension...");

//Until i fully understand how the Youtube API limits works, and how many requests can be made, i am not providing the api key.
//Feel free to talk to me in discord @D4rk#0693 if you want me to teach you how to get you own key tho
//IMPORTANT: This code sucks, i know. I have never developed anything with js before and i still dont know how this ended up working.
//I would like to thanks @Nathata#1957 and Stack Overflow for helping me with basic js.

let apiKey = "";
let cache = {};

setInterval(function() {
	let hashmap = {};

	let i = 0;
	let nonCachedIds = [];
	let ii = 0;
	let cachedIds = [];

	//Gets all videos in the HTML Document and registers them
    [].forEach.call(document.querySelectorAll('#video-title'), (yt)=>{
		try{
			//this is what i should have used from the beginning
			if(yt.search){
				let id = yt.search.match(/.*[?&]v=([^&]+).*/)[1];
				hashmap[id] = yt;
				if(cache[id]){
					cachedIds[ii] = id;
					ii++;
				}else{
					nonCachedIds[i] = id;
					i++;
				}
			//this is what i used instead
			}else if(yt.href){
				let id = yt.href.match(/.*[?&]v=([^&]+).*/)[1];
				hashmap[id] = yt;
				if(cache[id]){
					cachedIds[ii] = id;
					ii++;
				}else{
					nonCachedIds[i] = id;
					i++;
				}
			//this is youtube's fault™
			}else if(yt.offsetParent.children[0].children[0].children[0].href){
				let id = yt.offsetParent.children[0].children[0].children[0].href.match(/.*[?&]v=([^&]+).*/)[1];
				hashmap[id]	= yt;
				if(cache[id]){
					cachedIds[ii] = id;
					ii++;
				}else{
					nonCachedIds[i] = id;
					i++;
				}
			}else{
				console.debug("Could not find a valid video id");
			}
		}catch (err){}
	});

	//Gets the channel trailer in the HTML Document and registers it
	if(window.location.href.includes("user")){
		try{
			let trailerDoc = document.getElementsByTagName("ytd-channel-video-player-renderer")[0];
			let id = trailerDoc.children[1].children[0].children[0].children[0].href.href.match(/.*[?&]v=([^&]+).*/)[1];
			hashmap[id] = trailerDoc.children[1].children[0].children[0].children[0]
		}catch (err) {}
	}
	
	
	//Gets the main video in the HTML Document and registers it
	if(window.location.href.includes("watch")){
		try{
			let mainDoc = document.getElementsByClassName("title ytd-video-primary-info-renderer")[0]
			let id = mainDoc.baseURI.match(/.*[?&]v=([^&]+).*/)[1];
			hashmap[id] = mainDoc.children[0];
		}catch (err) {}
	}
	


	//If there are new non-cached ids we make an api request and cache then, if not we make sure the title have already been changed or else we change it.
	if(nonCachedIds.length > 0){
		while(nonCachedIds.length > 45){
			apiRequest(hashmap, nonCachedIds.slice(0, 45))
			nonCachedIds = nonCachedIds.slice(45, nonCachedIds.length)
		}
		apiRequest(hashmap, nonCachedIds)
	}else if(cachedIds.length > 0){
		[].forEach.call(cachedIds, (videoId)=> {
			if(hashmap[videoId].innerText != cache[videoId].snippet.title) {
				console.debug("Changing "+videoId+ " title");
				hashmap[videoId].innerText = cache[videoId].snippet.title;
			}
		});
	}
	

}, 1000);

function apiRequest(hashmap, ids) {
	var xhr = new XMLHttpRequest();
	console.debug("Requesting "+ids.length+" videos information from youtube api...");
	xhr.open("GET", "https://www.googleapis.com/youtube/v3/videos?id="+ids.join(",")+"&part=snippet&key="+apiKey, true);
	xhr.onload = function (e) {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				json = JSON.parse(xhr.responseText);
				[].forEach.call(json.items, (videoJson)=> {
					cache[videoJson.id] = videoJson;
					console.debug("Changing "+videoJson.id+" title");
					hashmap[videoJson.id].innerText = videoJson.snippet.title;
				});
			}else{
				console.debug("Unknown error while requesting the Youtube API.")
				console.error(xhr.statusText);
			}
		}
	};
	xhr.onerror = function (e) {
		console.debug("Unknown error while requesting the Youtube API.")
    	console.error(xhr.statusText);
	};
	xhr.send(null);
}