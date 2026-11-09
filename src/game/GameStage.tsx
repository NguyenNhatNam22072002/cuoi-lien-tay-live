import { useEffect, useRef, useState } from 'react';
import type { GameState } from './useGame';
import './stage.css';

const DEFAULT_TOP = [
  { id: 't1', name: 'MaiTruonggg', coins: 9 },
  { id: 't2', name: 'iu suu 💕', coins: 8 },
  { id: 't3', name: 'LuNar 🌸', coins: 7 },
  { id: 't4', name: 'Hoàng Trọng', coins: 4 },
  { id: 't5', name: 'Kim Chi 💖', coins: 3 },
];

export function GameStage({ game }: { game: GameState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setTick] = useState(0);

  // Re-render mỗi giây để cập nhật đồng hồ và bong bóng chat
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  // Canvas hiệu ứng cánh hoa hồng và trái tim bay lơ lửng
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const petals: Array<{ x: number; y: number; s: number; sp: number; r: number; rs: number; a: number }> = [];
    const hearts: Array<{ x: number; y: number; s: number; sp: number; a: number; sway: number }> = [];

    // Sinh 40 cánh hoa ban đầu
    for (let i = 0; i < 40; i++) {
      petals.push({
        x: Math.random() * 1080,
        y: Math.random() * 1920,
        s: 14 + Math.random() * 16,
        sp: 1.5 + Math.random() * 2.5,
        r: Math.random() * Math.PI * 2,
        rs: (Math.random() - 0.5) * 0.05,
        a: 0.4 + Math.random() * 0.5,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, 1080, 1920);

      // Vẽ cánh hoa hồng rơi
      for (const p of petals) {
        p.y += p.sp;
        p.x += Math.sin(p.r) * 1.2;
        p.r += p.rs;
        if (p.y > 1920) {
          p.y = -30;
          p.x = Math.random() * 1080;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s * 0.7, p.s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Khi quẩy hoặc có cặp đôi: sinh thêm tim bay lên
      if ((game.isDancing || game.isKissing || (game.groom && game.bride)) && Math.random() < 0.25) {
        hearts.push({
          x: 200 + Math.random() * 680,
          y: 1600,
          s: 18 + Math.random() * 22,
          sp: 2 + Math.random() * 3,
          a: 1,
          sway: Math.random() * Math.PI * 2,
        });
      }

      for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        h.y -= h.sp;
        h.x += Math.sin(h.sway) * 1.5;
        h.sway += 0.05;
        h.a -= 0.007;

        if (h.a <= 0 || h.y < 200) {
          hearts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = h.a;
        ctx.font = `${h.s}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('💖', h.x, h.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [game.isDancing, game.isKissing, !!game.groom, !!game.bride]);

  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  // Tên hiển thị trên vòng tròn lễ thành hôn
  let centerNames = 'TẶNG CHÚ HEO & TẶNG CỎ 4 LÁ';
  if (game.groom && game.bride) {
    centerNames = `${game.groom.name} & ${game.bride.name}`;
  } else if (game.groom) {
    centerNames = `${game.groom.name} & TẶNG CỎ 4 LÁ`;
  } else if (game.bride) {
    centerNames = `TẶNG CHÚ HEO & ${game.bride.name}`;
  }

  // Danh sách đại gia mừng cưới
  const displayTop = (game.top && game.top.length > 0) ? game.top : DEFAULT_TOP;

  // Lấy ảnh nền theo theme đã chọn
  const bgImage = `/assets/wedding/backgrounds/theme_${game.theme || 'red'}.jpg`;

  const now = Date.now();

  return (
    <div className="rw-stage">
      {/* 1. NỀN TIỆC CƯỚI THEO THEME */}
      <img src={bgImage} className="rw-bg" alt="Wedding Stage Background" />
      <div className="rw-stage-vignette" />

      {/* Hiệu ứng hào quang tháp sâm panh và bánh cưới */}
      <div className="rw-champagne-glow" />
      <div className="rw-cake-glow" />

      {/* Canvas cánh hoa hồng & trái tim bay lơ lửng */}
      <canvas ref={canvasRef} width={1080} height={1920} className="rw-particle-canvas" />

      {/* 2. BACKDROP VÒNG TRÒN LỄ THÀNH HÔN (TRÊN SÂN KHẤU) */}
      <div className="rw-backdrop-circle">
        <div className="rw-backdrop-title">LỄ THÀNH HÔN</div>
        <div className="rw-backdrop-names">{centerNames}</div>
        <div className="rw-backdrop-date">{dateStr}</div>
      </div>

      {/* 3. BẢNG TRÁI: CÁCH CHƠI */}
      <div className="rw-card-rules">
        <div className="rw-rules-header">📜 CÁCH CHƠI</div>
        <div className="rw-rules-list">
          <div className="rw-rules-item">
            <span>💬</span> <span>Cmt → vào dự tiệc</span>
          </div>
          <div className="rw-rules-item">
            <span>🎉</span> <span><b>"chúc mừng"</b> → chúc</span>
          </div>
          <div className="rw-rules-item">
            <span>🍻</span> <span><b>"dzô"</b> → hô dzô</span>
          </div>
          <div className="rw-rules-item">
            <span>💃</span> <span><b>"nhảy"</b> → ra nhảy</span>
          </div>
          <div className="rw-rules-item">
            <span>💋</span> <span><b>"hôn đi"</b> → giục hôn</span>
          </div>
        </div>
      </div>

      {/* 4. BẢNG PHẢI: SỐ VÀNG MỪNG CƯỚI */}
      <div className="rw-card-top">
        <div className="rw-top-header">🏆 SỐ VÀNG MỪNG CƯỚI</div>
        <div className="rw-top-list">
          {displayTop.slice(0, 5).map((t, idx) => (
            <div key={t.id || idx} className="rw-top-row">
              <div className="rw-top-user">
                <span className="rw-top-rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}</span>
                <span className="rw-top-name">{t.name}</span>
              </div>
              <span className="rw-top-gold">{t.coins} chỉ</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4.2 BẢNG GIÁ THỬ THÁCH DONATE (CỘT PHẢI - CHUẨN GIÁ QUÀ TIKTOK VIỆT NAM) */}
      <div className="rw-price-card">
        <div className="rw-price-header">🎁 BẢNG GIÁ QUÀ TIKTOK</div>
        <div className="rw-price-list">
          <div className="rw-price-row">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🍀</span>
              <span className="rw-price-item-name">Cỏ 4 Lá (Làm Dâu)</span>
            </div>
            <span className="rw-price-tag">10 xu</span>
          </div>
          <div className="rw-price-row">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🐷</span>
              <span className="rw-price-item-name">Chú Heo (Làm Rể)</span>
            </div>
            <span className="rw-price-tag">10 xu</span>
          </div>
          <div className="rw-price-row">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🍑</span>
              <span className="rw-price-item-name">Quả Đào / Donut (Nhảy)</span>
            </div>
            <span className="rw-price-tag">30 xu</span>
          </div>
          <div className="rw-price-row">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🕊️</span>
              <span className="rw-price-item-name">Hạc Giấy (Hủy Hôn)</span>
            </div>
            <span className="rw-price-tag">99 xu</span>
          </div>
          <div className="rw-price-row special-mc">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🎤</span>
              <span className="rw-price-item-name">Bắn Tim (Cưới MC)</span>
            </div>
            <span className="rw-price-tag" style={{ background: '#c084fc', color: '#1e053a' }}>99 xu</span>
          </div>
          <div className="rw-price-row special-dp">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🏰</span>
              <span className="rw-price-item-name">Động Phòng Hoa Chúc</span>
            </div>
            <span className="rw-price-tag" style={{ background: '#fb7185', color: '#3f0413' }}>150 xu</span>
          </div>
          <div className="rw-price-row">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🌹</span>
              <span className="rw-price-item-name">Hoa Hồng (Mừng Vàng)</span>
            </div>
            <span className="rw-price-tag">1 xu</span>
          </div>
        </div>
      </div>

      {/* 5. MC SÂN KHẤU (BÊN TRÁI BỤC) */}
      <div className="rw-mc-wrap">
        <div className={`rw-mc-tag ${game.mcMarriedTo ? 'rw-mc-tag-married' : ''}`}>
          {game.mcMarriedTo ? `💍 ĐÃ CƯỚI @${game.mcMarriedTo.name}` : `🎤 ${game.channelName || 'Mai Trường'}`}
        </div>
        <img src="/assets/wedding/characters/mc.png" className="rw-mc-img" alt="MC Mai Trường" />
      </div>

      {/* Người tặng cưới MC đứng bên cạnh */}
      {game.mcMarriedTo && (
        <div className="rw-mc-partner">
          <div className="rw-mc-partner-tag">💖 VỢ/CHỒNG MC (99 XU)</div>
          <img src="/assets/wedding/characters/guest_f1.png" className="rw-mc-img" alt={game.mcMarriedTo.name} />
        </div>
      )}

      {/* 6. CÔ DÂU VÀ CHÚ RỂ (HIỂN THỊ TO HƠN TRÊN BỤC ĐỂ AI CŨNG THẤY) */}
      <div className="rw-stage-couple-area">
        {game.isKissing || (game.groom && game.bride) ? (
          /* Tư thế chú rể bế cô dâu hôn nhau (Khoảnh khắc ngọt ngào) */
          <div className="rw-kiss-wrap">
            <div className="rw-kiss-banner">
              <div className="rw-kiss-banner-h">❤️ KHOẢNH KHẮC NGỌT NGÀO ❤️</div>
              <div className="rw-kiss-banner-sub">Chú rể hôn cô dâu — mọi người cùng chúc mừng!</div>
            </div>
            <img src="/assets/wedding/characters/couple_kiss.png" className="rw-kiss-img" alt="Chú rể bế cô dâu hôn nhau" />
          </div>
        ) : game.groom || game.bride ? (
          /* Hiển thị riêng rẽ từng người hoặc đang chờ một nửa */
          <>
            {game.groom && (
              <div className="rw-stage-person">
                <div className="rw-stage-avatar-wrap">
                  <div className="rw-stage-avatar-ring" />
                  <img
                    src={game.groom.avatar || '/assets/wedding/characters/groom.png'}
                    className="rw-stage-avatar-img"
                    alt={game.groom.name}
                  />
                </div>
                <div className="rw-vip-badge">🐷 CHÚ RỂ - HEO MAY MẮN</div>
                <div className="rw-name-badge">@{game.groom.name}</div>
                <img src="/assets/wedding/characters/groom.png" className="rw-groom-img" alt="Chú rể" />
              </div>
            )}
            {game.bride && (
              <div className="rw-stage-person">
                <div className="rw-stage-avatar-wrap">
                  <div className="rw-stage-avatar-ring" />
                  <img
                    src={game.bride.avatar || '/assets/wedding/characters/bride.png'}
                    className="rw-stage-avatar-img"
                    alt={game.bride.name}
                  />
                </div>
                <div className="rw-vip-badge">🍀 CÔ DÂU - CỎ 4 LÁ</div>
                <div className="rw-name-badge">@{game.bride.name}</div>
                <img src="/assets/wedding/characters/bride.png" className="rw-bride-img" alt="Cô dâu" />
              </div>
            )}
          </>
        ) : (
          /* Khi chưa ai cưới: Bảng mời đại gia lên lễ đường */
          <div className="rw-empty-invite">
            💍 Tặng Chú Heo để làm Chú Rể · Tặng Cỏ 4 Lá để làm Cô Dâu 💍
          </div>
        )}
      </div>

      {/* 7. DÀN KHÁCH DỰ TIỆC NGƯỜI THẬT DƯỚI THẢM ĐỎ VÀ BÀN TIỆC */}
      <div className="rw-guests-container">
        {game.realGuests.map((guest) => {
          const hasBubble = guest.bubble && guest.bubble.until > now;
          return (
            <div
              key={guest.id}
              className={`rw-guest-item ${game.isDancing ? 'is-dancing' : ''}`}
              style={
                {
                  left: `${guest.x}px`,
                  top: `${guest.y}px`,
                  zIndex: guest.zIndex,
                  '--g-scale': guest.scale,
                  transform: `translate(-50%, -100%) scale(${guest.scale})`,
                } as React.CSSProperties
              }
            >
              {/* Bong bóng chat khi khách comment */}
              {hasBubble && (
                <div className="rw-guest-bubble">
                  {guest.bubble!.text}
                </div>
              )}

              {/* Bảng tên pill bo tròn trên đầu khách */}
              <div className="rw-guest-tag">
                {guest.name}
              </div>

              {/* Ảnh người thật cắt hình sắc nét */}
              <img
                src={`/assets/wedding/characters/${guest.sprite}.png`}
                className="rw-guest-img"
                alt={guest.name}
              />
            </div>
          );
        })}
      </div>

      {/* 8. THÔNG BÁO NỔI (NOTICE BANNER) */}
      {game.notice && game.notice.until > now && (
        <div className="rw-notice-wrap">
          {game.notice.icon && <span className="rw-notice-icon">{game.notice.icon}</span>}
          <div className="rw-notice-text">
            <div className="rw-notice-title">{game.notice.title}</div>
            {game.notice.subtitle && <div className="rw-notice-sub">{game.notice.subtitle}</div>}
          </div>
        </div>
      )}

      {/* 9. DÃY NÚT THỬ THÁCH DONATE Ở DƯỚI & TICKER BANNER (KHÔNG CÓ NÚT ĐỔI NHẠC) */}
      <div className="rw-bottom-panel">
        <div className="rw-challenge-row">
          <button className="rw-challenge-btn rw-btn-emerald" onClick={() => game.triggerChallenge('make_bride', undefined, 10)}>
            <span className="rw-btn-icon">🍀</span>
            <span className="rw-btn-label">Làm Cô Dâu</span>
            <span className="rw-btn-cost">10 xu</span>
          </button>
          <button className="rw-challenge-btn rw-btn-rose" onClick={() => game.triggerChallenge('make_groom', undefined, 10)}>
            <span className="rw-btn-icon">🐷</span>
            <span className="rw-btn-label">Làm Chú Rể</span>
            <span className="rw-btn-cost">10 xu</span>
          </button>
          <button className="rw-challenge-btn rw-btn-purple" onClick={() => game.triggerChallenge('marry_mc', undefined, 99)}>
            <span className="rw-btn-icon">🎤</span>
            <span className="rw-btn-label">Cưới MC</span>
            <span className="rw-btn-cost">99 xu</span>
          </button>
          <button className="rw-challenge-btn rw-btn-crimson" onClick={() => game.triggerChallenge('dong_phong', undefined, 150)}>
            <span className="rw-btn-icon">🏰</span>
            <span className="rw-btn-label">Động Phòng</span>
            <span className="rw-btn-cost">150 xu</span>
          </button>
          <button className="rw-challenge-btn rw-btn-indigo" onClick={() => game.triggerChallenge('dance', undefined, 30)}>
            <span className="rw-btn-icon">🍑</span>
            <span className="rw-btn-label">Góp Vui Nhảy</span>
            <span className="rw-btn-cost">30 xu</span>
          </button>
          <button className="rw-challenge-btn rw-btn-cyan" onClick={() => game.triggerChallenge('cancel', undefined, 99)}>
            <span className="rw-btn-icon">🕊️</span>
            <span className="rw-btn-label">Hủy Hôn</span>
            <span className="rw-btn-cost">99 xu</span>
          </button>
          <button className="rw-challenge-btn rw-btn-pink" onClick={() => game.triggerChallenge('gold', undefined, 1)}>
            <span className="rw-btn-icon">🌹</span>
            <span className="rw-btn-label">Mừng 1 Chỉ</span>
            <span className="rw-btn-cost">1 xu</span>
          </button>
          <button className="rw-challenge-btn rw-btn-amber" onClick={() => game.triggerChallenge('kiss')}>
            <span className="rw-btn-icon">💋</span>
            <span className="rw-btn-label">Hôn Đi Nào</span>
            <span className="rw-btn-cost">Miễn phí</span>
          </button>
        </div>

        {/* Ticker chạy chữ ngang hướng dẫn donate */}
        <div className="rw-ticker-banner">
          <div className="rw-ticker-track">
            🌾 Tặng Cỏ 4 Lá (10 xu) làm Cô Dâu · Tặng Chú Heo (10 xu) làm Chú Rể · Tặng Quả Đào (30 xu) lên Sàn Nhảy · Tặng Hạc Giấy (99 xu) để Hủy Hôn · Tặng Bắn Tim (99 xu) để Cưới MC · Tặng 150 xu Vào Động Phòng · Tặng Hoa Hồng (1 xu) mừng 1 Chỉ Vàng 🌾
          </div>
        </div>
      </div>

      {/* 10. MÀN ĐỘNG PHÒNG HOA CHÚC SIÊU VIP (150 XU) */}
      {game.dongPhong && (
        <div className="rw-dongphong-overlay">
          <img src="/assets/wedding/events/dongphong.jpg" className="rw-dongphong-bg" alt="Động phòng" />
          <div className="rw-dp-top-card">
            <div className="rw-dp-title">Khoảnh khắc của đôi uyên ương</div>
            <div className="rw-dp-sub">Quà tặng đã phát</div>
            <div className="rw-dp-pair">
              <div className="rw-dp-pill">👀 Người tặng: {game.dongPhong.donor}</div>
              <div className="rw-dp-pill">👰 Cô dâu: {game.dongPhong.bride}</div>
            </div>
          </div>
          <div className="rw-dp-center-sign">
            <h1>❤️ ĐỘNG PHÒNG ❤️</h1>
          </div>
          <button
            className="rw-dp-badge-close"
            onClick={() => game.triggerChallenge('cancel')}
          >
            ✕ Trở về tiệc cưới
          </button>
        </div>
      )}
    </div>
  );
}
