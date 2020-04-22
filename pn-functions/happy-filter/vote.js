export default (request, response) => {
    const kvstore = require('kvstore');
    const pubnub = require('pubnub');

    let paramsObject = request.params;
    console.log('request', request); // Log the request envelope passed

    let emoji = "";

    if (paramsObject.voteid == "undefined") {
        console.log("request with no voteid");
        response.status = 400;
        return response.send("Missing voteid.");
    }

    if (paramsObject.emoji != "undefined") {
        emoji = paramsObject.emoji;
    }

    return kvstore.get(paramsObject.voteid).then((value) => {
        kvstore.set(paramsObject.voteid, { 
            votes:(value.votes+1) // Count vote
        });
        pubnub.publish({ message: String(emoji), channel: paramsObject.voteid }); // Stream new votes so dashboards can keep a real time count.
        response.status = 200;
        return response.send("Vote accepted."); // (: 
    }).catch((error) => {
        console.log(error);
        response.status = 400;
        return response.send("VoteID not found.");
    });                             
};