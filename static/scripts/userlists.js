"use strict";
(function(){
    window.addEventListener('load', init);

    function init(){
        getLists();
    }

    function getLists(){
        let base_url = "http//localhost:8080/userpage?";
        let user = window.sessionStorage.getItem("username");
        let url = base_url + "user=" + user;
        fetch(url)
        .then(checkStatus)
        .then(postLists)
        .catch((e)=>{console.log(e);});
    }

    function postLists(listJson){
        let box = document.createElement('div');
        box.classList.add('flexbox');
        let thumbnail = document.createElement('img');
        thumbnail.src = listJson.thumbnail;
        box.appendChild(thumbnail);
        let link = document.createElement('a');
        link.textContent = listJson.data.title;
        link.href = "/editor.html"; //make it call the import function as well.
        box.appendChild(link);
        document.querySelector('.listarea').appendChild(box);    
    }

    /**
     * Enhanced checkStatus to throw error on non-OK response.
     * @param {Response} response - fetch response object
     * @returns {Promise} parsed JSON response if successful
     * @throws {Error} on any HTTP error
     */
    function checkStatus(response) {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(`Error ${response.status}: ${err.message || response.statusText}`);
            });
        }
        return response.json();
    }
})()