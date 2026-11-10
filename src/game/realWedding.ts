// Quản lý trạng thái giao diện tiệc cưới người thật (Real Wedding Stream)
import { plain } from '../live/chatter';

export type WeddingTheme = 'red' | 'navy' | 'gold' | 'pink';

export type ChallengeType =
  | 'end_live'
  | 'dong_phong'
  | 'marry_mc'
  | 'cancel'
  | 'take_photo'
  | 'dance'
  | 'replace_groom'
  | 'replace_bride'
  | 'make_groom'
  | 'make_bride'
  | 'gold';

const PRICE_TABLE_RULES: Array<{
  type: ChallengeType | 'replace_role';
  exactCoins?: number;
  minCoins?: number;
  keywords: readonly string[];
}> = [
  { type: 'end_live', minCoins: 1000, keywords: [' ten lua ', ' rocket ', ' end live ', ' su tu ', ' lion '] },
  { type: 'dong_phong', exactCoins: 150, keywords: [' dong phong hoa chuc ', ' dong phong ', ' lau dai ', ' castle '] },
  { type: 'marry_mc', exactCoins: 99, keywords: [' ban tim ', ' cuoi mc ', ' love bang ', ' shooting heart ', ' finger heart '] },
  { type: 'cancel', exactCoins: 99, keywords: [' hac giay ', ' paper crane ', ' crane ', ' origami ', ' huy hon '] },
  { type: 'take_photo', exactCoins: 50, keywords: [' may anh ', ' camera ', ' chup poster ', ' chup hinh '] },
  { type: 'dance', exactCoins: 30, keywords: [' qua dao ', ' peach ', ' donut ', ' doughnut ', ' banh donut '] },
  { type: 'replace_role', exactCoins: 20, keywords: [' kinh ram ', ' sunglasses ', ' sunglass ', ' thay co dau ', ' thay chu re '] },
  { type: 'make_groom', exactCoins: 10, keywords: [' chu heo may man ', ' chu heo ', ' heo may man ', ' little piggy ', ' piggy ', ' pig '] },
  { type: 'make_bride', exactCoins: 10, keywords: [' co 4 la ', ' co bon la ', ' four leaf clover ', ' clover ', ' lam co dau '] },
  { type: 'gold', exactCoins: 1, keywords: [' hoa hong ', ' rose '] },
];

/**
 * Đối chiếu quà tặng từ TikTok theo đúng quy tắc:
 * Bắt buộc khớp CẢ tên quà lẫn đúng giá xu đơn vị (diamondCount) trong Bảng Giá.
 * Đúng giá xu nhưng sai tên quà (hoặc đúng tên quà nhưng sai xu) sẽ trả về null.
 */
export function matchPriceTableGift(
  giftName: string,
  unitCoins: number,
  hasGroom: boolean,
  hasBride: boolean,
): ChallengeType | null {
  const normalized = plain(giftName || '');
  if (!normalized.trim()) return null;

  for (const rule of PRICE_TABLE_RULES) {
    const coinsOk =
      (rule.exactCoins !== undefined && unitCoins === rule.exactCoins) ||
      (rule.minCoins !== undefined && unitCoins >= rule.minCoins);
    if (!coinsOk) continue;

    const nameOk = rule.keywords.some((kw) => normalized.includes(kw));
    if (!nameOk) continue;

    if (rule.type === 'replace_role') {
      if (normalized.includes(' chu re ')) return 'replace_groom';
      if (normalized.includes(' co dau ')) return 'replace_bride';
      if (hasGroom && !hasBride) return 'replace_groom';
      if (hasBride && !hasGroom) return 'replace_bride';
      return Math.random() < 0.5 ? 'replace_groom' : 'replace_bride';
    }

    return rule.type;
  }

  return null;
}

export interface RealGuest {
  id: string;
  name: string;
  avatar?: string;
  sprite: string;
  x: number; // 0 - 1080
  y: number; // 1110 - 1598 (quây quanh & phía dưới bục sân khấu, không leo lên che Cô Dâu/Chú Rể)
  scale: number;
  bubble: { text: string; until: number } | null;
  isDancing?: boolean;
  zIndex: number;
  isFake?: boolean;
  lastActive?: number;
  posIdx?: number;
}

export interface RealPerson {
  id: string;
  name: string;
  avatar?: string;
}

export interface DongPhongEvent {
  donor: string;
  donorAvatar?: string;
  groom: string;
  groomAvatar?: string;
  bride: string;
  brideAvatar?: string;
  until: number;
}

export interface McCelebration {
  partnerName: string;
  partnerAvatar?: string;
  isSteal?: boolean;
  oldPartnerName?: string;
  until: number;
}

export interface NoticeBanner {
  title: string;
  subtitle?: string;
  icon?: string;
  until: number;
}

export interface GiftAlert {
  user: string;
  avatar?: string;
  giftName: string;
  coins: number;
  icon?: string;
  until: number;
}

export interface EndLiveEvent {
  donor: string;
  donorAvatar?: string;
  coins: number;
  until: number;
}

export interface PhotoEvent {
  donor: string;
  donorAvatar?: string;
  groom: string;
  groomAvatar?: string;
  bride: string;
  brideAvatar?: string;
  dateStr: string;
  likes: number;
  likerNames: string[];
  coupleNo: number;
  until: number;
}

export const GUEST_SPRITES_M = ['guest_m1', 'guest_m2', 'guest_m3', 'guest_m4', 'guest_m5', 'guest_m6', 'guest_m7'];
export const GUEST_SPRITES_F = ['guest_f1', 'guest_f2', 'guest_f3', 'guest_f4', 'guest_f5', 'guest_f6', 'guest_f7', 'guest_f8'];
export const ALL_SPRITES = [...GUEST_SPRITES_M, ...GUEST_SPRITES_F];

/** Tạo mạng lưới vị trí đứng tự nhiên kiểu phân tán ngẫu nhiên (từ giữa lan ra 2 dãy ghế, không xếp hàng thẳng tắp) */
function generateGuestPositions(): Array<{ x: number; y: number; scale: number }> {
  const positions: Array<{ x: number; y: number; scale: number }> = [];

  // PRNG cố định theo seed để vị trí đứng tự nhiên, lộn xộn có trật tự và ổn định qua các lần load
  let seed = 20261110;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const minSafeYAt = (x: number) => (x > 335 && x < 745 ? 1148 : 1112);
  const scaleAt = (y: number) => {
    const t = Math.max(0, Math.min(1, (y - 1112) / (1595 - 1112)));
    return Number((0.55 + t * 0.37).toFixed(2));
  };

  const canPlace = (x: number, y: number, sc: number, sepX: number, sepY: number) => {
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const avgS = (sc + p.scale) * 0.5;
      const dx = (x - p.x) / (sepX * avgS);
      const dy = (y - p.y) / (sepY * avgS);
      if (dx * dx + dy * dy < 1) return false;
    }
    return true;
  };

  // 1. 6 vị trí đầu tiên: tập trung ở khu vực giữa thảm đỏ (hơi so le tự nhiên chứ không đóng khung thẳng hàng)
  const initialCenterSlots: Array<{ x: number; y: number }> = [
    { x: 438, y: 1468 },
    { x: 644, y: 1496 },
    { x: 548, y: 1326 },
    { x: 412, y: 1218 },
    { x: 668, y: 1236 },
    { x: 526, y: 1572 },
  ];
  for (const s of initialCenterSlots) {
    positions.push({ x: s.x, y: s.y, scale: scaleAt(s.y) });
  }

  // 2. Mở rộng dần từ giữa ra ngoài qua 4 đợt mật độ (tránh xếp hàng dọc/ngang cứng nhắc)
  // Đợt 1: 30 người tiếp theo đứng thưa thoáng, từ tâm lan dần sang cả khu vực ghế hai bên
  for (let attempt = 0; attempt < 2400 && positions.length < 36; attempt++) {
    const progress = (positions.length - 6) / 30;
    const maxSpread = 220 + progress * 246; // lan từ +-220px ra tới toàn chiều ngang [74..1006]
    // Nghiêng xác suất nhẹ từ giữa ra ngoài để khách luôn mọc tự nhiên từ lối đi ra ghế
    const u = (rand() - rand()) * 0.5 + 0.5; // phân bố tam giác quanh tâm (0..1, đỉnh ở 0.5)
    const dir = rand() < 0.5 ? -1 : 1;
    const x = Math.max(74, Math.min(1006, Math.round(540 + dir * Math.pow(u, 0.72) * maxSpread)));
    const minY = minSafeYAt(x);
    const y = Math.round(minY + rand() * (1594 - minY));
    const sc = scaleAt(y);
    if (canPlace(x, y, sc, 118, 96)) {
      positions.push({ x, y, scale: sc });
    }
  }

  // Đợt 2..4: lấp đầy dần từ trong ra ngoài đến > 600 chỗ bằng Poisson ngẫu nhiên không tạo hàng lối
  const waves: Array<{ target: number; tries: number; sepX: number; sepY: number }> = [
    { target: 96, tries: 4500, sepX: 82, sepY: 66 },
    { target: 220, tries: 7000, sepX: 52, sepY: 42 },
    { target: 680, tries: 16000, sepX: 25, sepY: 22 },
  ];

  for (const wave of waves) {
    for (let attempt = 0; attempt < wave.tries && positions.length < wave.target; attempt++) {
      // Ưu tiên điểm gần tâm trước rồi lan ngẫu nhiên toàn bộ [74..1006]
      const bias = Math.pow(rand(), 0.8);
      const dir = rand() < 0.5 ? -1 : 1;
      const x = Math.max(74, Math.min(1006, Math.round(540 + dir * bias * 466)));
      const minY = minSafeYAt(x);
      const y = Math.round(minY + rand() * (1594 - minY));
      const sc = scaleAt(y);
      if (canPlace(x, y, sc, wave.sepX, wave.sepY)) {
        positions.push({ x, y, scale: sc });
      }
    }
  }

  return positions;
}

export const GUEST_POSITIONS: Array<{ x: number; y: number; scale: number }> = generateGuestPositions();

/** 5 user ảo ban đầu khi vừa mở live: đứng tập trung cân đối ngay chính giữa thảm đỏ */
const INITIAL_FAKE_GUESTS = [
  { name: 'Minh Vũ', sprite: 'guest_m1', posIdx: 0 },
  { name: 'Bé Linh 🌸', sprite: 'guest_f1', posIdx: 1 },
  { name: 'Hoàng Trọng', sprite: 'guest_m2', posIdx: 2 },
  { name: 'Ái Phi ✨', sprite: 'guest_f4', posIdx: 3 },
  { name: 'Khánh Linh 💕', sprite: 'guest_f2', posIdx: 4 },
];

/** Khởi tạo chỉ khoảng 4-5 user giả đứng dưới sân khấu */
export function createDefaultGuests(): RealGuest[] {
  return INITIAL_FAKE_GUESTS.map((fake, idx) => {
    const pos = GUEST_POSITIONS[fake.posIdx] || GUEST_POSITIONS[idx];
    return {
      id: `fake_${idx + 1}`,
      name: fake.name,
      sprite: fake.sprite,
      x: pos.x,
      y: pos.y,
      scale: pos.scale,
      bubble: null,
      zIndex: Math.floor(pos.y),
      isFake: true,
      lastActive: Date.now(),
      posIdx: fake.posIdx,
    };
  });
}

function detectIsFemale(name: string): boolean {
  return /(em|bé|be|cô|chị|lan|mai|hoa|thảo|ngọc|hương|trang|yến|linh|chi|vy|phương|dung|hân|phi|quyên|thư|hà|nhi|ngân|hồng|bích|búp|gái|nữ)/i.test(name);
}

/** Thêm hoặc cập nhật user khi vào live, comment, donate hoặc tương tác */
export function addOrUpdateGuest(
  guests: RealGuest[],
  username: string,
  nickname: string,
  avatar?: string,
  action?: 'join' | 'chat' | 'gift' | 'like' | 'follow'
): RealGuest[] {
  const existingIdx = guests.findIndex((g) => g.id === username);
  const now = Date.now();

  // Nếu user đã có mặt trong sảnh tiệc: cập nhật thông tin và thời gian hoạt động
  if (existingIdx >= 0) {
    const updated = [...guests];
    const cur = updated[existingIdx];
    let bubble = cur.bubble;
    if (action === 'join' && (!bubble || bubble.until < now)) {
      bubble = { text: 'Hello mn 👋', until: now + 4000 };
    } else if (action === 'follow' && (!bubble || bubble.until < now)) {
      bubble = { text: 'Đã follow kênh ❤️', until: now + 4500 };
    }
    updated[existingIdx] = {
      ...cur,
      name: nickname || cur.name,
      avatar: avatar || cur.avatar,
      bubble,
      lastActive: now,
    };
    return updated;
  }

  // User mới chưa có mặt: tìm 1 vị trí trống để đứng
  const usedPositions = new Set(guests.map((g) => g.posIdx ?? -1));
  let targetPosIdx = -1;

  // 1. Tìm vị trí hoàn toàn trống trong danh sách vị trí (> 500 chỗ)
  for (let i = 0; i < GUEST_POSITIONS.length; i++) {
    if (!usedPositions.has(i)) {
      targetPosIdx = i;
      break;
    }
  }

  const updated = [...guests];

  // 2. Nếu đã kín tất cả vị trí (hơn 500 khách): thay thế khách giả trước
  if (targetPosIdx === -1) {
    const fakeIdx = updated.findIndex((g) => g.isFake);
    if (fakeIdx >= 0) {
      targetPosIdx = updated[fakeIdx].posIdx ?? 0;
      updated.splice(fakeIdx, 1);
    } else {
      // Nếu không còn khách giả: thay thế người ít hoạt động nhất
      let oldestIdx = 0;
      let oldestTime = Infinity;
      for (let i = 0; i < updated.length; i++) {
        const time = updated[i].lastActive ?? 0;
        if (time < oldestTime) {
          oldestTime = time;
          oldestIdx = i;
        }
      }
      targetPosIdx = updated[oldestIdx].posIdx ?? 0;
      updated.splice(oldestIdx, 1);
    }
  }

  const pos = GUEST_POSITIONS[targetPosIdx] || GUEST_POSITIONS[0];
  const isFemale = detectIsFemale(nickname || username);
  const sprite = isFemale
    ? GUEST_SPRITES_F[Math.floor(Math.random() * GUEST_SPRITES_F.length)]
    : GUEST_SPRITES_M[Math.floor(Math.random() * GUEST_SPRITES_M.length)];

  let initialBubble: { text: string; until: number } | null = null;
  if (action === 'join') {
    initialBubble = { text: 'Hello mn 👋', until: now + 4000 };
  } else if (action === 'follow') {
    initialBubble = { text: 'Đã follow kênh ❤️', until: now + 4500 };
  } else if (action === 'gift') {
    initialBubble = { text: 'Đã tặng quà 🎁', until: now + 4000 };
  }

  const newGuest: RealGuest = {
    id: username,
    name: nickname || username,
    avatar,
    sprite,
    x: pos.x,
    y: pos.y,
    scale: pos.scale,
    bubble: initialBubble,
    zIndex: Math.floor(pos.y),
    isFake: false,
    lastActive: now,
    posIdx: targetPosIdx,
  };

  updated.push(newGuest);
  return updated;
}

/** Thêm bong bóng chat trên đầu khách khi comment */
export function addGuestBubble(
  guests: RealGuest[],
  username: string,
  nickname: string,
  comment: string,
  avatar?: string
): RealGuest[] {
  let list = addOrUpdateGuest(guests, username, nickname, avatar, 'chat');
  const idx = list.findIndex((g) => g.id === username);
  if (idx >= 0) {
    const updated = [...list];
    updated[idx] = {
      ...updated[idx],
      bubble: {
        text: comment.length > 28 ? comment.slice(0, 27) + '…' : comment,
        until: Date.now() + 4500,
      },
      lastActive: Date.now(),
    };
    return updated;
  }
  return list;
}
