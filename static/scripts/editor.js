"use strict";
(function(){
    window.addEventListener('load', init); 
    
    function init() {
        hideMenus();
        const btn_list = ['imagebtn', 'fontbtn', 'importbtn', 'exportbtn', 'savebtn',];
        btn_list.forEach(btn => {id(btn).addEventListener('click', (e) => {
            e.preventDefault(); //used to prevent bootstrap from refreshing the page every time a click event happens.
            showMenu(e.target.id)})});
    
        //Sets up the setting prompts to each gear icon
        const settings = qsa('.settings img');
        settings.forEach(icon =>{
            icon.addEventListener('click', function(){
                const row = this.closest('.row');
                const firstCol = row.querySelector('.first p');
                const first = row.querySelector('.first');
                const rowCol = row.querySelector('.col-10.editing');
                const pageBackground = document.querySelector('#editor-body');
                
                //prompt for tier name
                const changeName = confirm("Would you like to change the tier name?");
                if (changeName){
                    const newTierName = prompt("Enter a new tier name:");
                    if (newTierName !== null){
                        firstCol.textContent = newTierName;
                    }
                }

                //prompt for tier background color
                const changeColor = confirm("Do you want to change tier background color?");
                if (changeColor){
                    const newColor = prompt("Enter a new tier background color:", getComputedStyle(first).backgroundColor);
                    if (newColor !== null){
                        first.style.backgroundColor = newColor;
                        
                    }
                }

                //prompt for row background color
                const changeRowColor = confirm("Do you want to change row color?");
                if (changeRowColor){
                    const newRowColor = prompt("Enter a new row color:", getComputedStyle(rowCol).backgroundColor);
                    if (newRowColor !== null){
                        rowCol.style.backgroundColor = newRowColor;
                        
                    }
                }

                //prompt for page background color
                const changeBackgroundColor = confirm("Do you want to change the page background color");
                if (changeBackgroundColor){
                    const newBackgroundColor = prompt("Enter a new page background color:", getComputedStyle(rowCol).backgroundColor);
                    if (newBackgroundColor !== null){
                        pageBackground.style.backgroundColor = newBackgroundColor;
                        
                    }
                }
                
            });
        });
        if(window.sessionStorage.getItem("from_link") == 1){
            let jsonToUse = JSON.parse(window.sessionStorage.getItem("jsonInfo"));
            console.log(jsonToUse);
            useJSON(jsonToUse);
            window.sessionStorage.removeItem("from_link");
            window.sessionStorage.removeItem("jsonInfo");
        }
    }

    //Hides the menus when the user clicks a button from one
    function hideMenus(){
        let menus = qsa('.menu');
        for(let i = 0; i < menus.length; i++){
            menus[i].classList.add('hidden');
        }
    }

    //When a menu button is clicked, show the correct menu and add eventlisteners.
    function showMenu(btn_id) {
        hideMenus();
        let menu;
        switch(btn_id){
            case "imagebtn":
                menu = id('imageImport');
                menu.classList.remove('hidden');
                uploadImageMenu();
                break;
            case "fontbtn":
                menu = id('fontImport');
                menu.classList.remove('hidden');
                break;
            case "importbtn":
                menu = id('projectImport');
                menu.classList.remove('hidden');
                importJSON();
                break;
            case "exportbtn":
                menu = id('projectExport');
                menu.classList.remove('hidden');
                downloadProject();
                break;
            case "savebtn":
                menu = id('saveProject');
                menu.classList.remove('hidden');
                saveProjectMenu();
                break;
            default:
                console.log("Unknown id: "+ btn_id);
        }
    } 

    //Adds listeners to the submit-btn that allows users to upload images, and makes them draggable.
    function uploadImageMenu () {
        id('submit-btn').addEventListener('click', function(e) {
            e.preventDefault();
            const imageUpload = id('imageUpload');
            const imageContainer = id('imageContainer');
            const files = imageUpload.files;
            for (let file of files){
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = create('img');
                        img.src = e.target.result;
                        img.className = 'draggable-image';
                        img.draggable = true;
                        img.id = 'draggableImage_' + Date.now();

                        makeImageDraggable(img);
                        imageContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            }
            // Clear the file input after processing
            imageUpload.value = '';
            // Hides menu after uploading images.
            id('imageImport').style.display = 'none';
            let draggableImages = qsa('.draggable-image');
            draggableImages.forEach(image => {
                makeImageDraggable(image);
            });
            attachEventListeners(imageContainer);
        });
        // Add Close Button Function
        qs('.close-btn').addEventListener('click', function() {
            id('imageImport').style.display = 'none';
        });

        // Allow Image Upload Box to Reopen
        id('imagebtn').addEventListener('click', function(){
            id('imageImport').style.display = 'block';
        });
    }

    //Used when user is trying to download their project as a JSON.
    function downloadProject(){
        id('dl-btn').addEventListener('click', function(e) {
            e.preventDefault();
            //bug here where images are not updated before being exported.
            //uploadImages(); 
            //setTimeout(async ()=>{
                const jsonString = JSON.stringify(getJSON(), null,2);
                const blob = new Blob([jsonString], {type:'application/json'}); //converts the JSON to a downloadable form.
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download;
                link.click();
            //},1000);
            id('projectExport').classList.add('hidden');
        });
    }
    
    //used to handle the menu for importing a project as a JSON
    function importJSON() {
        id('open-btn').addEventListener('click', function(e) {
            e.preventDefault();
            uploadJSON();
            id('projectImport').classList.add('hidden');
        });
    }

    //handles the actual upload of the JSON file
    function uploadJSON(){
        const fileInput = id('jsonFileInput'); 
        if(fileInput.length === 0){
            alert('Please select a file to upload');
            return;
        }
        const file = fileInput.files[0];
        if(file.type !== 'application/json'){ //verifies that the user uploaded a JSON file
            alert("Please upload a JSON file");
            return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
            try{
                var jsonData = JSON.parse(event.target.result);
                useJSON(jsonData);
            }catch(error){
                console.error("Error parsing JSON file:", error);
                alert("Error parsing JSON file"); //used to verify that the JSON is in the correct format
            }
        }
        reader.readAsText(file);
    }

    //Used to parse through the users' uploaded JSON, and place images correctly
    function useJSON(json){
        
        //set tier list title
        let rows = qsa('.container .row');
        

        for(let i = 0; i < rows.length-1; i++){ 
            let row = rows[i];
            let row_area = row.querySelector('.editing');
            let first = row.querySelector('.first')
            //set row title/color
            let tierText = row.querySelector('.first p');
            let pageBackground = document.querySelector('#editor-body');
            
            if (json.rows[i] && json.rows[i].name){
                tierText.textContent = json.rows[i].name;
            }
            if (json.rows[i].tierColor) {
                first.style.backgroundColor = json.rows[i].tierColor;
            }
            if (json.rows[i].rowColor) {
                row_area.style.backgroundColor = json.rows[i].rowColor;
            }
            if (json.pageBackground) {
                pageBackground.style.backgroundColor = json.pageBackground;
            }

            for(let j = 0; j < json.rows[i].items.length; j++) {
                let new_img = document.createElement('img');
                new_img.src = json.rows[i].items[j].src;
                new_img.classList.add('draggable-image');
                new_img.draggable = true;
                makeImageDraggable(new_img);
                //new_img.alt = json.rows[i].items[j].alt;
                new_img.title = json.rows[i].items[j].description;
                //right click event for adding a description to the image. For some reason contextmenu listeners need to return false in order to work.
                new_img.addEventListener('contextmenu', (e)=> {
                    e.preventDefault(); //prevents the normal context menu from appearing when image is right clicked.
                    e.target.title = prompt("Enter your description here: ");
                    return false;
                }, false);
                row_area.appendChild(new_img);
            }   
        }
    }
    
    //Adds event listners to the buttons in the project menu.
    function saveProjectMenu(){
        //Save Button sends the images to the server
        id('save-btn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log(getJSON());
            uploadImages();
            id('saveProject').classList.add('hidden');
        });
        //Publish saves your actual tier list to the server as a JSON
        id('pub-btn').addEventListener('click', function(e) {
            e.preventDefault();
            const jsonString = JSON.stringify(getJSON(), null, 2);
            let json_name;
            fetch('http://localhost:8080/save-tierlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonString
            })
            .then(checkStatus)
            .then(response => response.json())
            .then(data => {
                console.log('Tierlist saved:', data);
                json_name = data.filename;
            })
            .catch(error => {
                console.error('Error saving tierlist:', error);
                alert('Failed to save tierlist');
            });
            id('saveProject').classList.add('hidden');
            

            html2canvas(document.querySelector("#capture")).then(canvas => {
                const formData = new FormData();
                formData.append("key",json_name);
                canvas.toBlob(blob => {
                    formData.append("thumbnail", blob, "image.jpg");
                    fetch('http://localhost:8080/thumb-upload', {
                        method: 'POST',
                        body: formData
                    })
                    .then(checkStatus)
                    .then(response => response.json())
                    .then(data => {
                        console.log('Thumbnail saved: ', data);
                    })
                    .catch(e => {
                        console.log("Error Uploading Thumbnail: ", e);
                    });
                }, 'image/jpeg');
            });


        });
    }

    //Convert current tier list to JSON format
    function getJSON(){
        let title = '';
        let author = '';
        let font = '';
        let projectJSON = {
            'title' : title,
            'author' : author,
            'font': font,
            'pageBackground': getColor(id('editor-body')),
            'rows': [] 
        };
        
        let rows = qsa('.container .row');
        //iterate over rows
        for(let i = 0; i < rows.length-1; i++){ //rows.length -1 because the last row contains the buttons.
            let row = rows[i];
            let cells = row.querySelectorAll('.editing img');
            let j;
            //create temp JSON file to append back to projectJSON
            let rowJSON = {
                'name': row.querySelector('.first p').textContent || "", //error here
                'tierColor': getColor(row.querySelector('.first')),
                'rowColor': getColor(row.querySelector('.col-10.editing')),
                'items': []
            };
            //iterate through each image in that row, and add it to JSON
            for(j = 0; j < cells.length; j++){
                rowJSON.items.push({
                    'src': cells[j].src,
                    'alt': cells[j].alt || "",
                    'description': cells[j].title

                });
            }
            //append row to projectJSON
            projectJSON.rows.push(rowJSON);
        }
        return projectJSON; 

    }

    //used to gather the images, send them to the server, and then return (and update) the new srcs
    async function uploadImages() {
        const images = qsa(".editing img");
        const formData = new FormData();
        for(let i = 0; i < images.length; i++){
            const img = images[i];
            const res = await fetch(img.src);
            const blob = await res.blob();
            formData.append("images", blob, `image${i}.jpg`);
        }
        //Timeout is set to give the images time to blob.
        setTimeout(async() => {
            try{
                const response = await fetch("http://localhost:8080/img-upload", {
                    method: "POST",
                    body: formData
                });
                const data = await response.json();
                updateImages(data);
            }catch (error){
                console.log("Image Upload Error: ", error);
            }
        }, 1000);
    }

    //Once the response is recieved with new src links for images, update the images on the list to the new src
    function updateImages(response) {
        //changes the src for images on the page to the server's location.
        let rows = qsa('.container .row');
        //iterate over rows
        let idx = 0;
        for(let i = 0; i < rows.length-1; i++){ //rows.length -1 because the last row contains the buttons.
            let row = rows[i];
            let cells = row.querySelectorAll('.editing img');
            let j;
            for(j = 0; j < cells.length; j++){
                cells[j].src = response.files[idx++];
            }
        }
    }

    // Function to make images draggable
    function makeImageDraggable(image) {
        image.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.id);
        });
    }

    // Add EventListeners to Divs
    function attachEventListeners(imageContainer) {
        let editingDivs = qsa('.editing');
        editingDivs.forEach(item => {
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                item.classList.add('dragover');
            });

            item.addEventListener('dragleave', (e) => {
                item.classList.remove('dragover');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('dragover');
                const imageId = e.dataTransfer.getData('text/plain');
                const image = document.getElementById(imageId);
                
                if (!image) return;
                
                if (image.parentElement === imageContainer) {
                    const newImage = image.cloneNode(true);
                    newImage.draggable = true;
                    newImage.id = 'image_' + Date.now();
                    
                    makeImageDraggable(newImage);
                    newImage.addEventListener('contextmenu', (e)=> {
                        e.preventDefault();
                        e.target.title = prompt("Enter your description here: ");
                        return false;
                    }, false)
                    item.appendChild(newImage);
                    image.remove();
                } 
                else if (image.parentElement.classList.contains('editing')) {
                    item.appendChild(image);
                }
            });
        });
    }
    /* ------------------------------ Helper Functions ------------------------------ */
    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} idName - element ID
     * @returns {object} DOM object associated with id.
     */
    function id(idName) {
        return document.getElementById(idName);
    }

    /**
     * Returns the first element that matches the given CSS selector.
     * @param {string} query - CSS query selector.
     * @returns {object[]} array of DOM objects matching the query.
     */
    function qs(query) {
        return document.querySelector(query);
    }

    /**
     * Returns the array of elements that match the given CSS selector.
     * @param {string} query - CSS query selector
     * @returns {object[]} array of DOM objects matching the query.
     */
    function qsa(query) {
        return document.querySelectorAll(query);
    }


    function create(idName) {
        return document.createElement(idName);
    }

    function getColor(element){
        return window.getComputedStyle(element).backgroundColor;
    }

    /**
     * This function needs documentation.
     * @returns {} response
     */
    function checkStatus(response) {
        if (!response.ok) {
            throw Error("Error in request: " + response.statusText);
        }
        return response;
    }

})()