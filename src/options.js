//'use strict';

import './options.css';

function saveOptions(e) {
    console.log('bday typed value: ' + document.querySelector("#bdate").value);
    let birthdate = Date.parse(document.querySelector("#bdate").value);
    console.log('birthdate:' + birthdate);

    browser.storage.sync.set({
        kidsProUser: {
            nickname: document.querySelector("#nickname").value,
            bdate: document.querySelector("#bdate").value,
            rating: getRating(birthdate),
            allowed: {
                urls: document.querySelector("#allowedUrls").value || "[]"
            }, 
            blocked: {
                urls: document.querySelector("#blockedUrls").value || "[]"
            }
        }
    });

    e.preventDefault();
    location.reload();
}

function resetOptions(e) {
    console.log('reset options');

    browser.storage.sync.set({
        kidsProUser: {
            nickname: "",
            bdate: "",
            rating: "",
            allowed: {
                urls: "[]"
            }, 
            blocked: {
                urls: "[]"
            }
        }
    });

    e.preventDefault();
    location.reload();
}

function displayAllowedItems(itemsStr) {
    console.log('value' + itemsStr);
    console.log('display' + document.querySelector("#displayAllowed").value);

    let items = JSON.parse(itemsStr);
    let html = "";
    if (items) {
        for (let i = 0; i < items.length; i++) {
            html += "<input type=\"disabled\" value = " + items[i] + " id=\"allowed_" + i + "\" name=\"allowed_" + i +"\">"
            html += "</input>";
           // html += "<input type=\"button\" id=\"deleteAllow_" + i + " name=\"deleteAllow_" + i + "\ value=\"Delete\"></input></br>";
        }
    }
    console.log('display - ' + html);
    document.querySelector("#displayAllowed").innerHTML = html;
}

function displayBlockedItems(itemsStr) {
    console.log('value' + itemsStr);
    console.log('display' + document.querySelector("#displayBlocked").value);

    let items = JSON.parse(itemsStr);
    let html = "";
    if (items) {
        for (let i = 0; i < items.length; i++) {
            html += "<input type=\"disabled\" value = " + items[i] + " id=\"blocked_" + i + "\" name=\"blocked_" + i +"\">"
            html += "</input>";
            
            //html += "<input type=\"button\" id=\"deleteBlock_" + i + " name=\"deleteBlock_" + i + "\ value=\"Delete\"></input></br>";

        }
    }
    console.log('display - ' + html);
    document.querySelector("#displayBlocked").innerHTML = html;
}


function addAllowItem(e) {
    console.log('addAllowItem');
    let newItem = document.querySelector("#newAllowItem").value;
    let urls = JSON.parse(document.querySelector("#allowedUrls").value || "[]");
    urls.push(newItem);
    //document.querySelector("output[name='allowedUrls']").value = JSON.stringify(urls);
    document.querySelector("#allowedUrls").value = JSON.stringify(urls);
    document.querySelector("#newAllowItem").value = "";
    //displayAllowedItems(JSON.stringify(urls));
    saveOptions(e);
}

function addBlockItem(e) {
    console.log('addBlockItem');
    let newItem = document.querySelector("#newBlockItem").value;
    let urls = JSON.parse(document.querySelector("#blockedUrls").value || "[]");
    urls.push(newItem);
    //displayBlockedItems(JSON.stringify(urls));
    document.querySelector("#blockedUrls").value = JSON.stringify(urls);
    document.querySelector("#newBlockItem").value = "";
    
    saveOptions(e);
}



function getRating(birthday) {
    
    let age = calculateAge(birthday);
    console.log('age: ' + age);
    let rating = 'NA';
    if (age) {
        if (age <= 5) {
            rating = 'P';
        } else if (age <= 9) {
            rating = 'E';
        } else if (age <= 12) {
            rating = 'T';
        } else if (age <= 15) {
            rating = 'ET';
        } else if (age <= 17) {
            rating = 'LT';
        }
        console.log('rating: ' + rating);
        return rating;
    } else {
        throw new Error('cannot get rating from birthday - ' + birthday);
    }
}

function calculateAge(birthday) { // birthday is a date
    if (birthday) {
        var ageDifMs = Date.now() - birthday;
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    } else {
        return -1;
    }
}

function getMinimumDate() {
    let minDate = new Date();
    let day = minDate.getDate();
    let month = minDate.getMonth();
    if (month < 10) {
        month = '0' + month;
    }
    let year = minDate.getFullYear() - 18;
    minDate = year + '-' + month + '-' + day
    console.log('17 yr old birthdate: ' + minDate)
    return minDate;
}

function restoreOptions() {
    try {
        console.log('restoreOptions');
        //let storage = browser.storage.managed;
        let storageItem = browser.storage.managed.get('kidsProUser');
        storageItem.then((res) => {
            document.querySelector("#managed-bdate").innerText = res.kidsProUser.bdate;
        });

        let userData = browser.storage.sync.get('kidsProUser');
        userData.then((res) => {
            document.querySelector("#nickname").value = res.kidsProUser.nickname || 'Not Set';
            document.querySelector("#bdate").value = res.kidsProUser.bdate || getMinimumDate;
            document.querySelector("#rating").value = res.kidsProUser.rating || 'Not Set';
            document.querySelector("output[name='blockedUrls']").value = res.kidsProUser.blocked.urls;
            document.querySelector("output[name='allowedUrls']").value = res.kidsProUser.allowed.urls;
    
            displayAllowedItems(res.kidsProUser.allowed.urls);
            displayBlockedItems(res.kidsProUser.blocked.urls);
        });

    } catch (error) {
        console.error(error);
    }

}
document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("#reset").addEventListener("click", resetOptions);
document.querySelector("#addAllow").addEventListener("click", addAllowItem);
document.querySelector("#addBlock").addEventListener("click", addBlockItem);

