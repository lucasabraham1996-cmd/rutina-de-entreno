from pathlib import Path
p=Path('index.html')
t=p.read_text()
t=t.replace('content="#F8FAFD"','content="#F2F2F7"',1)
if 'ios.css?v=4' not in t:
    t=t.replace('</head>','  <link rel="stylesheet" href="ios.css?v=4" />\n</head>',1)
card='''        <button class="customize-card" type="button" onclick="openCustomizer()"><div class="customize-icon"><span class="material-symbols-rounded">tune</span></div><div class="customize-copy"><b>Personalizar esta semana</b><small>Sacá grupos musculares toda la semana o solo un día.</small><div id="customizeState" class="customize-state"></div></div><span class="material-symbols-rounded customize-arrow">chevron_right</span></button><div id="customActiveBanner" class="custom-active-banner"></div>\n'''
if 'id="customizeState"' not in t:
    needle='        <button class="beginner-card" type="button" onclick="goGuide()"'
    if needle not in t: raise SystemExit('No se encontró la tarjeta de guía')
    t=t.replace(needle,card+needle,1)
modal='''<div class="customize-modal" id="customizeModal" role="dialog" aria-modal="true" aria-label="Personalizar entrenamiento"><div class="modal-backdrop" onclick="closeCustomizer()"></div><div class="customize-sheet"><div class="dragbar"></div><div class="customize-head"><div><div class="tutorial-kicker">Esta semana</div><h2>Personalizar rutina</h2><p>Los cambios se reinician automáticamente el lunes.</p></div><button class="close-btn" type="button" onclick="closeCustomizer()" aria-label="Cerrar">×</button></div><div class="custom-section"><div class="custom-section-title">No trabajar en toda la semana</div><div class="custom-group" id="weekGroupControls"></div><div class="custom-hint">Ejemplo: activá Piernas para sacar ejercicios de piernas de todos los días.</div></div><div class="custom-section"><div class="custom-section-title" id="dayCustomTitle">No trabajar solo este día</div><div class="custom-group" id="dayGroupControls"></div><div class="custom-hint">Ejemplo: semana normal, pero el jueves sin brazos.</div></div><div class="custom-actions"><button class="secondary-btn" type="button" onclick="resetDayCustomization()">Restablecer día</button><button class="danger-btn" type="button" onclick="resetWeekCustomization()">Restablecer semana</button></div></div></div>\n'''
if 'id="customizeModal"' not in t:
    needle='<div class="tutorial-modal" id="tutorialModal"'
    if needle not in t: raise SystemExit('No se encontró el modal de tutorial')
    t=t.replace(needle,modal+needle,1)
if 'customize.js?v=4' not in t:
    t=t.replace('</body>','  <script src="customize.js?v=4"></script>\n</body>',1)
p.write_text(t)
print('Interfaz iPhone y personalización conectadas')
