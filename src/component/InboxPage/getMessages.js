import { getTwilioMessages, sortByDate, MAX_PAGE_SIZE } from "../../js/getTwilioMessages"
import { allPhones, MessageFilterEnum } from "./Selector"

/**
 * @typedef {import ("../../js/getTwilioMessages").Message} Message
 */

/**
 *
 * @returns {Promise<Array<Message>>}
 */
export const getMessages = async (phoneNumber = allPhones, filter = MessageFilterEnum.all) => {
  if (phoneNumber === allPhones) {
    return await getTwilioMessages()
  }

  if (MessageFilterEnum.received === filter) {
    return await getTwilioMessages(undefined, phoneNumber)
  }

  if (MessageFilterEnum.sent === filter) {
    return await getTwilioMessages(phoneNumber)
  }

  const from = await getTwilioMessages(phoneNumber)
  const to = await getTwilioMessages(undefined, phoneNumber)
  return from.concat(to).sort(sortByDate)
}

/**
 * Full history with one contact. The inbox list above only holds the newest 50 sent + 50 received,
 * so older messages in a conversation (usually the sent side) would otherwise be missing.
 *
 * @returns {Promise<Array<Message>>}
 */
export const getConversationMessages = async (contact, phoneNumber = allPhones, filter = MessageFilterEnum.all) => {
  const [fromContact, toContact] = await Promise.all([
    filter === MessageFilterEnum.sent ? [] : getTwilioMessages(contact, undefined, MAX_PAGE_SIZE),
    filter === MessageFilterEnum.received ? [] : getTwilioMessages(undefined, contact, MAX_PAGE_SIZE),
  ])
  return fromContact
    .concat(toContact)
    .filter(m => phoneNumber === allPhones || m.from === phoneNumber || m.to === phoneNumber)
    .sort(sortByDate)
}
