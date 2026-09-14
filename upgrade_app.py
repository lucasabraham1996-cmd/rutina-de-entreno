from pathlib import Path

p=Path('index.html')
t=p.read_text(encoding='utf-8')

firebase_head='''  <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>\n  <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>\n'''
t=t.replace('  <script defer src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>\n  <script defer src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>\n',firebase_head)
if 'firebase-firestore-compat.js' not in t:
    t=t.replace('  <link rel="stylesheet" href="ios.css?v=4" />\n', '  <link rel="stylesheet" href="ios.css?v=4" />\n'+firebase_head, 1)

old='''<div id="standaloneMsg" class="standalone" style="display:none">Modo móvil: la app guarda tus sesiones y mediciones en este dispositivo. La sincronización con Google Sheets puede conectarse después sin cambiar el diseño.</div>'''
new='''<div id="standaloneMsg" class="standalone" style="display:none">Tus cambios se guardan primero en este dispositivo y se sincronizan con Firebase cuando hay conexión.</div>'''
t=t.replace(old,new)
t=t.replace('Guardar sesión en la hoja','Guardar sesión')
t=t.replace('<small>desde la hoja</small>','<small>Firebase + dispositivo</small>')

marker='''        <div class="form-card"><h3>Registrar medición</h3>'''
weigh='''        <div class="daily-weigh-card"><div class="daily-weigh-icon">⚖️</div><div><b>Pesaje diario · 20:30</b><span>Todos los días, antes de cenar. Registrá el peso acá para mantener actualizada tu evolución.</span></div></div>\n'''
if 'Pesaje diario · 20:30' not in t:
    t=t.replace(marker,weigh+marker,1)

style='''\n<style id="firebaseUiStyle">.daily-weigh-card{margin:0 0 12px;background:#fff;border-radius:22px;padding:14px 15px;display:flex;align-items:center;gap:12px}.daily-weigh-icon{width:44px;height:44px;border-radius:13px;background:#eaf3ff;display:grid;place-items:center;font-size:22px;flex:0 0 auto}.daily-weigh-card b{display:block;font-size:15px}.daily-weigh-card span{display:block;color:#6e6e73;font-size:12px;line-height:1.35;margin-top:3px}</style>\n'''
if 'firebaseUiStyle' not in t:
    t=t.replace('</head>',style+'</head>',1)

custom='''  <script src="customize.js?v=4"></script>'''
if 'firebase-sync.js' not in t:
    t=t.replace(custom, custom+'\n  <script src="firebase-sync.js?v=1"></script>',1)

p.write_text(t,encoding='utf-8')
