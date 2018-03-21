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

// This isn't required when using the dev rig
// Use this if you're testing directly on your channel
// by using the `npm run frontend` command

const fs = require('fs');
const Hapi = require('hapi');
const path = require('path');
const Boom = require('boom');
const color = require('color');
const ext = require('commander');
const jwt = require('jsonwebtoken');
const request = require('request');

const server = new Hapi.Server({
    host: 'localhost',
    port: 8080,
    tls: { // if you need a certificate, use `npm run cert`
        key: fs.readFileSync(path.resolve(__dirname, '../conf/server.key')),
        cert: fs.readFileSync(path.resolve(__dirname, '../conf/server.crt')),
    },
    routes: { 
        files: { // This is just for hosting front-end assets for development.
            relativeTo: path.resolve(__dirname, '../', 'public')
        },
        cors: {
            origin: ['*']
        }
    }
});


(async () => { // we await top-level await ;P

    // serve the front-end for local testing
    await server.register(require('inert'));
    server.route({
        method: 'GET',
        path: '/{param}',
        handler: {
            directory: {
                path: '../public'
            }
        }
    });

    await server.start();

    console.log(`Server running at ${server.info.uri}`);

})(); // IIFE you know what I mean ;)
