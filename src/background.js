import { Certificate } from 'pkijs';
import * as asn1js from 'asn1js';
const NodeCache = require("node-cache");
const bcrypt = require("bcryptjs");
const ratingCache = new NodeCache();


const allowedForAll = [
  'https://protectkidsonline.ca',
  'https://www.cybertip.ca',
  'https://cybertip.ca'
];
//'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

/**
 * @param {*} extensions 
 * @param {*} id 
 * @returns 
 */
function getX509Ext(extensions, id) {
  for (var extension in extensions) {
    if (extensions[extension].extnID === id) {
      return extensions[extension];
    }
  }
}

let safe = true;
let block = false;
const ratings = [
  'P', // 0-5
  'E', // 6-9
  'T', // 10-12
  'ET', // 13-15
  'MT']; // 16-17

// siteRating
// block priorities
// p1: outside approved hours BBB
// p2: blocked site BB
// p3: age rating B

// allow cases
// allowed with warning
const accessLevel = [
  'A', // Allow
  'AW', // Allowed with warning for teens
  'B',  // Blocked age rating
  'BB', // Blocked list
  'BBB' // Blocked hours
  //'AA', // Allowed from list 
]

async function validateSite(details) {
  const preference = getPreference();
  const siteRating = await getCertificateRating(details);

  let ratingMatched = true;
  let allowed = false;
  let blocked = false;
  let siteUrl = new URL(details.url);
  
  console.log('siteUrl origin - ' + siteUrl.origin);
  let siteAccess = 'A';

  if (allowedForAll.includes(siteUrl.origin) || siteRating) {
    console.log('**siteRating: ' + siteRating);

    if (!allowedForAll.includes(siteUrl.origin) && preference.rating && ratings.indexOf(preference.rating) > -1) {
      ratingMatched = ratings.indexOf(siteRating) > -1 && (ratings.indexOf(siteRating) <= ratings.indexOf(preference.rating));
      if (!ratingMatched) {
        if (preference.rating === 'P' || preference.rating === 'E') { // || siteRating === 'NA'
          siteAccess = 'B';
        } else {
          console.log('site access AW');
          siteAccess = 'AW'; // not the raiting but allowed with warning
        }
      }
    }

    if (preference.allowedUrls) { // overrides everything above
      allowed = preference.allowedUrls.indexOf(siteUrl.origin) > -1;
      if (allowed) {
        siteAccess = 'A';
      }
    }

    if (preference.blockedUrls) { // overrides everything above
      blocked = preference.blockedUrls.indexOf(siteUrl.origin) > -1;
      if (blocked) {
        siteAccess = 'BB';
      }
    }
    console.log('siteAccess - ' + siteAccess);
    ratingCache.set(siteUrl.origin, siteAccess, 10000);

  }

}

//browser.runtime.onMessage.addListener(handleSiteAccess)

async function getCertificateRating(details) {
  try {
    console.log('newcert - ' + JSON.stringify(details));
    let securityInfo = await browser.webRequest.getSecurityInfo(
      details.requestId,
      { "certificateChain": true, rawDER: true }
    );
    if (securityInfo) {
      let cert = securityInfo.certificates[0];
      //console.log('certificate - ' + JSON.stringify(cert));
      let certificateChain = new Uint8Array(cert.rawDER).buffer;
      let asn1 = asn1js.fromBER(certificateChain);

      let x509 = await new Certificate({ schema: asn1.result });
      if (x509) {
        x509 = x509.toJSON();
        //console.log('x509 in pkijs - ' + x509);
        console.log('extensions - ' + JSON.stringify(x509.extensions));
        /*let san = getX509Ext(x509.extensions, '2.5.29.17').parsedValue;
        if (san && san.hasOwnProperty('altNames')) {
          //console.log('*Subject Alt Names: ' + JSON.stringify(san));
        }*/
        let kidsRatingValue = getX509Ext(x509.extensions, "1.3.6.1.4.1.60933.1");
        if (kidsRatingValue) {
          return kidsRatingValue.parsedValue.valueBlock.value;
        } else {
          return "NA";
        }
      }
    }

  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function getPreference() {
  let preference = ratingCache.get('preference');
  if (!preference) {
    preference = parsePreference();
  }
  console.log('pref:' + JSON.stringify(preference));
  return preference;
}

async function getAdminPassword() {
  let userData = await browser.storage.sync.get('kidsProUser');
  let pass = '';
  if (userData) {
    pass = userData.kidsProUser.admin.password;
  }
  return pass;
}

async function addLogItem(logItem) {
  try {
    let userData = await browser.storage.sync.get('kidsProUser');
    if (userData) {
      console.log('saving log item...' + JSON.stringify(logItem));
      console.log('data ' + JSON.stringify(userData.kidsProUser));
      let pref = userData.kidsProUser.preference;
      let admin = userData.kidsProUser.admin;
      let logs = JSON.parse(userData.kidsProUser.logs || "[]");
      if (logs.length > 0) {
        let lastItem = logs[logs.length - 1];
        if (lastItem.url === logItem.url) {
          // don't log the same site multiple times if it's recent one. 
          //let item = { time: new Date(), url: url, siteAccess: siteAccess };
          if (lastItem.numOfTries) {
            logItem.numOfTries = lastItem.numOfTries + 1;
          } else {
            logItem.numOfTries = 2;
          }
          logs.pop();
        }
      }
      logs.push(logItem);
      if (logs > 50) {
        logs.shift(); // keep the length to 50. 
      }
      let saved = browser.storage.sync.set({
        kidsProUser: {
          preference: pref,
          admin: admin,
          logs: JSON.stringify(logs)
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
}

async function saveAdminPassword(password) {
  try {
    let hashValue = await bcrypt.hash(password, 8);
    let userData = await browser.storage.sync.get('kidsProUser');

    if (hashValue && userData) {
      //
      console.log('saving hash..' + hashValue);
      let pref = userData.kidsProUser.preference;
      let logs = userData.kidsProUser.logs;
      let saved = browser.storage.sync.set({
        kidsProUser: {
          preference: pref,
          admin: {
            password: hashValue
          },
          logs: logs
        }
      });
      return true;

    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function parsePreference() {
  let userData = await browser.storage.sync.get('kidsProUser');
  let pref = {};
  if (userData) {
    pref.rating = userData.kidsProUser.preference.rating;
    if (userData.kidsProUser.preference.allowed) {
      pref.allowedUrls = userData.kidsProUser.preference.allowed.urls;
    }
    if (userData.kidsProUser.preference.blocked) {
      pref.blockedUrls = userData.kidsProUser.preference.blocked.urls;
    }
    if (userData.kidsProUser.preference.schedules) {
      pref.schedules = userData.kidsProUser.preference.schedules;
    }
  }
  console.log('parsed preference');
  ratingCache.set('preference', pref);
  return pref;
}

async function logRedirect(url, siteAccess) {
  if (siteAccess === 'B' || siteAccess === 'BB' || siteAccess === 'BBB') { // only log when kids violated knowingly...
    logAccessViolated(url, siteAccess);
  }
}

async function logAccessViolated(url, siteAccess) {
  let item = { time: new Date(), url: url, siteAccess: siteAccess, numOfTries: 1 };
  addLogItem(item);
}

function redirect(tabId, url, siteAccess) {
  // log redirect
  logRedirect(url, siteAccess);

  const redirectUrl = browser.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(url) + '?access=' + encodeURIComponent(siteAccess);
  // siteRating
  // p1: outside approved hours BBB
  // p2: blocked site BB
  // p3: age rating B

  chrome.tabs.update(tabId, {
    url: redirectUrl
  });
}

function verifyAllowedSchedules() {
  console.log('verifyAllowedSchedules');
  const preference = getPreference();

  const schedules = JSON.parse(preference.schedules || "[]");
  if (schedules.length === 0) { // allow always lest defined
    console.log('allow always');
    return true;
  }
  const now = new Date();
  const today = now.getDay();

  const currentHour = now.getHours();

  const currentMinute = now.getMinutes();
  console.log('today is Day +' + today);
  for (const schedule of schedules) {
    if (schedule.dayId === 'day' + today) { // day5 = Friday

      if (schedule.from < schedule.to) {
        console.log('from is smaller');
        if (schedule.from <= currentHour + ':' + currentMinute && schedule.to > currentHour + ':' + currentMinute) {
          // match allow
          console.log('match allow - ' + schedule);
          return true;
        }
      }
    }
  }
  console.log('schedule not allowed');
  return false;
}

browser.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (!changeInfo.url || changeInfo.url.startsWith("moz-extension:")) { // redirecting
    return;
  }

  const originUrl = new URL(changeInfo.url).origin;
  console.log('changeInfo.url.origin: ' + originUrl);

  // check time
  let allow = verifyAllowedSchedules();
  if (allow === false) {
    console.log('schedule allowed? ' + allow + ' redirect');
    redirect(tabId, changeInfo.url, 'BBB'); // BBB blocked by schedules
  } else {

    // check site rating

    let siteAccess = ratingCache.get(originUrl);
    console.log('siteacess ' + siteAccess);
    if (siteAccess) {

      console.log('found siteAccess: ' + siteAccess);

      //TODO cache site rating also
      if (siteAccess === 'A') {
        browser.pageAction.setIcon({
          tabId: tabId,
          path: "icons/dyno_icon.png"
        });
        browser.pageAction.setTitle({
          tabId: tabId,
          title: "kidspro Npm"
        });
      }

      if (siteAccess === 'AW') {
        logAccessViolated(changeInfo.url, siteAccess);

        browser.pageAction.setIcon({
          tabId: tabId,
          path: "icons/info_icon.png"
        });
        browser.pageAction.setTitle({
          tabId: tabId,
          title: "kidspro Npm - warning"
        });
        browser.pageAction.setPopup({
          tabId: tabId,
          popup: "popup_warning.html"
        });

        browser.notifications.create({
          iconUrl: "icons/fox.jpg",
          type: "basic",
          title: "KidsPro alert",
          message: 'Hi you are visiting a website you are not supposed to.',
          contextMessage: 'this message is...'
        });
      }

      if (siteAccess === 'B' || siteAccess === 'BB') { ///BBB is already redirectd
        redirect(tabId, changeInfo.url, siteAccess);
      }
    }
  }
  console.log('exit');
});

browser.runtime.onInstalled.addListener(() => {
  // tracking badge text ON or OFF
  console.log('new install');
  /*browser.pageAction.setBadgeText({
      text: "SAFE",
  });*/
  /*browser.notifications.create('above rating', {
    type: "basic",
    title: "KidsPro alert",
    message: 'Hi you are visiting a website you are supposed to.'
  });*/

  parsePreference();

});

browser.webRequest.onHeadersReceived.addListener(
  details => {
    validateSite(details);
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking"]
);

browser.webRequest.onErrorOccurred.addListener(
  details => {
    // eventually we will be able to consume these details, but for now we can only
    // disable the icon
    // consume(details);
    if (details.type === 'main_frame' && details.documentUrl === undefined) {
      console.log('error happend' + JSON.stringify(details));
      //icon.update(details.tabId, 'http');
    }
  },
  { urls: ['<all_urls>'] }
);

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('backgrounds.js received a message- ' + JSON.stringify(request));
  if (request.type === 'GREETINGS') {
    const message = `Hi ${sender.tab ? 'Con' : 'Pop'
      }, my name is Bac. I am from Background. It's great to hear from you.`;

    // Log message coming from the `request` parameter
    console.log(request.payload.message);
    // Send a response message
    sendResponse({
      message,
    });
    return true;
  } else if (request.type ==='RESET_CACHE') {
    console.log('reset cache..');
    ratingCache = new NodeCache();
    sendResponse({ message: "reset cache success" });
    return true;
  } else if (request.type === 'verifyPassword') {
    const getP = getAdminPassword();
    getP.then(function (password) {
      console.log('password - ' + password);
      const getV = bcrypt.compare(request.password, password);
      getV.then(function (result) {
        console.log('result - ' + result);
        if (result === true) {
          // ok.
          console.log('match!');
          sendResponse({ message: "success" });
        } else {
          console.log('fail!');
          sendResponse({ message: "fail" });
        }
      });
    });

    return true;
  } else if (request.type === 'storePassword') {
    const saveP = saveAdminPassword(request.password);
    saveP.then(function (result) {
      console.log('save result - ' + result);
      sendResponse({ message: "success" });
    });
    return true;
  }
});

function handleClick(e) {
  browser.runtime.openOptionsPage();
}

function handleStorageChange(storage) {
  parsePreference();
}

browser.browserAction.onClicked.addListener(handleClick);
browser.storage.onChanged.addListener(handleStorageChange);