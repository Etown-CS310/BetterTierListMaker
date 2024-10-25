"use strict";
(function(){
    window.addEventListener('load', init);
    
    function init() {
        hideMenus();
        const btn_list = ['imagebtn', 'fontbtn', 'importbtn', 'exportbtn', 'savebtn'];
        btn_list.forEach(btn => {id(btn).addEventListener('click', (e) => {showMenu(e.target.id)})});
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
                break;
            default:
                console.log("Unknown id: "+ btn_id);
        }
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
})()