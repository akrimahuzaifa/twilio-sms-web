# Send SMS and MMS

All Functions execute with a pre-initialized instance of the Twilio Node.js SDK available for use. This means you can access and utilize any Twilio SDK method in your Function. For example, sending SMS via [Twilio's Programmable SMS](/docs/messaging) from a Function is incredibly accessible, as we'll show in the following example snippets.

These examples are not exhaustive, and we encourage you to peruse the [Programmable SMS](/docs/messaging) tutorials for more inspiration on what you can build.

## Prerequisites

Before you start, be sure to complete the following prerequisites. You can skip to "[Create and host a Function](/docs/serverless/functions-assets/quickstart/send-sms-and-mms#create-and-host-a-function)" if you've already completed these steps and need to know more about Function deployment and invocation, or you can skip all the way to "[Send a single SMS](/docs/serverless/functions-assets/quickstart/send-sms-and-mms#send-a-single-sms)" if you're all ready to go and want to get straight to the code.

- **A [Twilio account](https://www.twilio.com/try-twilio).**
- **A [Twilio Phone number](https://www.twilio.com/console/phone-numbers/search) with SMS (and MMS) capabilities.**

## Create and host a Function

In order to run any of the following examples, you will first need to create a Function into which you can paste the example code. You can create a Function using the Twilio Console or the [Serverless Toolkit](/docs/labs/serverless-toolkit) as explained below:

## Console

If you prefer a UI-driven approach, creating and deploying a Function can be done entirely using the Twilio Console and the following steps:

1. Log in to the Twilio Console and navigate to the [Functions tab](https://www.twilio.com/console/functions/overview). If you need an account, you can sign up for a free Twilio account [here](https://www.twilio.com/try-twilio)!
2. Functions are contained within **Services**. Create a **[Service](/docs/serverless/functions-assets/functions/create-service)** by clicking the **[Create Service](https://www.twilio.com/console/functions/overview/services)** button and providing a name such as _test-function_.
3. Once you've been redirected to the new Service, click the **Add +** button and select **Add Function** from the dropdown.
4. This will create a new [Protected](/docs/serverless/functions-assets/visibility) Function for you with the option to rename it. The name of the file will be path it is accessed from.
5. Copy any one of the example code snippets from this page that you want to experiment with, and paste the code into your newly created Function. You can quickly switch examples by using the dropdown menu of the code rail.
6. Click **Save** to save your Function's contents.
7. Click **Deploy All** to build and deploy the Function. After a short delay, your Function will be accessible from: `https://<service-name>-<random-characters>-<optional-domain-suffix>.twil.io/<function-path>`\
   For example: `test-function-3548.twil.io/hello-world`.

## Serverless Toolkit

The [Serverless Toolkit](/docs/labs/serverless-toolkit) enables you with local development, project deployment, and other functionality via the [Twilio CLI](/docs/twilio-cli/quickstart). To get up and running with these examples using Serverless Toolkit, follow this process:

1. From the CLI, run `twilio serverless:init <your-service-name> --empty` to bootstrap your local environment.
2. Navigate into your new project directory using `cd <your-service-name>`
3. In the `/functions` directory, create a new JavaScript file that is named respective to the purpose of the Function. For example, `sms-reply.protected.js` for a [Protected](/docs/serverless/functions-assets/visibility) Function intended to handle incoming SMS.
4. Populate the file using the code example of your choice and save. **Note** A Function can only export a single handler. You will want to create separate files if you want to run and/or deploy multiple examples at once.

Once your Function(s) code is written and saved, you can test it either by running it locally (and optionally tunneling requests to it via a tool like [ngrok](https://ngrok.com/)), or by deploying the Function and executing against the deployed url(s).

### Run your Function in local development

Run `twilio serverless:start` from your CLI to start the project locally. The Function(s) in your project will be accessible from `http://localhost:3000/sms-reply`

- If you want to test a Function as a [Twilio webhook](/docs/usage/webhooks/getting-started-twilio-webhooks), run: `twilio phone-numbers:update <your Twilio phone number> --sms-url "http://localhost:3000/sms-reply"`\
  This will automatically generate an ngrok tunnel from Twilio to your locally running Function, so you can start sending texts to it. You can apply the same process but with the `voice-url` flag instead if you want to test with [Twilio Voice](/docs/voice).
- If your code does _not_ connect to Twilio Voice/Messages as a webhook, you can start your dev server and start an ngrok tunnel in the same command with the `ngrok` flag. For example: `twilio serverless:start --ngrok=""`

### Deploy your Function

To deploy your Function and have access to live url(s), run `twilio serverless:deploy` from your CLI. This will deploy your Function(s) to Twilio under a development environment by default, where they can be accessed from:

`https://<service-name>-<random-characters>-dev.twil.io/<function-path>`

For example: `https://incoming-sms-examples-3421-dev.twil.io/sms-reply`

Your Function is now ready to be invoked by HTTP requests, set as the [webhook](/docs/usage/webhooks/getting-started-twilio-webhooks) of a Twilio phone number, invoked by a Twilio Studio **[Run Function Widget](/docs/studio/widget-library/run-function)**, and more!

## How to invoke your Function

Functions created in the UI are [Protected](/docs/serverless/functions-assets/visibility) by default, and we highly recommend you to set Functions deployed via the Serverless Toolkit to `protected` as well by prepending `protected` before the file extension, for example: `send-sms.protected.js`. This will help secure your Function and protect it from being accessed by bad actors. However, this also adds an extra layer of complexity if you want to manually invoke and test code, such as the examples on this page.

In order to successfully call your `protected` Function, you will need to provide a valid `X-Twilio-Signature` header in your request. You can learn more about the [request validation process](/docs/usage/security#validating-requests), but in the meantime, let's get started with some code that will get you up and running fast.

### Generate a valid X-Twilio-Signature header

While it's possible to generate the header yourself using [HMAC-SHA1](/docs/usage/security#a-note-on-hmac-sha1), we highly recommend you use the convenience utilities exported by [Twilio's SDKs](/docs/libraries) to perform this operation. Head over to the [libraries page](/docs/libraries) to download the library for your language of choice.

Once you have the library of your choice installed, you'll need to:

1. Set your [Auth Token](https://www.twilio.com/console) as an [environment variable](/docs/usage/secure-credentials).
2. Modify the URL of the example below to match your Service and any intended data that you want to communicate as query parameters, if any, if using Node.js. (Refer to the examples [here](/docs/usage/security#test-the-validity-of-your-webhook-signature) for how to generate a signature with other SDKs.)
3. Execute the modified script and save the resulting `X-Twilio-Signature` for use in the next step.

Here are two examples for if you want to generate a signature for a `POST` request which includes JSON, or a `GET` request that communicates its data as query parameters instead:

## With a JSON body

```javascript
const { getExpectedTwilioSignature } = require("twilio/lib/webhooks/webhooks")

// Retrieve your auth token from the environment instead of hardcoding
const authToken = process.env.TWILIO_AUTH_TOKEN

// Use the Twilio helper to generate your valid signature!
// The 1st argument is your Twilio auth token.
// The 2nd is the full URL of your Function.
// The 3rd is any application/x-www-form-urlencoded data being sent, which is none!
const xTwilioSignature = getExpectedTwilioSignature(
  authToken,
  "https://example-4321.twil.io/sms/send",
  {}, // <- Leave this empty if sending request data via JSON
)

// Print the signature to the console for use with your
// preferred HTTP client
console.log("xTwilioSignature: ", xTwilioSignature)

// For example, the output will look like this:
// xTwilioSignature: coGTEaFEMv8ejgNGtgtUsbL8r7c=
```

### Create a valid request

Once you've generated a valid `X-Twilio-Signature` value, it's time to use this as a header in a request to your Function. You can do so using a variety of tools, such as [curl](https://curl.se/), [Postman](https://www.postman.com/), and more. Be sure to:

- Set the URL of the Function, including the root of your Service and the full path to the deployed Function.
- Set the `X-Twilio-Signature` header and content type header (`application/json`) for your request.
- Define the JSON body that you're sending to the Function

Using curl, the example request above would look like this:

```bash
curl -X POST 'http://test-4321.twil.io/sms/send' \
  -H 'X-Twilio-Signature: coGTEaFEMv8ejgNGtgtUsbL8r7c=' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "Body": "Hello, there!"
  }'
```

## With Query Parameters

```javascript
const { getExpectedTwilioSignature } = require("twilio/lib/webhooks/webhooks")

// Retrieve your auth token from the environment instead of hardcoding
const authToken = process.env.TWILIO_AUTH_TOKEN

// Use the Twilio helper to generate your valid signature!
// The 1st argument is your Twilio auth token.
// The 2nd is the full URL of your Function including query params.
// The 3rd is any application/x-www-form-urlencoded data being sent, which is none!
const xTwilioSignature = getExpectedTwilioSignature(
  authToken,
  "https://example-4321.twil.io/sms/send?Body=hello",
  {}, // <- Leave this empty
)

// Print the signature to the console for use with your
// preferred HTTP client
console.log("xTwilioSignature: ", xTwilioSignature)

// For example, the output will look like this:
// xTwilioSignature: a610Oi5WiDIHNrUsQYUvNCxKv7A=
```

### Create a valid request

Once you've generated a valid `X-Twilio-Signature` value, it's time to use this as a header in a request to your Function. You can do so using a variety of tools, such as [curl](https://curl.se/), [Postman](https://www.postman.com/), and more. Be sure to:

- Set the URL of the Function, including the root of your Service, the full path to the deployed Function, and your query parameters.
- Set the `X-Twilio-Signature` header for your request.

Using curl, the example request above would look like this:

```bash
curl -X GET 'http://test-4321.twil.io/sms/send?Body=hello' \
  -H 'X-Twilio-Signature: a610Oi5WiDIHNrUsQYUvNCxKv7A='
```

## Send a single SMS

> \[!WARNING]
>
> For any Function using the built-in Twilio client, the "Add my Twilio Credentials (ACCOUNT_SID) and (AUTH_TOKEN) to ENV" option on the **Settings > Environment Variables** tab _must_ be enabled.

You can use a Function to send a single SMS from your Twilio phone number via [Twilio's Programmable SMS](/docs/messaging). The **To**, **From**, and **Body** parameters of your message must be specified to successfully send.

You'll tell Twilio which phone number to use to send this message by either providing a `From` value in your request, or by omitting it and replacing the placeholder default value in the example code with your own Twilio phone number.

Next, specify yourself as the message recipient by either providing a `To` value in your request, or by omitting it and replacing the default value in the example code with your personal number. The resulting `from` and `to` values both must use [E.164 formatting](/docs/glossary/what-e164) ("`+`" and a country code, e.g., `+16175551212`).

Finally, the `body` value determines the contents of the SMS that is being sent. As with the other values, either pass in a `Body` value in your request to this Function or override the default in the example to your own custom message.

Once you've made any modifications to the sample and have deployed your Function for testing, go ahead and make some test HTTP requests against it. Example code for [invoking your Function](/docs/serverless/functions-assets/quickstart/send-sms-and-mms#how-to-invoke-your-function) is described earlier in this document.

```js title="Send a single SMS"
exports.handler = function (context, event, callback) {
  // The pre-initialized Twilio client is available from the `context` object
  const twilioClient = context.getTwilioClient()

  // Query parameters or values sent in a POST body can be accessed from `event`
  const from = event.From || "+15017122661"
  const to = event.To || "+15558675310"
  const body = event.Body || "Ahoy, World!"

  // Use `messages.create` to generate a message. Be sure to chain with `then`
  // and `catch` to properly handle the promise and call `callback` _after_ the
  // message is sent successfully!
  twilioClient.messages
    .create({ body, to, from })
    .then(message => {
      console.log("SMS successfully sent")
      console.log(message.sid)
      // Make sure to only call `callback` once everything is finished, and to pass
      // null as the first parameter to signal successful execution.
      return callback(null, `Success! Message SID: ${message.sid}`)
    })
    .catch(error => {
      console.error(error)
      return callback(error)
    })
}
```

## Send multiple SMS

You are not limited to sending a single SMS in a Function. For example, suppose you have a list of users to send messages to at the same time. As long as the list is reasonably short to avoid hitting rate limiting (see [Messaging Services](/docs/messaging/services) for how to send high volume messages), you can execute multiple, parallel calls to create a message and await the result in a Function as shown in the example below:

```js title="Send multiple SMS"
// Note: Since we're using the `await` keyword in this Function, it must be declared as `async`
exports.handler = async function (context, event, callback) {
  // The pre-initialized Twilio client is available from the `context` object
  const twilioClient = context.getTwilioClient()

  // In this example the messages are inlined. They could also be retrieved from
  // a private Asset, an API call, a call to a database, etc to name some options.
  const groupMessages = [
    {
      name: "Person1",
      to: "+15105550100",
      body: "Hello Alan",
      from: "+15095550100",
    },
    {
      name: "Person2",
      to: "+15105550101",
      body: "Hello Winston",
      from: "+15095550100",
    },
    {
      name: "Person3",
      to: "+15105550102",
      body: "Hello Deepa",
      from: "+15095550100",
    },
  ]

  try {
    // Create an array of message promises with `.map`, and await them all in
    // parallel using `Promise.all`. Be sure to use the `await` keyword to wait
    // for the promises to all finish before attempting to log or exit!
    const results = await Promise.all(groupMessages.map(message => twilioClient.messages.create(message)))
    results.forEach(result => console.log(`Success: ${result.sid}`))
    // Make sure to only call `callback` once everything is finished, and to pass
    // null as the first parameter to signal successful execution.
    return callback(null, "Batch SMS Successful")
  } catch (error) {
    console.error(error)
    return callback(error)
  }
}
```

## Include MMS in a message

Media, such as images, can be included in your text messages by adding the `mediaUrl` parameter to the call to `client.messages.create`. This can either be a single string to a publicly accessible URL or an array of multiple media URLs.

```js title="Send a MMS"
exports.handler = function (context, event, callback) {
  // The pre-initialized Twilio client is available from the `context` object
  const twilioClient = context.getTwilioClient()

  // Query parameters or values sent in a POST body can be accessed from `event`
  const from = event.From || "+15017122661"
  const to = event.To || "+15558675310"
  const body = event.Body || "This is the ship that made the Kessel Run in fourteen parsecs?"
  // Note that the `mediaUrl` value may be a single string, or an array of strings
  const mediaUrl = event.mediaUrl || "https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg"

  // Use `messages.create` to generate a message. Be sure to chain with `then`
  // and `catch` to properly handle the promise and call `callback` _after_ the
  // message is sent successfully!
  // Note the addition of the `mediaUrl` value as configuration for `messages.create`.
  twilioClient.messages
    .create({ body, to, from, mediaUrl })
    .then(message => {
      console.log("MMS successfully sent")
      console.log(message.sid)
      // Make sure to only call `callback` once everything is finished, and to pass
      // null as the first parameter to signal successful execution.
      return callback(null, `Success! Message SID: ${message.sid}`)
    })
    .catch(error => {
      console.error(error)
      return callback(error)
    })
}
```
