import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations.js'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState('th')
  const t = translations[lang]
  const toggleLang = () => setLang(l => l === 'th' ? 'en' : 'th')
  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
