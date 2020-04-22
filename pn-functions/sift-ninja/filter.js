export default (request) => {

    // SIFT NINJA
    // Create a free Sift Ninja account at https://www.siftninja.com

    // Your Sift Ninja account name
    //   For example, if your URL is https://my-test-account.siftninja.com, 
    //   your account name would be "my-test-account".
    const accountName = "pubnub";
    
    // Your Sift Ninja channel name
    //   Your channel configuration determines which topics to check the message
    //   against and how strictly to classify the content.
    const channelName = "pubnub_block";

    // Your Sift Ninja API key
    const apiKey = "";

    // End of configuration ------------------------

    const xhr = require("xhr");
    const basicAuth = require('codec/auth');
    const console = require('console');
    const authorization = basicAuth.basic(accountName + '/' + channelName,apiKey);

    let message = request.message;
    
    if (message.message == null) {
        return request.ok(message);
    }

    // Build the request to send to Sift Ninja
    const http_options = {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json",
            "Authorization": authorization
        },
        "body": JSON.stringify({
            "text": message.message,
            "user_id": message.user_id,
            "user_display_name": message.user_display_name
        })
    };

    // Send the request off to Sift Ninja for classification
    const url = "https://" + accountName + ".siftninja.com/api/v1/channel/" + channelName + "/sifted_data";
    return xhr.fetch(url, http_options).then(response => {
        
        var body = JSON.parse(response.body);
        
        // Take Sift Ninja's response and append it to the original message
        var sift_ninja = (response.status === 200 ? body : { error: body });
        Object.assign(message, { sift_ninja });
        
        if ((sift_ninja.tags.bullying == null) && (sift_ninja.tags.vulgar == null) && (sift_ninja.tags.racist == null) && (sift_ninja.tags.sexting == null)) {
            return request.ok(message);
        }
        return request.abort(); // Drop
    }).catch(err => {
        // Gather the error and append it to the original message
        var sift_ninja = { error: err };
        Object.assign(message, { sift_ninja });
        
        return request.ok(message);
    });

};
