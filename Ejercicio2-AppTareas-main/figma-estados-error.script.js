// Script para Figma — agrega estados de error/validación y botones de ver/ocultar contraseña
// al archivo "List Website – Mantenimiento SDD" (https://www.figma.com/design/iB0ecveG98qUzLqb2vJBFp).
//
// Cómo ejecutarlo (no consume cuota del MCP):
//   1. Abre el archivo en Figma Desktop o web, en la página "Pantallas".
//   2. Instala/abre el plugin de comunidad "Scripter" (Plugins → Buscar "Scripter").
//   3. Pega todo este archivo en el editor de Scripter y presiona ▶ Run.
//
// Requiere la fuente Inter (viene por defecto en Figma) y la colección de variables
// "List Website · Colores" que ya existe en el archivo.

const vars = await figma.variables.getLocalVariablesAsync('COLOR');
const V = {}; for (const v of vars) V[v.name] = v;
const P = (name, opacity) => {
  const p = figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V[name]);
  if (opacity != null) p.opacity = opacity;
  return p;
};
const F = { reg: { family: 'Inter', style: 'Regular' }, med: { family: 'Inter', style: 'Medium' }, semi: { family: 'Inter', style: 'Semi Bold' }, bold: { family: 'Inter', style: 'Bold' } };
for (const f of Object.values(F)) await figma.loadFontAsync(f);
const created = [], mutated = [];

// Equivalente a figma.createAutoLayout() del MCP usando la API estándar
function createAutoLayout(dir) {
  const f = figma.createFrame();
  f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.fills = [];
  return f;
}
function T(chars, o = {}) {
  const t = figma.createText(); t.fontName = F[o.font || 'reg']; t.characters = chars; t.fontSize = o.size || 14;
  t.fills = [P(o.color || 'text/primary')]; t.lineHeight = { unit: 'PERCENT', value: o.lh || 140 };
  if (o.width) { t.resize(o.width, t.height); t.textAutoResize = 'HEIGHT'; }
  t.name = o.name || chars.slice(0, 30); return t;
}
function AL(dir, o = {}) {
  const f = createAutoLayout(dir);
  if (o.name) f.name = o.name;
  f.itemSpacing = o.gap || 0;
  const pv = o.py != null ? o.py : (o.pad || 0), ph = o.px != null ? o.px : (o.pad || 0);
  f.paddingTop = pv; f.paddingBottom = pv; f.paddingLeft = ph; f.paddingRight = ph;
  f.fills = o.fill ? [P(o.fill, o.fillOpacity)] : [];
  if (o.stroke) { f.strokes = [P(o.stroke)]; f.strokeWeight = o.sw || 1; }
  if (o.radius != null) f.cornerRadius = o.radius;
  if (o.pa) f.primaryAxisAlignItems = o.pa;
  if (o.ca) f.counterAxisAlignItems = o.ca;
  return f;
}
function add(parent, child, o = {}) { parent.appendChild(child); if (o.fill) child.layoutSizingHorizontal = 'FILL'; return child; }
function Vec(parent, d, color, w = 2.5) {
  const v = figma.createVector(); v.vectorPaths = [{ windingRule: 'NONZERO', data: d }];
  v.strokes = [P(color)]; v.strokeWeight = w; v.strokeCap = 'ROUND'; v.strokeJoin = 'ROUND'; v.fills = []; parent.appendChild(v); return v;
}
const Check = (parent, color) => Vec(parent, 'M 4 10.5 L 8.5 15 L 16 6', color);
function Eye(parent, visible) {
  const b = AL('HORIZONTAL', { name: visible ? 'Icon / eye-off (ocultar)' : 'Icon / eye (mostrar)', pa: 'CENTER', ca: 'CENTER' });
  parent.appendChild(b); b.resize(22, 22);
  let d = 'M 2 11 C 5 5 17 5 20 11 C 17 17 5 17 2 11 Z M 14 11 C 14 12.657 12.657 14 11 14 C 9.343 14 8 12.657 8 11 C 8 9.343 9.343 8 11 8 C 12.657 8 14 9.343 14 11 Z';
  if (visible) d += ' M 3 3 L 19 19';
  Vec(b, d, 'text/secondary', 1.8).name = 'eye';
  return b;
}
function Screen(name, x, y, w = 1280, h = 900) {
  const s = AL('VERTICAL', { name, fill: 'bg/page', pa: 'CENTER', ca: 'CENTER' });
  figma.currentPage.appendChild(s); s.resize(w, h); s.x = x; s.y = y; created.push({ name, id: s.id }); return s;
}
function Card(parent, w = 440) {
  const c = AL('VERTICAL', { name: 'Card', pad: 40, gap: 24, fill: 'bg/card', radius: 20 });
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.05, b: 0.3, a: 0.45 }, offset: { x: 0, y: 16 }, radius: 40, spread: 0, visible: true, blendMode: 'NORMAL' }];
  parent.appendChild(c); c.resize(w, c.height); c.layoutSizingVertical = 'HUG'; return c;
}
function Brand(parent) {
  const r = add(parent, AL('HORIZONTAL', { name: 'Brand', gap: 10, ca: 'CENTER' }));
  const mark = AL('HORIZONTAL', { name: 'Logo', fill: 'accent/primary', radius: 9, pa: 'CENTER', ca: 'CENTER' });
  r.appendChild(mark); mark.resize(32, 32); Check(mark, 'text/onAccent');
  add(r, T('List Website', { size: 16, font: 'bold' }));
}
function Heading(parent, title, sub) {
  const h = add(parent, AL('VERTICAL', { name: 'Heading', gap: 6 }), { fill: true });
  add(h, T(title, { size: 28, font: 'bold', lh: 120 }));
  if (sub) add(h, T(sub, { size: 15, color: 'text/secondary', width: 360 }), { fill: true });
}
function ErrorMsg(parent, msg, kind = 'danger') {
  const color = kind === 'danger' ? 'status/danger' : 'status/success';
  const r = add(parent, AL('HORIZONTAL', { name: 'Message / ' + kind, gap: 6, ca: 'CENTER' }), { fill: true });
  const dot = AL('HORIZONTAL', { name: 'icon', fill: color, radius: 8, pa: 'CENTER', ca: 'CENTER' });
  r.appendChild(dot); dot.resize(16, 16);
  if (kind === 'danger') add(dot, T('!', { size: 11, font: 'bold', color: 'text/onAccent', lh: 100 })); else Vec(dot, 'M 4 8 L 7 11 L 12 5', 'text/onAccent', 2).name = 'check';
  add(r, T(msg, { size: 12, font: 'med', color, width: 300 }), { fill: true });
  return r;
}
function Banner(parent, msg, kind, linkText) {
  const color = kind === 'danger' ? 'status/danger' : (kind === 'success' ? 'status/success' : 'accent/link');
  const b = add(parent, AL('VERTICAL', { name: 'Banner / ' + kind, px: 16, py: 12, gap: 6, radius: 10, fill: color, fillOpacity: 0.16, stroke: color }), { fill: true });
  add(b, T(msg, { size: 14, font: 'med', color, width: 328 }), { fill: true });
  if (linkText) add(b, T(linkText, { size: 13, font: 'semi', color: 'accent/link' }));
  return b;
}
function Field(parent, label, text, o = {}) {
  const g = add(parent, AL('VERTICAL', { name: 'Field / ' + label + (o.error ? ' / error' : ''), gap: 8 }), { fill: true });
  add(g, T(label, { size: 13, font: 'med', color: 'text/secondary' }));
  const input = add(g, AL('HORIZONTAL', { name: 'Input', px: 16, py: 14, fill: 'bg/input', stroke: o.error ? 'status/danger' : (o.success ? 'status/success' : 'border/default'), sw: o.error || o.success ? 1.5 : 1, radius: 10, gap: 10, ca: 'CENTER' }), { fill: true });
  add(input, T(text, { size: 15, color: o.value ? 'text/primary' : 'text/secondary' }), { fill: true });
  if (o.password) Eye(input, !!o.visible);
  if (o.error) ErrorMsg(g, o.error);
  return g;
}
function Button(parent, label, o = {}) {
  const v = o.variant || 'primary';
  const b = AL('HORIZONTAL', { name: 'Button / ' + label, px: 20, py: 14, radius: 10, gap: 8, pa: 'CENTER', ca: 'CENTER',
    fill: v === 'primary' ? 'accent/primary' : null, stroke: v === 'outline' ? 'border/default' : null, sw: 1.5 });
  add(b, T(label, { font: 'semi', size: 15, color: v === 'primary' ? 'text/onAccent' : 'text/primary' }));
  add(parent, b, { fill: true }); if (o.disabled) { b.opacity = 0.5; b.name += ' / disabled'; } return b;
}
function Footer(parent, plain, link) {
  const r = add(parent, AL('HORIZONTAL', { name: 'Footer', gap: 6, pa: 'CENTER', ca: 'CENTER' }), { fill: true });
  if (plain) add(r, T(plain, { size: 14, color: 'text/secondary' }));
  add(r, T(link, { size: 14, font: 'semi', color: 'accent/link' }));
}
function Form(parent) { return add(parent, AL('VERTICAL', { name: 'Form', gap: 16 }), { fill: true }); }
function Req(parent, label, ok) {
  const r = add(parent, AL('HORIZONTAL', { name: 'Requisito / ' + label, gap: 8, ca: 'CENTER' }));
  const c = AL('HORIZONTAL', { name: 'icon', radius: 8, pa: 'CENTER', ca: 'CENTER', fill: ok ? 'status/success' : null, stroke: ok ? null : 'border/default', sw: 1.5 });
  r.appendChild(c); c.resize(16, 16); if (ok) Vec(c, 'M 4 8 L 7 11 L 12 5', 'text/onAccent', 2).name = 'check';
  add(r, T(label, { size: 13, color: ok ? 'text/primary' : 'text/secondary' }));
}

// ---- 1) Botones ver/ocultar contraseña en las pantallas existentes (idempotente) ----
const specs = [
  ['2:2',  [{ label: 'Contraseña', value: '••••••••', visible: false }, { label: 'Confirmar contraseña', value: '••••••••', visible: false }]],
  ['2:46', [{ label: 'Contraseña', value: 'MiClave2026', visible: true }]],
  ['2:89', [{ label: 'Nueva contraseña', value: '••••••••••', visible: false }, { label: 'Confirmar nueva contraseña', value: 'Tareas2026!', visible: true }]],
];
for (const [sid, list] of specs) {
  const s = await figma.getNodeByIdAsync(sid);
  if (!s) continue;
  for (const sp of list) {
    const field = s.findOne(n => n.type === 'FRAME' && n.name === 'Field / ' + sp.label);
    if (!field) continue;
    const input = field.findOne(n => n.type === 'FRAME' && n.name === 'Input');
    const txt = input.findOne(n => n.type === 'TEXT');
    txt.characters = sp.value; txt.fills = [P('text/primary')]; txt.layoutSizingHorizontal = 'FILL';
    if (!input.findOne(n => n.name.startsWith('Icon / eye'))) Eye(input, sp.visible);
    mutated.push(input.id);
  }
}

// ---- 2) Pantallas de estados de error / validación ----
const X = i => 100 + i * 1380, Y = 2400;
{ const s = Screen('01b · Registro · errores de validación', X(0), Y);
  const c = Card(s); Brand(c);
  Heading(c, 'Crea tu cuenta', 'Solo necesitas tu correo electrónico y una contraseña.');
  const f = Form(c);
  Field(f, 'Correo electrónico', 'correo@sin-dominio', { value: true, error: 'Ingresa un correo electrónico válido (ej. nombre@dominio.com).' });
  Field(f, 'Contraseña', '••••', { value: true, password: true, error: 'La contraseña debe tener al menos 8 caracteres.' });
  Field(f, 'Confirmar contraseña', '••••••', { value: true, password: true, error: 'Las contraseñas no coinciden.' });
  Button(c, 'Crear cuenta', { disabled: true });
  Footer(c, '¿Ya tienes cuenta?', 'Inicia sesión'); }
{ const s = Screen('01c · Registro · correo ya registrado', X(1), Y);
  const c = Card(s); Brand(c);
  Heading(c, 'Crea tu cuenta', 'Solo necesitas tu correo electrónico y una contraseña.');
  Banner(c, 'Este correo ya está registrado.', 'danger', 'Inicia sesión o recupera tu contraseña →');
  const f = Form(c);
  Field(f, 'Correo electrónico', 'tu@correo.com', { value: true, error: 'Ya existe una cuenta con este correo.' });
  Field(f, 'Contraseña', '••••••••••', { value: true, password: true });
  Field(f, 'Confirmar contraseña', '••••••••••', { value: true, password: true });
  Button(c, 'Crear cuenta');
  Footer(c, '¿Ya tienes cuenta?', 'Inicia sesión'); }
{ const s = Screen('03b · Inicio de sesión · credenciales incorrectas', X(2), Y);
  const c = Card(s); Brand(c);
  Heading(c, 'Bienvenido de nuevo', 'Inicia sesión para ver y organizar tus tareas.');
  Banner(c, 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.', 'danger');
  const f = Form(c);
  Field(f, 'Correo electrónico', 'tu@correo.com', { value: true });
  Field(f, 'Contraseña', 'MiClave2025', { value: true, password: true, visible: true });
  const r = add(f, AL('HORIZONTAL', { name: 'Forgot', pa: 'MAX' }), { fill: true });
  add(r, T('¿Olvidaste tu contraseña?', { size: 13, font: 'semi', color: 'accent/link' }));
  Button(c, 'Iniciar sesión');
  Footer(c, '¿No tienes cuenta?', 'Regístrate'); }
{ const s = Screen('03c · Inicio de sesión · cuenta sin verificar (NRF-02)', X(3), Y);
  const c = Card(s); Brand(c);
  Heading(c, 'Bienvenido de nuevo', 'Inicia sesión para ver y organizar tus tareas.');
  Banner(c, 'Tu cuenta aún no está verificada. Revisa tu correo para activarla.', 'warning', 'Reenviar correo de verificación →');
  const f = Form(c);
  Field(f, 'Correo electrónico', 'tu@correo.com', { value: true });
  Field(f, 'Contraseña', '••••••••••', { value: true, password: true });
  const r = add(f, AL('HORIZONTAL', { name: 'Forgot', pa: 'MAX' }), { fill: true });
  add(r, T('¿Olvidaste tu contraseña?', { size: 13, font: 'semi', color: 'accent/link' }));
  Button(c, 'Iniciar sesión');
  Footer(c, '¿No tienes cuenta?', 'Regístrate'); }
{ const s = Screen('04b · Recuperar contraseña · correo no encontrado', X(4), Y);
  const c = Card(s); Brand(c);
  Heading(c, 'Recupera tu contraseña', 'Escribe tu correo y te enviaremos un enlace para restablecerla.');
  const f = Form(c);
  Field(f, 'Correo electrónico', 'otro@correo.com', { value: true, error: 'No encontramos una cuenta con este correo.' });
  Button(c, 'Enviar enlace de recuperación');
  Footer(c, '', 'Volver a iniciar sesión'); }
{ const s = Screen('04c · Recuperar contraseña · enlace enviado', X(5), Y);
  const c = Card(s); Brand(c);
  Heading(c, 'Recupera tu contraseña', 'Escribe tu correo y te enviaremos un enlace para restablecerla.');
  Banner(c, 'Listo. Enviamos un enlace de recuperación a tu@correo.com. Caduca en 30 minutos.', 'success');
  const f = Form(c);
  Field(f, 'Correo electrónico', 'tu@correo.com', { value: true, success: true });
  Button(c, 'Reenviar enlace', { variant: 'outline' });
  Footer(c, '', 'Volver a iniciar sesión'); }
{ const s = Screen('05b · Restablecer contraseña · validación', X(6), Y);
  const c = Card(s); Brand(c);
  Heading(c, 'Crea una nueva contraseña', 'Elige una contraseña segura para tu@correo.com.');
  const f = Form(c);
  Field(f, 'Nueva contraseña', 'tareas2026', { value: true, password: true, visible: true, error: 'La contraseña no cumple todos los requisitos.' });
  const reqs = add(f, AL('VERTICAL', { name: 'Requisitos', gap: 6, px: 4 }), { fill: true });
  Req(reqs, 'Mínimo 8 caracteres', true);
  Req(reqs, 'Al menos un número', true);
  Req(reqs, 'Al menos una letra mayúscula', false);
  Req(reqs, 'Al menos un símbolo (! @ # $ …)', false);
  Field(f, 'Confirmar nueva contraseña', 'tareas2025', { value: true, password: true, visible: true, error: 'Las contraseñas no coinciden.' });
  Button(c, 'Guardar contraseña', { disabled: true });
  Footer(c, '', 'Volver a iniciar sesión'); }

// ---- 3) 06b · Tareas · validación (clon de la pantalla 06 con errores en el formulario) ----
{
  const base = await figma.getNodeByIdAsync('3:2');
  if (base) {
    const s = base.clone(); s.name = '06b · Tareas · validación de nueva tarea'; s.x = 100; s.y = 3500; created.push({ name: s.name, id: s.id });
    const section = s.findOne(n => n.type === 'FRAME' && n.name === 'Nueva tarea');
    const inputs = section.findOne(n => n.type === 'FRAME' && n.name === 'Inputs');
    const nameInput = inputs.children[0], dateInput = inputs.children[1];
    for (const inp of [nameInput, dateInput]) { inp.strokes = [P('status/danger')]; inp.strokeWeight = 1.5; }
    const dateTxt = dateInput.findOne(n => n.type === 'TEXT'); dateTxt.characters = '15/09/2026';
    const errs = add(section, AL('VERTICAL', { name: 'Errores', gap: 4 }), { fill: true });
    ErrorMsg(errs, 'Escribe un nombre para la tarea.');
    ErrorMsg(errs, 'La fecha y hora no pueden ser anteriores a hoy.');
    const addSub = s.findOne(n => n.type === 'FRAME' && n.name === 'Add subtask');
    if (addSub) {
      addSub.children[0].strokes = [P('status/danger')]; addSub.children[0].strokeWeight = 1.5;
      ErrorMsg(addSub.parent, 'La subtarea necesita un nombre.');
    }
  }
}

figma.notify(`Listo: ${created.length} pantallas creadas, ${mutated.length} campos actualizados`);
console.log({ created, mutated });
