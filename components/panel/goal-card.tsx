"use client";

/**
 * Objetivo de 30 días (§4.2, fila "Objetivo de 30 días": texto del paso 5,
 * EDITABLE). Cambiarlo recalcula el ranking y confirma con toast
 * (§3.2 regla UX 8, §4.7 último caso borde) — el recálculo lo hace
 * `saveProfile` del contexto del panel.
 */

import { useState } from "react";
import { Pencil } from "lucide-react";
import { goalLabel, interestOptionLabel } from "@/lib/i18n";
import { interestsForBranch } from "@/lib/catalogs/interests";
import type { InterestTag } from "@/lib/types";
import { sanitizeFreeText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { OptionChips } from "@/components/ui/option-chips";
import { toast } from "@/components/ui/toaster";
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

  return (
    <section
      aria-labelledby="objetivo-30-dias"
      className="rounded-lg border border-line bg-surface p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2
            id="objetivo-30-dias"
            className="text-caption font-semibold uppercase tracking-wide text-muted"
          >
            {g.label}
          </h2>
          <p className="mt-1 text-body-lg text-ink">
            {currentText.length > 0 ? currentText : g.empty}
          </p>
        </div>

        {readOnly ? null : (
          <Button variant="ghost" onClick={openEditor}>
            <Pencil aria-hidden="true" className="size-4" />
            {currentText.length > 0 ? g.edit : g.emptyCta}
          </Button>
        )}
      </div>

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
