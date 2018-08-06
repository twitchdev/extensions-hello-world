var token = "";
var tuid = "";
var ebs = "";

// because who wants to type this every time?
var twitch = window.Twitch.ext;

// create the request options for our Twitch API calls
var requests = {
    set: createRequest('POST', 'cycle'),
    get: createRequest('GET', 'query')
};

function createRequest(type, method) {

    return {
        type: type,
        url: 'https://localhost:8081/color/' + method,
        success: updateBlock,
        error: logError
    }
}

function setAuth(token) {
    Object.keys(requests).forEach((req) => {
        twitch.rig.log('Setting auth headers');
        requests[req].headers = { 'Authorization': 'Bearer ' + token }
    });
}

twitch.onContext(function(context) {
    twitch.rig.log(context);
});

twitch.onAuthorized(function(auth) {
    // save our credentials
    token = auth.token;
    tuid = auth.userId;

    // enable the button
    document.querySelector('#cycle').removeAttribute('disabled');

    setAuth(token);
    ajaxRequest(requests.get);
});

function updateBlock(hex) {
    twitch.rig.log('Updating block color');
    document.querySelector('#color').style['background-color'] = hex;
}

function logError(r) {
    twitch.rig.log('EBS request returned '+r.status+' ('+r.statusText+')');
}

function logSuccess(hex, status) {
  // we could also use the output to update the block synchronously here,
  // but we want all views to get the same broadcast response at the same time.
  twitch.rig.log('EBS request returned '+hex+' ('+status+')');
}

function ajaxRequest(request){
    var r = new XMLHttpRequest();
    r.open(request.type, request.url, true);
    Object.keys(request.headers).forEach((h) => { r.setRequestHeader(h, request.headers[h]) });
    
    r.onreadystatechange = function () {
      if (r.readyState != 4) return;
      if(r.status != 200){
        request.error(r);
      }
      else {
        request.success(r.responseText);
      }
    };
    r.send();
}

document.addEventListener("DOMContentLoaded", function(event) {
    // when we click the cycle button
    document.querySelector('#cycle').addEventListener("click", function() {
        if(!token) { return twitch.rig.log('Not authorized'); }
        twitch.rig.log('Requesting a color cycle');
        ajaxRequest(requests.set);
    });

    // listen for incoming broadcast message from our EBS
    twitch.listen('broadcast', function (target, contentType, color) {
        twitch.rig.log('Received broadcast color');
        updateBlock(color);
    });
});