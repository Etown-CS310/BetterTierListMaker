"use strict";

require('dotenv').config();
const fs = require('fs').promises;
const express = require("express");
const path = require("path");
const multer = require("multer");
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit:'10mb'}));
//app.use(multer().none());

const PORT = process.env.PORT || 8080;
const DB_PATH = "database/btlm.db";

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
//thumbnail upload and storage
const tnstorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "database/thumbnails/"); //directory for files
    },
    filename: (req, file, cb) => {
        const suffix = Date.now() + "-" + Math.round(Math.random()*1e9); //creates random suffix for images
        cb(null, suffix + path.extname(file.originalname));
    }
});
const tnupload = multer({
    storage: tnstorage,
    limits: {fileSize: 5 * 1024 * 1024} //limits file size to 5mb. 
});

app.use(express.static('static'));

app.post('/img-upload', upload.array('images'), (req, res) => {
    try {
        const filePaths = req.files.map((file) => {
            const fileName = path.basename(file.path);
            return `http://localhost:8080/image/${fileName}`;
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
    const imgUrl = `http://localhost:{PORT}/image/${id}`;
    res.status(200).json({src:imgUrl})
});
app.use("/image", express.static(path.join(__dirname, "database/images")));

app.get('/userpage/:user', async function (req, res) {
    try{
        let username = req.params.user;
        if(username) {
            let listSet = await getLists(username);
            if(listSet){
                return res.status(200).json(listSet);
            }
            else {
                return res.status(400).json({msg: "No lists found for user"});
            }
        }
        else {
            return res.status(400).json({msg: "Missing valid user param"});
        }
    }catch(e){
        return res.status(400).json(e);
    }
});

async function getLists(username){
    const db = await getDBConnection();
    const query = "SELECT data, thumbnail FROM TierLists WHERE author = ?"; //curretly broken, as thumbnail is not in the table yet.
    const answer = await db.all(query, [username]);
    await db.close();
    return answer;
}

const jsonDirectory = path.join(__dirname, 'database/tierlists');

app.get('/get-json/:json', async (req, res) => {
    const filename = req.params.json;
    const filePath = path.join(jsonDirectory, filename); 
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        res.status(200).json(jsonData);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ message: 'File not found' });
        }
        return res.status(500).json({ message: 'Error reading or parsing the file' });
    }
});

app.post('/thumb-upload', tnupload.single('thumbnail'), async function (req, res) {
    try{
        //insert thumbnail into db
        const imgurl = path.basename(req.file.path);
        const key = req.body.key;
        await insertThumbnail(imgurl, key);
        return res.status(200).json({msg: "Success!"});
    }catch(e){
        let msg = {"error" : "Error on the server. Please try again later."};
        res.status(500);
        return res.type('json').send(msg);
    }
});

async function insertThumbnail(imgurl, key) {
    const db = await getDBConnection();
    const insert = "UPDATE TierLists SET thumbnail = ? WHERE data = ?"; 
    const answer = await db.run(insert, [imgurl, key]);
    await db.close();
    return answer; 
}

app.get('/thumbnail/:id', (req, res) => {
    const id = req.params.id;
    const imgUrl = `http://localhost:{PORT}/thumbnail/${id}`;
    res.status(200).json({src:imgUrl})
});
app.use("/thumbnail", express.static(path.join(__dirname, "database/thumbnails")));

//--------------------------------------------------------------------------------
//                      Login and Registration Code
//--------------------------------------------------------------------------------

//Account Registration

//Setting external environment variable as the secret
const jwtSecret = process.env.JWT_SECRET;

app.post('/register', async function (req, res){
    try{
        const username = req.body.username;
        const password = req.body.password;

        if (!username || !password){
            return res.status(400).json({
                message: "Missing username or password."
            });
        }

        const user = await findUser(username);

        if (user){
            return res.status(400).json({
                message: "User already registered."
            });
        }
        const password_cipher = await bcrypt.hash(password, 10);
        const result = await insertUser(username, password_cipher);

        if (result) {
            return res.status(200).json({
                message: "Account has been created successfully."
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error on the server."
        });
    }
});

//Login

app.post('/login', async function (req, res) {
    try {
        res.clearCookie(); //clears cookie to remove previous user information
        

        const username = req.body.username;
        const password = req.body.password;

        if (!username || !password) {
            return res.status(400).json({
                message: "Missing username or password."
            });
        }

        const user = await findUser(username);
        if (!user) {
            return res.status(400).json({
                message: "User not found."
            });
        }
        

// Authentication

    const result = await bcrypt.compare(password, user.password);
        if (result) {
            const maxAge = 7 * 24 * 60 * 60;

            const token = jwt.sign(
                { "login": true, "username": username },
                jwtSecret,
                { expiresIn: maxAge }
            );
            
            res.cookie("my_cipher", token, {
                httpOnly: true,
                maxAge: maxAge * 1000
            });

            res.status(200).json({
                'message': "Login successful",
                username: username
            });
        }
        else{
            res.status(400).json({
                'message': "Password is incorrect."
            });
         }

        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Error on the server."
            });
        }
    });

// Render users page

app.get('/user', (req, res) => {

    const token = req.cookies.my_cipher;

    if (token) {
        jwt.verify(token, jwtSecret, (err, decodedToken) => {
            console.log("decodedToken", decodedToken);

            const login_status = decodedToken.login;


            if (login_status) {
                
                res.sendFile(__dirname + "/static/user.html");
            } else {
                
                res.status(401).json({
                    message: "Not authorized"
                });
            }
        })
    }else {
        return res.status(401).json({
            message: "Not authorized, token not available"
        });

    }
});

// Save TierList Information
app.post('/save-tierlist', async (req, res) => {
    try {

        //grabs the current logged in user's name and setting it as a const variable
        const token = req.cookies.my_cipher;
        const decoded = jwt.verify(token, jwtSecret); 
        const username = decoded.username;
        console.log('Username:', username);

        
        const dirPath = path.join(__dirname, 'database', 'tierlists');
        await fs.mkdir(dirPath, { recursive: true }); // this creates the tier lists directory if it does not exists.

        const filename = `tierlist-${Date.now()}.json`;
        const filePath = path.join(dirPath, filename);

        await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));

        //inserts the tier list filename and the associated username to the TierLists table
        const db = await getDBConnection();
        const insertSQL = "INSERT INTO TierLists (data, author) VALUES (?, ?)";
        await db.run(insertSQL, [filename, username]);
        await db.close();

        res.json({                                   
            success: true,                                                
            message: 'Tierlist saved successfully',     
            filename: filename,
            username: username                          
        });                                             
    } catch (error) {                                   
        console.error('Error saving tierlist:', error); 
        res.status(500).json({                          
            success: false,                             
            message: 'Failed to save tierlist',         
            error: error.message                     
        });
    }
});

//Find User in Database

async function findUser(username){
    const db = await getDBConnection();
    const query = "SELECT id, username, password FROM users WHERE username = ?";
    const user = await db.get(query, [username]);

    await db.close();
    return user;
}

//Add user information to database

async function insertUser(username, password_cipher){
    const db = await getDBConnection();
    const insertSQL = "insert into users (username, password)" + "values (?,?)";
    const result = await db.run(insertSQL, [username, password_cipher]);
    console.log(result);
    const user = await findUser(username);
    
    await db.close();
    return user;
}

//Setup Database Connection

async function getDBConnection(){
    const db = await sqlite.open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    return db;
}

app.listen(PORT);
console.log('Server started at http://localhost:' + PORT);
