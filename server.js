"use strict";
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.get("/img-upload", (req, res) => {
    try {
        let img = req.body;
        path = uploadImage(img);
        path_json = {'path' : path};
        res.type('json').send(path_json);
    }catch(error){
        let msg = {"error" : "Error on the server. Please try again later."};
        res.statusCode(500);
        res.type('json').send(msg);
    }
});
//this function is supposed to take an image as the input and save it on the server.
//it then is supposed to return the path to that image for the client to use. 
function uploadImage(img) {
    return "this/is/not/a/real/path/";
}

app.listen(PORT);
console.log('Server started at http://localhost:' + PORT);