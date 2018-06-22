var token, userId;

var twitch = window.Twitch.ext;

twitch.onContext(function(context) {
    twitch.rig.log(context);
});

twitch.onAuthorized(function(auth) {
    token = auth.token;
    userId = auth.userId;
});
