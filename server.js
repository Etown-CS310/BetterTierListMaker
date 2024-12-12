"use strict";

require('dotenv').config();
const fs = require('fs').promises;
const express = require("express");
const path = require("path");
const multer = require("multer");
const mysql = require('mysql2/promise');  // Updated to use mysql2/promise
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



// const bucketNameThumbs = '';


const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit:'10mb'}));

const PORT = process.env.PORT || 8080;

const { Storage } = require('@google-cloud/storage');
// const storage = new Storage({ keyFilename: '' }); this line is required to deploy and requires the json file provided by Google
// it will be left blank for having it on GitHub


const bucketName = 'bettertierlistmaker2.appspot.com';
//const bucketNameImages = bucketName + "/database/images";
//const bucketImage = storage.bucket(bucketNameImages);

//information for the MySQL pool will be left blank for GitHub
const pool = mysql.createPool({
    host: "",
    user: "",
    password: "",
    database: "btlm" 
});


const upload = multer({
    storage: multer.memoryStorage(), // Store in memory before uploading to GCS
    limits: { fileSize: 5 * 1024 * 1024 }, // Optional file size limit
  });

//thumbnail upload and storage
const tnupload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 5 * 1024 * 1024} //limits file size to 5mb. 
});

app.use(express.static('static'));


app.post('/img-upload', upload.array('images'), async (req, res) => {
    try {
      const filePaths = [];
  
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
      }
  
      // Create an array of promises for file uploads
      const uploadPromises = req.files.map((file, index) => {
        return new Promise((resolve, reject) => {
          const { originalname, buffer } = file;
          const newfilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
          const destination = `database/images/${newfilename}`;
  
          // Upload the file to GCS
          const bucket = storage.bucket(bucketName);
          const blob = bucket.file(destination);
          const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype, // Set the correct MIME type
          });
  
          blobStream.on('finish', () => {
            const fileUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
            filePaths.push(fileUrl);
            resolve(); // Resolve the promise when finished
          });
  
          blobStream.on('error', (err) => {
            console.error('Error uploading file:', err);
            reject(err); // Reject the promise on error
          });
  
          blobStream.end(buffer); // End the stream and start the upload
        });
      });
  
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
  
      // Send the response after all uploads have finished
      res.status(200).json({
        message: 'Files uploaded successfully!',
        files: filePaths
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      res.status(500).json({ message: 'Error uploading images' });
    }
  });


app.get('/images/:id', (req, res) => {
  const id = req.params.id;
  const imageUrl = `https://storage.googleapis.com/${bucketName}/${id}`;
  res.status(200).json({ src: imageUrl });
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
    const [rows] = await pool.execute('SELECT data, thumbnail FROM TierLists WHERE author = ?', [username]);
    return rows;
}

const jsonDirectory = path.join(__dirname, 'database/tierlists');

app.get('/get-json/:json', async (req, res) => {
    const filename = req.params.json;
    const destination = `database/tierlists/${filename}`; 
    try {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(destination);
        const [data] = await file.download();
        const jsonData = JSON.parse(data.toString('utf8'));
        res.status(200).json(jsonData);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ message: 'File not found' });
        }
        return res.status(500).json({ message: 'Error reading or parsing the file' });
    }
});

app.post('/thumb-upload', tnupload.single('thumbnail'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
  
      const { originalname, buffer } = req.file;
      const newfilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalname)}`;
      const destination = `database/thumbnails/${newfilename}`;
  
      // Upload the file to GCS
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(destination);
  
      await new Promise((resolve, reject) => {
        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: req.file.mimetype, // Set correct MIME type
        });
  
        blobStream.on('finish', resolve); // Resolve when upload is complete
        blobStream.on('error', reject);  // Reject on error
  
        blobStream.end(buffer); // End the stream and start the upload
      });
  
      // Generate the public URL for the uploaded file
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
      await insertThumbnail(fileUrl, req.body.key);
      // Send the response with the uploaded file URL
      res.status(200).json({
        message: 'File uploaded successfully!',
        file: fileUrl
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Error uploading image' });
    }
  });
/*
app.post('/thumb-upload', tnupload.single('thumbnail'), async (req, res) => {
  try {
    const bucketPath = bucketName + '/database/thumbnails'; 
    const fileName = req.file.originalname;
    const blob = storage.bucket(bucketName).file(fileName);
    
    await blob.upload(req.file.path);
    
    const imageUrl = `https://storage.googleapis.com/${bucketPath}/${fileName}`;
    
    await insertThumbnail(imageUrl, req.body.key);
    
    res.status(200).json({ msg: "Success!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading thumbnail' });
  }
});
*/

async function insertThumbnail(imgurl, key) {
    const [result] = await pool.execute('UPDATE TierLists SET thumbnail = ? WHERE data = ?', [imgurl, key]);
    return result; 
}

app.get('/thumbnail/:id', (req, res) => {
  const id = req.params.id;
  const imageUrl = `https://storage.googleapis.com/${bucketName}/${id}`;
  res.status(200).json({ src: imageUrl });
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

        const [rows] = await pool.execute('SELECT id, username, password FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (user){
            return res.status(400).json({
                message: "User already registered."
            });
        }
        const password_cipher = await bcrypt.hash(password, 10);
        const [result] = await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, password_cipher]);
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

        const [rows] = await pool.execute('SELECT id, username, password FROM users WHERE username = ?', [username]);
        const user = rows[0];

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
        const destination = `database/tierlists/${filename}`;

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(destination);
        await file.save(JSON.stringify(req.body, null, 2), {
            contentType: 'application/json', // Set appropriate content type
        });

        // Optionally make the file public or generate a signed URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

        // Insert the tierlist information into the database
        const [result] = await pool.execute('INSERT INTO TierLists (data, author) VALUES (?, ?)', [filename, username]);

        res.json({
            success: true,
            message: 'Tierlist saved successfully',
            filename: filename,
            username: username,
            url: publicUrl, // Optional: return the public URL
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

app.listen(PORT);
console.log('Server started at http://localhost:' + PORT);
