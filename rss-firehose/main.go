// Stream random articles to PubNub

package main

import (
	//"fmt"
	"github.com/mmcdole/gofeed"
	pubnub "github.com/pubnub/go"
	"math/rand"
	"strings"
	"time"
)

func main() {

	stream_urls := []string{ // List of RSS feeds to randomly parse and send posts.
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
		"https://asia.nikkei.com/rss/feed/nar",
		"http://feeds.skynews.com/feeds/rss/world.xml",
		"http://feeds.skynews.com/feeds/rss/home.xml",
		"http://feeds.skynews.com/feeds/rss/technology.xml",
		"http://feeds.skynews.com/feeds/rss/entertainment.xml",
		"http://feeds.skynews.com/feeds/rss/us.xml",
		"https://asianews.network/feed/",
		"https://www.theverge.com/rss/exclusive/index.xml",
		"https://www.theverge.com/rss/breaking/index.xml",
		"https://www.theverge.com/policy/rss/index.xml",
		"https://www.theverge.com/web/rss/index.xml",
		"https://www.theverge.com/culture/rss/index.xml",
		"http://feeds.arstechnica.com/arstechnica/index",
		"http://feeds.arstechnica.com/arstechnica/features",
		"http://www.independent.co.uk/topic/SouthKorea/rss",
		"https://chicago.suntimes.com/rss/news/index.xml",
		"https://www.tnp.sg/latest/rss.xml",
		"https://www.channelnewsasia.com/rssfeeds/8395744",
		"https://www.channelnewsasia.com/rssfeeds/8396082",
		"https://www.channelnewsasia.com/rssfeeds/8395884",
		"https://www.channelnewsasia.com/rssfeeds/8395954",
		"https://www.channelnewsasia.com/rssfeeds/8395986",
		"https://www.cbc.ca/cmlink/rss-world",
		"https://www.cbc.ca/cmlink/rss-business",
		"https://www.cbc.ca/cmlink/rss-health",
		"https://www.cbc.ca/cmlink/rss-arts",
		"https://www.cbc.ca/cmlink/rss-technology",
		"https://www.cbc.ca/cmlink/rss-topstories",
	}

	badWords := []string{ // Prefilter. Ban these words from titles completely (even if the context would be positive).
		"death",
		"frightened",
		"scared",
		"smear",
		"test positive",
		"tests positive",
		"testing positive",
		"positive for coronavirus",
		"positive for coronavirus;",
		"dies of coronavirus",
		"dies after contracting",
		"contracting covid-19",
		"positive for",
		"dies",
		"hate",
		"fear",
		"scared",
		"victim",
		"sacrifices herself",
		"sacrifices himself",
		"fatal",
		"sad",
		"gun",
		"shot",
		"murdered",
		"invincible until",
		"fatal case",
		"fatalities",
		"fatality",
		"sour note",
		"shooter",
		"kill",
		"flaw",
		"broken",
		"damaged",
		"hurt",
		"grim",
		"casualty",
		"slips",
		"falls",
		"bullet",
		"bad",
	}

	config := pubnub.NewConfig()
	config.PublishKey = "pub-c-aac19938-466b-4d89-8a61-ba29ec3b4149"   // Your PubNub PUBLISH key here.
	config.SubscribeKey = "sub-c-0b04217e-6f8c-11ea-bbe3-3ec3e5ef3302" // Your PubNub SUBSCRIBE key here.
	channel := "news_stream"
	var lastTitle string
	pn := pubnub.NewPubNub(config)
	for {
		rand.Seed(time.Now().UnixNano() / int64(time.Millisecond))
		fp := gofeed.NewParser()
		newFeed := stream_urls[rand.Intn(len(stream_urls))] // Pick random RSS feed.
		feed, err := fp.ParseURL(newFeed)
		if err != nil { // Parse failied
			//fmt.Println("bad url:" + newFeed) // Delete these from the array if you see them.
		} else {
			//fmt.Println("url:" + newFeed)
			if len(feed.Items) > 0 {
				newPost := feed.Items[rand.Intn(len(feed.Items))] // Pick random post from RSS feed.
				//fmt.Println(newPost.Title)
				if newPost.Title != lastTitle { // Avoid duplicate sends.
					if !contains(badWords, strings.ToLower(newPost.Title)) {
						lastTitle = newPost.Title
						pn.Publish().Channel(channel).Message(newPost).Execute() // Send random posts.
					}
				}
			}
		}
		time.Sleep(time.Duration(rand.Int31n(200-50)+50) * time.Millisecond) // Random delay to slow things down.
	}
}

func contains(slice []string, item string) bool { // Prefilter.
	for i := 0; i < len(slice); i++ {
		if strings.Contains(item, slice[i]) {
			return true
		}
	}
	return false
}
