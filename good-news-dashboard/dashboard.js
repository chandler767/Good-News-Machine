let currentVoteID;
let currentVoteCount;

let timeLimit = 90;
let timePassed = 0;
let timeLeft = timeLimit;
let timerInterval = null;
let shownEmoji = 0;
let timeoutCache = 0;
let isTyping = false;
let isTypingChannel = 'is-typing';
let typingIndicator = document.getElementById("typing-indicator");

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = timeLimit/3;
const ALERT_THRESHOLD = timeLimit/5;

let [myName, myInitials] = [sessionStorage['myName'],sessionStorage['myInitials']];

if (!sessionStorage['myName'] || !sessionStorage['myInitials']) {
	[sessionStorage['myName'], sessionStorage['myInitials']] = generateName();
	[myName, myInitials] = [sessionStorage['myName'],sessionStorage['myInitials']];
}

console.log("Hello "+myName);

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
	subscribeKey: "sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302",
	uuid: myName,
	presenceTimeout: 90,
})

pubnub.addListener({
	message: function(message) {
		console.log(message);
		if (message.channel == currentVoteID) {
			document.getElementById('featured-votes').innerHTML = "<p>⭐ "+currentVoteCount+" Votes</p>";
			if (shownEmoji == 0) {
				emojiAnimate(message.message);
			} else {
				shownEmoji = shownEmoji-1;
			}
		} else if (message.channel == "chatfeatured") {
			let yourName = message.message.name;
			if (yourName == myName) {
				yourName = yourName + " (You)"
			}
			let timeStamp = new Date(message.message.time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
            document.getElementById('chat-messages').innerHTML = document.getElementById('chat-messages').innerHTML + "<div class=\"chat-message\"><div class=\"profile-circle\">"+message.message.initials+"</div><div class=\"chat-message-head\"><h3>"+yourName+"</h3><p>"+timeStamp+"</p></div><div class=\"chat-message-content\"><p>"+message.message.message.substring(0,150)+"</p></div></div>";
			document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
			hideTypingIndicator();        
		}
	},
	presence: function(presenceEvent) {
		document.getElementById('online-count').innerHTML = "👥 "+presenceEvent.occupancy+" - Online";
	},
	signal: function(s) {
        clearTimeout(timeoutCache);
        if (s.publisher != myName) {
        	typingIndicator.style = "";
	        timeoutCache = setTimeout(hideTypingIndicator, 10000) // 10 seconds
	        if (s.message === '0') {
	            hideTypingIndicator();
	        }
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
	div.style.left = Math.floor((Math.random() * (width-110)) + 10)+"px";
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
    request.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
    		currentVoteCount = this.responseText;
    		document.getElementById('featured-votes').innerHTML = "<p>⭐ "+currentVoteCount+" Votes</p>";
        }
     };
    shownEmoji = shownEmoji+1;
    emojiAnimate(emoji);   
};

function refreshPosts() {
	console.log("refreshing posts");
	pubnub.unsubscribe({
	    channels: [currentVoteID],
	});
	// Get featured post
	pubnub.history(
	    {
	        channel: 'news_stream_featured',
	        reverse: false,
	        count: 1, // how many items to fetch
	    },
	    function (status, response) {
	    	if (response.messages != "undefined" && response.messages.length > 0) {
	    		//console.log(response);
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

					document.getElementById('featured-story-post').innerHTML = "<a href=\""+activeFeaturedPost.link+"\" target=\"_blank\"><h1>"+truncate(activeFeaturedPost.title, 98)+"</h1></a><h2>"+description+"</h2><a href=\""+activeFeaturedPost.link+"\" target=\"_blank\"><h3>"+truncate(activeFeaturedPost.link, 30)+"</h3></a><div id=featured-votes><p>⭐ 0 Votes</p></div>";
			    	let minValue = 0
			    	if (currentVoteCount>10){
			    		minValue = currentVoteCount-10;
			    	}
			    	animateValue("featured-votes", minValue, currentVoteCount, 500);

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
				for (var i = topPostMessages.length-1; i >= 0; i--) {
					let post_org = true;
					for (var u = topPostMessages.length-1; u >= 0; u--) {
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

pubnub.hereNow( // Update online count.
    {
        channels: ["chatfeatured"]
    },
    function (status, response) {
        document.getElementById('online-count').innerHTML = "👥 "+response.totalOccupancy+" - Online";
    }
);

// Get chat messages
pubnub.history(
    {
        channel: "chatfeatured",
        reverse: false,
        count: 15, 
    },
    function (status, response) {
    	let displayed = 0;
    	var chatMessages = response.messages;				    	
    	if (typeof chatMessages !== "undefined" && chatMessages.length > 0) {
    		document.getElementById('chat-messages').innerHTML = "";
			for (var i = 0; i < chatMessages.length; i++) {
				let yourName = chatMessages[i].entry.name;
				if (yourName == myName) {
					yourName = yourName + " (You)"
				}
				let timeStamp = new Date(chatMessages[i].entry.time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
				document.getElementById('chat-messages').innerHTML = document.getElementById('chat-messages').innerHTML + "<div class=\"chat-message\"><div class=\"profile-circle\">"+chatMessages[i].entry.initials+"</div><div class=\"chat-message-head\"><h3>"+yourName+"</h3><p>"+timeStamp+"</p></div><div class=\"chat-message-content\"><p>"+chatMessages[i].entry.message.substring(0,150)+"</p></div></div>";
				document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
			};
		} else {
			document.getElementById('chat-messages').innerHTML = "<div class=\"chat-message\"><div class=\"profile-circle\">PN</div><div class=\"chat-message-head\"><h3>PubNub</h3><p></p></div><div class=\"chat-message-content\"><p>What are you waiting for? Send the first message!</p></div></div>";
		}
	}
);

pubnub.subscribe({
    channels: ["chatfeatured", isTypingChannel],
    withPresence: true 
});

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

function animateValue(id, start, end, duration) {
var obj = document.getElementById(id);
    var range = end - start;
    var minTimer = 50;
    var stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);

    var shownEmojis = 0;
    var maxEmojis = 10; // Limit the amount of animations on screen.

    var startTime = new Date().getTime();
    var endTime = startTime + duration;
    var timer;
  
    function run() {
        var now = new Date().getTime();
        var remaining = Math.max((endTime - now) / duration, 0);
        var value = Math.round(end - (remaining * range));
        obj.innerHTML = "<p>⭐ "+value+" Votes</p>";
        if (range<maxEmojis) {
        	maxEmojis = range;
        }
        if (shownEmojis<maxEmojis){
        	shownEmojis=shownEmojis+1;
        	emojiAnimate(Math.floor((Math.random() * 4) + 1));   
        }
        if (value == end) {
            clearInterval(timer);
        }
    }
    
    timer = setInterval(run, stepTime);
    run();
}

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

window.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#emoji-button');
  const picker = new EmojiButton();

  picker.on('emoji', emoji => {
    document.querySelector('#chat-input').value += emoji;
    document.querySelector('#chat-input').get(0).focus(); 
  });

  button.addEventListener('click', () => {
    picker.togglePicker(button);
  });
});

document.getElementById("chat-input").addEventListener("keydown", function (e) {
    if (e.keyCode === 13) { 
    	e.preventDefault();
    	if (document.getElementById('chat-input').value != "") {
    		var publishConfig = {
			channel : "chatfeatured",
			message: { 
					name: myName,
					initials: myInitials,
					message: document.getElementById('chat-input').value,
					time: new Date()
				}
			}
	        pubnub.publish(publishConfig, function(status, response) {
	            console.log(status, response);
	        })
	        document.getElementById('chat-input').value = "";
    	}
    }
    const inputHasText = document.getElementById("chat-input").value.length > 1;
    // Publish new PubNub signal: Typing Indicator ON (1) or OFF (2)
    if ((inputHasText && !isTyping) || (!inputHasText && isTyping)) {
        isTyping = !isTyping;
        pubnub.signal({
            channel: isTypingChannel,
            message: inputHasText ? '1' : '0'
        });
    }
});

function capFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRandomInt(min, max) {
  	return Math.floor(Math.random() * (max - min)) + min;
}

function generateName(){

	var name1 = ["adaptable", "adventurous", "affable", "affectionate", "agreeable", "ambitious", "amiable", "amicable", "amusing", "brave", "bright", "calm", "careful", "charming", "communicative", "compassionate", "considerate", "convivial", "courageous", "courteous", "creative", "decisive", "determined", "diligent", "diplomatic", "discreet", "dynamic", "easygoing", "emotional", "energetic", "enthusiastic", "exuberant", "faithful", "fearless", "forceful", "frank", "friendly", "funny", "generous", "gentle", "good", "gregarious", "helpful", "honest", "humorous", "imaginative", "impartial", "independent", "intellectual", "intelligent", "intuitive", "inventive", "kind", "loving", "loyal", "modest", "neat", "nice", "optimistic", "passionate", "patient", "persistent", "pioneering", "polite", "powerful", "practical", "reliable", "reserved", "resourceful", "romantic", "sensible", "sincere", "sociable", "sympathetic", "thoughtful", "tidy", "tough", "unassuming", "understanding", "versatile", "warmhearted", "willing", "witty"];

	var name2 = ["alligator", "ant", "bear", "bee", "bird", "camel", "cat", "cheetah", "chicken", "chimpanzee", "cow", "crocodile", "deer", "dog", "dolphin", "duck", "eagle", "elephant", "fish", "fly", "fox", "frog", "giraffe", "goat", "goldfish", "hamster", "hippopotamus", "horse", "kangaroo", "kitten", "lion", "lobster", "monkey", "octopus", "owl", "panda", "pig", "puppy", "rabbit", "rat", "scorpion", "seal", "shark", "sheep", "snail", "snake", "spider", "squirrel", "tiger", "turtle", "wolf", "zebra"];

	var first = capFirst(name1[getRandomInt(1, name1.length)]);

	var last = capFirst(name2[getRandomInt(1, name2.length)]);

	return [(first + ' ' + last), (first.charAt(0)+last.charAt(0))];

}

let hideTypingIndicator = () => {
	isTyping = false;
	typingIndicator.style = "visibility:hidden;";
}