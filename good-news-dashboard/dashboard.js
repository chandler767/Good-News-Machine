let currentVoteID;
let currentVoteCount;

let timeLimit = 180;
let timePassed = 0;
let timeLeft = timeLimit;
let timerInterval = null;
let shownEmoji = 0;

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = timeLimit/3;
const ALERT_THRESHOLD = timeLimit/5;

const COLOR_CODES = {
  info: {
    color: "#F79041"
  },
  warning: {
    color: "#FF4900",
    threshold: WARNING_THRESHOLD
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD
  }
};
let remainingPathColor = COLOR_CODES.info.color;


var pubnub = new PubNub({
	publishKey: "pub-c-aac19938-466b-4d89-8a61-ba29ec3b4149",
	subscribeKey: "sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302"
})

pubnub.addListener({
	message: function(message) {
		currentVoteCount = parseInt(currentVoteCount, 10)+1;
		document.getElementById('featured-votes').innerHTML = "<p>⭐ "+currentVoteCount+" Votes</p>";
		if (shownEmoji == 0) {
			emojiAnimate(message.message);
		} else {
			shownEmoji = shownEmoji-1;
		}
	},
})

function emojiAnimate(emoji){
	var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var div = document.createElement("div");
	div.className = "emoji";
	if (emoji == "1") {
		div.innerHTML = "<h1>😀</h1>";
	} else if (emoji == "2") {
		div.innerHTML = "<h1>❤️</h1>";
	} else if (emoji == "3") {
		div.innerHTML = "<h1>⭐</h1>";
	} else if (emoji == "4") {
		div.innerHTML = "<h1>🏆</h1>";
	} else {
		div.innerHTML = "<h1>⭐</h1>";
	}
	div.style.position = "absolute";
	div.style.bottom = "-100%"; 
	div.style.left = Math.floor((Math.random() * (width-20)) + 10)+"px";
	div.style.opacity = 0;
	document.getElementById('wrapper').append(div);
	animateUp(div)
}

function animateUp(elem) {
	var pos = 0;
	var opac = 0;
	var id = setInterval(frame, 7);
	function frame() {
		if (pos == 125) {
			clearInterval(id);
			elem.parentElement.removeChild(elem);
		} else {
			pos++;
			if (opac < 1) {
				opac = opac+0.05;
				elem.style.opacity = opac;
			}
			elem.style.bottom = pos + '%';
		}
	}
}

function publishVote(emoji) { // Publish vote
	let request = new XMLHttpRequest();
    request.open('GET', 'https://ps.pndsn.com/v1/blocks/sub-key/sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302/vote?voteid='+currentVoteID+'&emoji='+emoji);
    request.send();
    shownEmoji = shownEmoji+1;
    emojiAnimate(emoji);   
};

function refreshPosts() {
	console.log("refreshing posts");
	pubnub.unsubscribeAll();
	// Get featured post
	pubnub.history(
	    {
	        channel: 'news_stream_featured',
	        reverse: false,
	        count: 1, // how many items to fetch
	    },
	    function (status, response) {
	    	if (response.messages != "undefined" && response.messages.length > 0) {
	    		console.log(response);
	    		document.getElementById('featured-story-post').innerHTML = "";
	    		timeLimit = response.messages[0].entry.cycle;
	    		timeLeft = timeLimit;
	    		let activeFeaturedPost = response.messages[0].entry.featured;
	    		currentVoteID = response.messages[0].entry.featured_vote_id;
	    		timePassed = (Math.round((new Date()).getTime() / 1000) - response.messages[0].entry.published);
	    		let timePassedLoops = Math.round(timePassed / timeLimit);
	    		timePassed = timePassed - (timePassedLoops*timeLimit);
	    		if (timePassed < 0) {
	    			timePassed = timePassed+timeLimit;
	    			timePassedLoops = timePassedLoops-1;
	    		}
	    		if (timePassedLoops % 2 == 0) { // Rotate to posts if a new post is not yet ready. 
	    			activeFeaturedPost = response.messages[0].entry.staged;
	    			currentVoteID = response.messages[0].entry.staged_post_vote_id;
	    		} 
	    		let request = new XMLHttpRequest();
			    request.onreadystatechange = function() {
			        if (this.readyState == 4 && this.status == 200) {
			            currentVoteCount = this.responseText;
			        } else {
			        	currentVoteCount = 0;
			        }
			        pubnub.subscribe({
					    channels: [currentVoteID],
					});
					let description = "";
					if (typeof activeFeaturedPost.description != "undefined") {
						description = truncate(activeFeaturedPost.description.replace( /(<([^>]+)>)/ig, ''), 150);
					}
					document.getElementById('featured-story-post').innerHTML = "<a href=\""+activeFeaturedPost.link+"\" target=\"_blank\"><h1>"+truncate(activeFeaturedPost.title, 98)+"</h1></a><h2>"+description+"</h2><a href=\""+activeFeaturedPost.link+"\" target=\"_blank\"><h3>"+activeFeaturedPost.link+"</h3></a><div id=featured-votes><p>⭐ "+currentVoteCount+" Votes</p></div>";
			    };
			    request.open('GET', 'https://ps.pndsn.com/v1/blocks/sub-key/sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302/count?voteid='+currentVoteID);
			    request.send();

			    startTimer();
			} else {
				document.getElementById('featured-story-post').innerHTML = "<h1>Unable to get featured post ):</h1>";
			}
	  	}
	);

	// Get top posts
	pubnub.history(
	    {
	        channel: 'top_voted',
	        reverse: false,
	        count: 15, // how many items to fetch
	    },
	    function (status, response) {
	    	let displayed = 0;
	    	var topPostMessages = response.messages;
	    	if (typeof topPostMessages !== "undefined" && topPostMessages.length > 0) {
	    		let posts = [];
				for (var i = 0; i < topPostMessages.length; i++) {
					let post_org = true;
					for (var u = 0; u < topPostMessages.length; u++) {
						if (i != u) {
							if (topPostMessages[i].entry.post.link == topPostMessages[u].entry.post.link) {
								post_org = false;
							}
						}
					};
					if (post_org != false) {
						if (displayed < 5) {
							currentPost = topPostMessages[i].entry;
							if (currentPost.vote_id != currentVoteID) {
								displayed = displayed+1;
								let description = "";
								if (currentPost.post.description !== undefined) {
									description = truncate(currentPost.post.description.replace( /(<([^>]+)>)/ig, ''), 150);
								}
								let title = truncate(currentPost.post.title, 98);
								let link = currentPost.post.link;
								let votes = currentPost.votes;
								let request = new XMLHttpRequest();
							    request.onreadystatechange = function() {
							    	let postVoteCount = 0;
							        if (this.readyState == 4 && this.status == 200) {
							            postVoteCount = this.responseText;
							            if (postVoteCount < votes) { // The object may have been removed from history. 
							            	postVoteCount = votes;
							            }
							            posts.push([Number(postVoteCount), "<div class=\"top-story\"><h2><a href=\""+link+"\" target=\"_blank\">"+title+"</a></h2><h3>"+description+"</h3><p>⭐ "+postVoteCount+" Votes</p></div>"]);
							        	addToTop(posts.sort(function(a,b) {
											return a[0]-b[0]
										}));
							        }
							    };
							    request.open('GET', 'https://ps.pndsn.com/v1/blocks/sub-key/sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302/count?voteid='+currentPost.vote_id);
							    request.send();
							}
						}
					}
				}
			} 
	    }
	);
}

function addToTop(posts) {
	document.getElementById('top-story-group').innerHTML = "";
	for (var i = posts.length-1; i >= 0; i--) {
		document.getElementById('top-story-group').innerHTML = document.getElementById('top-story-group').innerHTML + posts[i][1];
	}
}

refreshPosts();

document.getElementById("countdown").innerHTML = `
<div class="base-timer">
  <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="base-timer__circle">
      <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
      <path
        id="base-timer-path-remaining"
        stroke-dasharray="283"
        class="base-timer__path-remaining"
        style="color:${remainingPathColor}"
        d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
      ></path>
    </g>
  </svg>
</div>
`;

function topPosts(a, b) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}

function truncate(input, length) {
   if (input.length > length)
      return input.substring(0,length) + '...';
   else
      return input;
};

function onTimesUp() {
  	clearInterval(timerInterval);
  	refreshPosts();
}

function startTimer() {
  timerInterval = setInterval(() => {
    timePassed = timePassed += 1;
    timeLeft = timeLimit - timePassed;
    document.getElementById("countdown-time").innerHTML = "More good news in: " + formatTime(
      timeLeft
    );
    setCircleDasharray();
    setRemainingPathColor(timeLeft);

    if (timeLeft === 0) {
      onTimesUp();
    }
  }, 1000);
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  let seconds = time % 60;

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

function setRemainingPathColor(timeLeft) {
  const { alert, warning, info } = COLOR_CODES;
	if (timeLeft <= alert.threshold) {
		document
			.getElementById("base-timer-path-remaining")
			.style.color = alert.color;
	} else if (timeLeft <= warning.threshold) {
		document
			.getElementById("base-timer-path-remaining")
			.style.color = warning.color;
	} else {
		document
			.getElementById("base-timer-path-remaining")
			.style.color = info.color;
	}
}

function calculateTimeFraction() {
  const rawTimeFraction = timeLeft / timeLimit;
  return rawTimeFraction - (1 / timeLimit) * (1 - rawTimeFraction);
}

function setCircleDasharray() {
  const circleDasharray = `${(
    calculateTimeFraction() * FULL_DASH_ARRAY
  ).toFixed(0)} 283`;
  document
    .getElementById("base-timer-path-remaining")
    .setAttribute("stroke-dasharray", circleDasharray);
}