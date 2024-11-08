"use strict";
const express = require("express");
const multer = require('multer');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "database/images/"); //directory for files
    },
    filename: (req, file, cb) => {
        const suffix = Date.now() + "-" + Math.round(Math.random()*1e9); //creates random suffix for images
        cb(null, suffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: {filesize: 5 * 1024 * 1024} //limits file size to 5mb. 
});

app.use(express.static('static'));

app.post('/img-upload', upload.array('images'), (req, res) => {
    try {
        const filePaths = req.files.map((file) => {
            const fileName = path.basename(file.path);
            return `http://localhost:8080/images/${fileName}`;
        });
        res.status(200).json({files: filePaths});
    }catch(error){
        let msg = {"error" : "Error on the server. Please try again later."};
        res.status(500);
        res.type('json').send(msg);
    }
});

app.get('/images/:id', (req, res) => {
    const id = req.params.id;
    const imgUrl = `http://localhost:{PORT}/database/images/${id}`;
    res.status(200).json({src:imgUrl})
});
app.use("/images", express.static(path.join(__dirname, "database/images")));

app.listen(PORT);
console.log('Server started at http://localhost:' + PORT);