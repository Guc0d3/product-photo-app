import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import { fetchMediaByMonth, exportMediaToFolder } from '../services/exportService.js'

function getCurrentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function AdminExportPage({ onBack }) {
  const { t } = useLang()

  const [yearMonth,    setYearMonth]    = useState(getCurrentYearMonth())
  const [items,        setItems]        = useState([])
  const [loadingData,  setLoadingData]  = useState(false)
  const [fetchError,   setFetchError]   = useState(null)
  const [exporting,    setExporting]    = useState(false)
  const [exportDone,   setExportDone]   = useState(null)   // number of files exported
  const [exportError,  setExportError]  = useState(null)
  const [progress,     setProgress]     = useState({ done: 0, total: 0 })

  const browserSupported = 'showDirectoryPicker' in window

  // Auto-load stats when month changes
  useEffect(() => {
    if (!yearMonth) return
    setLoadingData(true)
    setFetchError(null)
    setExportDone(null)
    setExportError(null)
    fetchMediaByMonth(yearMonth)
      .then(data => { setItems(data); setLoadingData(false) })
      .catch(err  => { console.error('fetchMediaByMonth:', err); setFetchError(err.message); setLoadingData(false) })
  }, [yearMonth])

  // Compute stats
  const tagged      = items.filter(m => m.productType)
  const untagged    = items.filter(m => !m.productType)
  const typeCounts  = tagged.reduce((acc, m) => {
    acc[m.productType] = (acc[m.productType] || 0) + 1
    return acc
  }, {})

  const handleExport = async () => {
    if (!browserSupported || items.length === 0 || exporting) return
    setExporting(true)
    setExportDone(null)
    setExportError(null)
    setProgress({ done: 0, total: items.length })
    try {
      const dirHandle = await window.showDirectoryPicker()
      await exportMediaToFolder(items, dirHandle, (done, total) => {
        setProgress({ done, total })
      })
      setExportDone(items.length)
    } catch (err) {
      if (err.name === 'AbortError') {
        // user cancelled — do nothing
      } else {
        console.error('exportMediaToFolder:', err)
        setExportError(err.message)
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{t.exportTitle}</h1>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Browser warning */}
        {!browserSupported && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <svg className="flex-shrink-0 mt-0.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p className="text-sm text-amber-700">{t.exportBrowserWarning}</p>
          </div>
        )}

        {/* Month picker card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            {t.exportSelectMonth}
          </label>
          <input
            type="month"
            value={yearMonth}
            onChange={e => setYearMonth(e.target.value)}
            className="w-full bg-[#F5F7FA] rounded-xl px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#06C755] outline-none transition-all"
          />
        </div>

        {/* Stats card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {t.exportStats}
          </p>

          {loadingData ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
              </svg>
              <span className="text-sm">{t.exportLoading}</span>
            </div>
          ) : fetchError ? (
            <p className="text-sm text-red-500 py-4 text-center">{fetchError}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t.exportEmpty}</p>
          ) : (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#F5F7FA] rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{t.exportTotal}</p>
                </div>
                <div className="bg-[#F0FDF4] rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-[#16A34A]">{tagged.length}</p>
                  <p className="text-[11px] text-[#16A34A]/70 mt-0.5">{t.exportTagged}</p>
                </div>
                <div className="bg-orange-50 rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-orange-500">{untagged.length}</p>
                  <p className="text-[11px] text-orange-400 mt-0.5">{t.exportUntagged}</p>
                </div>
              </div>

              {/* Product type breakdown */}
              {Object.keys(typeCounts).length > 0 && (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    {t.exportProductTypes}
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(typeCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 truncate">{type}</span>
                          <span className="text-sm font-semibold text-gray-500 ml-2 flex-shrink-0">{count}</span>
                        </div>
                      ))
                    }
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Export button / progress / done */}
        {exportDone !== null ? (
          <div className="bg-[#F0FDF4] border border-green-200 rounded-2xl px-4 py-5 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-[#06C755] rounded-2xl flex items-center justify-center mb-1">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#16A34A]">{t.exportDone(exportDone)}</p>
          </div>
        ) : exporting ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-5">
            <p className="text-sm text-gray-600 text-center mb-3">
              {t.exportProgress(progress.done, progress.total)}
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#06C755] h-2.5 rounded-full transition-all duration-300"
                style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={!browserSupported || items.length === 0 || loadingData}
            className="w-full bg-gradient-to-r from-[#06C755] to-[#05B84C] text-white rounded-2xl py-4 font-semibold text-sm shadow-lg shadow-green-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            {t.exportButton}
          </button>
        )}

        {/* Export error */}
        {exportError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-600">{exportError}</p>
          </div>
        )}
      </div>
    </div>
  )
}
