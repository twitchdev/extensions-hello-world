# Extensions-Hello-World
The Simplest Extension in the (Hello) World.

## Motivation
The Hello World sample is designed to get you started building an Extension quickly. It contains all the key parts of a functioning Twitch Extension and can be immediately run in the [Developer Rig](https://github.com/twitchdev/developer-rig).

## What's in the Sample
The Hello World Extension provides a simple scenario that demonstrates the end to end flow of an Extension. On the frontend, a user clicks a button that can change the colour of a circle. Instead of changing the CSS locally, it calls its Extension Backend Service (EBS) to update the colour of the circle. That message is then sent via Twitch PubSub to update all clients listening to the PubSub topic.

__The sample is broken into two main components:__

1. The Frontend of the Extension, comprising HTML files for the different extension views, and corresponding Javascript files and CSS. The frontend has the following functionality:
    * A button and script that makes a POST call to the EBS to request a colour change for the circle
    * A GET call when the Extension is initialised to change the circle to the current colour stored on the EBS
    * A listener to Twitch PubSub, that receives colour change updates and then updates the circle colour
2. A lightweight EBS that performs the following functionality:
    * Spins up a simple HTTPS Server with a POST handler for changing colour
    * Validates an Extension JWT
    * Sends a new colour message via Twitch PubSub for a specific channel

There is also a service called Frontend which can be used to serve the HTML and .JS files in lieu of using the Developer Rig. If you are using the [Developer Rig](https://github.com/twitchdev/developer-rig), you can disregard this service.

## Using the Sample
The recommended path to using this sample is with the [Developer Rig](https://github.com/twitchdev/developer-rig). Use the Developer Rig's `extension-init` command clone this repo.

The Developer Rig is able to host the frontend Hello World files, but the EBS must be run separately. If you want to host your frontend files other than with the Developer Rig, run `node services/frontend` at the root of your project.

### Configuring and Running the Extension Backend Service
To run the EBS, run `node services/backend`, with the following command line arguments: `-c <client id>`, `-s <secret>`, `-o <owner id>`

This provides the EBS with your Extension client ID, Extension secret and the user ID of the Extension owner (likely you). These are necessary to validate calls to your EBS and make calls to Twitch services such as PubSub.

If you do not want to pass in command line arguments, you can also directly set the following environment variables: `EXT_SECRET`, `EXT_CLIENT_ID`, `EXT_OWNER_ID` in your code.

You can get your client ID and secret from your [Extension Dashboard](https://dev.twitch.tv/dashboard/extensions). See the documentation for the [Developer Rig](https://github.com/twitchdev/developer-rig#configuring-the-developer-rig) for more details.

To get the owner ID, you will need to execute a simple CURL command against the Twitch /users endpoint. You'll need your extension client ID as part of the query (this will be made consistent with the Developer Rig shortly, by using _owner name_).

```bash
curl -H 'Client-ID: <client id>' -X GET 'https://api.twitch.tv/helix/users?login=<owner name>'
```

You will also need to generate a cert to run your EBS. See below for the steps to accomplish this.

### SSL Certificates
Twitch Extensions require SSL (TLS).

If you need a certificate for local development, please use the `npm run cert` command, or `npm run wincert` for Windows users. This will generate a new certificate (`server.crt` and `server.key`) for you, and place it in the `conf/` directory. This certificate is different than the one used for the Developer Rig. If you're on OS X, this command will automatically add the certificate to your keychain. If you're on Windows, you need to do this manually to avoid the scary "connection not secure" warnings, or once the backend service is running visit [https://localhost:8081/](https://localhost:8081/) and choose to proceed despite the warning to accept the certificate within the browser.

**Note -** At this time, to use the Developer Rig and this sample, you will have needed to onboard to Twitch Extensions. You can start that process [here](https://dev.twitch.tv/extensions).
