import { useState, useRef, useCallback } from "react"
import { Loading3QuartersOutlined, SendOutlined, PaperClipOutlined, CloseCircleOutlined } from "@ant-design/icons"
import { allPhones } from "../InboxPage/Selector"
import { uploadMediaForMms, sendTwilioMms } from "../../js/sendTwilioMessage"
import { isTwilioFunctionsEnabled } from "../../js/siteConfig"

// Maximum file size (1.5MB for MMS)
const MAX_FILE_SIZE = 1.5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

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
  const [attachment, setAttachment] = useState(null) // { file: File, preview: string }
  const [attachmentError, setAttachmentError] = useState("")
  const fileInputRef = useRef(null)

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    setAttachmentError("")

    if (!file) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachmentError("Only JPEG, PNG, GIF, and WebP images are supported")
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setAttachmentError(`Image too large. Maximum size is 1.5MB (yours is ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      return
    }

    // Create preview URL
    const preview = URL.createObjectURL(file)
    setAttachment({ file, preview })
  }, [])

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ""
  }

  // Handle paste event for clipboard images
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          handleFileSelect(file)
        }
        break
      }
    }
  }, [handleFileSelect])

  // Remove attachment
  const removeAttachment = () => {
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview)
    }
    setAttachment(null)
    setAttachmentError("")
  }

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleSend = async () => {
    if (!selectedContact || !phoneNumber || sending) return
    if (!text && !attachment) return // Need either text or attachment

    const hasMedia = !!attachment
    const tempSid = `temp-${Date.now()}`
    const tempMsg = {
      messageSid: tempSid,
      direction: "sent",
      from: phoneNumber,
      to: selectedContact,
      status: "queued",
      body: text || (hasMedia ? "📷 Image" : ""),
      media: hasMedia ? 1 : 0,
      hasMedia: hasMedia,
      date: new Date().toISOString(),
      _optimistic: true,
    }

    // optimistic append
    onOptimisticSend && onOptimisticSend(tempMsg)
    setSending(true)

    try {
      let sid

      if (hasMedia) {
        // Upload image first, then send MMS
        const { url } = await uploadMediaForMms(attachment.file)
        sid = await sendTwilioMms(authentication, selectedContact, phoneNumber, text, url)
      } else {
        // Send regular SMS
        sid = await sendFunc(authentication, selectedContact, phoneNumber, text)
      }

      const realMsg = { ...tempMsg, messageSid: sid, _optimistic: false, status: "sent" }
      onReplaceTempMessage && onReplaceTempMessage(tempSid, realMsg)
      setText("")
      removeAttachment()
      return { ok: true, sid }
    } catch (e) {
      console.error("Send failed:", e)
      // mark failed by replacing with status
      const failedMsg = { ...tempMsg, _optimistic: false, status: "failed" }
      onReplaceTempMessage && onReplaceTempMessage(tempSid, failedMsg)
      setAttachmentError(e.message || "Failed to send message")
      return { ok: false, error: e }
    } finally {
      setSending(false)
    }
  }

  const canSend = selectedContact && 
    phoneNumber !== allPhones && 
    !sending && 
    (text.length > 0 || attachment)

  const isDisabled = !selectedContact || phoneNumber === allPhones || sending

  return (
    <div className="mt-2 pt-2 border-t">
      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-2 relative inline-block">
          <img 
            src={attachment.preview} 
            alt="Attachment preview" 
            className="max-h-24 rounded border border-gray-300"
          />
          <button
            onClick={removeAttachment}
            className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700"
            title="Remove attachment"
          >
            <CloseCircleOutlined style={{ fontSize: '20px' }} />
          </button>
        </div>
      )}

      {/* Error message */}
      {attachmentError && (
        <div className="mb-2 text-red-500 text-xs">{attachmentError}</div>
      )}

      {/* Input area */}
      <div className="h-14 flex items-stretch gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Attachment button */}
        {isTwilioFunctionsEnabled() && (
          <button
            onClick={openFilePicker}
            disabled={isDisabled}
            className="w-10 flex items-center justify-center rounded text-gray-500 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach image (or paste from clipboard)"
          >
            <PaperClipOutlined style={{ fontSize: '20px' }} />
          </button>
        )}

        {/* Text input */}
        <textarea
          className="flex-1 p-2 rounded focus:outline-none focus:border-blue-400"
          placeholder={selectedContact ? `Reply to ${selectedContact}${isTwilioFunctionsEnabled() ? ' (paste image to attach)' : ''}` : "Select a conversation to reply"}
          value={text}
          onChange={e => setText(e.target.value)}
          onPaste={handlePaste}
          rows={2}
          disabled={isDisabled}
          maxLength={500}
        />

        {/* Send button */}
        <button
          className="ml-2 w-14 h-full flex items-center justify-center rounded-[16px] composer-send"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
        >
          {sending ? <Loading3QuartersOutlined spin /> : <SendOutlined />}
        </button>
      </div>
    </div>
  )
}

export default ConversationComposer
