//'use strict';

//import './options.css';

let adminPass = '';

function promptAdminPassword(action) {

    browser.windows.create(
        {
            url: 'prompt.html?action=' + encodeURIComponent(action),
            type: 'popup',
            height: 400,
            width: 600
        }
    );
}

function createAdminPassword() {
    browser.windows.create(
        {
            url: 'createPassword.html',
            type: 'popup',
            height: 400,
            width: 600
        }
    );
}

async function saveOptionsWithPrompt(e) {
    createAdminPassword();
    //promptAdminPassword("saveOptions");
    e.preventDefault();
}

async function saveOptions() {
    console.log('bday typed value: ' + document.querySelector("#bdate").value);
    let birthdate = Date.parse(document.querySelector("#bdate").value);
    console.log('birthdate:' + birthdate);

    console.log('nickanme' + document.querySelector("#nickname").value);
    browser.storage.sync.set({
        kidsProUser: {
            preference: {
                nickname: document.querySelector("#nickname").value,
                bdate: document.querySelector("#bdate").value,
                rating: getRating(birthdate),
                allowed: {
                    urls: document.querySelector("#allowedUrls").value || "[]"
                },
                blocked: {
                    urls: document.querySelector("#blockedUrls").value || "[]"
                },
                schedules: document.querySelector("#schedules").value || "[]"
            },
            admin: {
                password: document.querySelector("#password").value || ""
            }
        }
    });
    location.reload();
}

async function resetOptionsWithPrompt(e) {
    promptAdminPassword("resetOptions");
    e.preventDefault();
}

function resetOptions() {
    console.log('reset options');
    browser.storage.sync.set({
        kidsProUser: {
            preference: {
                nickname: "",
                bdate: "",
                rating: "",
                allowed: {
                    urls: "[]"
                },
                blocked: {
                    urls: "[]"
                },
                schedules: "[]"
            },
            admin: {
                password: document.querySelector("#password").value || ""
            }
        }
    });
    location.reload();
}

function displayAllowedItems(itemsStr) {
    console.log('value' + itemsStr);
    console.log('display' + document.querySelector("#displayAllowed").value);

    let items = JSON.parse(itemsStr);
    let html = "";
    if (items) {
        for (let i = 0; i < items.length; i++) {
            html += "<input class=\"col-lg-6\" type=\"disabled\" value = " + items[i] + " id=\"allowed_" + i + "\" name=\"allowed_" + i + "\">"
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
            html += "<input type=\"disabled\" value = " + items[i] + " id=\"blocked_" + i + "\" name=\"blocked_" + i + "\">"
            html += "</input>";

            //html += "<input type=\"button\" id=\"deleteBlock_" + i + " name=\"deleteBlock_" + i + "\ value=\"Delete\"></input></br>";

        }
    }
    console.log('display - ' + html);
    document.querySelector("#displayBlocked").innerHTML = html;
}

function displaySchedules(schedules) {
    console.log('displaySchedules') + schedules;
  /* <!-- <ul class="list-group list-group-flush">
  <li class="list-group-item">An item</li>
  <li class="list-group-item">A second item</li>
  <li class="list-group-item">A third item</li>
  <li class="list-group-item">A fourth item</li>
  <li class="list-group-item">And a fifth one</li-->
*/
    let html = "";
    let items = JSON.parse(schedules); // string to json object
    if (items) {
        for (let i = 0; i < items.length; i++) {
            html += "<li class=\"list-group-item\">"
            html += JSON.stringify(items[i]);
            html += "</li>";
        }
    }
    document.querySelector("#displaySchedule").innerHTML = html;

}

async function addScheduleWithPrompt(e) {
    promptAdminPassword("addSchedule");
    e.preventDefault();
}

function addCheckedDay(input, fromTime, toTime, days) {
    if (input.checked === true) {
        days.push({ day: input.value, from: fromTime, to: toTime });
    }
    return days;
}

async function addSchedule() {
    console.log('addSchedule');
    let days = [];
    let fromTime = document.querySelector("#fromTime").value;
    let toTime = document.querySelector("#toTime").value;
    console.log('from - ' + fromTime + ' to ' + toTime);

    addCheckedDay(document.querySelector("#mon"), fromTime, toTime, days);
    addCheckedDay(document.querySelector("#tues"), fromTime, toTime, days);
    addCheckedDay(document.querySelector("#wednes"), fromTime, toTime, days);
    addCheckedDay(document.querySelector("#thurs"), fromTime, toTime, days);
    addCheckedDay(document.querySelector("#fri"), fromTime, toTime, days);
    addCheckedDay(document.querySelector("#satur"), fromTime, toTime, days);
    addCheckedDay(document.querySelector("#sun"), fromTime, toTime, days);

    let schedules = JSON.parse(document.querySelector("#schedules").value || "[]"); // array strings to array object 
    console.log('adding - ' + JSON.stringify(days));
    schedules = schedules.concat(days);
    document.querySelector("#schedules").value = JSON.stringify(schedules);
    console.log ('schedules -' +  document.querySelector("#schedules").value);
    saveOptions();
}

async function clearSchedulesWithPrompt(e) {
    promptAdminPassword("clearSchedules");
    e.preventDefault();
}

async function clearSchedules() {
    console.log('clearSchedules');
    document.querySelector("#schedules").value = "[]";
    saveOptions();
}

async function allowSchedules() {
    // TODO enable disabled inputs..
    document.querySelector("#addSchedule").disabled = false;
    document.querySelector("#clearSchedules").disabled = false;
}

async function addAllowItemWithPrompt(e) {
    promptAdminPassword("addAllowItem");
    e.preventDefault();
}

function addAllowItem() {
    console.log('addAllowItem');
    let newItem = document.querySelector("#newAllowItem").value;
    let urls = JSON.parse(document.querySelector("#allowedUrls").value || "[]");
    urls.push(newItem);
    //document.querySelector("output[name='allowedUrls']").value = JSON.stringify(urls);
    document.querySelector("#allowedUrls").value = JSON.stringify(urls);
    document.querySelector("#newAllowItem").value = "";
    //displayAllowedItems(JSON.stringify(urls));
    saveOptions();
}

async function clearAllowItemsWithPrompt(e) {
    promptAdminPassword("clearAllowItems");
    e.preventDefault();
}

async function clearAllowItems() {
    console.log('clearAllowItems');
    document.querySelector("#allowedUrls").value = "[]";
    saveOptions();
}

async function addBlockItemWithPrompt(e) {
    promptAdminPassword("addBlockItem");
    e.preventDefault();
}

function addBlockItem() {
    console.log('addBlockItem');
    let newItem = document.querySelector("#newBlockItem").value;
    let urls = JSON.parse(document.querySelector("#blockedUrls").value || "[]");
    urls.push(newItem);
    //displayBlockedItems(JSON.stringify(urls));
    document.querySelector("#blockedUrls").value = JSON.stringify(urls);
    document.querySelector("#newBlockItem").value = "";
    saveOptions();
}

async function clearBlockItemsWithPrompt(e) {
    promptAdminPassword("clearBlockItems");
    e.preventDefault();
}

async function clearBlockItems() {
    console.log('clearBlockItems');
    document.querySelector("#blockedUrls").value = "[]";
    saveOptions();
}

function getRating(birthday) {
    let age = calculateAge(birthday);
    console.log('age: ' + age);
    let rating = 'NA';
    if (age > -1) {
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
        return 'NA';
        //throw new Error('cannot get rating from birthday - ' + birthday);
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
            console.log('data ' + JSON.stringify(res.kidsProUser));
            document.querySelector("#nickname").value = res.kidsProUser.preference.nickname || 'Not Set';
            document.querySelector("#bdate").value = res.kidsProUser.preference.bdate || getMinimumDate;
            document.querySelector("#rating").value = res.kidsProUser.preference.rating || 'NA';
            if (res.kidsProUser.preference.blocked) {
                document.querySelector("output[name='blockedUrls']").value = res.kidsProUser.preference.blocked.urls;
                displayBlockedItems(res.kidsProUser.preference.blocked.urls);
            }
            if (res.kidsProUser.preference.allowed) {
                document.querySelector("output[name='allowedUrls']").value = res.kidsProUser.preference.allowed.urls;
                displayAllowedItems(res.kidsProUser.preference.allowed.urls);
            }
            
            if (res.kidsProUser.preference.schedules) {
                document.querySelector("output[name='schedules']").value = res.kidsProUser.preference.schedules;
                displaySchedules(res.kidsProUser.preference.schedules);
            }

            document.querySelector("output[name='password'").value = res.kidsProUser.admin.password;
        });

    } catch (error) {
        console.error(error);
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('options.js received a message- ' + JSON.stringify(request));

    if (request.type === 'action') {
        if (request.message === 'saveOptions') {
            saveOptions();
        } else if (request.message === 'resetOptions') {
            resetOptions();
        } else if (request.message === 'addAllowItem') {
            addAllowItem();
        } else if (request.message === 'addBlockItem') {
            addBlockItem();
        } else if (request.message === 'addSchedule') {
            addSchedule();
        } else if (request.message === 'clearSchedules') {
            clearSchedules();
        } else if (request.message === 'clearAllowItems') {
            clearAllowItems();
        } else if (request.message === 'clearBlockItems') {
            clearBlockItems();
        } else if (request.message === 'restoreOptions') {
            restoreOptions();
        } 
    } else {
        console.error('invalid action');
    }
    reloadPageWithHash();
});

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("#save").addEventListener("click", saveOptionsWithPrompt);
//document.querySelector("#reset").addEventListener("click", resetOptionsWithPrompt);
//document.querySelector("#save").addEventListener("click", saveOptions);
document.querySelector("#reset").addEventListener("click", resetOptions);
document.querySelector("#addAllow").addEventListener("click", addAllowItemWithPrompt);
document.querySelector("#addBlock").addEventListener("click", addBlockItemWithPrompt);
//document.querySelector("#clearAllowItems").addEventListener("click", clearAllowItemsWithPrompt);
//document.querySelector("#clearBlockItems").addEventListener("click", clearBlockItemsWithPrompt);
document.querySelector("#clearAllowItems").addEventListener("click", clearAllowItems);
document.querySelector("#clearBlockItems").addEventListener("click", clearBlockItems);
//document.querySelector("#addSchedule").addEventListener("click", addScheduleWithPrompt);
//document.querySelector("#addSchedule").addEventListener("click", clearSchedulesWithPrompt);
document.querySelector("#addSchedule").addEventListener("click", addSchedule);
document.querySelector("#clearSchedules").addEventListener("click", clearSchedules);


