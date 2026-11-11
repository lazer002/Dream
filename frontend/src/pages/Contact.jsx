import { useState } from "react"
import toast from "react-hot-toast"
import api from "@/utils/config"
import { errorMessage } from "@/utils/session"

const EMPTY = { name: "", email: "", message: "" }

export default function Contact() {
  const [form, setForm] = useState(EMPTY)
  const [sending, setSending] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (sending) return

    try {
      setSending(true)
      await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      })
      toast.success("Message sent successfully")
      setForm(EMPTY)
    } catch (err) {
      toast.error(errorMessage(err, "Failed to send message"))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Contact</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-md" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full rounded-md" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm mb-1">Message</label>
          <textarea name="message" value={form.message} onChange={handleChange} required className="w-full rounded-md" rows={5} placeholder="How can we help?" />
        </div>
        <button type="submit" disabled={sending} className="px-4 py-2 bg-brand-600 text-white rounded-md">Send</button>
      </form>
    </div>
  )
}
