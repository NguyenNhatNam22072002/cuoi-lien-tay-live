import { useEffect, useState, type ReactNode } from 'react';
import { emitTest, sendControl } from '../live/page';
import { GAME } from './config';

// Danh sách khách mô phỏng
const NAMES = [
  'Lan Anh Nguyễn', 'Minh Tuấn', 'Bé Na 🌸', 'Hoàng Long', 'Thu Trang',
  'Quốc Bảo', 'duyanh99', 'Ngọc Hân', 'Gia Huy', 'Khánh Linh',
  'Mai Phương', 'Tuấn Kiệt', 'Hải Yến', 'Đức Anh', 'Phương Thảo',
  'Bảo Ngọc', 'Trọng Nhân', 'Thanh Hà', 'Kim Chi 💖', 'Văn Toàn',
  'Trường_An ✈️', 'mạnh huệ', 'hieu-kyo', 'hoththuan217', 'Lơ ngơ biết làm thơ'
];

const POOL = Array.from({ length: 25 }, (_, i) => {
  const nickname = NAMES[i % NAMES.length];
  return { nickname, username: `khach_${i}` };
});
type P = (typeof POOL)[number];

const CHATS = [
  'Hello mn',
  'Chúc mừng hai bạn! 🎉',
  'Đẹp đôi quá trời',
  'Cưới liền tay thôi nào',
  'Dzô dzô dzô 🍻',
  'Hôn đi hôn đi 💋',
  'Cô dâu xinh quá',
  'Chú rể bảnh bao ghê',
  'Quẩy lên anh em ơi 💃',
  'Nhạc đám cưới hay quá',
  'Mừng 1 chỉ vàng nha',
  'Ai cưới mình không?',
  'Hai họ đẹp lòng quá',
];

const anyone = () => POOL[Math.floor(Math.random() * POOL.length)];
const chat = (who: P, comment: string) => emitTest('chat', { ...who, comment });
const gift = (who: P, diamondCount: number, giftName: string) =>
  emitTest('gift', { ...who, giftName, giftId: 1, diamondCount, repeatCount: 1 });

const many = (n: number, f: (i: number) => void) => {
  for (let i = 0; i < n; i++) setTimeout(() => f(i), i * 250);
};

export function GameControls({ stageCount = 0 }: { stageCount?: number }) {
  const [auto, setAuto] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      return localStorage.getItem('wedding-theme') || 'red';
    } catch {
      return 'red';
    }
  });
  const [musicOn, setMusicOn] = useState(true);
  const [musicVol, setMusicVol] = useState(() => {
    try {
      return Number(localStorage.getItem('cuoi3d-music-vol')) || 100;
    } catch {
      return 100;
    }
  });

  const selectTheme = (t: string) => {
    setActiveTheme(t);
    try {
      localStorage.setItem('wedding-theme', t);
    } catch {}
    void sendControl('custom', `theme:${t}`);
  };

  const changeVol = (v: number) => {
    setMusicVol(v);
    try {
      localStorage.setItem('cuoi3d-music-vol', String(v));
    } catch {}
    void sendControl('custom', `musicVol:${v}`);
  };

  // Live giả: khách vào, comment liên tục, thỉnh thoảng có người tặng quà hoặc giục hôn
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      const w = anyone();
      const r = Math.random();

      if (r < 0.05) {
        // Cưới MC (99 xu)
        gift(w, 99, 'Bắn Tim / Cưới MC');
      } else if (r < 0.12) {
        // Làm Chú rể hoặc Cô dâu (10 xu)
        if (Math.random() < 0.5) gift(w, 10, 'Chú Heo May Mắn');
        else gift(w, 10, 'Cỏ Bốn Lá');
      } else if (r < 0.18) {
        // Góp vui nhảy (30 xu)
        gift(w, 30, 'Quả Đào');
      } else if (r < 0.28) {
        // Mừng hoa hồng (1 xu)
        gift(w, 1, 'Hoa hồng');
      } else if (r < 0.40) {
        // Giục hôn, nhảy hoặc dzô
        const act = Math.random();
        chat(w, act < 0.33 ? 'hôn đi' : act < 0.66 ? 'dzô' : 'nhảy');
      } else {
        // Comment thường hiện bong bóng trên đầu khách
        chat(w, CHATS[Math.floor(Math.random() * CHATS.length)]);
      }
    }, 1100);

    return () => clearInterval(t);
  }, [auto]);

  return (
    <section className="space-y-2 rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800 text-slate-200">
      {stageCount > 1 && (
        <p className="rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-xs text-amber-300">
          ⚠ Đang có {stageCount} trang stage mở cùng lúc (2 nguồn Link trong LIVE Studio hoặc thêm tab ?view=stage). Chỉ trang mở sau cùng phát tiếng; nên xoá bớt nguồn thừa.
        </p>
      )}

      {/* 1. THỬ THÁCH DONATE VIRAL (CHUẨN TIKTOK) */}
      <Row label="Thử Thách Live">
        <B onClick={() => gift(anyone(), 10, 'Cỏ Bốn Lá')}>
          🍀 Làm Cô Dâu (10 xu)
        </B>
        <B onClick={() => gift(anyone(), 10, 'Chú Heo May Mắn')}>
          🐷 Làm Chú Rể (10 xu)
        </B>
        <B onClick={() => gift(anyone(), 20, 'Kính Râm / Thay Cô Dâu')}>
          👰 Thay Cô Dâu (20 xu)
        </B>
        <B onClick={() => gift(anyone(), 20, 'Kính Râm / Thay Chú Rể')}>
          👑 Thay Chú Rể (20 xu)
        </B>
        <B onClick={() => gift(anyone(), 50, 'Máy Ảnh / Chụp Poster')}>
          📷 Chụp Poster Cưới (50 xu)
        </B>
        <B onClick={() => gift(anyone(), 99, 'Bắn Tim / Cưới MC')}>
          🎤 Cưới MC (99 xu)
        </B>
        <B onClick={() => gift(anyone(), 150, 'Động Phòng Hoa Chúc')}>
          🏰 Vào Động Phòng (150 xu)
        </B>
        <B onClick={() => gift(anyone(), 1000, 'Tên Lửa / End Live')}>
          🚀 End Live (1000 xu)
        </B>
        <B onClick={() => gift(anyone(), 30, 'Quả Đào')}>
          🍑 Góp Vui Nhảy (30 xu)
        </B>
        <B onClick={() => gift(anyone(), 99, 'Hạc Giấy')}>
          🕊️ Hủy Hôn (99 xu)
        </B>
        <B onClick={() => gift(anyone(), 1, 'Hoa hồng')}>
          🌹 Mừng 1 Chỉ (1 xu)
        </B>
        <B onClick={() => chat(anyone(), 'hôn đi')}>
          💋 Chú Rể Hôn Cô Dâu
        </B>
      </Row>

      {/* 2. CHUYỂN THEME SÂN KHẤU TIỆC CƯỚI */}
      <Row label="Theme Sân Khấu">
        <B onClick={() => selectTheme('red')} on={activeTheme === 'red'}>
          🔴 Đỏ Vàng Hoàng Gia
        </B>
        <B onClick={() => selectTheme('navy')} on={activeTheme === 'navy'}>
          🔵 Xanh Đêm Hoàng Gia
        </B>
        <B onClick={() => selectTheme('gold')} on={activeTheme === 'gold'}>
          🟡 Thu Vàng Kim
        </B>
        <B onClick={() => selectTheme('pink')} on={activeTheme === 'pink'}>
          🌸 Hồng Hoa Anh Đào
        </B>
      </Row>

      {/* 3. TỰ ĐỘNG LIVE GIẢ */}
      <Row label="Mô Phỏng Live">
        <B onClick={() => setAuto((a) => !a)} on={auto}>
          {auto ? '⏸ Dừng Live Giả' : '⚡ BẬT LIVE GIẢ (Khách chat & Donate tự động)'}
        </B>
        <B onClick={() => many(6, () => chat(anyone(), CHATS[Math.floor(Math.random() * CHATS.length)]))}>
          💬 6 Khách Chat
        </B>
        <B onClick={() => many(6, () => chat(anyone(), 'dzô'))}>
          🍻 6 Khách Hô Dzô
        </B>
        <B onClick={() => chat(anyone(), 'nhảy thôi anh em')}>
          💃 Ra Sàn Nhảy
        </B>
      </Row>

      {/* 4. ÂM THANH & ĐIỀU KHIỂN CHUNG */}
      <Row label="Âm Thanh">
        <B
          on={musicOn}
          onClick={() => {
            const next = !musicOn;
            setMusicOn(next);
            void sendControl('custom', next ? 'music:on' : 'music:off');
          }}
        >
          {musicOn ? '🎵 Nhạc tiệc: BẬT' : '🔇 Nhạc tiệc: TẮT'}
        </B>
        <label className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1 text-xs">
          Âm lượng
          <input
            type="range"
            min={0}
            max={200}
            step={10}
            value={musicVol}
            onChange={(e) => changeVol(Number(e.target.value))}
            className="w-20 accent-amber-500"
          />
          <b className="w-8 text-right">{musicVol}%</b>
        </label>
        <B onClick={() => void sendControl('custom', 'clearStage')}>
          ✖ Dọn sạch sân khấu
        </B>
      </Row>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-24 flex-none text-xs font-semibold text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function B({ children, onClick, on }: { children: ReactNode; onClick: () => void; on?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
        on
          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
