# Receive an inbound SMS

When someone sends a text message to your Twilio number, Twilio can invoke a **webhook** that you've created to determine what reply to send back using **[TwiML](/docs/messaging/twiml)**. On this page, we will be providing some examples of **Functions** that can serve as the webhook of your Twilio number.

A Function that responds to webhook requests will receive details about the incoming message as properties on the `event` parameter. These include the incoming number (`event.From`), the recipient number (`event.To`), the text body of the message (`event.Body`), and other relevant data such as the number of media sent and/or geographic metadata about the phone numbers involved. You can view a full list of potential values at **[Twilio's Request to your Webhook URL](/docs/messaging/guides/webhook-request)**.

Once a Function has been invoked on an inbound SMS, any number of actions can be taken. Below are some examples to inspire what you will build.

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

## Set a Function as a webhook

In order for your Function to react to incoming SMS and/or voice calls, it must be set as a [webhook](/docs/usage/webhooks) for your Twilio number. There are a variety of methods to set a Function as a webhook, as detailed below:

![Setting a Function as a Messaging webhook using the webhook dropdown option.](https://docs-resources.prod.twilio.com/bf4eae4ac40fe7d47003a93bca295d5c232e0b372358e73ceff931fee3ccdc4f.png)

## Respond with a static message

For the most basic possible example, one can reply to the incoming SMS with a hardcoded message. To do so, you can create a new `MessagingResponse` and declare the intended message contents. Once your message content has been set, you can return the generated TwiML by passing it to the `callback` function as shown and signaling a successful end to the Function.

```js title="Respond to an inbound SMS"
exports.handler = (context, event, callback) => {
  // Create a new messaging response object
  const twiml = new Twilio.twiml.MessagingResponse()
  // Use any of the Node.js SDK methods, such as `message`, to compose a response
  twiml.message("Hello, World!")
  // Return the TwiML as the second argument to `callback`
  // This will render the response as XML in reply to the webhook request
  return callback(null, twiml)
}
```

## Respond dynamically to an inbound SMS

Because the contents of the incoming message are accessible from `event.Body`, it's also possible to tailor the response based on the contents of the message. For example, you could respond with "Hello, there!" to an incoming message that includes the text "hello", say "Goodbye" to any message including "bye", and have a fallback response if neither of those conditions is met.

```js title="Dynamically respond to an inbound SMS"
exports.handler = (context, event, callback) => {
  // Create a new messaging response object
  const twiml = new Twilio.twiml.MessagingResponse()

  // Access the incoming text content from `event.Body`
  const incomingMessage = event.Body.toLowerCase()

  // Use any of the Node.js SDK methods, such as `message`, to compose a response
  if (incomingMessage.includes("hello")) {
    twiml.message("Hello, there!")
  } else if (incomingMessage.includes("bye")) {
    twiml.message("Goodbye!")
  } else {
    twiml.message("Not sure what you meant! Please say hello or bye!")
  }

  // Return the TwiML as the second argument to `callback`
  // This will render the response as XML in reply to the webhook request
  return callback(null, twiml)
}
```

## Forward an inbound SMS

Another example that uses even more `event` properties would be a Function that forwards SMS messages from your Twilio phone number to your personal cell phone. This could be handy in a situation where perhaps you don't want to share your real number while selling an item online, you are suspicious of the stranger that just asked for your number, or for any other reason.

This Function will accept an incoming SMS and generate a new TwiML response that contains the number that sent the message followed by the contents of the SMS. Because the TwiML's `to` property is set to your personal phone number, this new message will be forwarded to you instead of creating a response directly to the sender.

For more information and a more detailed example, please reference this [blog post](https://www.twilio.com/blog/sms-forwarding-and-responding-using-twilio-and-javascript) on the subject.

```js title="Forward an inbound SMS"
const MY_NUMBER = "+15095550100"

exports.handler = (context, event, callback) => {
  // Create a new messaging response object
  const twiml = new Twilio.twiml.MessagingResponse()
  // Use any of the Node.js SDK methods, such as `message`, to compose a response
  // Access incoming text information like the from number and contents off of `event`
  // Note: providing a `to` parameter like so will forward this text instead of responding to the sender
  twiml.message({ to: MY_NUMBER }, `${event.From}: ${event.Body}`)
  // Return the TwiML as the second argument to `callback`
  // This will render the response as XML in reply to the webhook request
  return callback(null, twiml)
}
```

> \[!NOTE]
>
> In this example, your personal number is hardcoded as a string in the Function for convenience. For a more secure approach, consider setting `MY_NUMBER` as an **[Environment Variable](/docs/serverless/functions-assets/functions/variables)** in the Functions UI instead. It could then be referenced in your code as `context.MY_NUMBER`, as shown in the following example.

```js title="Forward an inbound SMS" description="Using an environment variable to store sensitive data"
exports.handler = (context, event, callback) => {
  // Create a new messaging response object
  const twiml = new Twilio.twiml.MessagingResponse()
  // Use any of the Node.js SDK methods, such as `message`, to compose a response
  // Access incoming text information like the from number and contents off of `event`
  // Access environment variables and other runtime data from `context`
  twiml.message({ to: context.MY_NUMBER }, `${event.From}: ${event.Body}`)
  // Return the TwiML as the second argument to `callback`
  // This will render the response as XML in reply to the webhook request
  return callback(null, twiml)
}
```

## Respond with MMS media from an HTTP request

All the Function examples so far are fully synchronous and only rely on data from the inbound message. Functions can also request data from other services with the ability to rely on modern [async/await syntax](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await).

For example, in response to an incoming SMS, it's possible for a Function to request an online resource (such as a fun image of a doge), and reply back to the sender with an MMS containing said image.

```js title="Respond to an inbound SMS with an asynchronously generated MMS"
const axios = require("axios")

// Note that the function must be `async` to enable the use of the `await` keyword
exports.handler = async (context, event, callback) => {
  // Create a new messaging response object
  const twiml = new Twilio.twiml.MessagingResponse()

  // You can do anything in a Function, including making async requests for data
  const response = await axios.get("https://dog.ceo/api/breed/shiba/images/random").catch(error => {
    // Be sure to handle any async errors, and return them in a callback to end
    // Function execution if it makes sense for your application logic
    console.error(error)
    return callback(error)
  })

  const imageUrl = response.data.message

  // Use any of the Node.js SDK methods, such as `message`, to compose a response
  // In this case we're also including the doge image as a media attachment
  // Note: access incoming text details such as the from number on `event`
  twiml.message(`Hello, ${event.From}! Enjoy this doge!`).media(imageUrl)

  // Return the TwiML as the second argument to `callback`
  // This will render the response as XML in reply to the webhook request
  return callback(null, twiml)
}
```

> \[!WARNING]
>
> In order to use an npm module such as `axios` to create HTTP requests, you will need to add it as a **[Dependency](/docs/serverless/functions-assets/functions/dependencies)**.
