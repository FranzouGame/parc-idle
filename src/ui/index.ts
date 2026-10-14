import type { GameAPI, ActiveEvent } from '../types';
import { ZONES } from '../data';
import { getEventDef } from '../events';
import { h, btn, setText, setCls, modal, type Panel } from './dom';
import { fmt, fmtDuration, fmtPct, setNotation } from './format';
import { parkPanel, upgradesPanel, needsPanel, achievementsPanel, prestigePanel, settingsPanel } from './panels';

const FOLK = ['🧑', '👧', '👦', '👩', '👨', '🧒', '👴', '🧓', '👩‍🦰', '🧑‍🦱'];
const MAX_FOLK = 25;

export function mountUI(root: HTMLElement, game: GameAPI): void {
  root.replaceChildren();
  root.classList.add('app');

  /* ── en-tête ── */
  const mk = (icon: string, label: string) => {
    const box = h('div', 'stat');
    const v = h('div', 'stat-v');
    box.append(h('div', 'stat-l', icon + ' ' + label), v);
    return { box, v };
  };
  const sCoins = mk('🪙', 'Pièces');
  const sInc = mk('📈', 'Revenu/s');
  const sVis = mk('👥', 'Visiteurs');
  const sStars = mk('⭐', 'Étoiles');
  const sat = h('div', 'stat sat');
  const satL = h('div', 'stat-l');
  const satBar = h('div', 'bar');
  const satFill = h('div', 'bar-fill');
  satBar.append(satFill);
  sat.append(satL, satBar);
  const header = h('header', 'header');
  header.append(h('h1', 'logo', '🎡 Parc Idle'), sCoins.box, sInc.box, sVis.box, sat, sStars.box);

  /* ── objectif, coup de pub ── */
  const goal = h('div', 'goal');
  const goalText = h('span');
  goal.append(h('span', 'goal-ico', '🎯'), goalText);

  const promoFill = h('div', 'promo-fill');
  const promoLabel = h('span', 'promo-label');
  const promoBtn = btn('btn promo', '', () => {
    game.promo();
    updateTick();
  });
  promoBtn.append(promoFill, promoLabel);

  /* ── événements ── */
  const eventsBox = h('div', 'events');
  const eventRefs: { ev: ActiveEvent; update(): void }[] = [];
  function rebuildEvents(): void {
    eventRefs.length = 0;
    const list = game.state.events.filter((e) => !e.resolved);
    eventsBox.replaceChildren();
    for (const ev of list) {
      const def = getEventDef(ev.defId);
      if (!def) continue;
      const card = h('div', 'event ' + (def.positive ? 'pos' : 'neg'));
      const title = h('div', 'event-title');
      const timer = h('span', 'event-timer');
      title.append(h('span', null, `${def.emoji} ${def.name}`), timer);
      card.append(title, h('div', 'small', def.text));
      const refs: (() => void)[] = [() => setText(timer, fmtDuration((ev.endsAt - Date.now()) / 1000))];
      const a = def.action;
      if (a) {
        const row = h('div', 'row');
        const tap = btn('btn btn-primary', '', () => {
          game.tapEvent(ev.uid);
          updateTick();
        });
        row.append(tap);
        refs.push(() => {
          const left = Math.max(0, a.clicksNeeded - ev.progress);
          setText(tap, a.clicksNeeded > 1 ? `${a.label} (${left} clic${left > 1 ? 's' : ''})` : a.label);
        });
        if (a.kind === 'repair') {
          const pay = btn('btn', '', () => {
            game.payRepair(ev.uid);
            updateTick();
          });
          row.append(pay);
          refs.push(() => {
            const c = game.repairCost(ev.uid);
            setText(pay, `Payer 🪙 ${fmt(c)}`);
            pay.disabled = game.state.coins < c;
          });
        }
        card.append(row);
      }
      eventsBox.append(card);
      eventRefs.push({ ev, update: () => refs.forEach((r) => r()) });
    }
    eventsBox.hidden = eventRefs.length === 0;
    eventRefs.forEach((r) => r.update());
  }

  /* ── scène de visiteurs ── */
  const scene = h('div', 'scene', null, { 'aria-hidden': 'true' });
  const skyline = h('div', 'skyline');
  const crowd = h('div', 'crowd');
  scene.append(skyline, crowd);
  function rebuildSkyline(): void {
    skyline.replaceChildren(
      ...ZONES.filter((z) => game.state.zones[z.id]).map((z) => h('span', null, z.emoji)),
    );
  }
  function setCrowd(n: number): void {
    while (crowd.childElementCount < n) {
      const s = h('span', 'folk', FOLK[Math.floor(Math.random() * FOLK.length)]);
      s.style.top = 25 + Math.random() * 60 + '%';
      s.style.animationDuration = 12 + Math.random() * 18 + 's';
      s.style.animationDelay = -Math.random() * 20 + 's';
      crowd.append(s);
    }
    while (crowd.childElementCount > n) crowd.lastElementChild!.remove();
  }

  /* ── panneaux et onglets ── */
  const tabs: { id: string; label: string; icon: string; panel: Panel }[] = [
    { id: 'park', label: 'Parc', icon: '🎡', panel: parkPanel(game) },
    { id: 'up', label: 'Idées', icon: '⚡', panel: upgradesPanel(game) },
    { id: 'needs', label: 'Besoins', icon: '😊', panel: needsPanel(game) },
    { id: 'ach', label: 'Succès', icon: '🏆', panel: achievementsPanel(game) },
    { id: 'pres', label: 'Prestige', icon: '⭐', panel: prestigePanel(game) },
    { id: 'set', label: 'Réglages', icon: '⚙️', panel: settingsPanel(game) },
  ];
  let active = 'park';
  const tabBar = h('nav', 'tabs', null, { role: 'tablist' });
  const content = h('main', 'content');
  const tabBtns = new Map<string, HTMLButtonElement>();
  function show(id: string): void {
    active = id;
    for (const t of tabs) {
      t.panel.el.hidden = t.id !== id;
      setCls(tabBtns.get(t.id)!, 'active', t.id === id);
    }
    tabs.find((t) => t.id === id)!.panel.update();
  }
  for (const t of tabs) {
    const b = btn('tab', '', () => show(t.id));
    b.append(h('span', 'tab-ico', t.icon), h('span', 'tab-lbl', t.label));
    tabBtns.set(t.id, b);
    tabBar.append(b);
    content.append(t.panel.el);
  }

  /* ── fx : toasts, bursts ── */
  const toasts = h('div', 'toasts', null, { 'aria-live': 'polite' });
  const fx = h('div', 'fx', null, { 'aria-hidden': 'true' });
  function toast(text: string, kind: string): void {
    const t = h('div', 'toast ' + kind, text);
    toasts.append(t);
    while (toasts.childElementCount > 4) toasts.firstElementChild!.remove();
    setTimeout(() => t.remove(), 4000);
  }

  /* ── assemblage ── */
  const side = h('aside', 'side');
  side.append(goal, promoBtn, eventsBox, scene);
  const body = h('div', 'body');
  body.append(side, h('div', 'main-col'));
  body.lastElementChild!.append(tabBar, content);
  root.append(header, body, toasts, fx);

  /* ── mises à jour ── */
  function updateTick(): void {
    const d = game.derived;
    const s = game.state;
    setNotation(s.settings.notation);
    setText(sCoins.v, fmt(s.coins));
    setText(sInc.v, fmt(d.incomePerSec));
    setText(sVis.v, fmt(d.visitors));
    setText(sStars.v, fmt(s.stars));
    const face = d.satisfaction >= 0.8 ? '😄' : d.satisfaction >= 0.5 ? '🙂' : d.satisfaction >= 0.3 ? '😐' : '😠';
    setText(satL, `${face} Satisfaction ${fmtPct(d.satisfaction)}`);
    satFill.style.width = Math.round(d.satisfaction * 100) + '%';
    setCls(sat, 'good', d.satisfaction >= 0.7);
    setCls(sat, 'warn', d.satisfaction < 0.7 && d.satisfaction >= 0.4);
    setCls(sat, 'bad', d.satisfaction < 0.4);
    setText(goalText, d.nextGoal);

    const rem = (s.promoReadyAt - Date.now()) / 1000;
    const ready = rem <= 0;
    promoBtn.disabled = !ready;
    setCls(promoBtn, 'ready', ready);
    setText(promoLabel, ready ? `📣 Coup de pub ! +🪙 ${fmt(d.promoReward)}` : `📣 Coup de pub dans ${fmtDuration(Math.ceil(rem))}`);
    promoFill.style.width = (ready ? 100 : Math.max(0, 1 - rem / d.promoCooldownSec) * 100).toFixed(0) + '%';

    eventRefs.forEach((r) => r.update());
    setCrowd(d.visitors <= 0 ? 0 : Math.min(MAX_FOLK, 1 + Math.floor(Math.pow(d.visitors, 0.6))));
    tabs.find((t) => t.id === active)!.panel.update();
  }

  let pending = false;
  function rebuildAll(): void {
    pending = false;
    setNotation(game.state.settings.notation);
    rebuildEvents();
    rebuildSkyline();
    for (const t of tabs) t.panel.rebuild();
    updateTick();
  }
  function scheduleRebuild(): void {
    if (pending) return;
    pending = true;
    requestAnimationFrame(rebuildAll);
  }

  game.on('tick', updateTick);
  game.on('change', scheduleRebuild);
  game.on('toast', (t) => toast(t.text, t.kind));
  game.on('eventStart', (e) => {
    rebuildEvents();
  });
  game.on('eventEnd', rebuildEvents);
  game.on('burst', (b) => {
    const el = h('div', 'burst', `+${fmt(b.coins)} 🪙 ${b.label}`);
    el.style.left = 30 + Math.random() * 40 + '%';
    fx.append(el);
    setTimeout(() => el.remove(), 1600);
  });
  game.on('offline', (r) => {
    modal(
      '🎉 Bon retour !',
      [
        h('p', 'modal-text', `Tu étais parti ${fmtDuration(r.seconds)}.`),
        h('p', 'modal-text', r.cappedSeconds < r.seconds ? `Le parc a travaillé pendant ${fmtDuration(r.cappedSeconds)} (plafond).` : 'Le parc a tourné pendant ton absence.'),
        h('p', 'big-note', `+🪙 ${fmt(r.coins)}`),
      ],
      [{ label: 'Super !', cls: 'btn btn-primary' }],
    );
  });

  rebuildAll();
  show('park');
}
