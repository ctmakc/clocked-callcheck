# CallCheck: QA for AI phone-host calls

CallCheck reviews one phone call between a restaurant guest and an AI host (a voice agent that answers the
restaurant's phone and takes reservations). Paste the restaurant's approved facts and the call transcript, or pick a
sample, and CallCheck runs five Clocked endpoints in sequence:

| Step | Clocked endpoint | What CallCheck sends | How the output changes the app |
|---|---|---|---|
| **Guard** | `POST /clocked/injection` | Each guest turn on its own, `source: "user"`, with the host's policy as `instructions` | A turn at or above the threshold is marked as a manipulation attempt: pink bar on the turn, the `evidence` spans highlighted at their exact offsets, category and severity shown, and the finding is passed on to Decide. |
| **Protect** | `POST /clocked/pii` | The whole transcript, `entities: person, phone, email, credit_card, address, date_of_birth`, `anonymize: "replace"` | Every finding is underlined in the transcript by type. `anonymized_text` powers the "Show masked copy" view and the "Copy masked transcript" button, and it is the only version of the call that Decide ever sees. |
| **Extract** | `POST /clocked/extract` | The transcript, 7 fields (name, party size, date, time, phone, email, dietary list) with `format` / `normalize` hints | Fills the booking record on the report card with values and confidence, highlights each value in the transcript at its `start`/`end`, and counts how many of the 5 core booking fields the host captured. |
| **Verify** | `POST /clocked/grounding` | All host turns as `answer`, the approved facts as the one document, `evidence: "all"` | Each claim gets a verdict note under the host turn that said it (contradicted = red, not in facts = amber, supported = green) with the facts passage quoted. The grounded score goes on the ticket and report, and the evidence offsets are highlighted inside the approved facts. |
| **Decide** | `POST /clocked/decide` | State = masked transcript + Guard findings + Verify verdicts + non-personal booking fields; a `choice`, a `multiselect` and a `score` question | `outcome` sets the status stamp (Booked / Answered / Callback / Escalate), `followups` becomes the staff to-do list with probabilities, `severity` is printed under the stamp. |

Nothing on screen is computed by heuristics in place of a Clocked answer. The only client-side logic is mapping
offsets to highlights and attaching each Verify claim to the host turn whose words it shares most.

Live demo: https://clocked-callcheck.pages.dev · Demo video: https://clocked-callcheck.pages.dev/demo.mp4

## Why

We are building an AI phone receptionist for restaurants (AIRest, pre-launch). Before a restaurant owner lets an AI
answer their phone, they need a way to review what it said: did a caller talk it into a free table, did it give wrong
allergy information, did it capture the booking, and can the recording be shared with staff without exposing the
guest's card number. CallCheck is that review screen, built as a new standalone app for the Clocked Build Challenge.

All data in this repo is synthetic. "Bella Vista" is a fictional restaurant, phone numbers use the reserved
613-555-01xx range, the card number is a public test number.

## Architecture

```
browser (public/app.js) ──POST /api/clocked/<endpoint>──▶ Cloudflare Pages Function ──▶ clocked.rezolve.ai/clocked/<endpoint>
                                                        (functions/api/clocked/[endpoint].js)
                                                        adds Authorization: Bearer $CLOCKED_API_KEY
                                                        sets Idempotency-Key (one UUID per attempt)
                                                        allows only injection|pii|extract|grounding|decide, 64 KB cap
```

* The API key is an encrypted Pages secret and never reaches the browser or git.
* Requests run one at a time (the trial plan allows 1 concurrent request). A 429 or 5xx is retried with backoff and
  the **same** Idempotency-Key, as the Clocked errors guide asks; `retryAsNew` stops retries.
* All offsets are treated as Unicode code points (`Array.from(text)`), never UTF-16 indices.
* `X-Clocked-Credits` and `X-Clocked-Model-Ms` are passed through, so the report shows what the review cost.
* The "API log" panel at the bottom shows every request body and raw response.

No build step, no framework: `public/` is plain HTML, CSS and ES modules.

## Run it yourself (under 10 minutes)

Requirements: Node 18+, a Clocked API key (https://clocked.rezolve.ai, free trial), optionally a Cloudflare account.

```bash
git clone https://github.com/ctmakc/clocked-callcheck && cd clocked-callcheck
npm install
cp .env.example .dev.vars          # put your key in .dev.vars (gitignored)
npm run dev                        # http://localhost:8788
```

Open the page, keep the "Group booking gone wrong" sample, press **Check this call**.

Deploy to your own Cloudflare Pages project:

```bash
npx wrangler login
npx wrangler pages project create clocked-callcheck --production-branch main
npx wrangler pages secret put CLOCKED_API_KEY --project-name clocked-callcheck
npm run deploy
```

### Local replay mode

`http://localhost:8788/?replay=1` replays responses from `public/dev-fixtures/<sample>.json` (gitignored) for UI work
without spending credits. A pink banner marks every replayed screen, and replay is disabled on any host other than
localhost, so the deployed app only ever shows live Clocked results.

## Files

* `public/index.html`, `public/styles.css`: the single page (ticket rail, transcript, report card)
* `public/app.js`: pipeline, offset-to-highlight rendering, report
* `public/samples.js`: approved facts and three synthetic calls
* `functions/api/clocked/[endpoint].js`: the key-holding proxy
* `DESIGN.md`: design decisions

## Limits

CallCheck is a review aid. Guard, Protect and Verify are detectors with thresholds; a missed finding is possible, so a
person still owns the decision. The masked transcript only masks what Protect found.

MIT License.
