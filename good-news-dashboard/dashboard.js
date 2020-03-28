const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 30;
const ALERT_THRESHOLD = 10;

const COLOR_CODES = {
  info: {
    color: "green"
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD
  }
};

let currentVoteID;
let currentVoteCount;

let timeLimit = 300;
let timePassed = 0;
let timeLeft = timeLimit;
let timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;
let shownStaged = false;

var pubnub = new PubNub({
	publishKey: "pub-c-aac19938-466b-4d89-8a61-ba29ec3b4149",
	subscribeKey: "sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302"
})

pubnub.addListener({
	message: function(message) {
		currentVoteCount = parseInt(currentVoteCount, 10)+1;
		document.getElementById('featured-votes').innerHTML = "<p>⭐ "+currentVoteCount+" Votes</p>";
	},
})

function publishVote() { // Publish vote
	let request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // ToDo : animate emoji
        } else {
        	console.log("Vote failed");
        }
    };
    request.open('GET', 'https://ps.pndsn.com/v1/blocks/sub-key/sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302/vote?voteid='+currentVoteID);
    request.send();
   
};

function refreshPosts() {
	console.log("refreshing posts");
	pubnub.unsubscribeAll();
	// Get featured post
	pubnub.history(
	    {
	        channel: 'news_stream_featured',
	        count: 1, // how many items to fetch
	    },
	    function (status, response) {
	    	if (response.messages != "undefined" && response.messages.length > 0) {
	    		console.log(response);
	    		document.getElementById('featured-story').innerHTML = "";
	    		timeLimit = response.messages[0].entry.cycle;
	    		timeLeft = timeLimit;
	    		let activeFeaturedPost = response.messages[0].entry.featured;
	    		currentVoteID = response.messages[0].entry.featured_vote_id;
	    		timePassed = (Math.round((new Date()).getTime() / 1000) - response.messages[0].entry.published);
	    		if (timePassed >= timeLimit) { // Rotate to posts if a new post is not yet ready. 
	    			if (shownStaged == false) {
	    				activeFeaturedPost = response.messages[0].entry.staged;
	    				currentVoteID = response.messages[0].entry.staged_post_vote_id;
	    				shownStaged = true;
	    			} else {
	    				shownStaged = false;
	    			}
	    			timePassed = 0;
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
						description = activeFeaturedPost.description;
					}
					document.getElementById('featured-story').innerHTML = "<h1>"+activeFeaturedPost.title+"</h1><h2>"+description+"</h2><h3><a href=\""+activeFeaturedPost.link+"\" target=\"_blank\">"+activeFeaturedPost.link+"</a></h3><div id=featured-votes><p>⭐ "+currentVoteCount+" Votes</p></div>";
			    };
			    request.open('GET', 'https://ps.pndsn.com/v1/blocks/sub-key/sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302/count?voteid='+currentVoteID);
			    request.send();

			    startTimer();
			} else {
				document.getElementById('featured-story').innerHTML = "<h1>Unable to get featured post ):</h1>";
			}
	  	}
	);

	// Get top posts
	pubnub.history(
	    {
	        channel: 'top_voted',
	        count: 10, // how many items to fetch
	    },
	    function (status, response) {
	    	let displayed = 0;
	    	if (typeof response.messages !== "undefined" && response.messages.length > 0) {

	    		document.getElementById('top-story-group').innerHTML = "";
	    		var top_posts_body = ""
				for (var i = 0; i < response.messages.length; i++) {
					let post_org = true;
					for (var u = 0; u < response.messages.length; u++) {
						if (i != u) {
							if (response.messages[i].entry.vote_id == response.messages[u].entry.post.vote_id) {
								post_org = false;
							}
						}
					};
					if (post_org != false) {
						if (displayed < 5) {
							if (response.messages[i].entry.vote_id != currentVoteID) {
								displayed = displayed+1;
								let description = "";
								if (response.messages[i].entry.post.description !== undefined) {
									description = response.messages[i].entry.post.description;
								}
								top_posts_body = top_posts_body + "<div class=\"top-story\"><h2><a href=\""+response.messages[i].entry.post.link+"\" target=\"_blank\">🔗"+response.messages[i].entry.post.title.substring(0,100)+"</a></h2><h3>"+description+"</h3><p>⭐ "+response.messages[i].entry.votes+" Votes</p></div>"
							}
						}
					}
				}
			} else {
				top_posts_body = "Unable to get top posts ):"
			}
			document.getElementById('top-story-group').innerHTML = top_posts_body;
	    }
	);

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
        class="base-timer__path-remaining ${remainingPathColor}"
        d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
      ></path>
    </g>
  </svg>
  <span id="base-timer-label" class="base-timer__label">${formatTime(
    timeLeft
  )}</span>
</div>
`;



function onTimesUp() {
  	clearInterval(timerInterval);
  	refreshPosts();
}

function startTimer() {
  timerInterval = setInterval(() => {
    timePassed = timePassed += 1;
    timeLeft = timeLimit - timePassed;
    document.getElementById("base-timer-label").innerHTML = formatTime(
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
			.classList.remove(warning.color);
		document
			.getElementById("base-timer-path-remaining")
			.classList.add(alert.color);
	} else if (timeLeft <= warning.threshold) {
		document
			.getElementById("base-timer-path-remaining")
			.classList.remove(info.color);
		document
			.getElementById("base-timer-path-remaining")
			.classList.add(warning.color);
	} else {
		document
			.getElementById("base-timer-path-remaining")
			.classList.remove(alert.color);
		document
			.getElementById("base-timer-path-remaining")
			.classList.remove(warning.color);
		document
			.getElementById("base-timer-path-remaining")
			.classList.add(info.color);
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