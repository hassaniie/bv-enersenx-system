export {}

// A minimal browser for the data layer: localStorage, location and events.
const store = new Map<string, string>()
const memoryStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
}
Object.assign(globalThis, {
  window: { localStorage: memoryStorage, location: { search: "" }, addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout },
})
