import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '食光 · 记录每一餐的美好',
  description: '拍照记录饮食，轻松了解每天的蛋白质、碳水与脂肪摄入。',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
