from pathlib import Path

p=Path('index.html')
t=p.read_text(encoding='utf-8')

t=t.replace('<meta name="theme-color" content="#F2F2F7" />','<meta name="theme-color" content="#7C3AED" />')

css='  <link rel="stylesheet" href="premium.css?v=1" />\n'
if 'premium.css' not in t:
    t=t.replace('</head>',css+'</head>',1)

js='  <script src="bodymap.js?v=1"></script>\n'
if 'bodymap.js' not in t:
    t=t.replace('</body>',js+'</body>',1)

p.write_text(t,encoding='utf-8')
