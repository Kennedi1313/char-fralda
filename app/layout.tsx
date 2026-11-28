import "./globals.css";
import "./garden.css";
import "./experience.css";
import "./map-controls.css";
import "./form-details.css";
import { DemoBanner } from "../components/DemoBanner";

export const metadata = {
  title: "O jardim do Estêvão",
  description: "Um chá de fraldas, um jardim cheio de carinho.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
