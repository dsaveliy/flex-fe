// плагин Figma: Flex UI Generator v13
// экран Crypto — без изменений (зафиксировано).
// экран Home: круглые кнопки действий увеличены и лучше сбалансированы с виджетом баланса.
// экран Cards: все карты (главная + мини) теперь строго держат реальное соотношение сторон банковской карты
// 1.586:1 (85.6×53.98мм, ISO/IEC 7810) на всех трёх breakpoint'ах — это и убирает "непропорциональность".
// запуск: Figma Desktop → значок Figma → Plugins → Development → New Plugin → без Custom UI →
// заменить manifest.json и code.js → запустить.

const CARD_RATIO = 1.586; // по ISO/IEC 7810 ID-1 — реальное соотношение сторон банковской карты

const COLORS = {
  bgTop: { r: 0.95, g: 0.98, b: 0.97 },
  bgBottom: { r: 0.98, g: 1, b: 0.99 },
  blobMint: { r: 0.66, g: 0.85, b: 0.78 },
  blobBlue: { r: 0.75, g: 0.83, b: 0.92 },
  haloMint: { r: 0.6, g: 0.88, b: 0.78 },
  textPrimary: { r: 0.08, g: 0.12, b: 0.16 },
  textMuted: { r: 0.45, g: 0.5, b: 0.52 },
  accent: { r: 0.14, g: 0.55, b: 0.4 },
  accentSoft: { r: 0.6, g: 0.8, b: 0.72 },
  red: { r: 0.82, g: 0.28, b: 0.3 },
  leafDark: { r: 0.16, g: 0.5, b: 0.38 },
  leafLight: { r: 0.55, g: 0.82, b: 0.68 },
  inactive: { r: 0.62, g: 0.66, b: 0.64 },
  white: { r: 1, g: 1, b: 1 },
  shadow: { r: 0.05, g: 0.15, b: 0.12 },
  cardMintA: { r: 0.72, g: 0.9, b: 0.85 },
  cardMintB: { r: 0.65, g: 0.82, b: 0.92 },
  cardDarkA: { r: 0.24, g: 0.26, b: 0.3 },
  cardDarkB: { r: 0.14, g: 0.15, b: 0.18 },
  cardGreyA: { r: 0.86, g: 0.88, b: 0.9 },
  cardGreyB: { r: 0.74, g: 0.78, b: 0.82 },
  cardPurpleA: { r: 0.78, g: 0.72, b: 0.94 },
  cardPurpleB: { r: 0.6, g: 0.55, b: 0.86 },
  mastercardOrange: { r: 0.96, g: 0.6, b: 0.2 },
  mastercardRed: { r: 0.92, g: 0.3, b: 0.28 },
  coinA: { r: 0.15, g: 0.15, b: 0.18 },
  coinB: { r: 0.35, g: 0.4, b: 0.85 },
  coinC: { r: 0.4, g: 0.65, b: 0.95 },
  coinD: { r: 0.95, g: 0.85, b: 0.4 },
  coinE: { r: 0.9, g: 0.35, b: 0.35 },
  coinF: { r: 0.5, g: 0.3, b: 0.75 },
  coinG: { r: 0.85, g: 0.4, b: 0.4 },
  coinH: { r: 0.2, g: 0.2, b: 0.22 },
  macClose: { r: 0.95, g: 0.4, b: 0.38 },
  macMin: { r: 0.95, g: 0.75, b: 0.25 },
  macMax: { r: 0.35, g: 0.8, b: 0.4 },
};

async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
}

function bgGradientFill() {
  return [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[0, 1, 0], [-1, 0, 1]],
    gradientStops: [
      { position: 0, color: { ...COLORS.bgTop, a: 1 } },
      { position: 1, color: { ...COLORS.bgBottom, a: 1 } },
    ],
  }];
}

function diagonalGradient(colorA, colorB) {
  return [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[0.7, 0.7, 0], [-0.7, 0.7, 0.3]],
    gradientStops: [
      { position: 0, color: { ...colorA, a: 1 } },
      { position: 1, color: { ...colorB, a: 1 } },
    ],
  }];
}

function addBackgroundBlobs(frame, w, h) {
  const blobs = [
    { x: -0.16 * w, y: 0.05 * h, w: 0.5 * w, h: 0.5 * w, color: COLORS.blobMint, opacity: 0.26 },
    { x: 0.55 * w, y: 0.35 * h, w: 0.4 * w, h: 0.4 * w, color: COLORS.blobBlue, opacity: 0.2 },
    { x: -0.1 * w, y: 0.7 * h, w: 0.45 * w, h: 0.45 * w, color: COLORS.blobMint, opacity: 0.18 },
  ];
  blobs.forEach((b) => {
    const ellipse = figma.createEllipse();
    ellipse.name = "BG Blob";
    ellipse.resize(b.w, b.h);
    ellipse.x = b.x;
    ellipse.y = b.y;
    ellipse.fills = [{ type: "SOLID", color: b.color, opacity: b.opacity }];
    ellipse.effects = [{ type: "LAYER_BLUR", radius: 60, visible: true }];
    frame.appendChild(ellipse);
  });
}

function addHaloBehind(frame, card, color = COLORS.haloMint, extra = 26, opacity = 0.28) {
  const halo = figma.createEllipse();
  halo.name = "Widget Halo";
  halo.resize(card.width + extra * 2, card.height + extra);
  halo.x = card.x - extra;
  halo.y = card.y - extra * 0.4;
  halo.fills = [{ type: "SOLID", color, opacity }];
  halo.effects = [{ type: "LAYER_BLUR", radius: 50, visible: true }];
  frame.insertChild(frame.children.indexOf(card), halo);
  return halo;
}

function createGlassCard(parent, x, y, w, h, opts = {}) {
  const { blur = 18, fillOpacity = 0.42, radius = 20, strokeOpacity = 0.5 } = opts;
  const rect = figma.createRectangle();
  rect.name = "Glass Card";
  rect.resize(w, h);
  rect.x = x;
  rect.y = y;
  rect.cornerRadius = radius;
  rect.fills = [{ type: "SOLID", color: COLORS.white, opacity: fillOpacity }];
  rect.strokes = [{ type: "SOLID", color: COLORS.white, opacity: strokeOpacity }];
  rect.strokeWeight = 1;
  rect.effects = [
    { type: "BACKGROUND_BLUR", radius: blur, visible: true },
    { type: "DROP_SHADOW", color: { ...COLORS.shadow, a: 0.12 }, offset: { x: 0, y: 10 }, radius: 26, spread: -6, visible: true, blendMode: "NORMAL" },
    { type: "INNER_SHADOW", color: { ...COLORS.white, a: 0.55 }, offset: { x: 0, y: 1 }, radius: 0, spread: 0, visible: true, blendMode: "NORMAL" },
  ];
  parent.appendChild(rect);
  return rect;
}

function createText(parent, { text, x, y, size = 14, weight = "Regular", color = COLORS.textPrimary, opacity = 1, width, align = "LEFT", spacing }) {
  const t = figma.createText();
  t.fontName = { family: "Inter", style: weight };
  t.characters = text;
  t.fontSize = size;
  t.x = x;
  t.y = y;
  t.fills = [{ type: "SOLID", color, opacity }];
  t.textAlignHorizontal = align;
  if (spacing) t.letterSpacing = { value: spacing, unit: "PIXELS" };
  if (width) t.resize(width, t.height);
  parent.appendChild(t);
  return t;
}

function createLeafLogo(parent, x, y, size = 28) {
  const back = figma.createEllipse();
  back.resize(size * 0.7, size);
  back.x = x;
  back.y = y;
  back.rotation = -25;
  back.fills = [{ type: "SOLID", color: COLORS.leafDark }];
  parent.appendChild(back);
  const front = figma.createEllipse();
  front.resize(size * 0.6, size * 0.85);
  front.x = x + size * 0.28;
  front.y = y + size * 0.1;
  front.rotation = -25;
  front.fills = [{ type: "SOLID", color: COLORS.leafLight }];
  parent.appendChild(front);
}

function createMiniChart(parent, x, y, w, h, color, points) {
  const stepX = w / (points.length - 1);
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = x + i * stepX, y1 = y + h - points[i] * h;
    const x2 = x + (i + 1) * stepX, y2 = y + h - points[i + 1] * h;
    const line = figma.createLine();
    line.name = "Chart Segment";
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    line.resize(len, 0);
    line.x = x1;
    line.y = y1;
    line.rotation = -Math.atan2(dy, dx) * (180 / Math.PI);
    line.strokes = [{ type: "SOLID", color, opacity: 0.85 }];
    line.strokeWeight = 2;
    line.strokeCap = "ROUND";
    parent.appendChild(line);
  }
}

function createSearchBar(parent, x, y, w, placeholder = "Search or pay", h = 46) {
  const search = createGlassCard(parent, x, y, w, h, { radius: h / 2 - 5, fillOpacity: 0.5, blur: 16 });
  createText(parent, { text: "🔍  " + placeholder, x: search.x + 18, y: search.y + h / 2 - 8, size: 12, weight: "Regular", color: COLORS.textMuted });
  return search;
}

function createRoundIconButton(parent, x, y, icon, size = 40, accentBg = false) {
  const circle = figma.createEllipse();
  circle.name = "Round Icon Button";
  circle.resize(size, size);
  circle.x = x;
  circle.y = y;
  circle.fills = [{ type: "SOLID", color: accentBg ? COLORS.accent : COLORS.white, opacity: accentBg ? 0.9 : 0.5 }];
  circle.strokes = [{ type: "SOLID", color: COLORS.white, opacity: 0.5 }];
  circle.strokeWeight = 1;
  circle.effects = [
    { type: "BACKGROUND_BLUR", radius: 12, visible: true },
    { type: "DROP_SHADOW", color: { ...COLORS.shadow, a: accentBg ? 0.25 : 0.1 }, offset: { x: 0, y: 6 }, radius: 14, spread: -4, visible: true, blendMode: "NORMAL" },
  ];
  parent.appendChild(circle);
  createText(parent, { text: icon, x, y: y + size / 2 - 9, size: 16, weight: "Bold", color: accentBg ? COLORS.white : COLORS.textPrimary, width: size, align: "CENTER" });
  return circle;
}

function createRoundAvatar(parent, x, y, size = 40) {
  const avatar = figma.createEllipse();
  avatar.resize(size, size);
  avatar.x = x;
  avatar.y = y;
  avatar.fills = [{ type: "SOLID", color: COLORS.white, opacity: 0.6 }];
  avatar.strokes = [{ type: "SOLID", color: COLORS.white, opacity: 0.5 }];
  avatar.strokeWeight = 1;
  avatar.effects = [{ type: "BACKGROUND_BLUR", radius: 10, visible: true }];
  parent.appendChild(avatar);
  return avatar;
}

// круглые стеклянные кнопки — размер иконки/подписи авто-масштабируется от диаметра круга
function createQuickActions(parent, containerX, containerW, y, items, circleD = 76) {
  const gap = Math.max(16, circleD * 0.24);
  const totalW = circleD * items.length + gap * (items.length - 1);
  const startX = containerX + (containerW - totalW) / 2;
  const iconSize = Math.round(circleD * 0.3);
  const labelSize = Math.max(11, Math.round(circleD * 0.16));

  items.forEach((item, i) => {
    const cx = startX + i * (circleD + gap);
    const circle = figma.createEllipse();
    circle.name = "Glass Button";
    circle.resize(circleD, circleD);
    circle.x = cx;
    circle.y = y;
    circle.fills = [{ type: "SOLID", color: COLORS.white, opacity: 0.5 }];
    circle.strokes = [{ type: "SOLID", color: COLORS.white, opacity: 0.6 }];
    circle.strokeWeight = 1;
    circle.effects = [
      { type: "BACKGROUND_BLUR", radius: 16, visible: true },
      { type: "DROP_SHADOW", color: { ...COLORS.shadow, a: 0.1 }, offset: { x: 0, y: 6 }, radius: 16, spread: -4, visible: true, blendMode: "NORMAL" },
      { type: "INNER_SHADOW", color: { ...COLORS.white, a: 0.6 }, offset: { x: 0, y: 1 }, radius: 0, spread: 0, visible: true, blendMode: "NORMAL" },
    ];
    parent.appendChild(circle);
    createText(parent, { text: item.icon, x: cx, y: y + circleD / 2 - iconSize / 2 - 2, size: iconSize, weight: "Bold", color: COLORS.accent, width: circleD, align: "CENTER" });
    createText(parent, { text: item.label, x: cx - 24, y: y + circleD + 12, size: labelSize, weight: "Medium", width: circleD + 48, align: "CENTER" });
  });
}

// ============ виджеты ============

function drawBalanceWidget(frame, x, y, w, h, withHalo = true, circleD = 76) {
  const card = createGlassCard(frame, x, y, w, h, { radius: 24, fillOpacity: 0.4 });
  if (withHalo) addHaloBehind(frame, card, COLORS.haloMint, 26, 0.28);

  const sigmaFrame = figma.createFrame();
  sigmaFrame.name = "Sigma Mask";
  sigmaFrame.resize(card.width, card.height);
  sigmaFrame.x = card.x;
  sigmaFrame.y = card.y;
  sigmaFrame.fills = [];
  sigmaFrame.clipsContent = true;
  frame.appendChild(sigmaFrame);
  createText(sigmaFrame, { text: "Σ", x: card.width - card.height * 0.62, y: -card.height * 0.1, size: card.height * 0.76, weight: "Bold", opacity: 0.07 });

  createText(frame, { text: "TOTAL BALANCE", x: card.x + 30, y: card.y + 34, size: 12, weight: "Medium", color: COLORS.textMuted, spacing: 1 });
  createText(frame, { text: "12,480", x: card.x + 30, y: card.y + 58, size: 40, weight: "Bold" });
  createText(frame, { text: ".50", x: card.x + 30 + 138, y: card.y + 74, size: 24, weight: "Bold", color: COLORS.textPrimary, opacity: 0.6 });
  createText(frame, { text: "BYN", x: card.x + 30 + 182, y: card.y + 80, size: 14, weight: "Medium", color: COLORS.textMuted });
  createText(frame, { text: "▲  +2.4% vs last month", x: card.x + 30, y: card.y + 112, size: 13, weight: "Medium", color: COLORS.accent });

  createQuickActions(frame, card.x, card.width, card.y + 172, [
    { icon: "⇄", label: "Transfer" },
    { icon: "+", label: "Top up" },
    { icon: "₿", label: "Buy crypto" },
  ], circleD);
  return card;
}

function drawBanner(frame, x, y, w, h = 88) {
  const banner = createGlassCard(frame, x, y, w, h, { radius: 18, fillOpacity: 0.5 });
  createLeafLogo(frame, banner.x + 18, banner.y + 26, 22);
  createText(frame, { text: "Your money works for you", x: banner.x + 56, y: banner.y + 16, size: 13, weight: "Medium" });
  createText(frame, { text: "Earn up to 4.5% APY on your balance", x: banner.x + 56, y: banner.y + 38, size: 11, weight: "Regular", color: COLORS.textMuted });
  createText(frame, { text: "›", x: banner.x + banner.width - 36, y: banner.y + 30, size: 18, weight: "Bold", color: COLORS.textMuted });
  return banner;
}

// главная карта — держит реальную пропорцию 1.586:1, все внутренние элементы масштабируются от ширины
function drawMainCard(frame, x, y, w) {
  const h = w / CARD_RATIO;
  const s = w / 335; // масштаб относительно базовой мобильной ширины

  const mainCard = figma.createRectangle();
  mainCard.name = "Main Card";
  mainCard.resize(w, h);
  mainCard.x = x;
  mainCard.y = y;
  mainCard.cornerRadius = 16 * s;
  mainCard.fills = diagonalGradient(COLORS.cardMintA, COLORS.cardMintB);
  mainCard.strokes = [{ type: "SOLID", color: COLORS.white, opacity: 0.5 }];
  mainCard.strokeWeight = 1;
  mainCard.effects = [{ type: "DROP_SHADOW", color: { ...COLORS.shadow, a: 0.15 }, offset: { x: 0, y: 12 * s }, radius: 24 * s, spread: -8, visible: true, blendMode: "NORMAL" }];
  frame.appendChild(mainCard);

  createLeafLogo(frame, x + 20 * s, y + 20 * s, 22 * s);
  createText(frame, { text: "NeoBank", x: x + 52 * s, y: y + 24 * s, size: 13 * s, weight: "Bold" });
  createText(frame, { text: "VISA", x: x + w - 60 * s, y: y + 18 * s, size: 13 * s, weight: "Bold" });
  createText(frame, { text: "Debit", x: x + w - 60 * s, y: y + 34 * s, size: 9 * s, weight: "Regular", color: COLORS.textMuted });

  const chip = figma.createRectangle();
  chip.resize(30 * s, 22 * s);
  chip.cornerRadius = 4 * s;
  chip.x = x + 20 * s;
  chip.y = y + h * 0.42;
  chip.fills = [{ type: "SOLID", color: COLORS.white, opacity: 0.55 }];
  frame.appendChild(chip);

  createText(frame, { text: "••••  4821", x: x + 20 * s, y: y + h * 0.68, size: 13 * s, weight: "Medium", color: COLORS.textPrimary, opacity: 0.7 });
  createText(frame, { text: "4,200.00 BYN", x: x + 20 * s, y: y + h * 0.82, size: 24 * s, weight: "Bold" });
  createText(frame, { text: "))) ", x: x + w - 40 * s, y: y + h * 0.82, size: 16 * s, weight: "Bold", color: COLORS.textPrimary, opacity: 0.5 });

  return mainCard;
}

const MINI_CARDS_DATA = [
  { fills: () => diagonalGradient(COLORS.cardMintA, COLORS.cardMintB), balance: "4,200.00", currency: "BYN", scheme: "VISA", active: true, textColor: COLORS.textPrimary },
  { fills: () => diagonalGradient(COLORS.cardDarkA, COLORS.cardDarkB), balance: "2,350.75", currency: "", scheme: "mc", active: false, textColor: COLORS.white },
  { fills: () => diagonalGradient(COLORS.cardGreyA, COLORS.cardGreyB), balance: "1,930.20", currency: "", scheme: "pay", active: false, textColor: COLORS.textPrimary },
  { fills: () => diagonalGradient(COLORS.cardPurpleA, COLORS.cardPurpleB), balance: "850.0", currency: "", scheme: "", active: false, textColor: COLORS.white },
];

// мини-карты — та же реальная пропорция 1.586:1, в ряд (горизонтальный скролл на мобильном/планшете)
function drawMiniCardsRow(frame, x, y, miniW, gap) {
  const miniH = miniW / CARD_RATIO;
  MINI_CARDS_DATA.forEach((c, i) => {
    const mx = x + i * (miniW + gap);
    drawMiniCard(frame, mx, y, miniW, miniH, c);
  });
  return miniH;
}

// мини-карты — колонкой (для планшета/десктопа, где больше вертикального пространства)
function drawMiniCardsColumn(frame, x, y, miniW, gap) {
  const miniH = miniW / CARD_RATIO;
  MINI_CARDS_DATA.forEach((c, i) => {
    const my = y + i * (miniH + gap);
    drawMiniCard(frame, x, my, miniW, miniH, c);
  });
  return miniH;
}

function drawMiniCard(frame, x, y, w, h, c) {
  const s = w / 82; // масштаб относительно базовой мобильной ширины мини-карты
  const mini = figma.createRectangle();
  mini.name = c.active ? "Mini Card — Active" : "Mini Card";
  mini.resize(w, h);
  mini.x = x;
  mini.y = y;
  mini.cornerRadius = 10 * s;
  mini.fills = c.fills();
  if (c.active) {
    mini.strokes = [{ type: "SOLID", color: COLORS.accent, opacity: 0.9 }];
    mini.strokeWeight = 2;
    mini.effects = [{ type: "DROP_SHADOW", color: { ...COLORS.accent, a: 0.35 }, offset: { x: 0, y: 4 }, radius: 14, spread: -2, visible: true, blendMode: "NORMAL" }];
  } else {
    mini.strokes = [{ type: "SOLID", color: COLORS.white, opacity: 0.3 }];
    mini.strokeWeight = 1;
    mini.effects = [{ type: "DROP_SHADOW", color: { ...COLORS.shadow, a: 0.1 }, offset: { x: 0, y: 6 }, radius: 12, spread: -4, visible: true, blendMode: "NORMAL" }];
  }
  frame.appendChild(mini);
  if (c.active) createLeafLogo(frame, x + 8 * s, y + 8 * s, 14 * s);
  createText(frame, { text: c.balance, x: x + 8 * s, y: y + h - 22 * s, size: 11 * s, weight: "Bold", color: c.textColor });
  if (c.currency) createText(frame, { text: c.currency, x: x + 8 * s, y: y + h - 10 * s, size: 7 * s, weight: "Medium", color: c.textColor, opacity: 0.7 });
  if (c.scheme === "VISA") {
    createText(frame, { text: "VISA", x: x + w - 34 * s, y: y + h - 20 * s, size: 9 * s, weight: "Bold", color: c.textColor });
  } else if (c.scheme === "mc") {
    const d1 = figma.createEllipse(); d1.resize(14 * s, 14 * s); d1.x = x + w - 30 * s; d1.y = y + 10 * s; d1.fills = [{ type: "SOLID", color: COLORS.mastercardRed, opacity: 0.85 }]; frame.appendChild(d1);
    const d2 = figma.createEllipse(); d2.resize(14 * s, 14 * s); d2.x = x + w - 22 * s; d2.y = y + 10 * s; d2.fills = [{ type: "SOLID", color: COLORS.mastercardOrange, opacity: 0.85 }]; frame.appendChild(d2);
  } else if (c.scheme === "pay") {
    createText(frame, { text: "Pay", x: x + w - 30 * s, y: y + 10 * s, size: 9 * s, weight: "Bold", color: c.textColor });
  }
}

const TX_ROWS = [
  ["MAK.by", "Shopping", "-124.90 BYN"],
  ["Salary", "Incoming", "+2,850.00 BYN"],
  ["Café 101", "Food & Drinks", "-42.50 BYN"],
];

function drawTransactionsList(frame, x, y, w, h) {
  const txCard = createGlassCard(frame, x, y, w, h, { radius: 18 });
  createText(frame, { text: "Recent transactions", x: txCard.x + 20, y: txCard.y + 16, size: 13, weight: "Medium" });
  createText(frame, { text: "See all ›", x: txCard.x + txCard.width - 80, y: txCard.y + 16, size: 11, weight: "Medium", color: COLORS.textMuted, width: 60, align: "RIGHT" });
  TX_ROWS.forEach((row, i) => {
    const ry = txCard.y + 44 + i * 46;
    const dot = figma.createEllipse();
    dot.resize(30, 30); dot.x = txCard.x + 20; dot.y = ry;
    dot.fills = [{ type: "SOLID", color: COLORS.accentSoft, opacity: 0.5 }];
    frame.appendChild(dot);
    createText(frame, { text: row[0], x: txCard.x + 60, y: ry + 2, size: 12, weight: "Medium" });
    createText(frame, { text: row[1], x: txCard.x + 60, y: ry + 18, size: 10, weight: "Regular", color: COLORS.textMuted });
    createText(frame, { text: row[2], x: txCard.x + txCard.width - 150, y: ry + 8, size: 12, weight: "Medium", width: 130, align: "RIGHT" });
  });
  return txCard;
}

function drawCoinCard(frame, x, y, w, h, symbol, sign, name, price, delta, iconColor, chartPoints) {
  const card = createGlassCard(frame, x, y, w, h, { radius: 18 });
  const icon = figma.createEllipse();
  icon.resize(24, 24); icon.x = card.x + card.width - 40; icon.y = card.y + 16;
  icon.fills = [{ type: "SOLID", color: iconColor }];
  frame.appendChild(icon);
  createText(frame, { text: symbol, x: icon.x, y: icon.y + 4, size: 12, weight: "Bold", color: COLORS.white, width: 24, align: "CENTER" });
  createText(frame, { text: name, x: card.x + 16, y: card.y + 18, size: 12, weight: "Medium", color: COLORS.textMuted });
  createText(frame, { text: price, x: card.x + 16, y: card.y + 38, size: 19, weight: "Bold" });
  createText(frame, { text: "▼ " + delta, x: card.x + 16, y: card.y + 66, size: 12, weight: "Medium", color: COLORS.red });
  createMiniChart(frame, card.x + 12, card.y + 92, card.width - 24, h - 104, COLORS.red, chartPoints);
  return card;
}

function drawTopMoversWidget(frame, x, y, w) {
  const padding = 20;
  const titleH = 24, segH = 42, gapTitleSeg = 12, gapSegGrid = 18, gridRowH = 96, gridRows = 2, gapGridBottom = 16;
  const widgetH = padding + titleH + gapTitleSeg + segH + gapSegGrid + gridRowH * gridRows + gapGridBottom;
  const widget = createGlassCard(frame, x, y, w, widgetH, { radius: 22, fillOpacity: 0.38 });

  const titleY = widget.y + padding;
  createText(frame, { text: "Top movers", x: widget.x + padding, y: titleY, size: 15, weight: "Bold" });
  createText(frame, { text: "›", x: widget.x + padding + 100, y: titleY - 2, size: 16, weight: "Bold", color: COLORS.textMuted });
  createText(frame, { text: "⠿", x: widget.x + widget.width - padding - 16, y: titleY, size: 14, weight: "Bold", color: COLORS.inactive });

  const seg = createGlassCard(frame, widget.x + padding, titleY + titleH + gapTitleSeg - 14, widget.width - padding * 2, segH, { radius: 21, fillOpacity: 0.55 });
  const pillW = (seg.width - 8) / 2;
  const activePill = figma.createRectangle();
  activePill.resize(pillW, seg.height - 8); activePill.x = seg.x + 4; activePill.y = seg.y + 4; activePill.cornerRadius = 18;
  activePill.fills = [{ type: "SOLID", color: COLORS.white, opacity: 0.7 }];
  frame.appendChild(activePill);
  createText(frame, { text: "Top gainers", x: seg.x + 4, y: seg.y + 13, size: 12, weight: "Bold", width: pillW, align: "CENTER" });
  createText(frame, { text: "Top losers", x: seg.x + 4 + pillW, y: seg.y + 13, size: 12, weight: "Medium", color: COLORS.textMuted, width: pillW, align: "CENTER" });

  const coins = [
    ["API3", "79.79%", COLORS.coinA], ["RAD", "16.08%", COLORS.coinB], ["VINU", "11.38%", COLORS.coinC], ["HOPR", "11.37%", COLORS.coinD],
    ["UMA", "7.86%", COLORS.coinE], ["AUDIO", "7.64%", COLORS.coinF], ["VVV", "6.56%", COLORS.coinG], ["CTC", "6.20%", COLORS.coinH],
  ];
  const gridY = seg.y + seg.height + gapSegGrid;
  const cellW = (widget.width - padding * 2) / 4;
  coins.forEach((coin, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const cx = widget.x + padding + col * cellW + cellW / 2;
    const cy = gridY + row * gridRowH;
    const dot = figma.createEllipse();
    dot.resize(48, 48); dot.x = cx - 24; dot.y = cy;
    dot.fills = [{ type: "SOLID", color: coin[2] }];
    dot.strokes = [{ type: "SOLID", color: COLORS.white, opacity: 0.6 }]; dot.strokeWeight = 1;
    frame.appendChild(dot);
    createText(frame, { text: coin[0][0], x: cx - 24, y: cy + 15, size: 16, weight: "Bold", color: COLORS.white, width: 48, align: "CENTER" });
    createText(frame, { text: coin[0], x: cx - cellW / 2 + 4, y: cy + 54, size: 11, weight: "Medium", width: cellW - 8, align: "CENTER" });
    createText(frame, { text: "▲ " + coin[1], x: cx - cellW / 2 + 4, y: cy + 70, size: 10, weight: "Medium", color: COLORS.accent, width: cellW - 8, align: "CENTER" });
  });
  return widget;
}

function drawPortfolioWidget(frame, x, y, w, h = 130) {
  const card = createGlassCard(frame, x, y, w, h, { radius: 20, fillOpacity: 0.48 });
  createText(frame, { text: "⠿", x: card.x + card.width - 36, y: card.y + 16, size: 14, weight: "Bold", color: COLORS.inactive });
  createText(frame, { text: "YOUR PORTFOLIO", x: card.x + 20, y: card.y + 18, size: 11, weight: "Medium", color: COLORS.textMuted, spacing: 1 });
  createText(frame, { text: "$4,820.30", x: card.x + 20, y: card.y + 38, size: 26, weight: "Bold" });
  createText(frame, { text: "▲ +3.2% today", x: card.x + 20, y: card.y + 72, size: 12, weight: "Medium", color: COLORS.accent });
  createMiniChart(frame, card.x + card.width - 140, card.y + 30, 120, 60, COLORS.accent, [0.2, 0.35, 0.3, 0.5, 0.45, 0.65, 0.6, 0.8]);
  [COLORS.mastercardOrange, COLORS.coinB, COLORS.coinF].forEach((c, i) => {
    const dot = figma.createEllipse();
    dot.resize(22, 22); dot.x = card.x + 20 + i * 16; dot.y = card.y + 96;
    dot.fills = [{ type: "SOLID", color: c }];
    dot.strokes = [{ type: "SOLID", color: COLORS.white, opacity: 0.8 }]; dot.strokeWeight = 1.5;
    frame.appendChild(dot);
  });
  createText(frame, { text: "BTC · ETH · AUDIO", x: card.x + 90, y: card.y + 100, size: 10, weight: "Regular", color: COLORS.textMuted });
  return card;
}

function drawMarketsWidget(frame, x, y, w, h = 260) {
  const card = createGlassCard(frame, x, y, w, h, { radius: 20 });
  createText(frame, { text: "⠿", x: card.x + card.width - 36, y: card.y + 16, size: 14, weight: "Bold", color: COLORS.inactive });
  createText(frame, { text: "Markets", x: card.x + 20, y: card.y + 16, size: 13, weight: "Bold" });

  const catTabs = ["Crypto", "Fiat", "Stocks"];
  const catGap = 8, catW = 74;
  catTabs.forEach((cat, i) => {
    const catX = card.x + card.width - 20 - (catW * catTabs.length + catGap * (catTabs.length - 1)) - 20;
    const bx = catX + i * (catW + catGap);
    const isActive = i === 0;
    const pill = figma.createRectangle();
    pill.resize(catW, 26); pill.x = bx; pill.y = card.y + 42; pill.cornerRadius = 13;
    pill.fills = [{ type: "SOLID", color: isActive ? COLORS.accent : COLORS.white, opacity: isActive ? 0.15 : 0.4 }];
    frame.appendChild(pill);
    createText(frame, { text: cat, x: bx, y: card.y + 49, size: 10, weight: "Medium", color: isActive ? COLORS.accent : COLORS.textMuted, width: catW, align: "CENTER" });
  });

  const assets = [
    ["₿", "Bitcoin", "BTC", "$99,099", "-0.87%", COLORS.mastercardOrange, false],
    ["Ξ", "Ethereum", "ETH", "$3,687.37", "-1.15%", COLORS.coinB, false],
    ["₮", "Tether", "USDT", "$1.00", "+0.01%", COLORS.coinC, true],
    ["◎", "Solana", "SOL", "$212.40", "+4.6%", COLORS.coinF, true],
  ];
  assets.forEach((a, i) => {
    const ry = card.y + 86 + i * 44;
    const dot = figma.createEllipse();
    dot.resize(32, 32); dot.x = card.x + 20; dot.y = ry;
    dot.fills = [{ type: "SOLID", color: a[5] }];
    frame.appendChild(dot);
    createText(frame, { text: a[0], x: card.x + 20, y: ry + 8, size: 13, weight: "Bold", color: COLORS.white, width: 32, align: "CENTER" });
    createText(frame, { text: a[1], x: card.x + 62, y: ry + 2, size: 12, weight: "Medium" });
    createText(frame, { text: a[2], x: card.x + 62, y: ry + 18, size: 10, weight: "Regular", color: COLORS.textMuted });
    createText(frame, { text: a[3], x: card.x + card.width - 160, y: ry + 2, size: 12, weight: "Medium", width: 140, align: "RIGHT" });
    createText(frame, { text: (a[6] ? "▲ " : "▼ ") + a[4], x: card.x + card.width - 160, y: ry + 18, size: 10, weight: "Medium", color: a[6] ? COLORS.accent : COLORS.red, width: 140, align: "RIGHT" });
  });
  return card;
}

function createTabBar(parent, w, h, activeIndex) {
  const tabs = [{ label: "Home", icon: "⌂" }, { label: "Crypto", icon: "◈" }, { label: "Cards", icon: "▭" }, { label: "Account", icon: "◍" }];
  const barW = w - 40, barH = 68;
  const bar = createGlassCard(parent, 20, h - 88, barW, barH, { blur: 24, fillOpacity: 0.55, radius: 24, strokeOpacity: 0.55 });
  bar.name = "Tab Bar";
  const slot = barW / tabs.length;
  tabs.forEach((tab, i) => {
    const isActive = i === activeIndex;
    const color = isActive ? COLORS.accent : COLORS.inactive;
    const cx = bar.x + slot * i + slot / 2;
    if (isActive) {
      const pill = figma.createRectangle();
      pill.resize(slot - 12, barH - 12); pill.x = cx - (slot - 12) / 2; pill.y = bar.y + 6; pill.cornerRadius = 16;
      pill.fills = [{ type: "SOLID", color: COLORS.accent, opacity: 0.14 }];
      parent.appendChild(pill);
    }
    createText(parent, { text: tab.icon, x: cx - 8, y: bar.y + 14, size: 18, weight: "Medium", color, align: "CENTER" });
    createText(parent, { text: tab.label, x: cx - slot / 2, y: bar.y + 42, size: 10, weight: "Medium", color, width: slot, align: "CENTER" });
  });
}

function baseScreen(name, w, h, offsetX) {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(w, h);
  frame.x = offsetX;
  frame.y = 0;
  frame.clipsContent = true;
  frame.fills = bgGradientFill();
  figma.currentPage.appendChild(frame);
  addBackgroundBlobs(frame, w, h);
  return frame;
}

// ============ mobile (375×812) ============

async function buildHomeMobile(offsetX) {
  const W = 375, H = 812;
  const frame = baseScreen("Mobile — Home", W, H, offsetX);
  createText(frame, { text: "Good morning,", x: 24, y: 26, size: 14, weight: "Medium", color: COLORS.textMuted });
  createText(frame, { text: "Alex ☀", x: 24, y: 46, size: 28, weight: "Bold" });
  createRoundAvatar(frame, W - 24 - 40, 34, 40);
  const card = drawBalanceWidget(frame, 16, 108, W - 32, 380, true, 78);
  drawBanner(frame, 20, card.y + card.height + 28, W - 40);
  createTabBar(frame, W, H, 0);
  return frame;
}

async function buildCardsMobile(offsetX) {
  const W = 375, H = 900;
  const frame = baseScreen("Mobile — Cards", W, H, offsetX);
  createLeafLogo(frame, 24, 30, 26);
  createText(frame, { text: "Flex", x: 56, y: 28, size: 16, weight: "Bold" });
  createText(frame, { text: "Better money. Brighter future.", x: 56, y: 48, size: 10, weight: "Regular", color: COLORS.textMuted });
  createRoundIconButton(frame, W - 24 - 36 - 44, 26, "+", 36, true);
  createRoundAvatar(frame, W - 24 - 36, 26, 36);
  const search = createSearchBar(frame, 20, 78, W - 40);
  const mainCard = drawMainCard(frame, 20, search.y + search.height + 20, W - 40);
  const dotsY = mainCard.y + mainCard.height + 14;
  [0, 1, 2].forEach((i) => {
    const dot = figma.createEllipse();
    dot.resize(6, 6); dot.x = mainCard.x + mainCard.width / 2 - 9 + i * 10; dot.y = dotsY;
    dot.fills = [{ type: "SOLID", color: COLORS.textMuted, opacity: i === 0 ? 0.7 : 0.3 }];
    frame.appendChild(dot);
  });
  const miniY = dotsY + 26;
  const miniH = drawMiniCardsRow(frame, 20, miniY, 82, 12);
  createQuickActions(frame, 20, W - 40, miniY + miniH + 28, [{ icon: "⇄", label: "Transfer" }, { icon: "+", label: "Top up" }, { icon: "•••", label: "Details" }], 64);
  drawTransactionsList(frame, 20, miniY + miniH + 28 + 100 + 20, W - 40, 190);
  createTabBar(frame, W, H, 2);
  return frame;
}

async function buildCryptoMobile(offsetX) {
  const W = 375, H = 1400;
  const frame = baseScreen("Mobile — Crypto", W, H, offsetX);
  createLeafLogo(frame, 24, 28, 26);
  createText(frame, { text: "Flex", x: 56, y: 24, size: 12, weight: "Medium", color: COLORS.textMuted, spacing: 1 });
  createText(frame, { text: "Crypto", x: 56, y: 38, size: 20, weight: "Bold", color: COLORS.accent });
  createRoundIconButton(frame, W - 24 - 40 - 44, 30, "⚙", 40);
  createRoundAvatar(frame, W - 24 - 40, 30, 40);
  const search = createSearchBar(frame, 20, 82, W - 40, "Search crypto");
  const coinCardY = search.y + search.height + 20;
  const coinCardW = (W - 40 - 12) / 2;
  drawCoinCard(frame, 20, coinCardY, coinCardW, 150, "₿", "+", "BTC", "$99,099", "0.87%", COLORS.mastercardOrange, [0.7, 0.9, 0.5, 0.35, 0.55, 0.3, 0.45, 0.25]);
  drawCoinCard(frame, 20 + coinCardW + 12, coinCardY, coinCardW, 150, "Ξ", "-", "ETH", "$3,687.37", "1.15%", COLORS.coinB, [0.75, 0.85, 0.45, 0.3, 0.5, 0.28, 0.4, 0.22]);
  const topMovers = drawTopMoversWidget(frame, 20, coinCardY + 150 + 24, W - 40);
  const portfolio = drawPortfolioWidget(frame, 20, topMovers.y + topMovers.height + 20, W - 40);
  drawMarketsWidget(frame, 20, portfolio.y + portfolio.height + 20, W - 40);
  createTabBar(frame, W, H, 1);
  return frame;
}

// ============ tablet (834×1194) ============

async function buildHomeTablet(offsetX) {
  const W = 834, H = 1194, CW = 700;
  const cx = (W - CW) / 2;
  const frame = baseScreen("Tablet — Home", W, H, offsetX);
  createText(frame, { text: "Good morning,", x: cx, y: 44, size: 18, weight: "Medium", color: COLORS.textMuted });
  createText(frame, { text: "Alex ☀", x: cx, y: 70, size: 38, weight: "Bold" });
  createRoundAvatar(frame, cx + CW - 52, 50, 52);
  const card = drawBalanceWidget(frame, cx, 150, CW, 460, true, 100);
  drawBanner(frame, cx, card.y + card.height + 36, CW, 100);
  createTabBar(frame, W, H, 0);
  return frame;
}

async function buildCardsTablet(offsetX) {
  const W = 834, H = 1194, CW = 700;
  const cx = (W - CW) / 2;
  const frame = baseScreen("Tablet — Cards", W, H, offsetX);
  createLeafLogo(frame, cx, 44, 32);
  createText(frame, { text: "Flex", x: cx + 40, y: 40, size: 20, weight: "Bold" });
  createText(frame, { text: "Better money. Brighter future.", x: cx + 40, y: 64, size: 12, weight: "Regular", color: COLORS.textMuted });
  createRoundIconButton(frame, cx + CW - 44 - 12 - 44, 40, "+", 44, true);
  createRoundAvatar(frame, cx + CW - 44, 40, 44);

  const search = createSearchBar(frame, cx, 108, CW, "Search or pay", 54);

  // главная карта — фиксированная реалистичная ширина (не растянута на всю колонку), рядом колонка остальных карт
  const mainCardW = 420;
  const mainCard = drawMainCard(frame, cx, search.y + search.height + 30, mainCardW);
  const colX = cx + mainCardW + 32;
  const colW = CW - mainCardW - 32;
  createText(frame, { text: "Other cards", x: colX, y: search.y + search.height + 30, size: 13, weight: "Bold" });
  drawMiniCardsColumn(frame, colX, search.y + search.height + 60, colW, 16);

  createQuickActions(frame, cx, mainCardW, mainCard.y + mainCard.height + 30, [{ icon: "⇄", label: "Transfer" }, { icon: "+", label: "Top up" }, { icon: "•••", label: "Details" }], 76);
  drawTransactionsList(frame, cx, mainCard.y + mainCard.height + 30 + 110 + 26, CW, 230);
  createTabBar(frame, W, H, 2);
  return frame;
}

async function buildCryptoTablet(offsetX) {
  const W = 834, H = 1700, CW = 700;
  const cx = (W - CW) / 2;
  const frame = baseScreen("Tablet — Crypto", W, H, offsetX);
  createLeafLogo(frame, cx, 42, 32);
  createText(frame, { text: "Flex", x: cx + 40, y: 36, size: 14, weight: "Medium", color: COLORS.textMuted, spacing: 1 });
  createText(frame, { text: "Crypto", x: cx + 40, y: 54, size: 24, weight: "Bold", color: COLORS.accent });
  createRoundIconButton(frame, cx + CW - 48 - 14 - 48, 40, "⚙", 48);
  createRoundAvatar(frame, cx + CW - 48, 40, 48);
  const search = createSearchBar(frame, cx, 108, CW, "Search crypto", 54);
  const coinCardY = search.y + search.height + 26;
  const coinCardW = (CW - 16) / 2;
  drawCoinCard(frame, cx, coinCardY, coinCardW, 180, "₿", "+", "BTC", "$99,099", "0.87%", COLORS.mastercardOrange, [0.7, 0.9, 0.5, 0.35, 0.55, 0.3, 0.45, 0.25]);
  drawCoinCard(frame, cx + coinCardW + 16, coinCardY, coinCardW, 180, "Ξ", "-", "ETH", "$3,687.37", "1.15%", COLORS.coinB, [0.75, 0.85, 0.45, 0.3, 0.5, 0.28, 0.4, 0.22]);
  const topMovers = drawTopMoversWidget(frame, cx, coinCardY + 180 + 30, CW);
  const portfolio = drawPortfolioWidget(frame, cx, topMovers.y + topMovers.height + 24, CW, 150);
  drawMarketsWidget(frame, cx, portfolio.y + portfolio.height + 24, CW, 300);
  createTabBar(frame, W, H, 1);
  return frame;
}

// ============ desktop (1440×900+, macOS-стиль) ============

function drawMacChrome(frame, w) {
  const chrome = createGlassCard(frame, 0, 0, w, 44, { radius: 0, fillOpacity: 0.55, blur: 20, strokeOpacity: 0.3 });
  chrome.name = "macOS Window Chrome";
  const dots = [COLORS.macClose, COLORS.macMin, COLORS.macMax];
  dots.forEach((c, i) => {
    const dot = figma.createEllipse();
    dot.resize(12, 12); dot.x = 20 + i * 20; dot.y = 16;
    dot.fills = [{ type: "SOLID", color: c }];
    frame.appendChild(dot);
  });
  createText(frame, { text: "Flex", x: 0, y: 14, size: 13, weight: "Medium", color: COLORS.textMuted, width: w, align: "CENTER" });
  return chrome;
}

function drawSidebar(frame, h, activeIndex) {
  const sidebarW = 240;
  const sidebar = createGlassCard(frame, 0, 44, sidebarW, h - 44, { radius: 0, fillOpacity: 0.45, blur: 22, strokeOpacity: 0.3 });
  sidebar.name = "Sidebar";
  createLeafLogo(frame, 28, 76, 28);
  createText(frame, { text: "Flex", x: 64, y: 74, size: 16, weight: "Bold" });
  createText(frame, { text: "Better money. Brighter future.", x: 64, y: 96, size: 9, weight: "Regular", color: COLORS.textMuted, width: 160 });
  const items = [{ label: "Home", icon: "⌂" }, { label: "Crypto", icon: "◈" }, { label: "Cards", icon: "▭" }, { label: "Account", icon: "◍" }];
  items.forEach((item, i) => {
    const iy = 150 + i * 52;
    const isActive = i === activeIndex;
    if (isActive) {
      const pill = figma.createRectangle();
      pill.resize(sidebarW - 32, 44); pill.x = 16; pill.y = iy - 8; pill.cornerRadius = 14;
      pill.fills = [{ type: "SOLID", color: COLORS.accent, opacity: 0.14 }];
      frame.appendChild(pill);
    }
    createText(frame, { text: item.icon, x: 28, y: iy, size: 16, weight: "Medium", color: isActive ? COLORS.accent : COLORS.inactive });
    createText(frame, { text: item.label, x: 60, y: iy, size: 13, weight: isActive ? "Bold" : "Medium", color: isActive ? COLORS.accent : COLORS.textPrimary });
  });
  createRoundIconButton(frame, 24, h - 90, "⚙", 40);
  createRoundAvatar(frame, 76, h - 90, 40);
  return sidebar;
}

async function buildHomeDesktop(offsetX) {
  const W = 1440, H = 900;
  const frame = baseScreen("Desktop — Home", W, H, offsetX);
  drawMacChrome(frame, W);
  drawSidebar(frame, H, 0);
  const contentX = 288, contentW = W - 288 - 48;

  createText(frame, { text: "Good morning, Alex ☀", x: contentX, y: 76, size: 26, weight: "Bold" });

  const leftW = contentW * 0.62;
  const rightW = contentW - leftW - 32;
  const balanceCard = drawBalanceWidget(frame, contentX, 130, leftW, 420, true, 92);

  const bannerCard = drawBanner(frame, contentX + leftW + 32, 130, rightW, 110);
  const statsCard = createGlassCard(frame, contentX + leftW + 32, bannerCard.y + bannerCard.height + 24, rightW, 286, { radius: 20, fillOpacity: 0.42 });
  createText(frame, { text: "THIS MONTH", x: statsCard.x + 20, y: statsCard.y + 18, size: 11, weight: "Medium", color: COLORS.textMuted, spacing: 1 });
  createText(frame, { text: "Spending", x: statsCard.x + 20, y: statsCard.y + 40, size: 13, weight: "Medium" });
  createMiniChart(frame, statsCard.x + 20, statsCard.y + 70, statsCard.width - 40, 90, COLORS.accent, [0.3, 0.5, 0.4, 0.65, 0.55, 0.75, 0.6, 0.85]);
  createText(frame, { text: "Income vs Expenses", x: statsCard.x + 20, y: statsCard.y + 180, size: 13, weight: "Medium" });
  createText(frame, { text: "▲ +2,850.00 BYN income", x: statsCard.x + 20, y: statsCard.y + 202, size: 11, weight: "Medium", color: COLORS.accent });
  createText(frame, { text: "▼ -1,240.30 BYN expenses", x: statsCard.x + 20, y: statsCard.y + 220, size: 11, weight: "Medium", color: COLORS.red });

  drawTransactionsList(frame, contentX, balanceCard.y + balanceCard.height + 24, contentW, 220);
  return frame;
}

async function buildCardsDesktop(offsetX) {
  const W = 1440, H = 1150;
  const frame = baseScreen("Desktop — Cards", W, H, offsetX);
  drawMacChrome(frame, W);
  drawSidebar(frame, H, 2);
  const contentX = 288, contentW = W - 288 - 48;

  const search = createSearchBar(frame, contentX, 76, contentW - 200, "Search or pay", 48);
  createRoundIconButton(frame, contentX + contentW - 44 - 12 - 44, 77, "+", 44, true);
  createRoundAvatar(frame, contentX + contentW - 44, 77, 44);

  // главная карта — фиксированная реалистичная ширина, колонка остальных карт справа фиксированной узкой ширины
  const mainCardW = 480;
  const mainCard = drawMainCard(frame, contentX, search.y + search.height + 24, mainCardW);
  const colX = contentX + mainCardW + 40;
  const colW = 220;
  createText(frame, { text: "Other cards", x: colX, y: search.y + search.height + 24, size: 13, weight: "Bold" });
  drawMiniCardsColumn(frame, colX, search.y + search.height + 54, colW, 16);

  createQuickActions(frame, contentX, mainCardW, mainCard.y + mainCard.height + 30, [{ icon: "⇄", label: "Transfer" }, { icon: "+", label: "Top up" }, { icon: "•••", label: "Details" }], 72);
  drawTransactionsList(frame, contentX, mainCard.y + mainCard.height + 30 + 108 + 24, contentW, 230);
  return frame;
}

async function buildCryptoDesktop(offsetX) {
  const W = 1440, H = 1100;
  const frame = baseScreen("Desktop — Crypto", W, H, offsetX);
  drawMacChrome(frame, W);
  drawSidebar(frame, H, 1);
  const contentX = 288, contentW = W - 288 - 48;

  createText(frame, { text: "Crypto", x: contentX, y: 76, size: 26, weight: "Bold", color: COLORS.accent });
  const search = createSearchBar(frame, contentX + 140, 76, contentW - 140 - 100, "Search crypto", 44);
  createRoundIconButton(frame, contentX + contentW - 44, 76, "⚙", 44);

  const coinCardY = search.y + search.height + 26;
  const coinCardW = (contentW - 24) / 2;
  drawCoinCard(frame, contentX, coinCardY, coinCardW, 170, "₿", "+", "BTC", "$99,099", "0.87%", COLORS.mastercardOrange, [0.7, 0.9, 0.5, 0.35, 0.55, 0.3, 0.45, 0.25]);
  drawCoinCard(frame, contentX + coinCardW + 24, coinCardY, coinCardW, 170, "Ξ", "-", "ETH", "$3,687.37", "1.15%", COLORS.coinB, [0.75, 0.85, 0.45, 0.3, 0.5, 0.28, 0.4, 0.22]);

  const gridY = coinCardY + 170 + 30;
  const leftW = contentW * 0.62;
  const rightW = contentW - leftW - 28;
  const topMovers = drawTopMoversWidget(frame, contentX, gridY, leftW);
  drawPortfolioWidget(frame, contentX + leftW + 28, gridY, rightW, topMovers.height);
  drawMarketsWidget(frame, contentX, topMovers.y + topMovers.height + 24, contentW, 300);
  return frame;
}

async function main() {
  await loadFonts();
  const gap = 100;
  let x = 0;

  const hm = await buildHomeMobile(x); x += 375 + gap;
  const cm = await buildCardsMobile(x); x += 375 + gap;
  const crm = await buildCryptoMobile(x); x += 375 + gap;

  const ht = await buildHomeTablet(x); x += 834 + gap;
  const ct = await buildCardsTablet(x); x += 834 + gap;
  const crt = await buildCryptoTablet(x); x += 834 + gap;

  const hd = await buildHomeDesktop(x); x += 1440 + gap;
  const cd = await buildCardsDesktop(x); x += 1440 + gap;
  const crd = await buildCryptoDesktop(x);

  const all = [hm, cm, crm, ht, ct, crt, hd, cd, crd];
  figma.currentPage.selection = all;
  figma.viewport.scrollAndZoomIntoView(all);
  figma.closePlugin("Flex UI: кнопки на Home увеличены, карты на Cards — реальные пропорции 1.586:1 ✅");
}

main();
