import { InboxOutlined, SendOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { isEmpty } from "lodash"
import { MessageDirection } from "../../js/types"
import { MediaViewer } from "../MediaViewer/MediaViewer"
import { LoadingOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router"
import { useEffect, useRef, useLayoutEffect } from "react"

/**
 * @typedef {import("../../js/types").Message} Message
 */

const messageBody = message => (isEmpty(message.body) && message.hasMedia ? "Message contains attachments" : message.body)

const MessageBubble = ({ message, onClick }) => {
  const isReceived = MessageDirection.received === message.direction
  const bubbleClass = isReceived
    ? "bubble-inbound text-gray-800 self-start rounded-tr-xl rounded-bl-xl rounded-br-xl p-3 max-w-[70%] shadow"
    : "bubble-outbound self-end rounded-tl-xl rounded-bl-xl rounded-br-xl p-3 max-w-[70%] shadow"

  return (
    <div key={message.messageSid} onClick={() => onClick(message)} className="mb-3 flex flex-col">
      <div className={`flex items-center ${isReceived ? "justify-start" : "justify-end"}`}>
        <div className={bubbleClass}>
          <div className="text-sm">{messageBody(message)}</div>
          <div className="text-[10px] mt-2 text-right timestamp">{message.date ? dayjs(message.date).format("MM/DD/YYYY, hh:mm:ss A") : ""}</div>
        </div>
      </div>
      {message.media > 0 && (
        <div className={`mt-2 ${isReceived ? "self-start" : "self-end"}`}>
          <MediaViewer messageSid={message.messageSid} thumbnail="true" />
        </div>
      )}
    </div>
  )
}

export const MessageRows = ({ loading = true, messages = [] }) => {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const lastMessageRef = useRef(null)

  const handleOnClick = message => {
    navigate(`/message/${message.messageSid}`)
  }

  useLayoutEffect(() => {
    // Prefer scrolling the last message into view for reliable placement
    try {
      if (lastMessageRef.current && typeof lastMessageRef.current.scrollIntoView === "function") {
        lastMessageRef.current.scrollIntoView({ block: "end", behavior: "auto" })
        return
      }
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    } catch (e) {
      // swallow
    }
  }, [messages, loading])

  if (loading)
    return (
      <div className="text-center mt-16">
        <LoadingOutlined className="text-6xl text-purple-900" />
      </div>
    )

  // Messages come in sorted newest-first; display oldest-first so newest appears at bottom
  // messages array may contain optimistic items appended newest-first; normalize order
  const ordered = (messages || []).slice().reverse()

  return (
    <div ref={containerRef} className="border-2 border-b-0 border-l-0 p-4 flex flex-col overflow-auto">
      {ordered.map((m, idx) => {
        const isLast = idx === ordered.length - 1
        return (
          <div key={m.messageSid} ref={isLast ? lastMessageRef : null}>
            <MessageBubble message={m} onClick={handleOnClick} />
          </div>
        )
      })}
    </div>
  )
}
