import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboardingActions } from "../actions/useOnboardingActions"
import { INVITE_ROLE_OPTIONS, JOB_ROLE_OPTIONS, ONBOARDING_STEPS, TEAM_SIZE_OPTIONS } from "../catalog/onboardingCatalog"
import { InviteMembersList } from "../components/InviteMembersList/InviteMembersList"
import { SelectField } from "../components/SelectField/SelectField"
import { useOnboardingStore } from "../store"

export function OnboardingWizard() {
  const store = useOnboardingStore()
  const { completeOnboardingAction, canContinueProfile, canContinueTeam, loading, lastStep } = useOnboardingActions()

  const step = ONBOARDING_STEPS[store.step] ?? "profile"
  const canContinue = step === "profile" ? canContinueProfile : step === "team" ? canContinueTeam : true

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Configura tu cuenta</CardTitle>
          <CardDescription>
            Paso {store.step + 1} de {ONBOARDING_STEPS.length}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "profile" ? (
            <SelectField
              label="¿Cuál es tu rol?"
              value={store.jobRole}
              onChange={store.setJobRole}
              options={JOB_ROLE_OPTIONS}
              disabled={loading}
            />
          ) : null}

          {step === "team" ? (
            <SelectField
              label="¿Cuántas personas usarán Cydo?"
              value={store.expectedUsers}
              onChange={store.setExpectedUsers}
              options={TEAM_SIZE_OPTIONS}
              disabled={loading}
            />
          ) : null}

          {step === "invites" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Invita a tu equipo</p>
              <p className="text-xs text-muted-foreground">Les enviaremos un email para unirse a tu cuenta.</p>
              <InviteMembersList
                invites={store.invites}
                roleOptions={INVITE_ROLE_OPTIONS}
                disabled={loading}
                onAdd={store.addInvite}
                onRemove={store.removeInvite}
                onEmailChange={store.updateInviteEmail}
                onRoleChange={store.updateInviteRole}
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button variant="ghost" disabled={store.step === 0 || loading} onClick={() => store.setStep(store.step - 1)}>
              Atrás
            </Button>

            {store.step < lastStep ? (
              <Button disabled={!canContinue} onClick={() => store.setStep(store.step + 1)}>
                Continuar
              </Button>
            ) : (
              <Button disabled={loading} onClick={() => void completeOnboardingAction()}>
                {loading ? "Finalizando…" : "Finalizar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
