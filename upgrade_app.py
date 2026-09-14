from pathlib import Path

p=Path('index.html')
t=p.read_text(encoding='utf-8')

firebase_head='''  <script defer src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>\n  <script defer src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>\n'''
if 'firebase-firestore-compat.js' not in t:
    t=t.replace('  <link rel="stylesheet" href="ios.css?v=4" />\n', '  <link rel="stylesheet" href="ios.css?v=4" />\n'+firebase_head, 1)

old='''<div id="standaloneMsg" class="standalone" style="display:none">Modo móvil: la app guarda tus sesiones y mediciones en este dispositivo. La sincronización con Google Sheets puede conectarse después sin cambiar el diseño.</div>'''
new='''<div id="standaloneMsg" class="standalone" style="display:none">Tus cambios se guardan primero en este dispositivo y se sincronizan con Firebase cuando hay conexión.</div>'''
t=t.replace(old,new)

marker='''        <div class="form-card"><h3>Registrar medición</h3>'''
weigh='''        <div class="daily-weigh-card"><div class="daily-weigh-icon">⚖️</div><div><b>Pesaje diario · 20:30</b><span>Todos los días, antes de cenar. Registrá el peso acá para mantener actualizada tu evolución.</span></div></div>\n'''
if 'Pesaje diario · 20:30' not in t:
    t=t.replace(marker,weigh+marker,1)

custom='''  <script src="customize.js?v=4"></script>'''
if 'firebase-sync.js' not in t:
    t=t.replace(custom, custom+'\n  <script src="firebase-sync.js?v=1"></script>',1)

p.write_text(t,encoding='utf-8')
