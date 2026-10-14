import type { Category, GameAPI } from '../types';
import { BUILDINGS, ZONES, UPGRADES, PRESTIGE_UPGRADES, BALANCE } from '../data';
import { ACHIEVEMENTS, getStat } from '../achievements';
import { h, btn, setText, setCls, confirmModal, type Panel } from './dom';
import { fmt, fmtInt, fmtPct, fmtDuration } from './format';

const CAT_LABEL: Record<Category, string> = {
  thrill: '🎢 Sensations',
  family: '🎠 Famille',
  water: '🌊 Eau',
  food: '🍟 Restauration',
  shop: '🛍️ Boutiques',
};
const CAT_TIP: Record<Category, string> = {
  thrill: 'Construis plus de manèges à sensations.',
  family: 'Construis plus de manèges familiaux.',
  water: "Construis plus d'attractions aquatiques.",
  food: 'Les visiteurs ont faim : ajoute des stands de nourriture.',
  shop: 'Ajoute des boutiques pour leur donner envie de dépenser.',
};
const CATS = Object.keys(CAT_LABEL) as Category[];


/* ───────────────────────── Parc ───────────────────────── */
export function parkPanel(game: GameAPI): Panel {
  const el = h('section', 'panel');
  let refs: (() => void)[] = [];

  const qtyRow = h('div', 'qty-row');
  const qtyBtns: [string, HTMLButtonElement][] = [];
  for (const q of [1, 10, 100, 'max'] as const) {
    const b = btn('btn qty', q === 'max' ? 'Max' : '×' + q, () => {
      game.setSettings({ buyQty: q });
      update();
    });
    qtyBtns.push([String(q), b]);
    qtyRow.append(b);
  }

  function rebuild(): void {
    refs = [];
    el.replaceChildren(h('div', 'qty-label', 'Quantité d’achat'), qtyRow);
    for (const z of ZONES.slice().sort((a, b) => a.order - b.order)) {
      const sec = h('div', 'zone');
      sec.style.setProperty('--zone', z.color);
      const head = h('div', 'zone-head');
      head.append(h('span', 'zone-emoji', z.emoji), h('h2', null, z.name));
      sec.append(head);
      const unlocked = !!game.state.zones[z.id];
      if (!unlocked) {
        sec.classList.add('zone-locked');
        sec.append(h('p', 'muted', z.description));
        const b = btn('btn btn-primary', '', () => {
          game.unlockZone(z.id);
          update();
        });
        sec.append(b);
        refs.push(() => {
          setText(b, `🔓 Débloquer — 🪙 ${fmt(z.unlockCost)}`);
          const prev = ZONES.find((x) => x.order === z.order - 1);
          b.disabled = game.state.coins < z.unlockCost || (!!prev && !game.state.zones[prev.id]);
        });
        el.append(sec);
        continue;
      }
      const grid = h('div', 'cards');
      for (const bd of BUILDINGS.filter((x) => x.zone === z.id)) {
        const card = h('div', 'card bcard');
        const top = h('div', 'card-top');
        const info = h('div', 'card-info');
        const name = h('div', 'card-name');
        const count = h('span', 'count');
        name.append(h('span', 'emoji', bd.emoji), h('span', null, bd.name), count);
        const inc = h('div', 'muted small');
        const ms = h('div', 'muted small');
        info.append(name, h('div', 'muted small', bd.description), inc, ms);
        top.append(info);
        const buy = btn('btn btn-buy', '', () => {
          game.buyBuilding(bd.id, game.state.settings.buyQty);
          update();
        });
        card.append(top, buy);
        grid.append(card);
        refs.push(() => {
          const c = game.state.buildings[bd.id] ?? 0;
          const qty = game.state.settings.buyQty;
          const aff = game.maxAffordable(bd.id);
          const n = qty === 'max' ? Math.max(1, aff) : qty;
          const cost = game.buildingCost(bd.id, n);
          const ok = qty === 'max' ? aff > 0 : game.state.coins >= cost;
          const locked = !game.isBuildingUnlocked(bd.id);
          const broken = game.derived.brokenBuildings.includes(bd.id);
          setText(count, '×' + c);
          setText(
            inc,
            broken
              ? '🔧 En panne !'
              : `🪙 ${fmt(game.derived.incomeByBuilding[bd.id] ?? 0)}/s · 👥 ${bd.appeal ? '+' + bd.appeal : '0'} · ${CAT_LABEL[bd.category]}`,
          );
          const next = BALANCE.milestones.find((m) => m > c);
          setText(ms, next ? `Prochain palier : ${c}/${next} → ×${BALANCE.milestoneMult} revenu` : 'Tous les paliers atteints ✨');
          setText(buy, locked ? '🔒 Verrouillé' : `Acheter ×${n} — 🪙 ${fmt(cost)}`);
          buy.disabled = locked || !ok;
          setCls(buy, 'affordable', !locked && ok);
          setCls(card, 'broken', broken);
          setCls(card, 'is-locked', locked);
        });
      }
      sec.append(grid);
      el.append(sec);
    }
    update();
  }

  function update(): void {
    const q = String(game.state.settings.buyQty);
    for (const [k, b] of qtyBtns) setCls(b, 'active', k === q);
    for (const r of refs) r();
  }
  return { el, rebuild, update };
}

/* ───────────────────────── Améliorations ───────────────────────── */
export function upgradesPanel(game: GameAPI): Panel {
  const el = h('section', 'panel');
  let refs: (() => void)[] = [];
  function rebuild(): void {
    refs = [];
    el.replaceChildren(h('h2', null, '⚡ Améliorations'));
    const list = UPGRADES.filter((u) => !game.state.upgrades[u.id] && game.isUpgradeVisible(u.id)).sort(
      (a, b) => a.cost - b.cost,
    );
    if (!list.length) el.append(h('p', 'muted', 'Aucune amélioration disponible pour le moment. Construis et débloque !'));
    const grid = h('div', 'cards');
    for (const u of list) {
      const card = h('div', 'card');
      const name = h('div', 'card-name');
      name.append(h('span', 'emoji', u.emoji), h('span', null, u.name));
      const b = btn('btn btn-buy', '', () => {
        game.buyUpgrade(u.id);
        update();
      });
      card.append(name, h('div', 'muted small', u.description), b);
      grid.append(card);
      refs.push(() => {
        setText(b, `Acheter — 🪙 ${fmt(u.cost)}`);
        const ok = game.state.coins >= u.cost;
        b.disabled = !ok;
        setCls(b, 'affordable', ok);
      });
    }
    el.append(grid);
    const owned = UPGRADES.filter((u) => game.state.upgrades[u.id]);
    if (owned.length) {
      const det = h('details', 'owned');
      det.append(h('summary', null, `✅ Achetées (${owned.length})`));
      const ul = h('div', 'chips');
      for (const u of owned) ul.append(h('span', 'chip', `${u.emoji} ${u.name}`, { title: u.description }));
      det.append(ul);
      el.append(det);
    }
    update();
  }
  function update(): void {
    for (const r of refs) r();
  }
  return { el, rebuild, update };
}

/* ───────────────────────── Besoins ───────────────────────── */
export function needsPanel(game: GameAPI): Panel {
  const el = h('section', 'panel');
  const rows = new Map<Category, { fill: HTMLElement; pct: HTMLElement; row: HTMLElement; sub: HTMLElement }>();
  const tip = h('div', 'tip');
  function rebuild(): void {
    rows.clear();
    el.replaceChildren(h('h2', null, '😊 Besoins des visiteurs'));
    el.append(
      h('p', 'muted', 'Les manèges attirent des visiteurs, les stands les servent. Une catégorie mal couverte fait baisser la satisfaction et le revenu.'),
    );
    for (const c of CATS) {
      const row = h('div', 'need');
      const head = h('div', 'need-head');
      const pct = h('span', 'need-pct');
      head.append(h('span', null, CAT_LABEL[c]), pct);
      const bar = h('div', 'bar');
      const fill = h('div', 'bar-fill');
      bar.append(fill);
      const sub = h('div', 'muted small');
      row.append(head, bar, sub);
      el.append(row);
      rows.set(c, { fill, pct, row, sub });
    }
    el.append(tip);
    update();
  }
  function update(): void {
    let worst: Category | null = null;
    let wv = 2;
    for (const c of CATS) {
      const r = rows.get(c)!;
      const n = game.derived.needs[c];
      r.row.hidden = !n.available;
      if (!n.available) continue;
      setText(r.pct, fmtPct(n.coverage));
      r.fill.style.width = Math.round(n.coverage * 100) + '%';
      setCls(r.row, 'good', n.coverage >= 0.9);
      setCls(r.row, 'warn', n.coverage < 0.9 && n.coverage >= 0.6);
      setCls(r.row, 'bad', n.coverage < 0.6);
      setText(r.sub, `Offre ${fmt(n.supply)} / demande ${fmt(n.demand)}`);
      if (n.coverage < wv) {
        wv = n.coverage;
        worst = c;
      }
    }
    if (worst && wv < 0.85) setText(tip, '💡 ' + CAT_TIP[worst]);
    else setText(tip, '👍 Parc bien équilibré : continue d’agrandir !');
  }
  return { el, rebuild, update };
}

/* ───────────────────────── Succès ───────────────────────── */
export function achievementsPanel(game: GameAPI): Panel {
  const el = h('section', 'panel');
  let refs: (() => void)[] = [];
  const head = h('h2');
  function rebuild(): void {
    refs = [];
    el.replaceChildren(head);
    const grid = h('div', 'cards');
    for (const a of ACHIEVEMENTS) {
      const card = h('div', 'card ach');
      const name = h('div', 'card-name');
      const nm = h('span');
      name.append(h('span', 'emoji'), nm);
      const em = name.firstChild as HTMLElement;
      const bar = h('div', 'bar thin');
      const fill = h('div', 'bar-fill');
      bar.append(fill);
      const prog = h('div', 'muted small');
      card.append(name, h('div', 'muted small', a.description), bar, prog);
      grid.append(card);
      refs.push(() => {
        const done = !!game.state.achievements[a.id];
        setCls(card, 'done', done);
        setCls(card, 'is-locked', !done);
        setText(em, done ? a.emoji : '🔒');
        setText(nm, done ? a.name : a.name);
        const cur = getStat(game.state, a.cond.stat, game.derived.incomePerSec);
        const p = Math.min(1, cur / a.cond.atLeast);
        fill.style.width = (done ? 100 : p * 100).toFixed(0) + '%';
        setText(prog, done ? 'Débloqué ✅' : `${fmtInt(Math.min(cur, a.cond.atLeast))} / ${fmtInt(a.cond.atLeast)}`);
      });
    }
    el.append(grid);
    update();
  }
  function update(): void {
    const n = Object.keys(game.state.achievements).length;
    setText(head, `🏆 Succès ${n}/${ACHIEVEMENTS.length}`);
    for (const r of refs) r();
  }
  return { el, rebuild, update };
}

/* ───────────────────────── Prestige ───────────────────────── */
export function prestigePanel(game: GameAPI): Panel {
  const el = h('section', 'panel');
  let refs: (() => void)[] = [];
  const info = h('p', 'big-note');
  const stars = h('div', 'stars-line');
  const go = btn('btn btn-primary btn-big', '', () => {
    confirmModal(
      'Rouvrir le parc ?',
      `Tu repars de zéro (bâtiments, zones, améliorations, pièces) et gagnes ⭐ ${fmt(game.derived.prestigeGain)} étoiles. Les étoiles, succès et bonus permanents sont conservés.`,
      'Rouvrir',
      () => {
        game.prestige();
      },
    );
  });
  function rebuild(): void {
    refs = [];
    el.replaceChildren(h('h2', null, '⭐ Réouverture'));
    el.append(
      h('p', 'muted', `Chaque étoile apporte +${Math.round(BALANCE.starBonus * 100)} % de revenu, et se dépense en bonus permanents.`),
      stars,
      info,
      go,
      h('h3', null, 'Boutique de bonus'),
    );
    const grid = h('div', 'cards');
    for (const p of PRESTIGE_UPGRADES) {
      const card = h('div', 'card');
      const name = h('div', 'card-name');
      const lvl = h('span', 'count');
      name.append(h('span', 'emoji', p.emoji), h('span', null, p.name), lvl);
      const b = btn('btn btn-buy', '', () => {
        game.buyPrestigeUpgrade(p.id);
        update();
      });
      card.append(name, h('div', 'muted small', p.description), b);
      grid.append(card);
      refs.push(() => {
        const l = game.state.prestigeUpgrades[p.id] ?? 0;
        setText(lvl, `Niv. ${l}/${p.maxLevel}`);
        if (l >= p.maxLevel) {
          setText(b, 'Niveau max ✨');
          b.disabled = true;
          setCls(b, 'affordable', false);
        } else {
          const c = game.prestigeUpgradeCost(p.id);
          setText(b, `Acheter — ⭐ ${fmt(c)}`);
          const ok = game.state.stars >= c;
          b.disabled = !ok;
          setCls(b, 'affordable', ok);
        }
      });
    }
    el.append(grid);
    update();
  }
  function update(): void {
    const g = game.derived.prestigeGain;
    setText(stars, `⭐ ${fmt(game.state.stars)} étoiles dépensables · ${fmt(game.state.starsTotal)} à vie`);
    setText(
      info,
      g > 0
        ? `Gain potentiel : ⭐ +${fmt(g)} (revenu actuel ×${game.derived.mult.stars.toFixed(2)})`
        : 'Pas encore assez de gains pour rouvrir. Continue à faire grandir le parc !',
    );
    go.disabled = g <= 0;
    setText(go, g > 0 ? `🎪 Rouvrir le parc (+${fmt(g)} ⭐)` : '🎪 Rouvrir le parc');
    for (const r of refs) r();
  }
  return { el, rebuild, update };
}

/* ───────────────────────── Réglages ───────────────────────── */
export function settingsPanel(game: GameAPI): Panel {
  const el = h('section', 'panel');
  const area = h('textarea', 'save-area', null, { rows: '4', spellcheck: 'false', placeholder: 'Sauvegarde…' });
  const msg = h('div', 'muted small');
  const sel = h('select', 'select');
  sel.append(h('option', null, 'Courte (K, M, B…)', { value: 'short' }), h('option', null, 'Scientifique (1.2e6)', { value: 'sci' }));
  sel.addEventListener('change', () => game.setSettings({ notation: sel.value === 'sci' ? 'sci' : 'short' }));
  const snd = h('input', null, null, { type: 'checkbox' });
  snd.addEventListener('change', () => game.setSettings({ sound: snd.checked }));
  function rebuild(): void {
    sel.value = game.state.settings.notation;
    snd.checked = game.state.settings.sound;
    const l1 = h('label', 'setting');
    l1.append(h('span', null, 'Notation des nombres'), sel);
    const l2 = h('label', 'setting');
    l2.append(h('span', null, 'Son'), snd);
    const row = h('div', 'row');
    row.append(
      btn('btn', '💾 Sauvegarder', () => {
        game.save();
        setText(msg, 'Sauvegardé.');
      }),
      btn('btn', '📤 Exporter', () => {
        area.value = game.exportSave();
        area.select();
        setText(msg, 'Copie ce texte pour le conserver.');
      }),
      btn('btn', '📥 Importer', () => {
        const ok = area.value.trim() !== '' && game.importSave(area.value.trim());
        setText(msg, ok ? 'Import réussi !' : 'Import impossible : sauvegarde invalide.');
      }),
    );
    el.replaceChildren(
      h('h2', null, '⚙️ Réglages'),
      l1,
      l2,
      h('h3', null, 'Sauvegarde'),
      area,
      row,
      msg,
      h('h3', null, 'Zone dangereuse'),
      btn('btn btn-danger', '🗑️ Tout réinitialiser', () =>
        confirmModal('Tout effacer ?', 'Toute ta progression, étoiles comprises, sera définitivement perdue.', 'Effacer', () => game.hardReset()),
      ),
      h('p', 'muted small', `Temps de jeu : ${fmtDuration(game.state.stats.playSeconds)}`),
    );
  }
  return { el, rebuild, update() {} };
}
