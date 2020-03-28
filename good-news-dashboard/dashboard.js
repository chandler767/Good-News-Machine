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

let current_voteid;
let current_votecount;

let timeLimit = 180;
let timePassed = 0;
let timeLeft = timeLimit;
let timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;

var pubnub = new PubNub({
	publishKey: "pub-c-aac19938-466b-4d89-8a61-ba29ec3b4149",
	subscribeKey: "sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302"
})

pubnub.addListener({
	message: function(message) {
		current_votecount = parseInt(current_votecount, 10)+1;
		document.getElementById('featured-votes').innerHTML = "<p>⭐ "+current_votecount+" Votes</p>";
	},
})

function publishVote() { // Publish vote
	let xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://ps.pndsn.com/v1/blocks/sub-key/sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302/vote?voteid='+current_voteid, false);
	try {
	  xhr.send();
	  if (xhr.status != 200) {
	    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
	  } else {
	   	// ToDo : animate emoji
	  }
	} catch(err) { // instead of onerror
	  console.log("Request failed");
	}
   
};

function refreshPosts() {
	pubnub.unsubscribeAll();
	// Get featured post
	pubnub.history(
	    {
	        channel: 'news_stream_featured',
	        count: 1, // how many items to fetch
	        stringifiedTimeToken: true, // false is the default
	    },
	    function (status, response) {
	    	if (response.messages != "undefined" && response.messages.length > 0) {
	    		document.getElementById('featured-story').innerHTML = "";
	    		timeLimit = response.messages[0].entry.cycle;
	    		timeLeft = timeLimit;
	    		timePassed = (Math.round((new Date()).getTime() / 1000) - response.messages[0].entry.published);
	    		if (timePassed >= timeLimit) {
	    			timePassed = 0;
	    		}
	    		startTimer();
	    		let xhr = new XMLHttpRequest();

				xhr.open('GET', 'https://ps.pndsn.com/v1/blocks/sub-key/sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302/count?voteid='+response.messages[0].entry.featured_vote_id, false);
				try {
				  xhr.send();
				  if (xhr.status != 200) {
				    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
				  } else {
				   	current_votecount = xhr.response;
				  }
				} catch(err) { // instead of onerror
				  console.log("Request failed");
				}
				pubnub.subscribe({
				    channels: [response.messages[0].entry.featured_vote_id],
				});
				console.log(response.messages[0].entry.featured_vote_id);
				current_voteid = response.messages[0].entry.featured_vote_id;
				document.getElementById('featured-story').innerHTML = "<h1>"+response.messages[0].entry.featured.title+"</h1><h2>"+response.messages[0].entry.featured.description+"</h2><h3><a href=\""+response.messages[0].entry.featured.link+"\" target=\"_blank\">"+response.messages[0].entry.featured.link+"</a></h3><div id=featured-votes><p>⭐ "+current_votecount+" Votes</p></div>";
			    console.log(response.messages[0]);
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
	        stringifiedTimeToken: true, // false is the default
	    },
	    function (status, response) {
	    	let displayed = 0;
	    	if (response.messages != "undefined" && response.messages.length > 0) {

	    		document.getElementById('top-story-group').innerHTML = "";
	    		var top_posts_body = ""
				for (var i = 0; i < response.messages.length; i++) {
					var post_org = true;
					for (var u = 0; u < response.messages.length; u++) {
						if (i != u) {
							if (response.messages[i].entry.post.title.substring(0,100) == response.messages[u].entry.post.title.substring(0,100)) {
								post_org = false;
							}
						}
					};
					if (post_org != false) {
						if (displayed < 5) {
							if (response.messages[i].entry.vote_id != current_voteid) {
								displayed = displayed+1;
								top_posts_body = top_posts_body + "<div class=\"top-story\"><h2><a href=\""+response.messages[i].entry.post.link+"\" target=\"_blank\">🔗"+response.messages[i].entry.post.title.substring(0,100)+"</a></h2><h3>"+response.messages[i].entry.post.description+"</h3><p>⭐ "+response.messages[i].entry.votes+" Votes</p></div>"
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