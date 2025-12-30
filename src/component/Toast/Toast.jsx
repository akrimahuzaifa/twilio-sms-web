import { useEffect } from "react"

export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => onClose && onClose(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div className="fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-2 rounded shadow">
      {toast.message}
    </div>
  )
}

export default Toast
