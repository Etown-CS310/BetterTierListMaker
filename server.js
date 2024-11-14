"use strict";
const express = require("express");
const path = require("path");
const multer = require("multer");
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
//const cookieParser = require("cookie-parser");
//const bcrypt = require('bcryptjs');
//const jwt = require('jsonwebtoken');


const app = express();
//app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//app.use(multer().none());

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

//--------------------------------------------------------------------------------
//                      Login and Registration Code
//--------------------------------------------------------------------------------

// Account Registration

// app.post('/register', async function (req, res){
//     try{
//         const username = req.body.username;
//         const password = req.body.password;

//         if (!username || !password){
//             return res.status(400).json({
//                 message: "Missing username or password."
//             });
//         }

//         const user = await findUser(username);

//         if (user){
//             return res.status(400).json({
//                 message: "User already registered."
//             });
//         }
//         const password_cipher = await bcrypt.hash(password, 10);
//         const result = await insertUser(username, password_cipher);

//         if (result) {
//             return res.status(200).json({
//                 message: "Account has been created successfully."
//             });
//         }
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message: "Error on the server."
//         });
//     }
// });

// //Login

// app.post('/login', async function (req, res) {
//     try {
//         const username = req.body.username;
//         const password = req.body.password;

//         if (!username || !password) {
//             return res.status(400).json({
//                 message: "Missing username or password."
//             });
//         }

//         const user = await findUser(username);
//         if (!user) {
//             return res.status(400).json({
//                 message: "User not found."
//             });
//         }
        

// // Authentication

//     const result = await bcrypt.compare(password, user.password);
//         if (result) {
//             const maxAge = 7 * 24 * 60 * 60;

//             const token = jwt.sign(
//                 { "login": true, "username": username },
//                 jwtSecret,
//                 { expiresIn: maxAge }
//             );
            
//             res.cookie("my_cipher", token, {
//                 httpOnly: true,
//                 maxAge: maxAge * 1000
//             });

//             res.status(200).json({
//                 'message': "Login successful"
//             });
//         }
//         else{
//             res.status(400).json({
//                 'message': "Password is incorrect."
//             });
//          }

//         } catch (error) {
//             console.log(error);
//             res.status(500).json({
//                 message: "Error on the server."
//             });
//         }
//     });

// // Render users page

// app.get('/user', (req, res) => {

//     const token = req.cookies.jwt;

//     if (token) {
//         jwt.verify(token, jwtSecret, (err, decodedToken) => {
//             console.log("decodedToken", decodedToken);

//             const login_status = false;


//             if (login_status) {
                
//                 res.sendFile(__dirname + "/public/user.html");
//             } else {
                
//                 res.status(401).json({
//                     message: "Not authorized"
//                 });
//             }
//         })
//     }else {
//         return res.status(401).json({
//             message: "Not authorized, token not available"
//         });

//     }
// });

// //Find User in Database

// async function findUser(username){
//     const db = await getDBConnection();
//     const query = "select id from users where username = ?";
//     const user = await db.get(query, [email]);

//     await db.close();
//     return user;
// }

// //Add user informaiton to database

// async function insertUser(username, password_cipher){
//     const db = await getDBConnection();
//     const insertSQL = "inster into users (username, password)" + "values (?,?)";
//     console.log(result);
//     const user = await findUser(username);
    
//     await db.close();
//     return user;
// }

// //Setup Database Connection

// async function getDBConnection(){
//     const db = await sqlite.open({
//         filename: DB_PATH,
//         driver: sqlite3.Database
//     });

//     return db;
// }

app.listen(PORT);
console.log('Server started at http://localhost:' + PORT);
