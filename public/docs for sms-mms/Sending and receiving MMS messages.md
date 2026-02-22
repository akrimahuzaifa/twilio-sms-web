## Sending and receiving MMS messages

## Objective

You can send and receive MMS (media messages) in the United States, Canada, and Australia by using a Twilio phone number that is MMS-enabled. Currently, Twilio offers MMS-enabled long code phone numbers in the US and Canada, MMS-enabled short codes in the US, and Australian Long Codes. Read our [phone numbers FAQ](https://help.twilio.com/articles/223135247-How-to-Search-for-and-Buy-a-Twilio-Phone-Number-from-Console) to learn how to buy a Twilio phone number, ensuring to check the box for "MMS".

## Product

Programmable Messaging 

## Procedure

### Supported media types for MMS

MMS on Twilio offers full support for common image file types: png, jpeg, and gif. In addition, there are other file types which we will accept, but will not make any attempt to modify for device or carrier compatibility. See [Accepted Content Types for Media](https://www.twilio.com/docs/sms/accepted-mime-types) for a full list.

### Sending MMS messages (United States and Canada)

At this time, MMS messages can only be sent within the US and Canada when sending from US and CA Long Codes and Shortcodes (That are MMS enabled).

(information)

Notice: Shortcode MMS can only be sent to/from US Short Code numbers if the mobile user is on a major US network (AT&T/Sprint/T-Mobile/Verizon). MMS from/to providers such as Google Voice and any others not listed above will fail. An additional one-time fee is required if you would like to add MMS capability to your new or existing short code. Please see our FAQ on [pricing for picture messaging over short codes](https://help.twilio.com/articles/223181048-How-much-does-it-cost-to-send-receive-an-MMS-message-over-a-short-code-) for more information.

MMS message requests terminating to [unsupported MMS carriers](https://help.twilio.com/articles/223133707-Is-MMS-supported-for-all-carriers-in-US-and-Canada-) in the US and Canada, or non-US/Canada destinations, can be converted to SMS messages with a short URL link to the media by enabling MMS Converter. Without using MMS Converter, these message requests will receive an `HTTP 400` response from the Twilio REST API.

For more information, please see [Getting Started with MMS Converter](https://help.twilio.com/articles/360032795214-Getting-Started-with-MMS-Converter-).

Sending MMS messages is as easy as sending regular text messages. All you need to do is make an HTTP POST request to the [Messages resource URI](https://www.twilio.com/docs/api/rest/sending-messages#post "Messages list resource URI") and specify an image URL in the "MediaUrl" parameter.

You can also specify multiple "MediaUrl" parameters if you wish to include multiple images in one message. Check out our API documentation for [code examples](https://www.twilio.com/docs/api/rest/sending-messages#example-1 "Messaging Code Examples"). 

To reply to incoming messages with an MMS, use the <Message> verb and <Media> noun to send a picture message. Here is an example for how to send a message with text and a picture:

Copy code block

```
<?xml version="1.0" encoding="UTF‐8"?>
<Response>
    <Message>
        <Body>I drew an owl!</Body>
        <Media>https://demo.twilio.com/owl.png</Media>
    </Message>
</Response>
```

For more information, please see our Messaging [TwiML documentation](https://www.twilio.com/docs/api/twiml/sms/message). 

Recommendations for File Name (including Content-Disposition header) :

Example:

Copy code block

```
Content-Disposition=inline; filename="<expected filename>.<extension>"
```

- Don't use spaces
- Keep file name to 20 characters or less
- Avoid using most special characters such as ~ ! @ # $ % ^ & \* ( ) [ ] { } 

MMS capability can also be added Twilio US short codes. 

### Sending MMS messages in the rest of the world

Outbound MMS from Twilio is only supported outside US and Canada, in Australia, by using an MMS enabled Australian-based phone numbers. Outbound MMS messages are supported to all major mobile carriers in these destinations.

### Receiving MMS messages

If you own an MMS-enabled US or Canadian phone number, your phone number is capable of receiving MMS messages from US and Canadian long code phone numbers. Make sure your number is [configured to receive messages](https://help.twilio.com/articles/223136047-Configuring-Phone-Numbers-to-Receive-and-Respond-to-SMS-and-MMS-Messages). 

Please note that Twilio phone numbers cannot receive messages from [short code numbers.](https://help.twilio.com/articles/223182068-What-is-a-short-code-)
