export default (request, response) => {
    const kvstore = require('kvstore');

    let paramsObject = request.params;
    console.log('request', request); // Log the request envelope passed

    if (paramsObject.voteid == "undefined") {
 		console.log("request with no voteid");
        response.status = 400;
        return response.send("Missing voteid.");
    }

   	return kvstore.get(paramsObject.voteid).then((value) => {
        response.status = 200;
		return response.send(value.votes); // (:
	}).catch((error) => {
        console.log(error);
        response.status = 200;
        kvstore.set(paramsObject.voteid, {
            votes: 1
        });
        return response.send("1");
    });                             
};