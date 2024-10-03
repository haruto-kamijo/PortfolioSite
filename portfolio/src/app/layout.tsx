import '@/app/ui/global.css';
import {mono} from './ui/fonts';
export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
    <html className="html" lang="ja">
    <body className={mono.className}>{children}</body>
    </html>
  );
}
