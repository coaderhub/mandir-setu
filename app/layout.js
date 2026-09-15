import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: 'MandirSetu | Temple Management System',
    template: '%s | MandirSetu',
  },

  description:
    'MandirSetu is a secure and transparent temple management platform for managing donations, donors, expenses, finances, reports, and temple operations.',

  keywords: [
    'MandirSetu',
    'MandirSetu temple management',
    'temple management system',
    'temple management software',
    'temple donation management',
    'temple accounting software',
    'temple financial management',
    'temple expense management',
    'temple donation software',
    'mandir management software',
  ],
  authors: [
    {
      name: 'CoaderHub',
    },
  ],
  creator: 'CoaderHub',
  publisher: 'MandirSetu',
  applicationName: 'MandirSetu',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
  ),
  alternates: {
    canonical: '/',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  openGraph: {
    title: 'MandirSetu | Temple Management System',
    description:
      'Secure and transparent temple management for donations, donors, expenses, finances, reports, and daily temple operations.',
    url: '/',
    siteName: 'MandirSetu',
    type: 'website',
    locale: 'en_IN',
  },

  twitter: {
    card: 'summary',
    title: 'MandirSetu | Temple Management System',
    description:
      'Secure and transparent temple management for donations, expenses, finances, reports, and temple operations.',
  },
};


export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
