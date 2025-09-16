export default function Contact() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Contact</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full rounded-md" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" className="w-full rounded-md" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm mb-1">Message</label>
          <textarea className="w-full rounded-md" rows={5} placeholder="How can we help?" />
        </div>
        <button className="px-4 py-2 bg-brand-600 text-white rounded-md">Send</button>
      </form>
    </div>
  )
}


