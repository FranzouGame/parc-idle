/** Helpers DOM : tout passe par textContent, jamais innerHTML. */

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string | null,
  text?: string | null,
  attrs?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

export function btn(cls: string, text: string, onClick: () => void): HTMLButtonElement {
  const b = h('button', cls, text, { type: 'button' });
  b.addEventListener('click', onClick);
  return b;
}

/** Met à jour un texte seulement s'il change (évite le travail DOM inutile à 10 Hz). */
export function setText(el: Node, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

export function setCls(el: Element, cls: string, on: boolean): void {
  if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}

export interface Panel {
  el: HTMLElement;
  /** Reconstruit la structure (événement 'change'). */
  rebuild(): void;
  /** Rafraîchit chiffres/classes (événement 'tick'). */
  update(): void;
}

export function modal(
  title: string,
  body: Node[],
  buttons: { label: string; cls?: string; onClick?: () => void }[],
): () => void {
  const back = h('div', 'modal-back');
  const box = h('div', 'modal', null, { role: 'dialog', 'aria-modal': 'true' });
  const close = () => back.remove();
  box.append(h('h2', 'modal-title', title), ...body);
  const row = h('div', 'modal-btns');
  for (const b of buttons) {
    row.append(
      btn(b.cls ?? 'btn', b.label, () => {
        close();
        b.onClick?.();
      }),
    );
  }
  box.append(row);
  back.append(box);
  back.addEventListener('click', (e) => {
    if (e.target === back) close();
  });
  document.body.append(back);
  return close;
}

export function confirmModal(title: string, text: string, okLabel: string, onOk: () => void): void {
  modal(title, [h('p', 'modal-text', text)], [
    { label: 'Annuler', cls: 'btn' },
    { label: okLabel, cls: 'btn btn-danger', onClick: onOk },
  ]);
}
