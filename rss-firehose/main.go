// Stream randomly sorted rss feeds to PubNub

package main

import (
	//pubnub "github.com/pubnub/go"
	"fmt"
	"github.com/mmcdole/gofeed"
	"math/rand"
	"time"
)

func main() {
	stream_urls := []string{
		"http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml",
		"http://feeds.reuters.com/reuters/topNews?format=xml",
		"https://feeds.skynews.com/feeds/rss/world.xml",
		"https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
		"https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
		"http://rss.cnn.com/rss/cnn_topstories.rss",
		"http://rss.cnn.com/rss/cnn_world.rss",
	}
	/*config := pubnub.NewConfig()
	config.PublishKey = "pub-c-aac19938-466b-4d89-8a61-ba29ec3b4149"
	config.SubscribeKey = "sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302"
	channel := "news_stream"
	pn := pubnub.NewPubNub(config)
	pn.Publish().Channel(channel).Message("").Execute()*/
	for {
		rand.Seed(time.Now().Unix())
		fp := gofeed.NewParser()
		feed, err := fp.ParseURL(stream_urls[rand.Intn(len(stream_urls))])
		if err != nil {
			panic(err)
		}
		fmt.Println(feed.Title)

		time.Sleep(2 * time.Second) // Send random news every 2 seconds
	}
}
