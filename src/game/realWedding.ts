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
  y: number; // 920 - 1520
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

/** Tạo mạng lưới vị trí đứng chuẩn phối cảnh khắp sảnh tiệc chứa hơn 500 khách */
function generateGuestPositions(): Array<{ x: number; y: number; scale: number }> {
  const positions: Array<{ x: number; y: number; scale: number }> = [];

  // 1. VIP Carpet & Stairs Aisle (28 vị trí vàng hand-tuned trên thảm đỏ & bậc thang, tăng kích cỡ scale 0.72 - 1.20)
  const vipSlots = [
    // Hàng 1 (Ngay chân bậc thang sân khấu) - scale 0.72 - 0.74
    { x: 320, y: 1060, scale: 0.74 },
    { x: 430, y: 1050, scale: 0.72 },
    { x: 540, y: 1045, scale: 0.72 },
    { x: 650, y: 1050, scale: 0.72 },
    { x: 760, y: 1060, scale: 0.74 },

    // Hàng 2 (Bậc thang số 2) - scale 0.82 - 0.84
    { x: 250, y: 1160, scale: 0.82 },
    { x: 360, y: 1175, scale: 0.84 },
    { x: 480, y: 1165, scale: 0.82 },
    { x: 600, y: 1165, scale: 0.82 },
    { x: 720, y: 1175, scale: 0.84 },
    { x: 830, y: 1160, scale: 0.82 },

    // Hàng 3 (Bậc thang số 3) - scale 0.94 - 0.96
    { x: 190, y: 1280, scale: 0.94 },
    { x: 320, y: 1295, scale: 0.96 },
    { x: 450, y: 1275, scale: 0.94 },
    { x: 540, y: 1290, scale: 0.95 },
    { x: 630, y: 1275, scale: 0.94 },
    { x: 750, y: 1295, scale: 0.96 },
    { x: 880, y: 1280, scale: 0.94 },

    // Hàng 4 (Thảm đỏ chính diện) - scale 1.05 - 1.08
    { x: 150, y: 1400, scale: 1.05 },
    { x: 280, y: 1415, scale: 1.08 },
    { x: 410, y: 1395, scale: 1.05 },
    { x: 540, y: 1405, scale: 1.06 },
    { x: 670, y: 1395, scale: 1.05 },
    { x: 800, y: 1415, scale: 1.08 },
    { x: 920, y: 1400, scale: 1.05 },

    // Hàng 5 (Tiền cảnh gần camera thảm đỏ) - scale 1.18 - 1.20
    { x: 220, y: 1520, scale: 1.18 },
    { x: 540, y: 1535, scale: 1.20 },
    { x: 850, y: 1520, scale: 1.18 },
  ];

  for (const s of vipSlots) {
    positions.push(s);
  }

  // 2. Mạng lưới phân bổ đồng đều khắp sảnh tiệc (24 hàng, phủ kín lối đi giữa & các bàn tiệc hai bên)
  // Đảm bảo sảnh chứa hơn 500 người (> 580 vị trí độc lập)
  const rows = 24;
  const used = new Set(positions.map((p) => `${Math.round(p.x / 16)}_${Math.round(p.y / 16)}`));

  const aisleSlots: Array<{ x: number; y: number; scale: number }> = [];
  const tableSlots: Array<{ x: number; y: number; scale: number }> = [];

  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const y = Math.round(1040 + t * 790);
    const scale = Number((0.72 + t * 0.48).toFixed(2));

    // Độ rộng thảm đỏ mở rộng dần theo chiều sâu phối cảnh
    const carpetHalf = Math.round(180 + t * 160);
    const carpetLeft = 540 - carpetHalf;
    const carpetRight = 540 + carpetHalf;

    const cols = 24;
    for (let c = 0; c < cols; c++) {
      const stagger = r % 2 === 1 ? 20 : 0;
      const x = Math.round(75 + (c / (cols - 1)) * 930 + stagger + Math.sin(r * 11 + c * 7) * 6);
      if (x < 65 || x > 1015) continue;

      const key = `${Math.round(x / 16)}_${Math.round(y / 16)}`;
      if (used.has(key)) continue;
      used.add(key);

      if (x >= carpetLeft && x <= carpetRight) {
        aisleSlots.push({ x, y, scale });
      } else {
        tableSlots.push({ x, y, scale });
      }
    }
  }

  // Ưu tiên nạp khách vào thảm đỏ trước, rồi mới lan tỏa ra các bàn tiệc hai bên
  positions.push(...aisleSlots);
  positions.push(...tableSlots);

  return positions;
}

export const GUEST_POSITIONS: Array<{ x: number; y: number; scale: number }> = generateGuestPositions();

/** 5 user ảo ban đầu khi vừa mở live (để người xem không thấy cô đơn) */
const INITIAL_FAKE_GUESTS = [
  { name: 'Minh Vũ', sprite: 'guest_m1', posIdx: 6 },
  { name: 'Bé Linh 🌸', sprite: 'guest_f1', posIdx: 8 },
  { name: 'Hoàng Trọng', sprite: 'guest_m2', posIdx: 13 },
  { name: 'Ái Phi ✨', sprite: 'guest_f4', posIdx: 16 },
  { name: 'Khánh Linh 💕', sprite: 'guest_f2', posIdx: 21 },
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
