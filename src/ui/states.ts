export type PanelState = 'idle' | 'loading' | 'error' | 'empty';

function setHidden(el: HTMLElement | null, hidden: boolean): void {
  if (!el) return;
  el.hidden = hidden;
  if (hidden) el.setAttribute('hidden', '');
  else el.removeAttribute('hidden');
}

export function setPanelState(
  root: HTMLElement,
  state: PanelState,
  message?: string,
): void {
  const loading = root.querySelector<HTMLElement>('[data-state="loading"]');
  const error = root.querySelector<HTMLElement>('[data-state="error"]');
  const empty = root.querySelector<HTMLElement>('[data-state="empty"]');
  const content = root.querySelector<HTMLElement>('[data-state="content"]');

  setHidden(loading, state !== 'loading');
  setHidden(error, state !== 'error');
  setHidden(empty, state !== 'empty');
  setHidden(content, state !== 'idle');

  if (error && message) {
    const text = error.querySelector('[data-error-message]');
    if (text) text.textContent = message;
  }
}
