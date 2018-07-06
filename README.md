# Extensions-Hello-World
The Simplest Extension in the (Hello) World.  Now supporting Local Mode in the Developer Rig.

## Motivation
The Hello World sample is designed to get you started building a Twitch Extension quickly. It contains all the key parts of a functioning Extension and can be immediately run in the [Developer Rig](https://github.com/twitchdev/developer-rig).  It works in both online mode and local mode.  For a fast guide to get started, visit the Developer Rig documentation.

## What's in the Sample
The Hello World Extension provides a simple scenario that demonstrates the end-to-end flow of an Extension. On the frontend, a user clicks a button that can change the color of a circle. Instead of changing the CSS locally, it calls its Extension Backend Service (EBS) to update the color of the circle. That message is then sent via Twitch PubSub to update all clients listening to the PubSub topic.

__The sample is broken into two main components:__

1. The Frontend of the Extension, comprised of HTML files for the different extension views and corresponding Javascript files and CSS. The frontend has the following functionality:
    * A button and script that makes a POST call to the EBS to request a color change for the circle
    * A GET call when the Extension is initialized to change the circle to the current color stored on the EBS
    * A listener to Twitch PubSub, that receives color change updates and then updates the circle color
2. A lightweight EBS that performs the following functionality:
    * Spins up a simple HTTPS server with a POST handler for changing color
    * Validates an Extension JWT
    * Sends a new color message via Twitch PubSub (or a local mock version of Twitch PubSub for Local Mode) for a specific channel

## Using the Sample
The recommended path to using this sample is with the [Developer Rig](/twitchdev/developer-rig). Use the Developer Rig's `extension-init` command to clone this repository.

The Developer Rig is able to host the frontend Hello World files, but the EBS must be run and hosted separately.

### Setting Up Your Backend Certs
Twitch Extensions require SSL (TLS).

If you didn't already follow the Getting Started Guide in the Developer Rig's README, you'll need to set up a certificate for local development.  This will generate a new certificate (`server.crt` and `server.key`) for you and place it in the `conf/` directory. This certificate is different from the one used for the Developer Rig.

#### On MacOS
Navigate to the root of the Hello World extension folder and run `npm install` and then `npm run cert`

#### On Windows
Run the following commands to generate the necessary certs for your Hello World backend
1. `node scripts/ssl.js`
2. `mkdir ../my-extension/conf`
3. `mv ssl/selfsigned.crt ../my-extension/conf/server.crt`
4. `mv ssl/selfsigned.key ../my-extension/conf/server.key`

### Running Hello World in Local Mode in the Developer Rig
You can use the Developer Rig to host your front end files using the `yarn host` commands (see Developer Rig Documentation).

To host your EBS in Local Mode, use the following command: `node services/backend -l ../manifest.json`  In this case, the manifest.json file has been generated using a Developer Rig yarn command.  

### Running Hello World in Online Mode
To run the EBS, run `node services/backend`, with the following command line arguments: `-c <client id>`, `-s <secret>`, `-o <owner id>`.  To run it in local mode, use only `-l <config-file>` instead. See the [Developer Rig](/twitchdev/developer-rig#configuring-the-developer-rig) for more information about the configuration file.

This provides the EBS with your Extension client ID, Extension secret and the user ID of the Extension owner (likely you). These are necessary to validate calls to your EBS and make calls to Twitch services such as PubSub.

If you do not want to pass in command line arguments, you can also directly set the following environment variables: `EXT_SECRET`, `EXT_CLIENT_ID`, `EXT_OWNER_ID` in your code.

You can get your client ID and secret from your [Extension Dashboard](https://dev.twitch.tv/dashboard/extensions). See the documentation for the [Developer Rig](https://github.com/twitchdev/developer-rig#configuring-the-developer-rig) for more details.

To get the owner ID, you will need to execute a simple CURL command against the Twitch `/users` endpoint. You'll need your extension client ID as part of the query (this will be made consistent with the Developer Rig shortly, by using _owner name_).

```bash
curl -H 'Client-ID: <client id>' -X GET 'https://api.twitch.tv/helix/users?login=<owner name>'
```

**Note -** Although the Developer Rig's local mode allows you to develop your extension without onboarding, you will need to do so to live-test your extension against Twitch Production APIs. You can start that process [here](https://dev.twitch.tv/extensions).
