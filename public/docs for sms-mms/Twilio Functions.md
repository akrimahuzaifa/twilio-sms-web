# Functions

**Twilio Functions** is a serverless environment that empowers developers to quickly create production-grade, event-driven Twilio applications that scale with their businesses.

## Key features

- **Secure by default** - Automatically ensure that only Twilio requests can execute your code
- **Serverless** - Offload your operational burden to Twilio and skip maintaining any infrastructure
- **Autoscaling** - Automatically add capacity to meet the unique demands of your application
- **Native Twilio integration** - Use Functions as a first-class member of the Twilio console with a pre-initialized [Twilio Node.js SDK](https://github.com/twilio/twilio-node) built in
- **Familiar** - Work in an environment powered by [Node 22](https://nodejs.org/en/blog/release/v22.14.0)

## What it does

![Diagram showing HTTP requests and responses between a web app, TwiML, Twilio services, and third-party services.](https://docs-resources.prod.twilio.com/c53e91e471d18c0a2043c49be617066815b536bc99ae2b95fcfc977428f41620.png)

Twilio Functions replaces your need to find hosting or stand up a server to serve TwiML or any other HTTP-based responses. With Functions, you no longer have to worry about maintaining or scaling your web infrastructure—it's all managed seamlessly by Twilio, scaling with your use case.

Typical use cases include manipulating voice calls, serving up tokens for our mobile SDKs, or invoking the Twilio REST API in response to an event, such as an inbound SMS.

## Get started with Serverless and Twilio Functions

The Twilio Functions and Assets Editor brings together Functions, Assets, Dependencies, Environment Variables, and Debugging in the same window. You can upload and create [Assets](/docs/serverless/functions-assets/assets). You can access all your Functions to edit them in multiple tabs simultaneously.

![Twilio Functions Console showing code editor with example TwiML function and logs pane.](https://docs-resources.prod.twilio.com/402ccb797944a0f0d4ed448b70b590c62d5878466ef6e3276a1abe9d476ce6cf.png)

We have put together code examples that you can use to get your application development started with Twilio Functions and Assets.

### Learn the basics for handling SMS, MMS, and phone calls

- [Receive inbound SMS](/docs/serverless/functions-assets/quickstart/receive-sms)
- [Send SMS and MMS](/docs/serverless/functions-assets/quickstart/send-sms-and-mms)
- [Receive incoming phone calls](/docs/serverless/functions-assets/quickstart/receive-call)
- [Make a Call](/docs/serverless/functions-assets/quickstart/make-a-call)

### Learn how to leverage APIs

- [Make an API request](/docs/serverless/functions-assets/quickstart/api-request)

### Learn how headers and cookies can add extra functionality and security

- [Enable CORS between Flex Plugins and Functions](/docs/serverless/functions-assets/quickstart/enabling-cors-between-flex-plugins-and-functions)
- [Validate Webhook requests from SendGrid](/docs/serverless/functions-assets/quickstart/validate-webhook-requests-from-sendgrid)
- [Manage application state with cookies](/docs/serverless/functions-assets/quickstart/cookies-state)
- [Protect your Function with Basic Auth](/docs/serverless/functions-assets/quickstart/basic-auth)
- [Protect your Function with JSON Web Token (JWT)](/docs/serverless/functions-assets/quickstart/json-web-token)

### Learn how to integrate Functions with Twilio Studio

- [Use the Run Function widget in Studio](/docs/serverless/functions-assets/quickstart/run-function-studio-widget)
- [Add delay](/docs/serverless/functions-assets/quickstart/add-delay)
- [Normalize telephone numbers](/docs/serverless/functions-assets/quickstart/normalize-telephone-numbers)

### Learn other common use cases

- [Use Twilio Sync to manage real-time data in your applications](/docs/serverless/functions-assets/quickstart/real-time-data-sync)
- [Determine carrier, phone number type, and caller info](/docs/serverless/functions-assets/quickstart/lookup-carrier-and-caller-info)
- [Time of day routing](/docs/serverless/functions-assets/quickstart/time-of-day-routing)
- [Prevent blocked numbers from calling your application](/docs/serverless/functions-assets/quickstart/blocked-numbers)
- [Display Node.js and Twilio server-side SDK versions](/docs/serverless/functions-assets/quickstart/display-versions)

## What's next?

Now that you've been introduced to what Functions can do, it's important to also have an understanding of how this all works, particularly the way that requests are sent to your Function.

If you'd rather skip that and get straight to the nuts and bolts of all the values and tools at your disposal from within a Function, we understand.

- [Understand the mechanics of and limitations on requests to your Twilio Function](/docs/serverless/functions-assets/functions/request-flow)
- [Understand the execution process, handler method, and response building processes](/docs/serverless/functions-assets/functions/invocation)
