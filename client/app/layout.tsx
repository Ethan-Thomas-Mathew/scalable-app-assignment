import { Toaster } from 'react-hot-toast';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-white selection:text-black">
        <div className="noise-overlay"></div>
        <Toaster position="bottom-center" />
        {children}
      </body>
    </html>
  );
}