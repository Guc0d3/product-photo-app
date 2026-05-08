import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'

export default function LoginPage({ onLogin }) {
  const { t, lang, toggleLang } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 800)
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-[#06C755] px-6 pt-16 pb-10 flex flex-col items-center relative">
        {/* Lang toggle */}
        <button
          onClick={toggleLang}
          className="absolute top-12 right-4 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full active:bg-white/30"
        >
          {lang === 'th' ? 'EN' : 'TH'}
        </button>

        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#06C755"/>
            <path d="M24 8C15.163 8 8 15.163 8 24s7.163 16 16 16 16-7.163 16-16S32.837 8 24 8z" fill="white" opacity="0.3"/>
            <path d="M20 18h-4v12h4V18zM28 18h-4v12h4V18z" fill="white"/>
            <circle cx="24" cy="30" r="2" fill="white"/>
            <path d="M18 14h12v2H18z" fill="white"/>
          </svg>
        </div>
        <h1 className="text-white text-2xl font-bold">{t.appName}</h1>
        <p className="text-green-100 text-sm mt-1">{t.appSubtitle}</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] focus:border-transparent bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] focus:border-transparent bg-gray-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#06C755] text-white rounded-xl py-3 font-semibold text-sm mt-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30 70"/>
                </svg>
                {t.loggingIn}
              </span>
            ) : t.login}
          </button>
        </form>
        <div className="pb-6"/>
      </div>
    </div>
  )
}
