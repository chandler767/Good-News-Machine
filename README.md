# Good-News-Machine
A web-app that aggregates a feed of positive news.

[Try It Here: https://goodnews.chandlermayo.com/good-news-dashboard/dashboard.html](https://goodnews.chandlermayo.com/good-news-dashboard/dashboard.html)

## There are 3 components:
1. The RSS Firehose - for creating a stream of news feeds from randomly selected sources. 
2. PubNub Functions - for filtering posts by positivity, rotating featured and top posts, and handling voting.
3. The Dashboard - for displaying the news feed and voting. 

## RSS Firehose:
The RSS Firehose is a Go app that randomly selects an RSS feed from a provided list of feeds and then selects a random post. The post title is checked against a list of banned words before publishing the post to PubNub. The banned word list allows for removal of posts that may be classified as positive when they are in fact not. 

## PubNub Functions:
There are 3 functions used by this application:
- Amazon Comprehend Positivity Filter. The filter runs each time a new post is received and uses Amazon Comprehend to perform sentiment analysis on the post title. If the post title is positive a new message is published to a ‘Featured Posts’ channel with a timestamp for when the post should be rotated in to be displayed. When a new featured post is staged to be displayed the previous featured post is checked to see if it received more votes than the average of the last two featured posts. If it received enough votes a message is published to the ‘Top Voted’ channel. 
- Vote function. The Vote function provides an endpoint for adding a new vote to a featured post. The vote action is also published to a another channel specific to the post that was voted for so that an animation can be displayed and the vote count can be updated in the dashboard as votes occur. 
- Vote Count function. The Vote Count function exposes an endpoint for returning an updated count of votes for both ‘Featured' and 'Top Voted' posts on refresh. 

## Dashboard:
- The dashboard makes a history request to the ‘Top Featured’ channel to get the most recently featured post, next staged post, and the timestamp. The timestamp is used to rotate posts to be displayed and to keep the timer in sync for all users. When the countdown time has finished another request to history is made to check for a new featured post. If there’s not a new featured post the staged featured post is displayed, giving the filter time to find a new featured message from the rss post stream for the next cycle.
- The dashboard also makes a history request to the ‘Top Posts’ channel and displays the most recent 5 top posts. 
- The vote counts are rechecked each time the posts are refreshed.
- The dashboard subscribes to the current featured post vote channel and updates the vote count, along with displaying the emoji used to vote, in an animation as they occur. The dashboard unsubscribes and resubscribes when the featured posts are rotated to display the correct animations for the active post.
