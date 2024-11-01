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
                break;
            case "exportbtn":
                menu = id('projectExport');
                menu.classList.remove('hidden');
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

    function saveProjectMenu(){
        id('save-btn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log(getJSON());
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
        };
        let rows = qsa('.container .row');
        //iterate over rows
        for(let i = 0; i < rows.length-1; i++){
            let row = rows[i];
            let cells = row.querySelectorAll('.editing img');
            let j;
            //create temp JSON file to append back to projectJSON
            let rowJSON = {
                'name': row.querySelector('.first').textContent || "", //error here
                'color': getColor(row.querySelector('.first')),
            };
            //iterate through each image in that row, and add it to JSON
            for(j = 0; j < cells.length; j++){
                rowJSON['item' + j] = {
                    'src': cells[j].src,
                    'alt': cells[j].alt || "",
                    'description': ''
                };
            }
            //append row to projectJSON
            projectJSON['row' + i] = rowJSON;
        }
        return projectJSON; 

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
})()