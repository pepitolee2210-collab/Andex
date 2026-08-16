"use client";

/**
 * Objetivo de 30 días (§4.2, fila "Objetivo de 30 días": texto del paso 5,
 * EDITABLE). Cambiarlo recalcula el ranking y confirma con toast
 * (§3.2 regla UX 8, §4.7 último caso borde) — el recálculo lo hace
 * `saveProfile` del contexto del panel.
 *
 * En el diseño no es una tarjeta con su propio título y su propio botón de
 * lápiz: es un ROTULO de sección y UNA fila, como el resto de la pantalla.
 * La fila entera abre el editor, así que el objetivo se lee y se cambia en
 * el mismo sitio, sin un control de 24px al lado del texto.
 */

import { useState } from "react";
import { ChevronRight, Target } from "lucide-react";
import { goalLabel, interestOptionLabel } from "@/lib/i18n";
import { interestsForBranch } from "@/lib/catalogs/interests";
import type { InterestTag } from "@/lib/types";
import { sanitizeFreeText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { OptionChips } from "@/components/ui/option-chips";
import { toast } from "@/components/ui/toaster";
import { Glyph, ListGroup, ListRow, SectionLabel } from "@/components/ui/kit";
import { usePanel } from "./panel-context";

/** §3.2.1 regla 3 — todo texto libre, máximo 120 caracteres. */
const GOAL_MAX = 120;
const CUSTOM = "custom";

export function GoalCard() {
  const { dict, lang, profile, readOnly, saveProfile } = usePanel();
  const g = dict.panel.goal;

  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const current = profile.immediateGoal;
  const currentText =
    current === CUSTOM
      ? (profile.immediateGoalCustom ?? "").trim()
      : current
        ? goalLabel(current, lang)
        : "";

  /**
   * Opciones del paso 5: se generan de los intereses del paso 4 (§3.2 paso 5).
   * `other` no entra: no es un objetivo, es una señal de investigación.
   * Sin intereses marcados se ofrecen todos los de la rama.
   */
  const picked = (profile.interests ?? []).filter((tag) => tag !== "other");
  const options: InterestTag[] =
    picked.length > 0
      ? picked
      : interestsForBranch(profile.locationContext).filter((tag) => tag !== "other");

  function openEditor() {
    setChoice(current ?? null);
    setCustomText((profile?.immediateGoalCustom ?? "").trim());
    setOpen(true);
  }

  async function handleSave() {
    if (!choice) return;
    setSaving(true);
    const isCustom = choice === CUSTOM;
    const cleaned = sanitizeFreeText(customText, GOAL_MAX);
    const ok = await saveProfile({
      immediateGoal: isCustom ? CUSTOM : (choice as InterestTag),
      immediateGoalCustom: isCustom && cleaned.length > 0 ? cleaned : null,
    });
    setSaving(false);
    if (ok) {
      setOpen(false);
      toast.success(g.savedToast);
    } else {
      toast.error(dict.perfil.toasts.saveFailed);
    }
  }

  const tieneObjetivo = currentText.length > 0;

  /**
   * `goalLabel` devuelve el objetivo como TROZO DE FRASE —«resolver tus
   * trámites migratorios»—, porque ahí es donde nació: dentro de «Porque
   * dijiste que quieres…». Como título de fila empieza en minúscula y
   * parece un descuido. Se le sube la primera letra al mostrarlo; el texto
   * sigue siendo el mismo y sigue viviendo en i18n.
   */
  const titulo = tieneObjetivo
    ? currentText.charAt(0).toLocaleUpperCase(lang) + currentText.slice(1)
    : g.empty;

  return (
    <section aria-labelledby="objetivo-30-dias">
      <SectionLabel as="h2" id="objetivo-30-dias">
        {g.label}
      </SectionLabel>

      <ListGroup>
        {/* En solo lectura la fila deja de ser pulsable: sin galón y sin
            cursor, porque tocarla no podría guardar nada (§3.4.7). */}
        <ListRow
          iconName="target"
          icon={Target}
          iconTone="highlight"
          title={titulo}
          meta={readOnly ? undefined : tieneObjetivo ? g.hint : g.emptyCta}
          trail={
            readOnly ? undefined : (
              <Glyph
                name="chevron-right"
                icon={ChevronRight}
                size={18}
                strokeWidth={2}
                className="text-disabled"
              />
            )
          }
          onClick={readOnly ? undefined : openEditor}
        />
      </ListGroup>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={g.editTitle}
        closeLabel={dict.common.aria.closeModal}
        variant="fullscreen-mobile"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {dict.common.actions.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!choice}
              loading={saving}
              loadingLabel={dict.common.actions.loading}
            >
              {g.save}
            </Button>
          </>
        }
      >
        <OptionChips
          label={g.editTitle}
          hideLabel
          value={choice}
          onChange={setChoice}
          options={[
            ...options.map((tag) => ({
              value: tag,
              label: interestOptionLabel(tag, lang),
            })),
            { value: CUSTOM, label: dict.wizard.step5.customOption },
          ]}
        />

        {choice === CUSTOM ? (
          <div className="mt-4">
            <Input
              label={dict.wizard.step5.customLabel}
              value={customText}
              maxLength={GOAL_MAX}
              placeholder={g.placeholder}
              help={g.counter(customText.length, GOAL_MAX)}
              onChange={(e) => setCustomText(e.target.value)}
            />
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
