// Shop: what a player owns, wears and has in the room, buying, feeding and how hungry the character is.
// The catalog: FOODS and ITEM_SLOTS in constants.js, ITEMS filled by the slot files (items/wear/, items/room/), drawings in
// food.js and the slot files.

const Shop = (() => {
  const item = id => ITEMS.find(it => it.id === id) || null;
  const food = id => FOODS.find(f => f.id === id) || null;
  const slot = id => ITEM_SLOTS.find(s => s.id === id) || null;
  const charOf = p => CHARACTERS.find(c => c.id === p.character) || CHARACTERS[0];
  const free = it => !it.price && !it.gems;

  // Fullness now: it was p.fullness at p.fedAt and drops FULL_MAX every HUNGER_HOURS.
  function fullness(p) {
    const hours = Math.max(0, Date.now() - p.fedAt) / 3600000;
    return clamp(p.fullness - hours * FULL_MAX / HUNGER_HOURS, 0, FULL_MAX);
  }

  function setFullness(p, v) {
    p.fullness = clamp(v, 0, FULL_MAX);
    p.fedAt = Date.now();
  }

  const owns = (p, it) => free(it) || p.owned.includes(it.id);
  const canPay = (p, x) => (x.gems ? p.gems >= x.gems : p.coins >= (x.price || 0));
  const costText = x => (x.gems ? `💎 ${x.gems}` : `🪙 ${x.price}`);
  const missing = (p, x) => (x.gems ? x.gems - p.gems : x.price - p.coins);

  function pay(p, x) {
    if (x.gems) p.gems -= x.gems;
    else p.coins -= x.price || 0;
  }

  // Buy a wear / room item and put it on / in the room. False if owned already or not enough money.
  function buy(p, it) {
    if (owns(p, it) || !canPay(p, it)) return false;
    pay(p, it);
    p.owned.push(it.id);
    p.equip[it.slot] = it.id;
    Store.save();
    return true;
  }

  // Wear / place an owned item, or take the slot's item off (back to the slot's default, if it has one).
  function use(p, it) {
    if (!owns(p, it)) return;
    p.equip[it.slot] = it.id;
    Store.save();
  }

  function takeOff(p, slotId) {
    const def = slot(slotId).def;
    if (def) p.equip[slotId] = def;
    else delete p.equip[slotId];
    Store.save();
  }

  // How the character takes a food: love (favourite or a treat; the dragon breathes fire on chili),
  // sour / spicy / cold for those who don't love it (cold only if they dislike it), bleh (disliked), yum.
  function taste(p, f) {
    const c = charOf(p);
    if (c.loves.includes(f.id)) return f.taste === 'spicy' ? 'fire' : 'love';
    if (f.treat) return f.gems ? 'sparkle' : 'love';
    if (f.taste === 'sour' || f.taste === 'spicy') return f.taste;
    if (c.dislikes.includes(f.id)) return f.taste === 'cold' ? 'cold' : 'bleh';
    return 'yum';
  }

  const isFull = p => fullness(p) >= FULL_REFUSE;

  // Pay for a food and fill the tummy (a favourite fills FOOD_LOVE_FILL times more). Returns the reaction or null.
  function feed(p, f) {
    if (isFull(p) || !canPay(p, f)) return null;
    pay(p, f);
    const r = taste(p, f);
    setFullness(p, fullness(p) + f.fill * (charOf(p).loves.includes(f.id) ? FOOD_LOVE_FILL : 1));
    Store.save();
    return r;
  }

  // Coins of a lesson with the player's settings and no mistakes (to say "about N lessons").
  const lessonCoins = p => Math.max(1, Tasks.lessonCoins(p.settings, p.settings.lessonLength));
  const lessonsFor = (p, coins) => Math.max(1, Math.ceil(coins / lessonCoins(p)));

  // Items not owned yet that the player can pay for now (for the "!" on the shop's slot tabs).
  const affordable = p => ITEMS.filter(it => !owns(p, it) && canPay(p, it));

  // The priciest item that this much money buys but `before` didn't (the "Now you can buy" hint after a lesson).
  function newlyAffordable(p, coinsBefore, gemsBefore) {
    const was = { coins: coinsBefore, gems: gemsBefore };
    const fresh = affordable(p).filter(it => !canPay(was, it));
    fresh.sort((a, b) => (a.gems ? 1e6 * a.gems : a.price) - (b.gems ? 1e6 * b.gems : b.price));
    return fresh.length ? fresh[fresh.length - 1] : null;
  }

  // Shop thumbnail SVG of a food or an item.
  function thumb(p, x, kind) {
    if (kind === 'food') return `<svg class="thumb" viewBox="${FOOD_BOX}" aria-hidden="true">${FOOD_ART[x.id]()}</svg>`;
    if (slot(x.slot).kind === 'wear') {
      const a = WEAR_ART[x.id];
      return `<svg class="thumb" viewBox="${a.box || WEAR_BOX[x.slot]}" aria-hidden="true">${a.draw()}</svg>`;
    }
    const a = ROOM_ART[x.id];
    return `<svg class="thumb" viewBox="${a.box || ROOM_BOX[x.slot]}" aria-hidden="true">${a.draw({ character: p.character, equip: p.equip })}</svg>`;
  }

  return {
    item, food, slot, charOf, free, fullness, setFullness, owns, canPay, costText, missing, buy, use, takeOff,
    taste, isFull, feed, lessonCoins, lessonsFor, affordable, newlyAffordable, thumb,
  };
})();
