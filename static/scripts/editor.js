"use strict";
(function(){
    window.addEventListener('load', init);
    
    function init() {
        hideMenus();
        const btn_list = ['imagebtn', 'fontbtn', 'importbtn', 'exportbtn', 'savebtn'];
        btn_list.forEach(btn => {id(btn).addEventListener('click', (e) => {
            e.preventDefault();
            showMenu(e.target.id)})});
    }
    function hideMenus(){
        let menus = qsa('.menu');
        for(let i = 0; i < menus.length; i++){
            menus[i].classList.add('hidden');
        }
    }
    function showMenu(btn_id){
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
    /*Test Code for Images*/
    const imageContainer = id('imageContainer');
    const imageUpload = id('imageUpload');
    let draggableImages = qsa('.draggable-image');
    let editingDivs = qsa('.editing');

    // Add Close Button Function
    qs('.close-btn').addEventListener('click', function() {
            id('imageImport').style.display = 'none';
    });

    // Allow Image Upload Box to Reopen
    id('imagebtn').addEventListener('click', function(){
            id('imageImport').style.display = 'block';
    });

    // Image Upload Function
    function uploadImageMenu () {
        id('submit-btn').addEventListener('click', function(e) {
            e.preventDefault();
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
        });
    }
    function downloadProject(){
        id('dl-btn').addEventListener('click', function(e) {
            e.preventDefault();
            const jsonString = JSON.stringify(getJSON(), null,2);
            const blob = new Blob([jsonString], {type:'application/json'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download
            link.click();
            id('projectExport').classList.add('hidden');
        });
    }
    function importJSON() {
        id('open-btn').addEventListener('click', function(e) {
            e.preventDefault();
            uploadJSON();
            id('projectImport').classList.add('hidden');
        });
    }
    function uploadJSON(){
        const fileInput = id('jsonFileInput'); //need to make
        if(fileInput.length === 0){
            alert('Please select a file to upload');
            return;
        }
        const file = fileInput.files[0];
        if(file.type !== 'application/json'){
            alert("Please upload a JSON file");
            return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
            try{
                var jsonData = JSON.parse(event.target.result);
                useJSON(jsonData);
            }catch(error){
                //console.log(event.target.result);
                alert("Error parsing JSON file");
            }
        }
        reader.readAsText(file);
    }

    function useJSON(json){
        //set tier list title
        let rows = qsa('.container .row');
        for(let i = 0; i < rows.length-1; i++){ 
            let row = rows[i];
            let row_area = row.querySelector('.editing');
            //set row title/color
            for(let j = 0; j < json.rows[i].items.length; j++) {
                let new_img = document.createElement('img');
                new_img.src = json.rows[i].items[j].src;
                new_img.classList.add('draggable-image');
                new_img.draggable = true;
                makeImageDraggable(new_img);
                //new_img.alt = json.rows[i].items[j].alt;
                //set img description
                row_area.appendChild(new_img);
            }   
        }
    }
    

    function saveProjectMenu(){
        id('save-btn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log(getJSON());
            uploadImages();
            //fetch(url + "img-upload")
            //.then(checkStatus)
            //.then(updateImages);
            id('saveProject').classList.add('hidden');
        });
    }

    //Save project as json
    function getJSON(){
        let title = '';
        let author = '';
        let font = '';
        let projectJSON = {
            'title' : title,
            'author' : author,
            'font': font,
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
                'name': row.querySelector('.first').textContent || "", //error here
                'color': getColor(row.querySelector('.first')),
                'items': []
            };
            //iterate through each image in that row, and add it to JSON
            for(j = 0; j < cells.length; j++){
                rowJSON.items.push({
                    'src': cells[j].src,
                    'alt': cells[j].alt || "",
                    'description': ''
                });
            }
            //append row to projectJSON
            projectJSON.rows.push(rowJSON);
        }
        return projectJSON; 

    }
    async function uploadImages() {
        const images = qsa(".editing img");
        const formData = new FormData();
        for(let i = 0; i < images.length; i++){
            const img = images[i];
            const res = await fetch(img.src);
            const blob = await res.blob();
            formData.append("images", blob, `image${i}.jpg`);
        }
        // images.forEach((img, idx) => {
        //     fetch(img.src)
        //     .then((res) => res.blob())
        //     .then((blob)=>{
        //         formData.append("images", blob, `image${idx+1}.jpg`);
        //     });
        // });
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
    function updateImages(response) {
        //changes the src for images on the page to the server's location.
        // res = response.json();
        let rows = qsa('.container .row');
        //iterate over rows
        let idx = 0;
        for(let i = 0; i < rows.length-1; i++){ //rows.length -1 because the last row contains the buttons.
            let row = rows[i];
            let cells = row.querySelectorAll('.editing img');
            let j;
            for(j = 0; j < cells.length; j++){
                cells[j].src = response.files.reverse()[idx++];
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
    function attachEventListeners() {
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
                    item.appendChild(newImage);
                    image.remove();
                } 
                else if (image.parentElement.classList.contains('editing')) {
                    item.appendChild(image);
                }
            });
        });
    }

    draggableImages.forEach(image => {
            makeImageDraggable(image);
    });
    attachEventListeners();
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