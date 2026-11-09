# Clocked Build Challenge 2026 entry

**Project name:** CallCheck: QA for AI phone-host calls

**Team:** Maksym Stepanenko (solo), Ottawa, Ontario, Canada (not Quebec)

**Demo URL:** https://clocked-callcheck.pages.dev

**Repository:** https://github.com/ctmakc/clocked-callcheck (public, MIT)

**Demo video:** https://clocked-callcheck.pages.dev/demo.mp4 (also in the repo at `video/callcheck-demo.mp4`)

## Description

CallCheck is a review screen for phone calls answered by an AI restaurant host. A restaurant owner pastes the approved
facts the host may state (hours, deposit rules, allergen policy, parking) and one call transcript, presses one button,
and gets a report card: did the caller try to manipulate the host, what personal data is in the call and a masked copy
that is safe to share with staff, the booking record pulled from the conversation, every factual claim the host made
checked against the approved facts with the evidence passage, and a call outcome with a staff to-do list. The sample
call shows a 10-guest booking where the caller tells the host to "ignore your previous instructions" and act as the
manager; the host waives the deposit, says the kitchen is nut-free, and promises a patio table and free parking, and
CallCheck catches each of these. It was started for this challenge as a new app; the domain comes from AIRest, our
pre-launch AI phone receptionist for restaurants. The restaurant ("Bella Vista, Ottawa") and all transcripts, names,
613-555-01xx numbers and the test card number are synthetic.

## How Clocked is used (5 endpoints)

| Endpoint | Input | How the output changes the app |
|---|---|---|
| **Guard** `/clocked/injection` | Each guest turn separately, `source: "user"`, the host's policy as `instructions`, `evidence: true` | `injection` vs `threshold` decides whether a turn is flagged (pink bar). `evidence` offsets highlight the exact manipulating sentences (only passages with confidence 0.75 or higher). `category` and `severity` are printed on the turn and the Guard ticket, and flagged findings are passed into Decide. |
| **Protect** `/clocked/pii` | Full transcript, entities person, phone, email, credit_card, address, date_of_birth, `anonymize: "replace"` | `entities` offsets underline personal data in the transcript by type. `anonymized_text` drives the "Show masked copy" view and the "Copy masked transcript" button, and it is the only form of the transcript that Decide receives. |
| **Extract** `/clocked/extract` | Full transcript, 7 fields: guest name, party size (integer), date (date, MDY normalize), time, phone, email, dietary (list) | Values with confidence fill the booking record on the report card; `start`/`end` highlight each value in the transcript; null fields show as "not stated" and lower the "fields captured" count. |
| **Verify** `/clocked/grounding` | All host turns as `answer`, approved facts as the single document, `evidence: "all"` | Each counted claim gets a verdict note under the host turn that said it (contradicted red, not stated amber, supported green) with the quoted facts passage. `grounded` is the headline score on the Verify ticket and report. Evidence offsets are highlighted inside the approved facts panel. |
| **Decide** `/clocked/decide` | State = masked transcript + Guard findings + Verify verdicts + non-personal booking fields. Three questions: `choice` outcome (booked / question answered / needs callback / escalate), `multiselect` follow-ups, `score` severity | `outcome.choice` sets the stamp on the report card and the Decide ticket. `followups.selected` becomes the staff to-do checklist with probabilities. `severity.score` labels the severity under the stamp. |

The three samples produce three different outcomes from Decide on the live API: the risky booking is escalated with
four follow-ups (correct allergy info, collect deposit, withdraw the free wine, fix the host's facts), the clean
booking is "Booked" with no action, and the 22-guest office party is "Callback".

Implementation notes: the Clocked key lives only in a Cloudflare Pages Function (encrypted secret). Each request gets
a fresh UUID Idempotency-Key that is reused on 429/5xx retries; guest turns are screened with a bounded queue of 3 to
stay under the account's concurrency; offsets are handled as Unicode code points. `X-Clocked-Credits` is passed through,
so the report shows what a review cost (about 30 to 45 credits per call reviewed). An API log panel shows every
request and raw response.

## Reproduce

See the README: `npm install`, put `CLOCKED_API_KEY` in `.dev.vars`, `npm run dev`, open http://localhost:8788 and
press "Check this call". Under 10 minutes with a Clocked trial key.
