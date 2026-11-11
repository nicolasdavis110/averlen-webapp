// Signs the web app out after a period with no use, including when a closed
// tab is reopened later. Sign-in still survives a browser restart within that
// window; only the time of the last activity is stored, never financial data.
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ACTIVITY_KEY = 'averlen.web.lastActivity';
const WRITE_EVERY_MS = 30 * 1000;

export function createIdleGuard({
  storage, now = () => Date.now(), timeoutMs = IDLE_TIMEOUT_MS, onExpire,
}) {
  let lastWrite = 0;
  let memory = null; // used when storage is blocked (private mode, etc.)
  const read = () => {
    try { const value = Number(storage?.getItem(ACTIVITY_KEY)); return Number.isFinite(value) && value > 0 ? value : memory; }
    catch { return memory; }
  };
  const write = value => {
    memory = value;
    try { storage?.setItem(ACTIVITY_KEY, String(value)); } catch { /* memory only */ }
  };
  return {
    // Is the stored session older than the limit? A missing timestamp counts
    // as fresh: there is nothing to expire yet.
    expired() {
      const last = read();
      return last != null && now() - last > timeoutMs;
    },
    touch(force = false) {
      const at = now();
      if (!force && at - lastWrite < WRITE_EVERY_MS) return;
      lastWrite = at; write(at);
    },
    // Called on a timer and when the tab becomes visible again.
    check() {
      if (this.expired()) { write(now()); lastWrite = now(); onExpire(); return true; }
      return false;
    },
  };
}
