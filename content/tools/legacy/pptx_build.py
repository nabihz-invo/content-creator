# python pptx_build.py <layers_dir> <out.pptx>  -> background image + native editable text boxes
import json, re, sys, os
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from pptx.oxml.ns import qn

PX = 9525  # EMU per CSS px at 96dpi
d, out = sys.argv[1], sys.argv[2]
boxes = json.load(open(os.path.join(d, 'text-boxes.json'), encoding='utf-8'))
prs = Presentation()
prs.slide_width, prs.slide_height = Emu(1080 * PX), Emu(1350 * PX)
s = prs.slides.add_slide(prs.slide_layouts[6])
s.shapes.add_picture(os.path.join(d, 'background.png'), 0, 0, prs.slide_width, prs.slide_height)

def rgb(c):
    return RGBColor(*[int(x) for x in re.findall(r'\d+', c)[:3]])

for b in boxes:
    x, y, w, h = (Emu(int(v * PX)) for v in (b['x'], b['y'], b['w'] + 6, b['h']))
    filled = 'rgba(0, 0, 0, 0)' not in b.get('bg', 'rgba(0, 0, 0, 0)') and 'transparent' not in b.get('bg', '')
    boxed = b.get('border') not in (None, 'none') or filled
    if boxed:
        sh = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Emu(int(b['w'] * PX)), h)
        sh.adjustments[0] = min(0.5, b.get('radius', 0) / max(b['h'], 1))
        if filled:
            sh.fill.solid(); sh.fill.fore_color.rgb = rgb(b['bg']); sh.line.fill.background()
        else:
            sh.fill.background()
            sh.line.color.rgb = rgb(b['borderColor']); sh.line.width = Pt(1.1)
            sh.line.dash_style = MSO_LINE_DASH_STYLE.DASH
        tf = sh.text_frame
    else:
        tf = s.shapes.add_textbox(x, y, w, h).text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE if boxed else MSO_ANCHOR.TOP
    p = tf.paragraphs[0]
    from pptx.enum.text import PP_ALIGN
    if boxed:
        p.alignment = PP_ALIGN.CENTER
    elif b.get('rtl'):
        p.alignment = PP_ALIGN.RIGHT
    if b.get('rtl'):
        p._p.get_or_add_pPr().set('rtl', '1')
    lh = b['lineHeight']
    if lh.endswith('px'):
        p.line_spacing = float(lh[:-2]) / b['size']
    for r in b['runs']:
        run = p.add_run()
        run.text = r['text'].upper() if b['upper'] else r['text']
        f = run.font
        f.name = b.get('font') or 'Readex Pro'
        cs = run._r.get_or_add_rPr().makeelement(qn('a:cs'), {'typeface': f.name})
        run._r.get_or_add_rPr().append(cs)
        f.size = Pt(b['size'] * 0.75)
        f.bold = int(b['weight']) >= 600
        f.color.rgb = rgb(r['color'])
        sp = b['spacing']
        if sp.endswith('px'):
            run._r.get_or_add_rPr().set('spc', str(int(float(sp[:-2]) * 0.75 * 100)))
prs.save(out)
print('saved', out, len(boxes), 'text boxes')
