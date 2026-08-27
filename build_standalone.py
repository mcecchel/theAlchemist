# Costruisce le pagine autoportanti: inlinea css, js, font e immagini.
import re, os, base64, urllib.parse, pathlib, mimetypes

SRC, OUT = '.', 'anteprima-singolo-file'
os.makedirs(OUT, exist_ok=True)

style = open(f'{SRC}/css/style.css').read()
fonts = open(f'{SRC}/css/fonts.css').read()
js    = open(f'{SRC}/js/script.js').read()

def img_data_uri(path):
	file_path = pathlib.Path(SRC) / path
	mime_type = mimetypes.guess_type(file_path.name)[0] or 'application/octet-stream'
	file_data = file_path.read_bytes()
	if mime_type == 'image/svg+xml':
		return 'data:image/svg+xml,' + urllib.parse.quote(file_data.decode('utf-8'), safe="")
	return f'data:{mime_type};base64,' + base64.b64encode(file_data).decode('ascii')

for page in ['index.html', 'about.html', 'portfolio.html', 'contatti.html']:
	html = open(f'{SRC}/{page}').read()
	html = re.sub(r'<link rel="stylesheet" href="css/fonts\.css">\s*<link rel="stylesheet" href="css/style\.css">',
				  lambda m: f'<style>\n{fonts}\n{style}\n</style>', html)
	html = html.replace('<script src="js/script.js"></script>', f'<script>\n{js}\n</script>')
	for m in set(re.findall(r'src="(assets/img/[^"]+)"', html)):
		html = html.replace(f'src="{m}"', f'src="{img_data_uri(m)}"')
	open(f'{OUT}/{page}', 'w').write(html)
	print(page, round(os.path.getsize(f'{OUT}/{page}')/1024), 'KB')
