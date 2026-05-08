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
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#06C755] via-[#05BA4F] to-[#04A845] px-6 pt-16 pb-14 flex flex-col items-center">
        <button
          onClick={toggleLang}
          className="absolute top-12 right-5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full active:bg-white/30 transition-colors"
        >
          {lang === 'th' ? 'EN' : 'TH'}
        </button>

        <div className="w-[72px] h-[72px] bg-white rounded-[22px] flex items-center justify-center shadow-2xl mb-5">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#06C755"/>
            <path d="M24 8C15.163 8 8 15.163 8 24s7.163 16 16 16 16-7.163 16-16S32.837 8 24 8z" fill="white" opacity="0.2"/>
            <path d="M20 18h-4v12h4V18zM28 18h-4v12h4V18z" fill="white"/>
            <circle cx="24" cy="30" r="2" fill="white"/>
            <path d="M18 14h12v2H18z" fill="white"/>
          </svg>
        </div>
        <h1 className="text-white text-[22px] font-bold tracking-tight">{t.appName}</h1>
        <p className="text-white/70 text-sm mt-1">{t.appSubtitle}</p>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-7 bg-white rounded-t-[28px]"/>
      </div>

      {/* Form */}
      <div className="flex-1 bg-white px-6 pt-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#06C755] focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {t.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#06C755] focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#06C755] to-[#05B84C] text-white rounded-2xl py-3.5 font-semibold text-sm shadow-lg shadow-green-200 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:shadow-none"
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
          </div>
        </form>
        <div className="pb-8"/>
      </div>
    </div>
  )
}
