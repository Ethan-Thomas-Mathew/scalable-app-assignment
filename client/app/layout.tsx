import { Toaster } from 'react-hot-toast';
import "./globals.css";
import DemoBanner from "./DemoBanner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-white selection:text-black">
        <div className="noise-overlay"></div>
        <Toaster position="bottom-center" />
        {process.env.NEXT_PUBLIC_DEMO === 'true' && <DemoBanner />}
        {children}
      </body>
    </html>
  );
}
