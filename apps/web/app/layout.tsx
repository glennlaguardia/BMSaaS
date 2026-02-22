import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'BudaBook — Resort & Hotel',
    description: 'Book your perfect getaway. Explore rooms, amenities, and day tours.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="min-h-screen bg-white font-sans antialiased">
                {children}
            </body>
        </html>
    );
}
