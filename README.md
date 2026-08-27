# Portfolio — Marianna Cecchelli

Sito statico, 4 pagine. Nessuna build, nessuna dipendenza da installare.

## Struttura

```
index.html, about.html, portfolio.html, contatti.html  — pagine generate da template
														(NON modificare direttamente)

templates/
  base.html                 Layout comune a tutte le pagine
  {index,about,portfolio,contatti}_content.html  — contenuto unico di ogni pagina
  
generate_pages.py           Script che genera le pagine HTML da template + metadati
							⚠ Esegui questo dopo OGNI modifica al contenuto o metadati
build_standalone.py         Inlinea CSS/JS/font/img per preview offline

css/style.css       Tutto lo stile. La dualità vive qui: --dom / --sub
css/fonts.css       Urban Spray (font incorporato in base64)
js/script.js        Particelle + roll 3D + profilo Designer/Developer + filtri + menu mobile

assets/fonts/       Il .ttf originale di Urban Spray
assets/img/         PLACEHOLDER SVG — da sostituire con le immagini vere

anteprima-singolo-file/   Le stesse 4 pagine, ma con CSS/JS/font/immagini inline:
						  si aprono con doppio click ovunque, utili per mostrare il sito al volo
```

## Come si guarda

- Doppio click su `index.html` (funziona da file://, purché le cartelle restino accanto)
- Oppure, meglio, un server locale: `python3 -m http.server 8000`

## Come mantenere il sito (modifica pagine)

**Non modificare mai direttamente i file `.html`** — verranno riscritti.

Per apportare modifiche:

1. **Modifica il contenuto** in `templates/{pagina}_content.html` (es. `templates/about_content.html`)
2. **Aggiorna metadati** (titolo, descrizione) in `generate_pages.py` se necessario
3. **Rigenerai le pagine**:
   ```bash
   python3 generate_pages.py
   ```
4. **Verifica e test** nel browser
5. **Rigenera i file standalone** (opzionale, per preview offline):
   ```bash
   python3 build_standalone.py
   ```

Esempio: aggiungi un nuovo progetto a portfolio
1. Modifica `templates/portfolio_content.html` (aggiungi `<article class="work-card">…</article>`)
2. Esegui `python3 generate_pages.py`
3. Verifica in `portfolio.html`

## La dualità (come funziona davvero)

Un solo stato: l'attributo `data-lens` su `<html>` — `design` o `dev`. Niente stato "assente/entrambi": finché non è scelto, il gate d'ingresso (`.lens-gate`, presente su tutte e 4 le pagine) resta in primo piano e nasconde il resto del sito. Si sceglie una volta sola (o si cambia idea col bottone "ribalta" in header) — non si torna mai a vedere i due profili insieme.

Cambia:
1. **Palette** — `--dom` / `--sub` si ribaltano. Designer = blu, Developer = magenta. Nessuna regola usa `--blue` o `--magenta` diretti: cambi due variabili e cambia tutto (gradienti, bordi, bottoni, divisori).
2. **Copy** — ogni elemento porta tre versioni: `data-both` (fallback), `data-design`, `data-dev`. Stesso contenuto, altra angolazione.
3. **Ordine** — progetti, servizi e competenze si riordinano; l'altro profilo si attenua ma non sparisce mai.
4. **Filtri** — il portfolio pre-attiva Web Development (dev) o Brand & Design (design). "Tutti" resta a un click.
5. **Texture** — griglia tecnica (dev) vs velo spray (design), e le etichette cambiano segno: `//` vs `✦`.

Il profilo scelto segue il visitatore tra le pagine (query string `?lens=dev` + `localStorage`), e uno script inline in `<head>` lo applica prima del primo paint per evitare il flash del gate ai visitatori di ritorno.

## Cosa manca (da fare a te)

- `assets/img/` — sostituisci i placeholder con le immagini vere (i nomi dei file sono già quelli giusti nell'HTML)
- Link LinkedIn e GitHub: cerca `href="#"` nelle 4 pagine
- Foto profilo in `about.html` (`assets/img/about-photo.svg`)

## Tipografia

- **Urban Spray** — solo accenti: "playground" della cover e titoli di sezione, con gradiente blu->magenta e glow
- **Space Grotesk** — titoli, UI, testo (da Google Fonts)
- **JetBrains Mono** — etichette, meta, dati (da Google Fonts)

## Accessibilità

`prefers-reduced-motion` rispettato ovunque: niente roll 3D, niente particelle, niente sweep. Focus visibile, `aria-pressed` sul selettore, menu mobile con `aria-expanded`.
