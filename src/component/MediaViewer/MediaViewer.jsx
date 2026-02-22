import "./MediaViewer.css"
import { useEffect, useState } from "react"
import { getTwilioMedia } from "../../js/getTwilioMedia"
import { LoadingOutlined, FileImageOutlined, WarningOutlined } from "@ant-design/icons"
import { isEmpty } from "lodash"
import { useIsMounted } from "../../js/useIsMounted"
import { isTwilioFunctionsEnabled } from "../../js/siteConfig"

const Loading = () => (
  <div className="message-viewer-loading">
    <LoadingOutlined className="text-primary" />
    <span className="message-viewer-loading-text">Loading media...</span>
  </div>
)

const MediaError = ({ thumbnail }) => (
  <div className={`media-error ${thumbnail ? "thumbnail" : ""}`}>
    <WarningOutlined className="text-orange-500" />
    <span className="media-error-text">
      {isTwilioFunctionsEnabled() ? "Failed to load" : "Configure Functions to view MMS"}
    </span>
  </div>
)

const MediaPlaceholder = ({ thumbnail, onClick }) => (
  <div
    className={`media-placeholder ${thumbnail ? "thumbnail" : ""}`}
    onClick={onClick}
    title="Click to view media (requires Twilio Functions)"
  >
    <FileImageOutlined className="text-gray-400 text-2xl" />
    <span className="media-placeholder-text">Media attachment</span>
  </div>
)

const MediaImage = ({ src, thumbnail, onError }) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError && onError()
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  if (hasError) {
    return <MediaError thumbnail={thumbnail} />
  }

  return (
    <div className={`media-image-container ${thumbnail ? "thumbnail" : ""}`}>
      {isLoading && (
        <div className="media-image-loading">
          <LoadingOutlined className="text-primary" />
        </div>
      )}
      <img
        className={`message-viewer-content ${thumbnail ? "thumbnail" : ""} ${isLoading ? "loading" : ""}`}
        src={src}
        alt="Attached media file (MMS)"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  )
}

export const MediaViewer = ({ messageSid = "", thumbnail = false }) => {
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState([])
  const [error, setError] = useState(null)
  const isMounted = useIsMounted()

  useEffect(() => {
    if (!messageSid) {
      setLoading(false)
      return
    }

    console.log("MediaViewer useEffect: Fetching media for", messageSid)

    getTwilioMedia(messageSid)
      .then(m => {
        console.log("MediaViewer useEffect: Got media", m, "isMounted:", isMounted())
        if (isMounted()) {
          setMedia(m)
        }
      })
      .catch(err => {
        console.error("MediaViewer: Failed to fetch media", err)
        if (isMounted()) {
          setError(err)
        }
      })
      .finally(() => {
        console.log("MediaViewer useEffect: Setting loading to false, isMounted:", isMounted())
        if (isMounted()) {
          setLoading(false)
        }
      })
  }, [isMounted, messageSid])

  if (loading) {
    console.log("MediaViewer: Still loading for", messageSid)
    return <Loading />
  }

  console.log("MediaViewer: Rendering", { messageSid, media, error, isFunctionsEnabled: isTwilioFunctionsEnabled() })

  if (error) {
    return <MediaError thumbnail={thumbnail} />
  }

  if (isEmpty(media)) {
    console.log("MediaViewer: media is empty for", messageSid)
    return null
  }

  // If Twilio Functions is not configured, show placeholder
  if (!isTwilioFunctionsEnabled() && media.length > 0) {
    return (
      <div className="media-viewer-warning">
        <MediaPlaceholder thumbnail={thumbnail} />
        {!thumbnail && (
          <p className="text-xs text-gray-500 mt-2">
            To view MMS media, configure Twilio Functions. See <code>server/twilio-function/README.md</code>
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      {media.map((m, index) => (
        <MediaImage key={`${messageSid}-${index}`} src={m} thumbnail={thumbnail} />
      ))}
    </>
  )
}
