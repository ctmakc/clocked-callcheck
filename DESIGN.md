# CallCheck — design decision

Subject: QA review of phone calls handled by an AI restaurant host. Real-world vernacular:
the kitchen **ticket rail** (thermal order tickets clipped to a steel pass rail), the
two-colour kitchen printer (black + red thermal ink), and the reviewer's **highlighter pens**
on a printed transcript.

## Directions considered
1. **Ticket rail (chosen).** Brushed-steel pass rail as the page, every pipeline step prints as a
   white thermal ticket clipped to the rail, the report card is the long tear-off receipt.
   Highlighter strokes mark the transcript. Motion: tickets feed out of the printer in steps.
2. Reservation book: green leather ledger, gilt serif, handwritten pencil marks. Rejected: serif +
   warm paper drifts into our house slop.
3. Audio console: dark waveform timeline with VU meters per utterance. Rejected: neon-on-dark
   dashboard prior, weak tie to restaurants.

## Locked tokens
- Rail steel `#2B2F33` (page), rail edge `#3A3F44`, thermal paper `#F7F6F1`, thermal ink `#1C1D1F`,
  red ink `#C2141F` (only for flags/contradictions), muted ink `#6B6E72`.
- Highlighters (semantic, never decorative): yellow `#FFE45C` = extracted booking field,
  blue `#9AD3FF` = PII found, pink `#FF9BC2` = guard evidence, green `#B6F09C` = supported claim.
- Type: **Host Grotesk** 800/500 (UI + display; the name is the subject), **Azeret Mono** for
  everything printed on a ticket (thermal-printer register).
- Radius 2px on paper, 0 on steel. No shadows except one: ticket hangs 1px off the rail.
- Signature: zigzag tear edge on tickets + steel clip; tickets print with `steps()` feed.
- Motion: ticket feed (clip-path, `steps(12)`), highlighter swipe (background-size 0→100%,
  expo-out 420ms), LED blink while a call is in flight. `prefers-reduced-motion` disables all.
