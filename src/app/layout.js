import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "消耗品発注システム",
  description: "病院・施設向け消耗品発注管理アプリケーション",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={inter.variable}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
