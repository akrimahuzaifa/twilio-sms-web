import { useParams } from "react-router-dom"
import { Layout } from "../Layout/Layout"
import { useEffect, useState } from "react"
import { getTwilioMessages, sortByDate, MAX_PAGE_SIZE } from "../../js/getTwilioMessages"
import { MessageRows } from "../MessageRows/MessageRows"

export const ConversationPage = () => {
  const { from, to } = useParams()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ft = getTwilioMessages(from, to, MAX_PAGE_SIZE)
    const tf = getTwilioMessages(to, from, MAX_PAGE_SIZE)
    Promise.all([ft, tf])
      .then(msg => setMessages(msg.flat().sort(sortByDate)))
      .then(() => setLoading(false))
  }, [from, to])

  return (
    <Layout>
      <h3>Conversation</h3>
      <p className="my-4">
        Messages exchanged between <span className="font-semibold">{from}</span> and{" "}
        <span className="font-semibold">{to}</span>
      </p>
      <MessageRows messages={messages} loading={loading} conversationKey={`${from}-${to}`} />
    </Layout>
  )
}
