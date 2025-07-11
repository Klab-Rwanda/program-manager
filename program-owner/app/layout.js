// app/layout.js
import "./global.css";
import { DarkModeProvider } from "../utils/theme"; // adjust path as needed

export const metadata = {
  title: "KLab Program Manager",
  description: "Program Management Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}
