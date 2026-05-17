const DELAYS = [300, 900, 2700]

export async function withRetry(fn) {
  let lastErr
  for (let i = 0; i <= DELAYS.length; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < DELAYS.length) await new Promise(r => setTimeout(r, DELAYS[i]))
    }
  }
  throw lastErr
}
