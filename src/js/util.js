import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
dayjs.extend(relativeTime)

/**
 *
 * @param {Date | null | undefined} date
 * @returns {string | null} Time from now
 */
export const fromNow = date => {
  if (!date) return null
  return dayjs(date).fromNow()
}

export const copyToClipboard = s =>
  navigator.clipboard
    .writeText(s)
    .then(() => console.log("Text copied", s))
    .catch(() => console.log("Unable to copy to clipboard"))

// Starts with plus followed by at least 11 digits
export const phonePattern = "^\\+\\d{11,}$"

export const normalizePhoneNumber = rawValue => {
  if (!rawValue && rawValue !== 0) return null

  const digits = String(rawValue).replace(/\D/g, "")
  if (!digits || digits.length < 11) return null

  return `+${digits}`
}

export const parseRecipientList = rawValue => {
  if (Array.isArray(rawValue)) {
    return rawValue.map(normalizePhoneNumber).filter(Boolean)
  }

  if (!rawValue) return []

  return String(rawValue)
    .split(/[\n,;]+/)
    .map(value => normalizePhoneNumber(value))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
}
