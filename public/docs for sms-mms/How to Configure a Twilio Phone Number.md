## How to Configure a Twilio Phone Number to Receive and Respond to Messages

## Objective

All newly purchased Twilio numbers will automatically respond to incoming SMS and MMS messages with a default sample message, but this routing can be changed easily. This guide covers the following topics to help update the routing for your phone numbers.

(warning)

Notice: Twilio phone numbers must be compliant with all [local regulations](https://www.twilio.com/guidelines/regulatory) in order to update the routing. For help determining your phone numbers' compliance status, see [View the Regulatory Compliance Report for your Twilio Phone Numbers](https://help.twilio.com/articles/360024351914-View-the-Regulatory-Compliance-Report-for-your-Twilio-Phone-Numbers).

## Product

Programmable Messaging

## Procedure

### Create your app[ 🔗](https://help.twilio.com/articles/223136047-Configuring-Phone-Numbers-to-Receive-and-Respond-to-SMS-and-MMS-Messages#h_11f6a805-5bc8-40b0-963b-6b7dcf05d8a9)

Incoming communications to Twilio will need to be handled by an application that responds with [TwiML](https://www.twilio.com/docs/glossary/what-is-twilio-markup-language-twiml) - our XML-based markup language. Twilio reaches out to your application on incoming communications, and uses the TwiML response we receive as instructions that tell us how to respond to the message.

Your Twilio response will vary depending on your use case and business needs. For full details on how Twilio Programmable Messaging works, see [Receive and Reply to SMS and MMS Messages (Twilio Docs)](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply).

(information)

Notice: While specific messages can't be blocked, you can choose to not trigger a webhook for incoming messages to a specific number. For more information, see [Is there a way to block incoming SMS on my Twilio phone number?](https://help.twilio.com/articles/223181648-Is-there-a-way-to-block-incoming-SMS-on-my-Twilio-phone-number-)\
For help configuring your phone number to receive messages without an auto-response, see [Receive SMS and MMS Messages without Responding](https://help.twilio.com/articles/223134127-Receive-SMS-messages-without-Responding).

### Configuration options [🔗](https://help.twilio.com/articles/223136047-Configuring-Phone-Numbers-to-Receive-and-Respond-to-SMS-and-MMS-Messages#h_24dd9e68-3f3e-48c9-bb18-4be92b093494)

Once your app is ready, it will need to be posted online where Twilio can access it. We'll reach out on incoming communications, and then process the TwiML command instructions your app responds with. For hosting your app, we offer users an array of products to meet different requirements. Here are some of the most common options, and our recommendations:

TwiML Bins give users free hosting for static XML-based TwiML response scripts. We recommend this option for users who need a simple setup option for basic use cases like a static automated reply, or forwarding to another phone number.

Studio Flows allow users to create an application with our no-code-required flowchart-style interface. We recommend this options for users who have no coding experience, or those who need to design a scalable hosted communications application.

Functions give users free hosting for Node.js TwiML response applications. We recommend this option for users who need a scalable option to develop more robust use cases like applications that utilize NPM libraries, or make API requests.

Webhooks allow users to receive Twilio incoming messages at their own hosted web application. Once the messages arrive, users are free to store or process the information, and can respond to the message via TwiML in XML format or from one of our [helper library SDKs](https://www.twilio.com/docs/libraries).

Once your application is posted, you'll need to update your phone number's routing via either the [Console UI](https://help.twilio.com/articles/223136047-Configuring-Phone-Numbers-to-Receive-and-Respond-to-SMS-and-MMS-Messages#h_5fd3801f-8241-421f-ad0f-8fb6c25ba68c) or an [API request](https://help.twilio.com/articles/223136047-Configuring-Phone-Numbers-to-Receive-and-Respond-to-SMS-and-MMS-Messages#h_58646936-ad13-4940-aeb7-252b1d5aaa4e).

### Update phone number routing via Console [🔗](https://help.twilio.com/articles/223136047-Configuring-Phone-Numbers-to-Receive-and-Respond-to-SMS-and-MMS-Messages#h_5fd3801f-8241-421f-ad0f-8fb6c25ba68c)

1.  Access the Active Numbers page in [Console](https://www.twilio.com/console/phone-numbers/incoming).
2.  Click the desired phone number to modify.
3.  Scroll to the Messaging section, and then modify the phone number's routing. When finished, click Save.\
    ![SMS_1_webhook.png](https://support.twilio.com/hc/article_attachments/22945082654491)

Each routing option has different setup requirements. The following table contains selection details for the most common configurations:

|   | Configure with | A Message comes in | Input or Drop-down |
| TwiML Bin | Webhooks, TwiML Bins, Functions, Studio, or Proxy | TwiML | Select your previously saved TwiML Bin |
| Studio Flow | Webhooks, TwiML Bins, Functions, Studio, or Proxy | Studio Flow | Select your previously saved Studio Flow |
| Functions | Webhooks, TwiML Bins, Functions, Studio, or Proxy | Function | Select your previously saved Function |
| Webhook | Webhooks, TwiML Bins, Functions, Studio, or Proxy | Webhook | Enter your Twilio application's URL |
| Proxy | Webhooks, TwiML Bins, Functions, Studio, or Proxy | Proxy | Select Proxy Service |
| TwiML App | TwiML App | TwiML App | Select your previously saved TwiML App |

###\
Update phone number routing via an API request [🔗](https://help.twilio.com/articles/223136047-Configuring-Phone-Numbers-to-Receive-and-Respond-to-SMS-and-MMS-Messages#h_58646936-ad13-4940-aeb7-252b1d5aaa4e)

A Twilio phone number's routing can also be changed by submitting an HTTP POST request to the `IncomingPhoneNumber` REST API resource of the phone number you want to change. To make this request, you will need the following pieces of information:

- Phone number SID: The PN SID (long code) or SC SID (short code) for the phone number you wish to update.
- Twilio messaging app details: The URL for your Twilio app (webhook, TwiML Bin, Function, etc.), or your TwiML App SID
- Regulatory Requirements (as needed): The Identity (`RI...`), Address (`AD...`), or Bundle (`BU...`) SID as needed for [regulatory compliance](https://www.twilio.com/guidelines/regulatory).
- Project credentials: The [Account SID and Auth Token](https://www.twilio.com/docs/usage/your-request-to-twilio#credentials) for your Twilio project.

Here's an example cURL script:

Copy code block

```
curl -XPOST https://api.twilio.com/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/IncomingPhoneNumbers/PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json\
    --data-urlencode "SmsUrl=http://www.mysite.com/twilio"\
    --data-urlencode "BundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"\
    -u 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:your_auth_token'
```

This example will update the webhook on phone number `PN...` to point incoming requests to `www.mysite.com/twilio`, and use the ID documentation Bundle SID `BU...` for local regulatory requirements. To make this script work for you, make the following updates, and then paste it into a terminal window:

- Line 1: update with your Twilio Account SID (`ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`) and the [incoming phone number's SID](https://www.twilio.com/console/phone-numbers/incoming) (`PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`).
- Line 2: update with your Twilio webhook app's URL. If using a TwiML App to handle incoming messages, [replace this line ](https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource#:~:text=sms_application_sid,of%20the%20application.)with "SmsApplicationSid=APXXXXXXXXXXXXXX".
- Line 3: update with the your regulatory documentation ([as required](https://www.twilio.com/guidelines/regulatory)).
- Line 4: update with your [Account SID and Auth Token](https://www.twilio.com/docs/usage/your-request-to-twilio#credentials).

For additional help, see the following resource: [IncomingPhoneNumber resource (Twilio Docs)](https://www.twilio.com/docs/phone-numbers/api/incoming-phone-numbers#update-an-incomingphonenumber-resource)
