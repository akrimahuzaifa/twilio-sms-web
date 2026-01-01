import { useEffect, useState, useRef } from "react"
import { useAuthentication } from "../../context/AuthenticationProvider"
import { sendTwilioMessage } from "../../js/sendTwilioMessage"
import { LayoutMinimal } from "../Layout/Layout"
import { InboxOutlined, SendOutlined } from "@ant-design/icons"
import { MessageRows } from "../MessageRows/MessageRows"
import { useNavigate } from "react-router-dom"
import { allPhones, MessageFilterEnum, Selector } from "./Selector"
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers"
import { getMessages } from "./getMessages"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import ConversationComposer from "../ConversationComposer/ConversationComposer"
import Toast from "../Toast/Toast"
import { MessageDirection } from "../../js/types"

const LAST_SEEN_KEY = "twilio_sms_last_seen"

const otherFromMessage = m => (m.direction === "received" ? m.from : m.to)

const loadLastSeen = () => {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

const saveLastSeen = v => localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(v))

const buildConversations = (messages = [], lastSeen = {}) => {
  const byContact = {}
  messages.forEach(m => {
    const contact = otherFromMessage(m)
    if (!byContact[contact]) byContact[contact] = []
    byContact[contact].push(m)
  })
  return Object.keys(byContact)
    .map(contact => {
      const msgs = byContact[contact].sort((a, b) => (Date.parse(a.date) > Date.parse(b.date) ? -1 : 1))
      const lastMessage = msgs[0]
      const seen = lastSeen[contact] ? Date.parse(lastSeen[contact]) : 0
      const unread = msgs.filter(m => m.direction === "received" && Date.parse(m.date) > seen).length
      return {
        contact,
        lastMessage,
        unread,
        messages: msgs,
      }
    })
    .sort((a, b) => (Date.parse(a.lastMessage.date) > Date.parse(b.lastMessage.date) ? -1 : 1))
}

export const InboxPage = () => {
  const navigate = useNavigate()

  const navigateToInbox = () => navigate("/inbox")
  const navigateToSend = () => navigate("/send")

  const [messages, setMessages] = useState([])
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [phoneNumber, setPhoneNumber] = useState(allPhones)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [loadingPhones, setLoadingPhones] = useState(true)
  const [messageFilter, setMessageFilter] = useState(MessageFilterEnum.all)
  const [error, setError] = useState(null)

  const [selectedContact, setSelectedContact] = useState(undefined)
  const [lastSeen, setLastSeen] = useState(() => loadLastSeen())
  const pollingRef = useRef(false)
  const [authentication] = useAuthentication()
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [toasts, setToasts] = useState([])

  const pushToast = message => {
    const id = `t-${Date.now()}`
    setToasts(ts => [...ts, { id, message }])
  }

  const removeToast = id => setToasts(ts => ts.filter(t => t.id !== id))

  useEffect(() => {
    const run = async () => {
      setLoadingMessages(true)
      try {
        const ms = await getMessages(phoneNumber, messageFilter)
        setMessages(ms)
      } catch (e) {
        setError(e)
      } finally {
        setLoadingMessages(false)
      }
    }
    run()
  }, [phoneNumber, messageFilter])

  useEffect(() => {
    getTwilioPhoneNumbers()
      .then(setPhoneNumbers)
      .catch(setError)
      .finally(() => setLoadingPhones(false))
  }, [])

  // polling for new messages
  useEffect(() => {
    let interval = undefined
    const start = () => {
      if (interval) return
      interval = setInterval(async () => {
        if (pollingRef.current) return
        pollingRef.current = true
        try {
          const ms = await getMessages(phoneNumber, messageFilter)
          setMessages(ms)
        } catch (e) {
          setError(e)
        } finally {
          pollingRef.current = false
        }
      }, 12000)
    }
    start()
    return () => clearInterval(interval)
  }, [phoneNumber, messageFilter])

  const conversations = buildConversations(messages, lastSeen)

  const handleSelect = contact => {
    setSelectedContact(contact)
    const updated = { ...lastSeen, [contact]: new Date().toISOString() }
    setLastSeen(updated)
    saveLastSeen(updated)
  }

  const handleSendReply = async () => {
    // deprecated in favor of ConversationComposer
  }

  const currentMessages = selectedContact
    ? messages.filter(m => otherFromMessage(m) === selectedContact)
    : messages

  return (
    <LayoutMinimal>
      <ErrorLabel error={error} className="mb-4" />
      <div className="flex gap-4" style={{ height: "97vh", overflow: "hidden" }}>
        <div className="w-80 border-2 rounded-md p-2 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
                <div className="font-semibold text-2xl">Twilio SMS Web</div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <span onClick={navigateToInbox} className="cursor-pointer">
                  <InboxOutlined className="text-xl" />
                </span>
                <span onClick={navigateToSend} className="cursor-pointer">
                  <SendOutlined className="text-xl" />
                </span>
              </div>
          </div>
          <Selector
            phoneNumbers={phoneNumbers}
            phoneNumber={phoneNumber}
            loading={loadingPhones}
            onMessageFilterChange={setMessageFilter}
            onPhoneNumberChange={pn => {
              setPhoneNumber(pn)
              setSelectedContact(undefined)
            }}
          />
          <div className="mt-4 overflow-auto flex-1">
            {conversations.length === 0 && <div className="p-4 text-sm">No conversations yet</div>}
            {conversations.map(c => (
              <div
                key={c.contact}
                onClick={() => handleSelect(c.contact)}
                className={`p-2 mb-2 rounded hover:bg-gray-100 cursor-pointer flex justify-between items-start ${
                  selectedContact === c.contact ? "bg-purple-100" : "bg-white"
                }`}
              >
                <div>
                  <div className="font-semibold truncate w-48">{c.contact}</div>
                  <div className="text-xs text-gray-600 line-clamp-2 w-48">{c.lastMessage.body}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs timestamp">{new Date(c.lastMessage.date).toLocaleString()}</div>
                  {c.unread > 0 && (
                    <div className="mt-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">{c.unread}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-gray-600">
            <div className="border-t mt-2 pt-2 text-center">
              <a href={import.meta.env.VITE_GITHUB_URL || '#'} className="underline">GitHub</a>
              <div>Developed by AHK</div>
            </div>
          </div>
        </div>
        <div className="flex-1 border-2 rounded-md p-2 flex flex-col">
          <div className="mb-4">
            <h4 className="text-lg">{selectedContact ? `Conversation with ${selectedContact}` : "All messages"}</h4>
          </div>
          <div className="flex-1 overflow-auto flex flex-col">
            <div className="flex-1 overflow-auto">
              <MessageRows loading={loadingMessages} messages={currentMessages} />
            </div>
            <ConversationComposer
              selectedContact={selectedContact}
              phoneNumber={phoneNumber}
              authentication={authentication}
              sendFunc={sendTwilioMessage}
              onOptimisticSend={m => {
                // append optimistic message
                setMessages(prev => [m, ...prev])
              }}
              onReplaceTempMessage={(tempSid, realMsg) => {
                setMessages(prev => {
                  const idx = prev.findIndex(p => p.messageSid === tempSid)
                  if (idx === -1) return prev
                  const copy = prev.slice()
                  copy[idx] = realMsg
                  return copy
                })
                if (realMsg.status === "sent") pushToast("Message sent")
                if (realMsg.status === "failed") pushToast("Message failed to send")
              }}
            />
          </div>
        </div>
      </div>
      {toasts.length > 0 && <Toast toast={toasts[toasts.length - 1]} onClose={removeToast} />}
    </LayoutMinimal>
  )
}
