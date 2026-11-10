import { useEffect, useRef, useState } from 'react';
import type { GameState } from './useGame';
import './stage.css';

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

      // Khi quẩy, hôn hoặc cưới MC: sinh thêm tim bay lên
      if ((game.isDancing || game.isKissing || game.mcCelebration || (game.groom && game.bride)) && Math.random() < 0.35) {
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
  }, [game.isDancing, game.isKissing, !!game.mcCelebration, !!game.groom, !!game.bride]);

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

  // Danh sách đại gia mừng cưới thực tế trong phiên live
  const displayTop = (game.top && game.top.length > 0) ? game.top : [];

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

      {/* 4. BẢNG PHẢI: SỐ VÀNG MỪNG CƯỚI (CẬP NHẬT THEO PHIÊN LIVE) */}
      <div className="rw-card-top">
        <div className="rw-top-header">🏆 SỐ VÀNG MỪNG CƯỚI</div>
        <div className="rw-top-list">
          {displayTop.length > 0 ? (
            displayTop.slice(0, 5).map((t, idx) => (
              <div key={t.id || idx} className="rw-top-row">
                <div className="rw-top-user">
                  <span className="rw-top-rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}</span>
                  <span className="rw-top-name">{t.name}</span>
                </div>
                <span className="rw-top-gold">{t.coins} chỉ</span>
              </div>
            ))
          ) : (
            <div className="rw-top-empty">
              <div className="rw-top-empty-text">Chưa có ai mừng cưới</div>
              <div className="rw-top-empty-sub">Tặng 1 Hoa Hồng (1 xu) để lên TOP 1 ngay!</div>
            </div>
          )}
        </div>
      </div>

      {/* 4.2 BẢNG GIÁ THỬ THÁCH DONATE (CỘT PHẢI - CHUẨN GIÁ QUÀ TIKTOK VIỆT NAM) */}
      <div className="rw-price-card">
        <div className="rw-price-header">🎁 BẢNG GIÁ QUÀ TIKTOK</div>
        <div className="rw-price-note">⚠️ Tặng đúng quà & đúng xu để thực hiện</div>
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
              <span className="rw-price-item-icon">🕶️</span>
              <span className="rw-price-item-name">Kính Râm (Thay Dâu/Rể)</span>
            </div>
            <span className="rw-price-tag" style={{ background: '#f59e0b', color: '#1e053a', fontWeight: 900 }}>20 xu</span>
          </div>
          <div className="rw-price-row">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🍑</span>
              <span className="rw-price-item-name">Quả Đào / Donut (Nhảy)</span>
            </div>
            <span className="rw-price-tag">30 xu</span>
          </div>
          <div className="rw-price-row special-photo">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">📷</span>
              <span className="rw-price-item-name">Máy Ảnh (Chụp Poster)</span>
            </div>
            <span className="rw-price-tag" style={{ background: '#38bdf8', color: '#082f49', fontWeight: 900 }}>50 xu</span>
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
          <div className="rw-price-row special-endlive">
            <div className="rw-price-item-left">
              <span className="rw-price-item-icon">🚀</span>
              <span className="rw-price-item-name">Tên Lửa (End Live)</span>
            </div>
            <span className="rw-price-tag" style={{ background: 'linear-gradient(135deg, #ffd700, #f59e0b)', color: '#1e053a', fontWeight: 900 }}>1000 xu</span>
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

      {/* 5. CẶP ĐÔI MC & PHU NHÂN/PHU QUÂN (BÊN TRÁI BỤC SÂN KHẤU - ẨN KHI ĐỘNG PHÒNG) */}
      {!game.dongPhong && (
        <>
          {/* Trái tim kết nối lơ lửng giữa MC và bạn đời khi đã cưới */}
          {game.mcMarriedTo && (
            <div className="rw-mc-wedding-ring-link">
              <span className="rw-mc-ring-icon">💍</span>
              <span className="rw-mc-ring-heart">💖</span>
            </div>
          )}

          {/* Bạn đời của MC (Mặc váy cưới lộng lẫy, avatar viền vương miện kim cương) */}
          {game.mcMarriedTo && (
            <div className="rw-mc-partner">
              {/* Bong bóng bình luận khi Người Cưới MC chat trong live */}
              {game.mcPartnerBubble && game.mcPartnerBubble.until > now && (
                <div className="rw-stage-bubble rw-partner-bubble">
                  {game.mcPartnerBubble.text}
                </div>
              )}

              {/* Avatar phát sáng viền kim cương & vương miện hoàng gia */}
              <div className="rw-mc-partner-avatar-wrap">
                <span className="rw-mc-partner-crown">👑</span>
                <div className="rw-mc-partner-avatar-ring" />
                <img
                  src={game.mcMarriedTo.avatar || '/assets/wedding/characters/bride.png'}
                  className="rw-mc-partner-avatar-img"
                  alt={game.mcMarriedTo.name}
                />
              </div>

              {/* Danh hiệu Đệ Nhất Phu Nhân / Phu Quân MC */}
              <div className="rw-mc-partner-vip-badge">💎 ĐỆ NHẤT PHU NHÂN (99 XU)</div>
              <div className="rw-mc-partner-name-badge">@{game.mcMarriedTo.name}</div>

              {/* Váy cưới lộng lẫy cô dâu hoàng gia */}
              <img
                src="/assets/wedding/characters/bride.png"
                className="rw-mc-partner-img"
                alt={game.mcMarriedTo.name}
              />
            </div>
          )}

          {/* MC Mai Trường */}
          <div className="rw-mc-wrap">
            <div className={`rw-mc-tag ${game.mcMarriedTo ? 'rw-mc-tag-married' : ''}`}>
              {game.mcMarriedTo ? `💍 ĐÃ CƯỚI @${game.mcMarriedTo.name}` : `🎤 ${game.channelName || 'Mai Trường'}`}
            </div>
            <img src="/assets/wedding/characters/mc.png" className="rw-mc-img" alt="MC Mai Trường" />
          </div>
        </>
      )}

      {/* 5.2 MÀN BẮN PHÁO HOA VINH DANH HÔN LỄ MC (KHI CÓ NGƯỜI TẶNG 99 XU) */}
      {game.mcCelebration && game.mcCelebration.until > now && (
        <div className="rw-mc-celebration-banner">
          <div className="rw-mc-celeb-card">
            <div className="rw-mc-celeb-badge">
              {game.mcCelebration.isSteal ? '💔 CƯỚP MC NGOẠN MỤC! 💔' : '💘 HÔN LỄ ĐẶC BIỆT CỦA MC 💘'}
            </div>
            <div className="rw-mc-celeb-couple">
              <div className="rw-mc-celeb-avatar-wrap">
                <img src="/assets/wedding/characters/mc.png" className="rw-mc-celeb-mc-pic" alt="MC" />
                <span>MC Mai Trường</span>
              </div>
              <div className="rw-mc-celeb-rings">💍 💖 💍</div>
              <div className="rw-mc-celeb-avatar-wrap">
                <img
                  src={game.mcCelebration.partnerAvatar || '/assets/wedding/characters/bride.png'}
                  className="rw-mc-celeb-user-pic"
                  alt="Partner"
                />
                <span>@{game.mcCelebration.partnerName}</span>
              </div>
            </div>
            <div className="rw-mc-celeb-title">
              {game.mcCelebration.isSteal
                ? `@${game.mcCelebration.partnerName} vừa tặng 99 xu CƯỚP MC khỏi tay @${game.mcCelebration.oldPartnerName}!`
                : `@${game.mcCelebration.partnerName} vừa tặng Bắn Tim (99 xu) CƯỚI ĐỨT MC!`}
            </div>
            <div className="rw-mc-celeb-sub">
              {game.mcCelebration.isSteal
                ? `⚡ Ai tặng 99 xu để CƯỚP LẠI MC từ tay @${game.mcCelebration.partnerName} không nào?! ⚡`
                : '🎉 Từ nay MC chính thức thuộc quyền sở hữu của đại gia, xin chúc mừng! 🎉'}
            </div>
          </div>
        </div>
      )}

      {/* 6. CÔ DÂU VÀ CHÚ RỂ (ĐỨNG TRÊN SÂN KHẤU - ẨN KHI ĐỘNG PHÒNG) */}
      {!game.dongPhong && (
        <div className="rw-stage-couple-area">
          {game.isKissing ? (
            /* Tư thế chú rể bế cô dâu hôn nhau (Khoảnh khắc ngọt ngào) */
            <div className="rw-kiss-wrap">
              <div className="rw-kiss-banner">
                <div className="rw-kiss-banner-h">❤️ KHOẢNH KHẮC NGỌT NGÀO ❤️</div>
                <div className="rw-kiss-banner-sub">
                  Chú rể @{game.groom?.name || 'Chú Rể'} 💋 Cô dâu @{game.bride?.name || 'Cô Dâu'}
                </div>
              </div>
              <img src="/assets/wedding/characters/couple_kiss.png" className="rw-kiss-img" alt="Chú rể bế cô dâu hôn nhau" />
            </div>
          ) : (
            /* Chú rể và cô dâu đứng trên sân khấu */
            <div className="rw-couple-standing">
              {/* Vị trí Chú Rể */}
              {game.groom ? (
                <div className="rw-stage-person rw-groom-side">
                  {/* Bong bóng bình luận khi Chú Rể comment trong live */}
                  {game.groomBubble && game.groomBubble.until > now && (
                    <div className="rw-stage-bubble rw-groom-bubble">
                      {game.groomBubble.text}
                    </div>
                  )}
                  <div className="rw-stage-avatar-wrap">
                    <div className="rw-stage-avatar-ring" />
                    <img
                      src={game.groom.avatar || '/assets/wedding/characters/groom_face.png'}
                      className="rw-stage-avatar-img"
                      alt={game.groom.name}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/wedding/characters/groom_face.png';
                      }}
                    />
                  </div>
                  <div className="rw-vip-badge">🐷 CHÚ RỂ</div>
                  <div className="rw-name-badge">@{game.groom.name}</div>
                  <img src="/assets/wedding/characters/groom.png" className="rw-groom-img" alt="Chú rể" />
                </div>
              ) : (
                <div className="rw-stage-person rw-groom-side is-empty">
                  <div className="rw-spot-avatar-placeholder">🐷</div>
                  <div className="rw-vip-badge is-placeholder">🐷 CHÚ RỂ (10 XU)</div>
                  <div className="rw-name-badge is-placeholder">Tặng Chú Heo</div>
                  <img src="/assets/wedding/characters/groom.png" className="rw-groom-img is-silhouette" alt="Chờ chú rể" />
                </div>
              )}

              {/* Vị trí Cô Dâu */}
              {game.bride ? (
                <div className="rw-stage-person rw-bride-side">
                  {/* Bong bóng bình luận khi Cô Dâu comment trong live */}
                  {game.brideBubble && game.brideBubble.until > now && (
                    <div className="rw-stage-bubble rw-bride-bubble">
                      {game.brideBubble.text}
                    </div>
                  )}
                  <div className="rw-stage-avatar-wrap">
                    <div className="rw-stage-avatar-ring" />
                    <img
                      src={game.bride.avatar || '/assets/wedding/characters/bride_face.png'}
                      className="rw-stage-avatar-img"
                      alt={game.bride.name}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/wedding/characters/bride_face.png';
                      }}
                    />
                  </div>
                  <div className="rw-vip-badge">🍀 CÔ DÂU</div>
                  <div className="rw-name-badge">@{game.bride.name}</div>
                  <img src="/assets/wedding/characters/bride.png" className="rw-bride-img" alt="Cô dâu" />
                </div>
              ) : (
                <div className="rw-stage-person rw-bride-side is-empty">
                  <div className="rw-spot-avatar-placeholder">🍀</div>
                  <div className="rw-vip-badge is-placeholder">🍀 CÔ DÂU (10 XU)</div>
                  <div className="rw-name-badge is-placeholder">Tặng Cỏ 4 Lá</div>
                  <img src="/assets/wedding/characters/bride.png" className="rw-bride-img is-silhouette" alt="Chờ cô dâu" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. DÀN KHÁCH DỰ TIỆC NGƯỜI THẬT DƯỚI THẢM ĐỎ VÀ BÀN TIỆC (ẨN KHI ĐỘNG PHÒNG, CHỨA > 500 NGƯỜI) */}
      {!game.dongPhong && (
        <div className="rw-guests-container">
          {game.realGuests.map((guest) => {
            const hasBubble = guest.bubble && guest.bubble.until > now;
            // Khi khách comment hoặc tương tác: nổi lên lớp cao nhất để bong bóng và bảng tên không bị che
            const itemZIndex = hasBubble ? 25000 + Math.floor(guest.y) : guest.zIndex;
            return (
              <div
                key={guest.id}
                className={`rw-guest-item ${game.isDancing ? 'is-dancing' : ''} ${hasBubble ? 'is-speaking' : ''}`}
                style={
                  {
                    left: `${guest.x}px`,
                    top: `${guest.y}px`,
                    zIndex: itemZIndex,
                    '--g-scale': guest.scale,
                  } as React.CSSProperties
                }
              >
                {/* BẢNG TÊN & BONG BÓNG BÌNH LUẬN - NẰM NGOÀI SCALE CỦA BODY ĐỂ TEXT CỰC NÉT, RÕ TRÊN ĐIỆN THOẠI */}
                <div className="rw-guest-ui">
                  {hasBubble && (
                    <div className="rw-guest-bubble">
                      {guest.bubble!.text}
                    </div>
                  )}

                  <div className="rw-guest-tag">
                    {guest.name}
                  </div>
                </div>

                {/* ẢNH NGƯỜI THẬT CẮT HÌNH THEO PHỐI CẢNH 3D CHIỀU SÂU SÂN KHẤU */}
                <div className="rw-guest-body">
                  <img
                    src={`/assets/wedding/characters/${guest.sprite}.png`}
                    className="rw-guest-img"
                    alt={guest.name}
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. THÔNG BÁO QUÀ TẶNG LIVE NỔI BẬT (GIFT ALERT TOAST) */}
      {game.giftAlert && game.giftAlert.until > now && (
        <div className="rw-gift-toast">
          <div className="rw-gift-toast-icon">{game.giftAlert.icon || '🎁'}</div>
          {game.giftAlert.avatar ? (
            <img src={game.giftAlert.avatar} className="rw-gift-toast-avatar" alt={game.giftAlert.user} />
          ) : (
            <div className="rw-gift-toast-avatar-fallback">
              {game.giftAlert.user.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="rw-gift-toast-info">
            <div className="rw-gift-toast-user">@{game.giftAlert.user}</div>
            <div className="rw-gift-toast-gift">
              Vừa tặng <b>{game.giftAlert.giftName}</b> ({game.giftAlert.coins} xu)
            </div>
          </div>
        </div>
      )}

      {/* 8.2 THÔNG BÁO NỔI (NOTICE BANNER) */}
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
          {game.bride ? (
            <button className="rw-challenge-btn rw-btn-emerald is-replace" onClick={() => game.triggerChallenge('replace_bride', undefined, 20)}>
              <span className="rw-btn-icon">👰</span>
              <span className="rw-btn-label">Thay Cô Dâu</span>
              <span className="rw-btn-cost">20 xu</span>
            </button>
          ) : (
            <button className="rw-challenge-btn rw-btn-emerald" onClick={() => game.triggerChallenge('make_bride', undefined, 10)}>
              <span className="rw-btn-icon">🍀</span>
              <span className="rw-btn-label">Làm Cô Dâu</span>
              <span className="rw-btn-cost">10 xu</span>
            </button>
          )}

          {game.groom ? (
            <button className="rw-challenge-btn rw-btn-rose is-replace" onClick={() => game.triggerChallenge('replace_groom', undefined, 20)}>
              <span className="rw-btn-icon">👑</span>
              <span className="rw-btn-label">Thay Chú Rể</span>
              <span className="rw-btn-cost">20 xu</span>
            </button>
          ) : (
            <button className="rw-challenge-btn rw-btn-rose" onClick={() => game.triggerChallenge('make_groom', undefined, 10)}>
              <span className="rw-btn-icon">🐷</span>
              <span className="rw-btn-label">Làm Chú Rể</span>
              <span className="rw-btn-cost">10 xu</span>
            </button>
          )}

          <button className="rw-challenge-btn rw-btn-photo" onClick={() => game.triggerChallenge('take_photo', undefined, 50)}>
            <span className="rw-btn-icon">📷</span>
            <span className="rw-btn-label">Chụp Hình</span>
            <span className="rw-btn-cost">50 xu</span>
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
          <button className="rw-challenge-btn rw-btn-endlive" onClick={() => game.triggerChallenge('end_live', undefined, 1000)}>
            <span className="rw-btn-icon">🚀</span>
            <span className="rw-btn-label">End Live</span>
            <span className="rw-btn-cost">1000 xu</span>
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
            🌾 Tặng Cỏ 4 Lá (10 xu) làm Cô Dâu · Tặng Chú Heo (10 xu) làm Chú Rể · Tặng Kính Râm (20 xu) Thay Dâu / Thay Rể · Tặng Quả Đào (30 xu) lên Sàn Nhảy · Tặng Máy Ảnh (50 xu) Chụp Poster Đăng Story · Tặng Hạc Giấy (99 xu) để Hủy Hôn · Tặng Bắn Tim (99 xu) để Cưới MC · Tặng 150 xu Vào Động Phòng · Tặng Tên Lửa (1000 xu) Bao Trọn Sảnh & End Live · Tặng Hoa Hồng (1 xu) mừng 1 Chỉ Vàng 🌾
          </div>
        </div>
      </div>

      {/* 10. MÀN ĐỘNG PHÒNG HOA CHÚC SIÊU VIP (150 XU) */}
      {game.dongPhong && (
        <div className="rw-dongphong-overlay">
          {/* Lớp phủ làm tối toàn bộ xung quanh */}
          <div className="rw-dongphong-dimmer" />

          <div className="rw-dongphong-content">
            {/* Phần hiển thị tên & avatar 2 người ở trên: Chỉ có Chú Rể và Cô Dâu */}
            <div className="rw-dp-top-card">
              <div className="rw-dp-title">Khoảnh khắc của đôi uyên ương</div>
              <div className="rw-dp-sub">
                {game.dongPhong.donor && game.dongPhong.donor !== (game.groom?.name || game.dongPhong.groom)
                  ? `🎁 @${game.dongPhong.donor} tặng Động Phòng Hoa Chúc`
                  : 'Quà tặng Động Phòng Hoa Chúc'}
              </div>

              <div className="rw-dp-avatars-row">
                {/* Chú rể */}
                <div className="rw-dp-user-block">
                  <div className="rw-dp-avatar-frame">
                    <img
                      src={game.groom?.avatar || game.dongPhong.groomAvatar || '/assets/wedding/characters/groom_face.png'}
                      className="rw-dp-avatar-img"
                      alt={game.groom?.name || game.dongPhong.groom || 'Chú Rể'}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/wedding/characters/groom_face.png';
                      }}
                    />
                  </div>
                  <div className="rw-dp-role-badge">CHÚ RỂ</div>
                  <div className="rw-dp-name-pill">@{game.groom?.name || game.dongPhong.groom || 'Chú Rể'}</div>
                </div>

                {/* Trái tim kết nối */}
                <div className="rw-dp-heart-connector">💛</div>

                {/* Cô dâu */}
                <div className="rw-dp-user-block">
                  <div className="rw-dp-avatar-frame">
                    <img
                      src={game.bride?.avatar || game.dongPhong.brideAvatar || '/assets/wedding/characters/bride_face.png'}
                      className="rw-dp-avatar-img"
                      alt={game.bride?.name || game.dongPhong.bride || 'Cô Dâu'}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/wedding/characters/bride_face.png';
                      }}
                    />
                  </div>
                  <div className="rw-dp-role-badge">CÔ DÂU</div>
                  <div className="rw-dp-name-pill">@{game.bride?.name || game.dongPhong.bride || 'Cô Dâu'}</div>
                </div>
              </div>
            </div>

            {/* Cổng rèm Động Phòng hoa chúc giữ nguyên ảnh gốc, chỉ cử động nhẹ phần đầu 2 người lại gần nhau */}
            <div className="rw-dp-arch-wrap">
              <img
                src="/assets/wedding/events/rem_dong_phong_base.png"
                className="rw-dp-arch-img"
                alt="Rèm Động Phòng"
              />
              <img
                src="/assets/wedding/events/dp_orig_groom_head.png"
                className="rw-dp-head-sprite rw-dp-head-groom"
                alt=""
                aria-hidden="true"
              />
              <img
                src="/assets/wedding/events/dp_orig_bride_head.png"
                className="rw-dp-head-sprite rw-dp-head-bride"
                alt=""
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}

      {/* 11. MÀN END LIVE SIÊU ĐẠI GIA (1000 XU) */}
      {game.endLive && (
        <div className="rw-endlive-overlay">
          <div className="rw-endlive-dimmer" />
          <div className="rw-endlive-particles" />

          <div className="rw-endlive-card">
            <div className="rw-endlive-badge">
              <span>🚀 👑 🏆</span>
            </div>

            <div className="rw-endlive-title">
              ĐẠI GIA ĐÃ MUA ĐỨT PHÒNG LIVE!
            </div>
            <div className="rw-endlive-subtitle">
              CHÍNH THỨC BẾ MẠC & KẾT THÚC TIỆC CƯỚI (END LIVE)
            </div>

            <div className="rw-endlive-donor-box">
              <div className="rw-endlive-avatar-wrap">
                <div className="rw-endlive-avatar-ring" />
                <img
                  src={game.endLive.donorAvatar || '/assets/wedding/characters/mc.png'}
                  className="rw-endlive-avatar-img"
                  alt={game.endLive.donor}
                />
              </div>
              <div className="rw-endlive-donor-name">
                @{game.endLive.donor}
              </div>
              <div className="rw-endlive-donor-gift">
                🚀 ĐÃ DONATE {game.endLive.coins.toLocaleString('vi-VN')} XU BAO TRỌN TIỆC CƯỚI
              </div>
            </div>

            <div className="rw-endlive-countdown">
              ✨ Đám cưới hoàn tất viên mãn · Cảm ơn đại gia và cả sảnh tiệc! ✨
            </div>

            <div className="rw-endlive-actions">
              <button className="rw-endlive-reset-btn" onClick={() => game.resetWedding()}>
                🔄 BẮT ĐẦU TIỆC CƯỚI MỚI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MÀN POSTER CHỤP HÌNH KỶ NIỆM ĐĂNG STORY (HIỂN THỊ 7 GIÂY TỰ ĐÓNG) */}
      {game.photoPoster && (() => {
        const posterGroomName = game.groom?.name || game.photoPoster.groom || 'Chú Rể';
        const posterBrideName = game.bride?.name || game.photoPoster.bride || 'Cô Dâu';
        const posterGroomAvatar = game.groom?.avatar || game.photoPoster.groomAvatar || '/assets/wedding/characters/groom_face.png';
        const posterBrideAvatar = game.bride?.avatar || game.photoPoster.brideAvatar || '/assets/wedding/characters/bride_face.png';
        return (
        <div className="rw-photo-overlay">
          {/* Hiệu ứng đèn flash máy ảnh lóe sáng */}
          <div className="rw-photo-flash" />
          <div className="rw-photo-dimmer" />

          <div className="rw-poster-container">
            {/* Tấm Social Card Polaroid Tilted Style (Chuẩn Story viral, độc quyền Rạp Cưới) */}
            <div className="rw-pcard">
              {/* Thanh tiến trình Story chạy mượt */}
              <div className="rw-pcard-story-timer" key={game.photoPoster.until}>
                <div className="rw-pcard-story-progress" />
              </div>

              {/* 1. Header Profile */}
              <div className="rw-pcard-header">
                <div className="rw-pcard-header-top">
                  <span className="rw-pcard-header-title">Happy Wedding</span>
                </div>
                <div className="rw-pcard-profile-row">
                  <div className="rw-pcard-avatar-combo">
                    <img
                      src={posterGroomAvatar}
                      className="rw-pcard-av rw-pcard-av-groom"
                      alt={posterGroomName}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/wedding/characters/groom_face.png';
                      }}
                    />
                    <img
                      src={posterBrideAvatar}
                      className="rw-pcard-av rw-pcard-av-bride"
                      alt={posterBrideName}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/wedding/characters/bride_face.png';
                      }}
                    />
                    <span className="rw-pcard-av-badge">💍</span>
                  </div>
                  <div className="rw-pcard-profile-info">
                    <div className="rw-pcard-profile-names">
                      <strong>{posterGroomName}</strong>
                      <span className="rw-pcard-heart-dot">♥</span>
                      <strong>{posterBrideName}</strong>
                    </div>
                    <div className="rw-pcard-profile-sub">
                      <span>💍 Lễ thành hôn · {game.photoPoster.dateStr}</span>
                      <span className="rw-pcard-sub-donor">📷 @{game.photoPoster.donor} tặng</span>
                    </div>
                  </div>
                  <div className="rw-pcard-follow-btn">
                    💖 ĐÃ CƯỚI
                  </div>
                </div>
              </div>

              {/* 2. Khung Ảnh Studio Thật Đẹp (Chân dung 3D sắc nét nổi khối + Đèn chùm + Vòm hoa) */}
              <div className="rw-pcard-photo-box">
                {/* Biển Vòm Lễ Thành Hôn in trực tiếp lên phông vòm hoa phía trên đầu cặp đôi */}
                <div className="rw-pcard-stage-plaque">
                  <div className="rw-pcard-plaque-title">LỄ THÀNH HÔN</div>
                  <div className="rw-pcard-plaque-name">{posterGroomName}</div>
                  <div className="rw-pcard-plaque-heart">♥</div>
                  <div className="rw-pcard-plaque-name">{posterBrideName}</div>
                  <div className="rw-pcard-plaque-date">{game.photoPoster.dateStr}</div>
                </div>

                {/* Chân dung Chú Rể & Cô Dâu 3D sắc nét, rực rỡ trên nền studio */}
                <div className="rw-pcard-couple-stage">
                  <img
                    src="/assets/wedding/events/poster_couple_hd.png"
                    className="rw-pcard-couple-hd-img"
                    alt={`${posterGroomName} & ${posterBrideName}`}
                  />
                </div>

                {/* Hiệu ứng nhiều tim & lấp lánh bay lãng mạn bên góc phải khung hình */}
                <div className="rw-pcard-floating-hearts" aria-hidden="true">
                  <span className="rw-fheart fh-1">💖</span>
                  <span className="rw-fheart fh-2">❤️</span>
                  <span className="rw-fheart fh-3">💕</span>
                  <span className="rw-fheart fh-4">💗</span>
                  <span className="rw-fheart fh-5">💘</span>
                  <span className="rw-fheart fh-6">❤️‍🔥</span>
                  <span className="rw-fheart fh-7">💖</span>
                  <span className="rw-fheart fh-8">✨</span>
                </div>

                {/* Badge nhỏ góc dưới phải thể hiện đông đảo khách đang thả tim */}
                <div className="rw-pcard-live-hearts-pill">
                  <span className="rw-lhp-icon">❤️</span>
                  <span className="rw-lhp-text">Bão tim từ rạp cưới</span>
                </div>
              </div>

              {/* 3. Footer Tương Tác & Nhiều Người Thả Tim */}
              <div className="rw-pcard-footer">
                <div className="rw-pcard-actions-row">
                  <div className="rw-pcard-action-icons">
                    <span className="rw-pact-icon rw-pact-heart">❤️</span>
                    <span className="rw-pact-icon">💬</span>
                    <span className="rw-pact-icon">✈️</span>
                  </div>
                  <div className="rw-pcard-likers-mini">
                    <span className="rw-pcard-reaction-stack">❤️💖👍</span>
                    <span className="rw-pcard-likers-text">
                      {game.photoPoster.likerNames.slice(0, 2).join(', ')} và nhiều khách đã thả tim
                    </span>
                  </div>
                </div>

                {/* Tổng lượt thích bùng nổ */}
                <div className="rw-pcard-likes-row">
                  <span className="rw-pcard-heart-fire">❤️</span>
                  <span className="rw-pcard-likes-count">
                    {game.photoPoster.likes.toLocaleString('vi-VN')} lượt thích
                  </span>
                </div>

                {/* Chú thích Story ý nghĩa */}
                <div className="rw-pcard-caption">
                  Cặp đôi số <b>{game.photoPoster.coupleNo}</b> của rạp cưới hôm nay, chúc hai bạn trăm năm hạnh phúc 💍
                </div>

                {/* Hashtag trending */}
                <div className="rw-pcard-tags">
                  <span>#HappyWedding</span>
                  <span>#CapDoiSo{game.photoPoster.coupleNo}</span>
                  <span>#TramNamHanhPhuc</span>
                  <span>#CuoiLienTay</span>
                </div>

                {/* Hướng dẫn chụp màn hình (Không ghi text tự đóng) */}
                <div className="rw-pcard-screenshot-hint">
                  📸 Chụp màn hình ngay để đăng Story & lưu giữ kỷ niệm nhé!
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
