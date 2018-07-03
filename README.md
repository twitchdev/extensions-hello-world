# Extensions-Hello-World
The Simplest Extension in the (Hello) World.

## Motivation
The Hello World sample is designed to get you started building a Twitch Extension quickly. It contains all the key parts of a functioning Extension and can be immediately run in the [Developer Rig](https://github.com/twitchdev/developer-rig).

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
    * Sends a new color message via Twitch PubSub for a specific channel

## Using the Sample
The recommended path to using this sample is with the [Developer Rig](/twitchdev/developer-rig). Use the Developer Rig's `extension-init` command to clone this repository.

The Developer Rig is able to host the frontend Hello World files, but the EBS must be run separately.

### Configuring and Running the Extension Backend Service
To run the EBS, run `node services/backend`, with the following command line arguments: `-c <client id>`, `-s <secret>`, `-o <owner id>`.  To run it in local mode, use only `-l <config-file>` instead. See the [Developer Rig](/twitchdev/developer-rig#configuring-the-developer-rig) for more information about the configuration file.

This provides the EBS with your Extension client ID, Extension secret and the user ID of the Extension owner (likely you). These are necessary to validate calls to your EBS and make calls to Twitch services such as PubSub.

If you do not want to pass in command line arguments, you can also directly set the following environment variables: `EXT_SECRET`, `EXT_CLIENT_ID`, `EXT_OWNER_ID` in your code.

You can get your client ID and secret from your [Extension Dashboard](https://dev.twitch.tv/dashboard/extensions). See the documentation for the [Developer Rig](https://github.com/twitchdev/developer-rig#configuring-the-developer-rig) for more details.

To get the owner ID, you will need to execute a simple CURL command against the Twitch `/users` endpoint. You'll need your extension client ID as part of the query (this will be made consistent with the Developer Rig shortly, by using _owner name_).

```bash
curl -H 'Client-ID: <client id>' -X GET 'https://api.twitch.tv/helix/users?login=<owner name>'
```

You will also need to generate an SSL certificate to run your EBS. See below for the steps to accomplish this.

### SSL Certificates
Twitch Extensions require SSL (TLS).

If you need a certificate for local development, please use the `npm run cert` command. This will generate a new certificate (`server.crt` and `server.key`) for you and place it in the `conf/` directory. This certificate is different from the one used for the Developer Rig. If you're on OS X, this command will automatically add the certificate to your keychain. If you're on Windows, you will need to either configure your browser to accept self-signed certificates or install them manually to avoid the scary "connection not secure" warnings. Check out the [Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wcf/feature-details/how-to-create-temporary-certificates-for-use-during-development) for more information on generating and installing certificates on Windows.

**Note -** Although the Developer Rig's local mode allows you to develop your extension without onboarding, you will need to do so to live-test your extension. You can start that process [here](https://dev.twitch.tv/extensions).
