import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function InvitationSheet({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  return <section className="invite-sheet shell">
    <button className="sheet-back text-button" onClick={onBack}><ArrowLeft size={16} /> Voltar ao convite</button>
    <div className="sheet-spread">
      <aside className="sheet-cover" aria-label="Chá de fraldas do Estêvão">
        <div className="sheet-cover-type"><span>Chá de fraldas do</span><strong>Estêvão</strong></div>
        <div className="sheet-landscape" aria-hidden="true" />
        <div className="sheet-signature">Com amor, Amanda e Kennedi</div>
      </aside>
      <div className="sheet-content">{children}</div>
    </div>
  </section>;
}
