#!/bin/bash
cd "$(dirname "$0")"

export LIVE_MODE=1
export OPEN_BROWSER=1

if [ ! -d "node_modules" ]; then
  echo "Lần đầu chạy: đang cài thư viện, đợi 1-2 phút..."
  npm install
fi

echo "=========================================================="
echo "           CƯỚI LIỀN TAY - TIKTOK LIVE STREAM             "
echo "=========================================================="
echo "Đang bật game... Đóng cửa sổ Terminal này là tắt game."
echo "Game dùng cổng riêng 3005 (nếu bận sẽ tự chuyển cổng kế tiếp)."
echo ""

npm run dev
