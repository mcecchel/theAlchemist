#!/usr/bin/env python3
"""
Genera le pagine HTML da template e contenuto.
Riduce la duplicazione tra le pagine mantenendo una sorgente di verità unica.
"""

from pathlib import Path

# Metadati per ogni pagina
PAGES = {
	'index.html': {
		'title': 'Marianna Cecchelli — Visual Designer & Full-Stack Developer',
		'desc': 'Portfolio di Marianna Cecchelli — Visual Designer & Full-Stack Developer. Firenze.',
		'current_nav': 'Home',
	},
	'about.html': {
		'title': 'About — Marianna Cecchelli',
		'desc': 'Percorso, formazione, competenze ed esperienze di Marianna Cecchelli — Visual Designer & Full-Stack Developer.',
		'current_nav': 'About',
	},
	'portfolio.html': {
		'title': 'Portfolio — Marianna Cecchelli',
		'desc': 'Progetti di Marianna Cecchelli: sviluppo web, brand identity, WordPress & strategy, video.',
		'current_nav': 'Portfolio',
	},
	'contatti.html': {
		'title': 'Contatti — Marianna Cecchelli',
		'desc': 'Contatti di Marianna Cecchelli — Visual Designer & Full-Stack Developer, Firenze.',
		'current_nav': 'Contatti',
	},
}

def generate_pages():
	base_template = Path('templates/base.html').read_text()
	warning = '<!-- AVVERTENZA: questo file è GENERATO AUTOMATICAMENTE da generate_pages.py\n     NON MODIFICARE: le tue modifiche verranno sovrascritte.\n     Modifica invece templates/{nome}_content.html -->\n'
	
	for page_name, meta in PAGES.items():
		# Leggi il template del contenuto unico
		content_file = Path(f'templates/{Path(page_name).stem}_content.html')
		if not content_file.exists():
			print(f'⚠ {content_file} non trovato, salto {page_name}')
			continue
		
		content = content_file.read_text()
		
		# Sostituisci i placeholder nel base template
		html = base_template
		html = html.replace('{{PAGE_TITLE}}', meta['title'])
		html = html.replace('{{PAGE_DESC}}', meta['desc'])
		html = html.replace('{{CONTENT}}', content)
		
		# Aggiungi la classe is-current solo al primo link dentro la navigazione.
		# Il link del logo usa lo stesso href e non deve ricevere la classe.
		nav_link = f'<nav class="nav" id="site-nav">\n\t\t<a href="{page_name}"'
		current_link = f'<nav class="nav" id="site-nav">\n\t\t<a href="{page_name}" class="is-current"'
		html = html.replace(nav_link, current_link)
		
		# Aggiungi avvertenza all'inizio del file
		html = warning.replace('{nome}', Path(page_name).stem) + html
		
		# Scrivi il file HTML finale
		Path(page_name).write_text(html)
		print(f'✓ {page_name}')

if __name__ == '__main__':
	generate_pages()
	print('\n✅ Pagine HTML generate da template.')
