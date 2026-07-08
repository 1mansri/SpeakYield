# CI_CD — Speak Yield

> **Status:** Draft, idea stage. Sized for a solo/small team on AWS. Tooling assumed (⚠️) — GitHub Actions + Terraform + ECS Fargate.

---

## Branch strategy
- **Trunk-based.** `main` is always deployable. Short-lived `feat/…`, `fix/…` branches → PR → squash-merge to `main`.
- No long-running release branches at this stage. Tags (`vX.Y.Z`) mark production releases.
- No direct pushes to `main` (branch protection: PR + green CI + 1 review; solo founder may self-review with CI as the gate, but the checks are mandatory).

## Environments
| Env | Purpose | Data |
|---|---|---|
| `preview` | Per-PR ephemeral (optional) | Synthetic |
| `staging` | Pre-prod, mirrors prod, Razorpay **test mode** | Synthetic |
| `production` | Live pilot (ap-south-1) | Real (India-resident) |

## Pipeline stages (on PR)
1. **Install & cache** deps.
2. **Lint** (ESLint) + **format check** (Prettier) + **typecheck** (`tsc --noEmit`).
3. **Unit + integration tests** (ephemeral Mongo).
4. **NLU eval** on the golden dataset if voice/prompt/provider files changed — block on regression. See [TESTING.md](./TESTING.md).
5. **Secret scan** + **dependency audit** (see cadence in [SECURITY.md](../05-security-legal/SECURITY.md)).
6. **Build** app + worker container images.
7. (optional) spin **preview** env, run smoke E2E.

## Pipeline stages (on merge to `main`)
1. Rebuild + push images to ECR.
2. **Deploy to `staging`** (Terraform apply / ECS service update).
3. **Automated smoke + E2E** against staging (incl. Razorpay test-mode payment path).
4. **Manual gate** → promote to `production`.
5. Deploy prod with **rolling / blue-green** ECS deployment; run DB migrations as a guarded pre-step.
6. Post-deploy health checks; auto-rollback on failed health/alarm.

## Deployment gates (must pass to reach prod)
- ✅ All CI checks green.
- ✅ Staging smoke + E2E pass.
- ✅ No unresolved **critical/high** dependency vulnerabilities.
- ✅ DB migration has a tested rollback.
- ✅ Money/auth/voice-confirm changes carry required test coverage.

## Migrations
- Schema/index changes via versioned migration scripts, forward + rollback, run in a controlled step before app rollout. Mongo index builds on large collections done in background/off-peak.

## Secrets & config
- Secrets from AWS Secrets Manager / SSM, injected at runtime — never in the image or repo. See [ENV_VARIABLES.md](./ENV_VARIABLES.md).

## Release cadence
- Ship small and often to staging; promote to prod on a human gate. During pilot, prefer frequent low-risk releases with fast rollback over big-bang deploys.
