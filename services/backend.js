/**
 *    Copyright 2018 Amazon.com, Inc. or its affiliates
 * 
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 * 
 *        http://www.apache.org/licenses/LICENSE-2.0
 * 
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

const fs = require('fs');
const Hapi = require('hapi');
const path = require('path');
const Boom = require('boom');
const color = require('color');
const ext = require('commander');
const jwt = require('jsonwebtoken');
const request = require('request');

// The developer rig uses self-signed certificates.  Node doesn't accept them
// by default.  Do not use this in production.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const verboseLogging = true; // verbose logging; turn off for production

const initialColor = color('#6441A4');     // super important; bleedPurple, etc.
const serverTokenDurationSec = 30;         // our tokens for pubsub expire after 30 seconds
const userCooldownMs = 1000;               // maximum input rate per user to prevent bot abuse
const userCooldownClearIntervalMs = 60000; // interval to reset our tracking object
const channelCooldownMs = 1000;            // maximum broadcast rate per channel
const bearerPrefix = 'Bearer ';            // JWT auth headers have this prefix

const channelColors = { };             // current extension state
const channelCooldowns = { }           // rate limit compliance
let   userCooldowns = { };             // spam prevention

function missingOnline(name, variable) {
  const option = name.charAt(0);
  return `Extension ${name} required in online mode.\nUse argument "-${option} <${name}>" or environment variable "${variable}".`;
}

const STRINGS = {
  secretEnv: 'Using environment variable for secret',
  clientIdEnv: 'Using environment variable for client-id',
  ownerIdEnv: 'Using environment variable for owner-id',
  secretLocal: 'Using local mode secret',
  clientIdLocal: 'Using local mode client-id',
  ownerIdLocal: 'Using local mode owner-id',
  serverStarted: 'Server running at %s',
  secretMissing: missingOnline('secret', 'EXT_SECRET'),
  clientIdMissing: missingOnline('client ID', 'EXT_CLIENT_ID'),
  ownerIdMissing: missingOnline('owner ID', 'EXT_OWNER_ID'),
  messageSendError: 'Error sending message to channel %s: %s',
  pubsubResponse: 'Message to c:%s returned %s',
  cyclingColor: 'Cycling color for c:%s on behalf of u:%s',
  colorBroadcast: 'Broadcasting color %s for c:%s',
  sendColor: 'Sending color %s to c:%s',
  cooldown: 'Please wait before clicking again',
  invalidJwt: 'Invalid JWT',
};

ext.
  version(require('../package.json').version).
  option('-s, --secret <secret>', 'Extension secret').
  option('-c, --client-id <client_id>', 'Extension client ID').
  option('-o, --owner-id <owner_id>', 'Extension owner ID').
  option('-l, --local <manifest_file>', 'Developer rig local mode').
  option('-r, --rig-port <rig_port>', 'Developer rig service port').
  parse(process.argv);

const ownerId = getOption('ownerId', 'ENV_OWNER_ID', '100000001');
const secret = Buffer.from(getOption('secret', 'ENV_SECRET', 'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk'), 'base64');
let clientId;
if (ext.local) {
  const localFileLocation = path.resolve(process.cwd(), ext.local);
  clientId = require(localFileLocation).clientId;
}
clientId = getOption('clientId', 'ENV_CLIENT_ID', clientId);

// Get options from the command line, environment, or, if local mode is
// enabled, the local value.
function getOption(optionName, environmentName, localValue) {
  if (ext[optionName]) {
    return ext[optionName];
  } else if (process.env[environmentName]) {
    console.log(STRINGS[optionName + 'Env']);
    return process.env[environmentName];
  } else if (ext.local) {
    console.log(STRINGS[optionName + 'Local']);
    return localValue;
  }
  console.log(STRINGS[optionName + 'Missing']);
  process.exit(1);
}

// log function that won't spam in production
const verboseLog = verboseLogging ? console.log.bind(console) : function(){}

const server = new Hapi.Server({
    host: 'localhost',
    port: 8081,
    tls: { // if you need a certificate, use `npm run cert`
        key: fs.readFileSync(path.resolve(__dirname, '../conf/server.key')),
        cert: fs.readFileSync(path.resolve(__dirname, '../conf/server.crt')),
    },
    routes: { 
        cors: {
            origin: ['*']
        }
    }
});

// use a common method for consistency
function verifyAndDecode(header) {

    try {
        if (!header.startsWith(bearerPrefix)) {
            return false;
        }
        
        const token = header.substring(bearerPrefix.length);
        return jwt.verify(token, secret, { algorithms: ['HS256'] }); 
    }
    catch (e) {
        return false;
    }
}

function colorCycleHandler (req, h) {

    // once more with feeling: every request MUST be verified, for SAFETY!
    const payload = verifyAndDecode(req.headers.authorization);
    if(!payload) { throw Boom.unauthorized(STRINGS.invalidJwt); }

    const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

    // we need to store the color for each channel using the extension
    let currentColor = channelColors[channelId] || initialColor;
    
    // bot abuse prevention - don't allow a single user to spam the button
    if (userIsInCooldown(opaqueUserId)) {
      throw Boom.tooManyRequests(STRINGS.cooldown);
    }

    verboseLog(STRINGS.cyclingColor, channelId, opaqueUserId);
      
    // rotate the color like a wheel
    currentColor = color(currentColor).rotate(30).hex();
    
    // save the new color for the channel
    channelColors[channelId] = currentColor;
    
    attemptColorBroadcast(channelId)
    
    return currentColor;
};

function colorQueryHandler(req, h) {
    
    // REMEMBER! every request MUST be verified, for SAFETY!
    const payload = verifyAndDecode(req.headers.authorization);
    if(!payload) { throw Boom.unauthorized(STRINGS.invalidJwt); } // seriously though

    const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

    const currentColor = color(channelColors[channelId] || initialColor).hex();

    verboseLog(STRINGS.sendColor, currentColor, opaqueUserId);
    return currentColor;
}

function attemptColorBroadcast(channelId) {
  
  // per-channel rate limit handler
  const now = Date.now();
  const cooldown = channelCooldowns[channelId];
  
  if (!cooldown || cooldown.time < now) { 
    // we can send immediately because we're outside the cooldown
    sendColorBroadcast(channelId);
    channelCooldowns[channelId] = { time: now + channelCooldownMs };
    return;
  }
  
  // schedule a delayed broadcast only if we haven't already
  if (!cooldown.trigger) {
      cooldown.trigger = setTimeout(sendColorBroadcast, now - cooldown.time, channelId);
  }
}

function sendColorBroadcast(channelId) {
  
    // our HTTP headers to the Twitch API
    const headers = {
        'Client-Id': clientId,
        'Content-Type': 'application/json',
        'Authorization': bearerPrefix + makeServerToken(channelId)
    };
    
    const currentColor = color(channelColors[channelId] || initialColor).hex();

    // our POST body to the Twitch API
    const body = JSON.stringify({
        content_type: 'application/json',
        message: currentColor,
        targets: [ 'broadcast' ]
    });

    verboseLog(STRINGS.colorBroadcast, currentColor, channelId);

    // Send the broadcast request to the Twitch API.
    const apiHost = ext.local ? `localhost.rig.twitch.tv:${ext.rig_port || 3000}` : 'api.twitch.tv';
    request(
        `https://${apiHost}/extensions/message/${channelId}`,
        {
            method: 'POST',
            headers,
            body
        }
        , (err, res) => {
            if (err) {
                console.log(STRINGS.messageSendError, channelId, err);
            } else {
                verboseLog(STRINGS.pubsubResponse, channelId, res.statusCode);
            }
    });
}

function makeServerToken(channelId) {
  
    const payload = {
        exp: Math.floor(Date.now() / 1000) + serverTokenDurationSec,
        channel_id: channelId,
        user_id: ownerId, // extension owner ID for the call to Twitch PubSub
        role: 'external',
        pubsub_perms: {
            send: [ '*' ],
        },
    }

    return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

function userIsInCooldown(opaqueUserId) {
  
    const cooldown = userCooldowns[opaqueUserId];
    const now = Date.now();
    if (cooldown && cooldown > now) {
        return true;
    }
    
    // voting extensions should also track per-user votes to prevent skew
    userCooldowns[opaqueUserId] = now + userCooldownMs;
    return false;
}

(async () => { // we await top-level await ;P
  
    // viewer wants to cycle the color
    server.route({
        method: 'POST',
        path: '/color/cycle',
        handler: colorCycleHandler
    });

    // new viewer is requesting the color
    server.route({
        method: 'GET',
        path: '/color/query',
        handler: colorQueryHandler
    });

    await server.start();

    console.log(STRINGS.serverStarted, server.info.uri);

    // periodically clear cooldown tracking to prevent unbounded growth due to
    // per-session logged out user tokens
    setInterval(function() { userCooldowns = {} }, userCooldownClearIntervalMs)

})(); // IIFE you know what I mean ;)
