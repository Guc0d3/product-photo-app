import { useState, useEffect } from 'react'
import { subscribeProducts } from '../services/productService.js'

/**
 * Returns the live list of active product type names from Firestore.
 * Falls back to an empty array while loading.
 */
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (data) => { setProducts(data.map(p => p.name)); setLoading(false) },
      ()     => setLoading(false),
    )
    return () => unsubscribe()
  }, [])

  return { products, loading }
}
