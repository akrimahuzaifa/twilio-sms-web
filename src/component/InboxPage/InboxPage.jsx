import { useEffect, useState, useRef } from "react"
import { useAuthentication } from "../../context/AuthenticationProvider"
import { sendTwilioMessage } from "../../js/sendTwilioMessage"
import { LayoutMinimal } from "../Layout/Layout"
import { siteConfig } from "../../js/siteConfig"
import { InboxOutlined, SendOutlined, LeftOutlined } from "@ant-design/icons"
import { MessageRows } from "../MessageRows/MessageRows"
import { useNavigate } from "react-router-dom"
import { allPhones, MessageFilterEnum, Selector } from "./Selector"
import { PhoneCombobox } from "../PhoneCombobox/PhoneComboox"
import { phonePattern } from "../../js/util"
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers"
import { getMessages } from "./getMessages"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import ConversationComposer from "../ConversationComposer/ConversationComposer"
import Toast from "../Toast/Toast"
import { MessageDirection } from "../../js/types"
import notif from "../../assets/notification.mp3"
import { FOOTER as MessageFooter } from "../../js/sendTwilioMessage"

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
  const navigateToSend = () => {} // Prevent navigation, will use panel instead
  const [showSendPanel, setShowSendPanel] = useState(false)
  const [sendFrom, setSendFrom] = useState("")
  const [sendTo, setSendTo] = useState("")
  const [sendMessage, setSendMessage] = useState(
    import.meta.env.VITE_SMS_SIGNATURE ? `\n\n${import.meta.env.VITE_SMS_SIGNATURE}` : MessageFooter,
  )
  const [sendingMessage, setSendingMessage] = useState(false)

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
  const prevReceivedIdsRef = useRef(new Set())
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
    // request notification permission once on mount
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {})
      }
    } catch (e) {}

    // helper to play a short in-browser tone using WebAudio
    try {
      // const playNotificationSound = () => {
      //   try {
      //     const AudioCtx = window.AudioContext || window.webkitAudioContext
      //     if (!AudioCtx) return
      //     const ctx = new AudioCtx()
      //     const o = ctx.createOscillator()
      //     const g = ctx.createGain()
      //     o.type = "sine" // sine | square | triangle | sawtooth
      //     o.frequency.value = 1000
      //     g.gain.value = 0.04
      //     o.connect(g)
      //     g.connect(ctx.destination)
      //     o.start()
      //     setTimeout(() => {
      //       o.stop()
      //       try {
      //         ctx.close()
      //       } catch (e) {}
      //     }, 180)
      //   } catch (e) {}
      // }

      const playNotificationSound = () => {
        try {
          const audio = new Audio(notif)
          audio.volume = 0.7
          audio.play().catch(() => {})
        } catch (e) {}
      }
      // expose for debugging or manual trigger
      try {
        window.__playTwilioSmsSound = playNotificationSound
      } catch (e) {}
    } catch (e) {}
  }, [])
  useEffect(() => {
    const run = async () => {
      setLoadingMessages(true)
      try {
        const ms = await getMessages(phoneNumber, messageFilter)
        setMessages(ms)
        // initialize previously seen received ids so initial fetch does not trigger notifications
        try {
          prevReceivedIdsRef.current = new Set(
            (ms || []).filter(m => m.direction === "received").map(m => m.messageSid),
          )
        } catch (e) {}
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

  useEffect(() => {
    // default sendFrom to first phone number when available
    if (!sendFrom && phoneNumbers && phoneNumbers.length > 0) setSendFrom(phoneNumbers[0])
  }, [phoneNumbers])

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
          // detect new inbound messages
          try {
            const prevIds = prevReceivedIdsRef.current || new Set()
            const received = (ms || []).filter(m => m.direction === "received")
            const newMessages = received.filter(m => !prevIds.has(m.messageSid))
            if (newMessages && newMessages.length > 0) {
              newMessages.forEach(m => prevIds.add(m.messageSid))
              prevReceivedIdsRef.current = prevIds
              newMessages.forEach(m => {
                try {
                  if (
                    typeof window !== "undefined" &&
                    "Notification" in window &&
                    Notification.permission === "granted"
                  ) {
                    const title = `${siteConfig.appTitle} — New message`
                    const body = `${m.from}: ${m.body ? (m.body.length > 120 ? m.body.substring(0, 120) + "..." : m.body) : "(media)"}`
                    const n = new Notification(title, { body })
                    n.onclick = () => {
                      try {
                        window.focus()
                      } catch (e) {}
                    }
                  }
                } catch (e) {}
                try {
                  if (typeof window !== "undefined" && window.__playTwilioSmsSound) window.__playTwilioSmsSound()
                } catch (e) {}
                pushToast(`New message from ${m.from}`)
              })
            }
          } catch (e) {}
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

  const currentMessages = selectedContact ? messages.filter(m => otherFromMessage(m) === selectedContact) : messages

  // validation for slide-in send panel
  const _userPortion = sendMessage
    ? sendMessage.split(import.meta.env.VITE_SMS_SIGNATURE || MessageFooter)[0].trim()
    : ""
  const isValidFromPanel = phoneNumbers && phoneNumbers.length > 0 && phoneNumbers.includes(sendFrom)
  const isValidToPanel = sendTo && sendTo.match(phonePattern)
  const isValidMessagePanel = _userPortion.length > 0 && sendMessage.length < 500
  const canSend = isValidFromPanel && isValidToPanel && isValidMessagePanel

  return (
    <LayoutMinimal>
      <ErrorLabel error={error} className="mb-4" />
      <div className="flex gap-4 relative" style={{ height: "97vh", overflow: "hidden" }}>
        <div className="w-[30%] border-2 rounded-md p-2 flex flex-col h-full relative">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-2xl text-[#3b82f6]">{siteConfig.appTitle}</div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              {/* <span onClick={navigateToInbox} className="cursor-pointer">
                  <InboxOutlined className="text-xl" />
                </span> */}
              <button
                onClick={() => setShowSendPanel(true)}
                className="bg-transparent rounded-[27px] border-none text-black hover:text-white cursor-pointer items-center flex gap-1"
              >
                + <SendOutlined className="text-xl" />
              </button>
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
                className={`p-2 mb-2 rounded hover:bg-gray-100 cursor-pointer flex justify-between items-center min-h-[75px] ${
                  selectedContact === c.contact ? "bg-blue-100" : "bg-white"
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-semibold truncate">{c.contact}</div>
                  <div className="text-xs text-gray-600 line-clamp-2 truncate">{c.lastMessage.body}</div>
                </div>
                <div className="w-20 flex flex-col items-end text-right">
                  <div className="text-xs timestamp">{new Date(c.lastMessage.date).toLocaleString()}</div>
                  {c.unread > 0 && (
                    <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      {c.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-gray-600">
            <div className="border-t mt-2 pt-2 text-center">
              <div>
                {siteConfig.footer.creditText}
                <br />
                <a
                  href={siteConfig.footer.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {siteConfig.footer.companyName}
                </a>
              </div>
            </div>
          </div>

          {/* Slide-in Send Panel (inside left column) */}
          <div
            className={`absolute inset-0 z-40 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
              showSendPanel ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center gap-2">
                <button
                  className="bg-transparent py-2 rounded-[27px] text-gray-600 border-none hover:text-white"
                  onClick={() => setShowSendPanel(false)}
                  aria-label="Back"
                >
                  ↩ <InboxOutlined className="text-xl" />
                </button>
                <div className="font-semibold">New message</div>
              </div>
            </div>
            <div className="p-4 overflow-auto h-full">
              <div className="mb-3 flex items-center">
                <label className="w-14">From:</label>
                <PhoneCombobox
                  initial={sendFrom}
                  options={phoneNumbers}
                  onSelect={setSendFrom}
                  loading={loadingPhones}
                  disabled={sendingMessage}
                />
              </div>
              <div className="mb-3 flex items-center">
                <label className="w-14">To:</label>
                <input
                  type="tel"
                  value={sendTo}
                  pattern={phonePattern}
                  onChange={e => setSendTo("+" + e.target.value.replace(/\D/g, ""))}
                  disabled={sendingMessage}
                />
              </div>
              <textarea
                className="w-full mt-2 p-2 min-h-[120px]"
                placeholder={`Send a message from ${sendFrom || "?"} to ${sendTo || "?"}`}
                value={sendMessage}
                onChange={e => setSendMessage(e.target.value)}
                disabled={sendingMessage}
                rows={6}
              />
              <div className="mt-3 flex justify-end">
                <button
                  disabled={sendingMessage || !canSend}
                  className={`${sendingMessage || !canSend ? "px-4 py-2 rounded-[27px] bg-gray-300 text-gray-600 cursor-not-allowed" : "btn-primary"}`}
                  onClick={async () => {
                    if (sendingMessage || !canSend) return
                    // keep the existing validation as a safeguard
                    const isValidFrom = phoneNumbers.includes(sendFrom)
                    const isValidTo = sendTo && sendTo.match(phonePattern)
                    const userPortion = sendMessage
                      ? sendMessage.split(import.meta.env.VITE_SMS_SIGNATURE || MessageFooter)[0].trim()
                      : ""
                    const isValidMessage = userPortion.length > 0 && sendMessage.length < 500
                    if (!isValidFrom || !isValidTo || !isValidMessage) {
                      pushToast("Invalid send details")
                      return
                    }
                    setSendingMessage(true)
                    try {
                      await sendTwilioMessage(authentication, sendTo, sendFrom, sendMessage)
                      pushToast("Message sent")
                      setShowSendPanel(false)
                      setSendTo("")
                      setSendMessage(
                        import.meta.env.VITE_SMS_SIGNATURE
                          ? `\n\n${import.meta.env.VITE_SMS_SIGNATURE}`
                          : MessageFooter,
                      )
                    } catch (e) {
                      pushToast("Message failed to send")
                    } finally {
                      setSendingMessage(false)
                    }
                  }}
                >
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 border-2 rounded-md p-2 flex flex-col">
          <div className="mb-4">
            <h4 className="text-lg">{selectedContact ? `Conversation with ${selectedContact}` : "All messages"}</h4>
          </div>
          <div className="flex-1 overflow-auto flex flex-col">
            <div className="flex-1 overflow-auto">
              <MessageRows loading={loadingMessages} messages={currentMessages} conversationKey={selectedContact || "all"} />
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
