import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import { formatTime } from '../utils/dateUtils.js'
import { seedProducts } from '../services/productService.js'

export default function ProductTypeModal({ photo, productTypes, isAdmin, onClose, onSave }) {
  const { t } = useLang()
  const [selected, setSelected] = useState(photo.productType || '')
  const [search,   setSearch]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [seeding,  setSeeding]  = useState(false)

  const filtered = productTypes.filter(pt =>
    pt.toLowerCase().includes(search.toLowerCase())
  )

  const handleSeed = async () => {
    setSeeding(true)
    try { await seedProducts() } catch (e) { console.error('seed:', e) }
    setSeeding(false)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    const ok = await onSave(selected)
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl flex flex-col shadow-2xl" style={{ maxHeight: '75%' }} onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-2 flex flex-col items-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full"/>
        </div>

        {/* Header thumbnail */}
        <div className="px-5 pb-3 flex items-center gap-3">
          {photo.url ? (
            <img src={photo.url} alt="media" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-sm"/>
          ) : (
            <div className="w-12 h-12 rounded-2xl flex-shrink-0 shadow-sm bg-gray-100 flex items-center justify-center">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1.5">
                <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{t.selectProductType}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.takenAt(formatTime(photo.takenAt))}</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.searchProductType}
              className="w-full bg-[#F5F7FA] rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {filtered.map(type => (
            <button key={type} onClick={() => setSelected(type)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-1 text-sm font-medium transition-colors ${
                selected === type ? 'bg-[#F0FDF4] text-[#16A34A]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{type}</span>
              {selected === type && (
                <div className="w-5 h-5 bg-[#06C755] rounded-full flex items-center justify-center">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && search === '' && productTypes.length === 0 && isAdmin && (
            <div className="flex flex-col items-center py-10 gap-3">
              <p className="text-sm text-gray-400 text-center">{t.noProductTypes ?? 'ยังไม่มีชนิดสินค้า'}</p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 bg-[#06C755] text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-all disabled:opacity-60"
              >
                {seeding ? (
                  <><LoadingSpinner className="w-4 h-4" stroke="white"/>{t.seeding ?? 'กำลังเพิ่มข้อมูล...'}</>
                ) : (
                  <>{t.seedProducts ?? 'เพิ่มชนิดสินค้าเริ่มต้น'}</>
                )}
              </button>
            </div>
          )}
          {filtered.length === 0 && (search !== '' || productTypes.length > 0) && (
            <p className="text-center text-gray-400 text-sm py-8">{t.noProductTypeFound}</p>
          )}
        </div>

        {/* Footer button */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="w-full bg-gradient-to-r from-[#06C755] to-[#05B84C] text-white rounded-2xl py-3.5 font-semibold text-sm disabled:opacity-40 shadow-lg shadow-green-200 disabled:shadow-none active:scale-[0.98] transition-all"
          >
            {saving
              ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
              : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
