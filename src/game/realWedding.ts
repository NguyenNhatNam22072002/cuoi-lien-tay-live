// Quản lý trạng thái giao diện tiệc cưới người thật (Real Wedding Stream)
export type WeddingTheme = 'red' | 'navy' | 'gold' | 'pink';

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
  bride: string;
  until: number;
}

export interface NoticeBanner {
  title: string;
  subtitle?: string;
  icon?: string;
  until: number;
}

export const GUEST_SPRITES_M = ['guest_m1', 'guest_m2', 'guest_m3', 'guest_m4', 'guest_m5', 'guest_m6', 'guest_m7'];
export const GUEST_SPRITES_F = ['guest_f1', 'guest_f2', 'guest_f3', 'guest_f4', 'guest_f5', 'guest_f6', 'guest_f7', 'guest_f8'];
export const ALL_SPRITES = [...GUEST_SPRITES_M, ...GUEST_SPRITES_F];

const DEFAULT_GUEST_NAMES = [
  'Trường_An', 'Lan Anh Nguyễn', 'mạnh huệ', 'hieu-kyo', 'hoththuan217',
  'Lơ ngơ biết làm thơ', 'Ngọc Quyền', 'Bé Linh', 'Xuân Quy', 'Kim Diệu',
  'Diên', 'Hoàng Trọng', 'Minh Vũ', 'Phúc Khang', 'Bá Thông',
  'Ái Phi', 'Ngọc Hân', 'Thanh Hà', 'Bellingham', 'Thư nè',
  'Phương Dung', 'Anh Vũ', 'Văn Toàn', 'Khánh Linh', 'Tuấn Kiệt'
];

/** Tọa độ 24 khách mời theo phối cảnh thảm đỏ tiệc cưới (xa nhỏ, gần to) */
export function createDefaultGuests(): RealGuest[] {
  const positions: Array<{ x: number; y: number; scale: number; sprite: string }> = [
    // Hàng xa nhất (gần sân khấu) - scale 0.58 - 0.65
    { x: 310, y: 940, scale: 0.60, sprite: 'guest_m1' },
    { x: 420, y: 930, scale: 0.58, sprite: 'guest_f2' },
    { x: 540, y: 920, scale: 0.58, sprite: 'guest_m4' },
    { x: 660, y: 930, scale: 0.58, sprite: 'guest_f3' },
    { x: 770, y: 940, scale: 0.60, sprite: 'guest_m2' },

    // Hàng 2 - scale 0.70 - 0.78
    { x: 230, y: 1040, scale: 0.72, sprite: 'guest_f1' },
    { x: 350, y: 1060, scale: 0.74, sprite: 'guest_m3' },
    { x: 470, y: 1050, scale: 0.72, sprite: 'guest_f5' },
    { x: 610, y: 1050, scale: 0.72, sprite: 'guest_m5' },
    { x: 730, y: 1060, scale: 0.74, sprite: 'guest_f4' },
    { x: 850, y: 1040, scale: 0.72, sprite: 'guest_m6' },

    // Hàng 3 - scale 0.84 - 0.92
    { x: 170, y: 1180, scale: 0.86, sprite: 'guest_m7' },
    { x: 300, y: 1200, scale: 0.88, sprite: 'guest_f6' },
    { x: 440, y: 1170, scale: 0.85, sprite: 'guest_m2' },
    { x: 600, y: 1170, scale: 0.85, sprite: 'guest_f7' },
    { x: 740, y: 1200, scale: 0.88, sprite: 'guest_m1' },
    { x: 890, y: 1180, scale: 0.86, sprite: 'guest_f8' },

    // Hàng trước mặt (cận cảnh) - scale 1.0 - 1.15
    { x: 110, y: 1360, scale: 1.05, sprite: 'guest_f2' },
    { x: 250, y: 1400, scale: 1.10, sprite: 'guest_m1' },
    { x: 390, y: 1380, scale: 1.08, sprite: 'guest_f1' },
    { x: 650, y: 1380, scale: 1.08, sprite: 'guest_m6' },
    { x: 800, y: 1400, scale: 1.10, sprite: 'guest_f4' },
    { x: 940, y: 1360, scale: 1.05, sprite: 'guest_m7' },
    { x: 520, y: 1440, scale: 1.15, sprite: 'guest_m3' },
  ];

  return positions.map((pos, idx) => ({
    id: `guest_seat_${idx}`,
    name: DEFAULT_GUEST_NAMES[idx] || `Khách ${idx + 1}`,
    sprite: pos.sprite,
    x: pos.x,
    y: pos.y,
    scale: pos.scale,
    bubble: null,
    zIndex: Math.floor(pos.y),
  }));
}

/** Gán hoặc cập nhật khách trong phòng */
export function assignGuest(
  guests: RealGuest[],
  username: string,
  nickname: string,
  avatar?: string
): RealGuest[] {
  const existingIdx = guests.findIndex((g) => g.id === username);
  if (existingIdx >= 0) {
    const updated = [...guests];
    updated[existingIdx] = {
      ...updated[existingIdx],
      name: nickname || updated[existingIdx].name,
      avatar: avatar || updated[existingIdx].avatar,
    };
    return updated;
  }

  // Chọn 1 vị trí chưa có người thật (hoặc vị trí ngẫu nhiên ở hàng trước)
  const defaultIdx = guests.findIndex((g) => g.id.startsWith('guest_seat_'));
  const targetIdx = defaultIdx >= 0 ? defaultIdx : Math.floor(Math.random() * guests.length);

  const updated = [...guests];
  const old = updated[targetIdx];
  const isFemale = /^(em|bé|cô|chị|lan|mai|hoa|thảo|ngọc|hương|trang|yến|linh|chi|vy)/i.test(nickname);
  const sprite = isFemale
    ? GUEST_SPRITES_F[Math.floor(Math.random() * GUEST_SPRITES_F.length)]
    : GUEST_SPRITES_M[Math.floor(Math.random() * GUEST_SPRITES_M.length)];

  updated[targetIdx] = {
    ...old,
    id: username,
    name: nickname || old.name,
    avatar: avatar || old.avatar,
    sprite: sprite,
  };
  return updated;
}

/** Thêm bong bóng chat trên đầu khách */
export function addGuestBubble(
  guests: RealGuest[],
  username: string,
  nickname: string,
  comment: string,
  avatar?: string
): RealGuest[] {
  let list = assignGuest(guests, username, nickname, avatar);
  const idx = list.findIndex((g) => g.id === username);
  if (idx >= 0) {
    const updated = [...list];
    updated[idx] = {
      ...updated[idx],
      bubble: {
        text: comment.length > 25 ? comment.slice(0, 24) + '…' : comment,
        until: Date.now() + 4500,
      },
    };
    return updated;
  }
  return list;
}
