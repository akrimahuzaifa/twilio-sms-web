import { useState } from "react"
import { Loading3QuartersOutlined, SendOutlined } from "@ant-design/icons"
import { allPhones } from "../InboxPage/Selector"

/**
 * Props:
 * - selectedContact (string)
 * - phoneNumber (string)
 * - onOptimisticSend(message) => append temporary message
 * - onReplaceTempMessage(tempSid, realMessage) => replace temp with real
 * - sendFunc(authentication, to, from, body) => Promise<sid>
 * - authentication
 */
export const ConversationComposer = ({
  selectedContact,
  phoneNumber,
  authentication,
  onOptimisticSend,
  onReplaceTempMessage,
  sendFunc,
}) => {
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!selectedContact || !phoneNumber || !text || sending) return
    const tempSid = `temp-${Date.now()}`
    const tempMsg = {
      messageSid: tempSid,
      direction: "sent",
      from: phoneNumber,
      to: selectedContact,
      status: "queued",
      body: text,
      media: 0,
      date: new Date().toISOString(),
      _optimistic: true,
    }

    // optimistic append
    onOptimisticSend && onOptimisticSend(tempMsg)
    setSending(true)
    try {
      const sid = await sendFunc(authentication, selectedContact, phoneNumber, text)
      const realMsg = { ...tempMsg, messageSid: sid, _optimistic: false, status: "sent" }
      onReplaceTempMessage && onReplaceTempMessage(tempSid, realMsg)
      setText("")
      return { ok: true, sid }
    } catch (e) {
      // mark failed by replacing with status
      const failedMsg = { ...tempMsg, _optimistic: false, status: "failed" }
      onReplaceTempMessage && onReplaceTempMessage(tempSid, failedMsg)
      return { ok: false, error: e }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-2 pt-2 h-14 border-t flex items-stretch gap-2">
      <textarea
        className="flex-1 p-2 rounded focus:outline-none focus:border-blue-400"
        placeholder={selectedContact ? `Reply to ${selectedContact}` : "Select a conversation to reply"}
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        disabled={!selectedContact || phoneNumber === allPhones || sending}
        maxLength={500}
      />
      <button
        className="ml-2 w-14 h-full flex items-center justify-center rounded-[16px] composer-send"
        onClick={handleSend}
        disabled={!selectedContact || phoneNumber === allPhones || sending || text.length === 0}
        aria-label="Send message"
      >
        {sending ? <Loading3QuartersOutlined spin /> : <SendOutlined />}
      </button>
    </div>
  )
}

export default ConversationComposer
