// Stream random articles to PubNub

package main

import (
	"github.com/mmcdole/gofeed"
	pubnub "github.com/pubnub/go"
	"math/rand"
	"time"
)

func main() {
	stream_urls := []string{
		"http://feeds.bbci.co.uk/news/world/rss.xml",
		"http://feeds.bbci.co.uk/news/rss.xml",
		"http://feeds.reuters.com/reuters/topNews?format=xml",
		"https://feeds.skynews.com/feeds/rss/world.xml",
		"https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
		"https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
		"https://feeds.a.dj.com/rss/RSSWorldNews.xml",
		"http://feeds.washingtonpost.com/rss/world",
		"https://www.reddit.com/r/UpliftingNews/.rss",
		"https://abcnews.go.com/abcnews/topstories",
		"https://nypost.com/feed/",
		"https://www.newyorker.com/feed/everything",
		"https://www.vox.com/rss/index.xml",
		"http://rssfeeds.usatoday.com/usatoday-NewsTopStories",
		"https://feeds.npr.org/1001/rss.xml",
		"http://feeds.wired.com/wired/index",
		"https://www.reddit.com/r/worldnews/.rss",
		"https://www.globalissues.org/news/feed",
		"https://www.yahoo.com/news/rss/world",
		"https://www.cnbc.com/id/100727362/device/rss/rss.html",
		"http://feeds.feedburner.com/time/world",
		"https://abcnews.go.com/abcnews/internationalheadlines",
		"https://www.cbsnews.com/latest/rss/world",
		"http://feeds.feedburner.com/daily-express-world-news",
		"https://www.mirror.co.uk/news/world-news/?service=rss",
		"https://www.latimes.com/world/rss2.0.xml",
	}
	config := pubnub.NewConfig()
	config.PublishKey = "pub-c-aac19938-466b-4d89-8a61-ba29ec3b4149"
	config.SubscribeKey = "sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302"
	channel := "news_stream"
	pn := pubnub.NewPubNub(config)
	for {
		rand.Seed(time.Now().Unix())
		fp := gofeed.NewParser()
		feed, err := fp.ParseURL(stream_urls[rand.Intn(len(stream_urls))])
		if err != nil { // Parse failied
			time.Sleep(time.Duration(rand.Int31n(7-2)+2) * time.Second) // Send random news every few seconds
		} else {
			pn.Publish().Channel(channel).Message(feed.Items[rand.Intn(len(feed.Items))]).Execute()
			time.Sleep(time.Duration(rand.Int31n(7-2)+2) * time.Second) // Send random news every few seconds
		}
	}
}
