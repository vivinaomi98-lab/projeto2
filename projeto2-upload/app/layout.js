import "./globals.css";

export const metadata = {
  title: "AI Lead Research Agent",
  description: "Turn a company name into a sales-ready research brief in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
