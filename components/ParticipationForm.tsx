"use client";
import { FormEvent, useState } from "react";
import {
  CUSTOM_GIFT_PREFIX,
  CUSTOM_GIFT_MAX_LENGTH,
  diapers,
  gifts,
} from "../data/items";
import { relationships } from "../data/relationships";
import { GiftCard } from "./GiftCard";
export type Registration = {
  name: string;
  contact: string;
  relationship: string;
  diaper: string;
  gift: string;
  message: string;
};
export function ParticipationForm({
  onSubmit,
  busy,
  error,
  counts,
}: {
  onSubmit: (form: Registration) => void;
  busy: boolean;
  error: string;
  counts: Record<string, number>;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Registration>({
    name: "",
    contact: "",
    relationship: "",
    diaper: "",
    gift: "",
    message: "",
  });
  const [other, setOther] = useState("");
  const [customGift, setCustomGift] = useState("");
  const [mimosOpen, setMimosOpen] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    onSubmit({
      ...form,
      gift:
        form.gift === CUSTOM_GIFT_PREFIX
          ? CUSTOM_GIFT_PREFIX + customGift.trim()
          : form.gift,
      relationship:
        form.relationship === "Outro vínculo"
          ? other.trim()
          : form.relationship,
    });
  }
  return (
    <>
      <p className="eyebrow">UM CARINHO PARA O ESTEVÃO</p>
      <ol className="form-stepper">
        {["Sobre você", "Presentes", "Seu recado"].map((label, i) => (
          <li key={label} aria-current={step === i ? "step" : undefined}>
            <span>{i < step ? "✓" : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <form onSubmit={submit}>
        {step === 0 && (
          <>
            <h2>Vamos começar por você.</h2>
            <p>Como você faz parte da história do nosso pequeno?</p>
            <label>
              Seu nome
              <input
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Como podemos te chamar?"
              />
            </label>
            <label>
              Seu vínculo com o Estevão
              <select
                required
                value={form.relationship}
                onChange={(e) =>
                  setForm({ ...form, relationship: e.target.value })
                }
              >
                <option value="" disabled>
                  Selecione seu parentesco ou vínculo
                </option>
                {relationships.map((label) => (
                  <option key={label}>{label}</option>
                ))}
              </select>
            </label>
            {form.relationship === "Outro vínculo" && (
              <label>
                Conte para a gente
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  placeholder="Ex.: tia de coração"
                />
              </label>
            )}
            <label>
              Contato <small>opcional, só a família vê</small>
              <input
                maxLength={150}
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="WhatsApp ou e-mail"
              />
            </label>
          </>
        )}
        {step === 1 && (
          <>
            <p className="eyebrow">CUIDADO EM FORMA DE PRESENTE</p>
            <h2>O que você quer trazer?</h2>
            <p>
              Uma fralda já é um carinho enorme. O mimo é totalmente opcional.
            </p>
            <aside className="catalog-note">
              Lista de exemplo: marcas e detalhes serão confirmados pela
              família. A seleção reserva o presente, sem efetuar compra.
            </aside>
            <fieldset>
              <legend>
                Um pacote de fraldas <small>escolha o tamanho</small>
              </legend>
              <div className="gift-grid">
                {diapers.map((item) => (
                  <GiftCard
                    key={item.id}
                    item={item}
                    counts={counts}
                    checked={form.diaper === item.id}
                    group="diaper"
                    required
                    onChange={() => setForm({ ...form, diaper: item.id })}
                  />
                ))}
              </div>
            </fieldset>
            <details
              className="mimos-accordion"
              open={mimosOpen}
              onToggle={(event) => setMimosOpen(event.currentTarget.open)}
            >
              <summary>Quero dar um mimo também!</summary>
              <fieldset>
                <legend>Escolha um mimo</legend>
                <div className="gift-grid">
                  {gifts.map((item) => (
                    <GiftCard
                      key={item.id}
                      item={item}
                      counts={counts}
                      checked={form.gift === item.id}
                      group="gift"
                      onChange={() => setForm({ ...form, gift: item.id })}
                    />
                  ))}
                </div>
                <label className="custom-gift-option">
                  <input
                    type="radio"
                    name="gift"
                    checked={form.gift === CUSTOM_GIFT_PREFIX}
                    onChange={() =>
                      setForm({ ...form, gift: CUSTOM_GIFT_PREFIX })
                    }
                  />
                  Outro mimo
                </label>
                {form.gift === CUSTOM_GIFT_PREFIX && (
                  <label>
                    Qual mimo você quer trazer?
                    <input
                      required
                      pattern=".*\S.*"
                      maxLength={CUSTOM_GIFT_MAX_LENGTH}
                      value={customGift}
                      onChange={(event) => setCustomGift(event.target.value)}
                      placeholder="Ex.: uma manta feita à mão"
                      onInvalid={() => setMimosOpen(true)}
                    />
                  </label>
                )}
              </fieldset>
            </details>
          </>
        )}
        {step === 2 && (
          <>
            <h2>Palavras que vão ficar.</h2>
            <p>Um desejo, uma lembrança ou um simples “estamos aqui”.</p>
            <label>
              Seu depoimento <small>opcional</small>
              <textarea
                maxLength={1000}
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Querido Estevão…"
              />
            </label>
            <p>
              Seu depoimento ficará visível para todos os visitantes do jardim.
            </p>
            <small>
              Contato, parentesco e presentes ficam na área privada da família.
            </small>
          </>
        )}
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => setStep(step - 1)}
            >
              Voltar
            </button>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Salvando…"
              : step === 2
                ? "Confirmar meu carinho"
                : "Continuar"}
          </button>
        </div>
      </form>
    </>
  );
}
