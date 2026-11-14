"""Build the English CV from the same verified content used by the portfolio."""
import json
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape
from shutil import copyfile

from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
import reportlab

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / 'output' / 'pdf' / 'elkin-lopez-cv.pdf'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
profile = json.loads((ROOT / 'content/profile.json').read_text(encoding='utf-8'))
projects = json.loads((ROOT / 'content/projects.json').read_text(encoding='utf-8'))
credentials = json.loads((ROOT / 'content/credentials.json').read_text(encoding='utf-8'))
font_dir = Path('C:/Windows/Fonts')
if (font_dir / 'arial.ttf').exists():
    font_files = {'CV': font_dir / 'arial.ttf', 'CV-Bold': font_dir / 'arialbd.ttf', 'CV-Italic': font_dir / 'ariali.ttf'}
else:
    font_dir = Path(reportlab.__file__).parent / 'fonts'
    font_files = {'CV': font_dir / 'Vera.ttf', 'CV-Bold': font_dir / 'VeraBd.ttf', 'CV-Italic': font_dir / 'VeraIt.ttf'}
for name, path in font_files.items():
    pdfmetrics.registerFont(TTFont(name, str(path)))
pdfmetrics.registerFontFamily('CV', normal='CV', bold='CV-Bold', italic='CV-Italic', boldItalic='CV-Bold')

W, H = A4
M = 39
WIDTH = W - 2 * M
INK = colors.HexColor('#172744')
BLUE = colors.HexColor('#3156c9')
MUTED = colors.HexColor('#51617b')
LINE = colors.HexColor('#d5deed')
c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
c.setTitle('Elkin Joao López Garcés - Curriculum Vitae')
c.setAuthor(profile['name'])
c.setSubject('Software Engineering student - projects and professional internship')
y = H - M
body = ParagraphStyle('Body', fontName='CV', fontSize=10, leading=13.6, textColor=INK)
small = ParagraphStyle('Small', parent=body, fontSize=9.2, leading=12.6, textColor=MUTED)
bullet = ParagraphStyle('Bullet', parent=body, leftIndent=9, firstLineIndent=-8, spaceAfter=3.8)

def para(text, style=body, width=WIDTH, after=4):
    global y
    p = Paragraph(text, style)
    _, height = p.wrap(width, H)
    p.drawOn(c, M, y - height)
    y -= height + after

def section(title):
    global y
    y -= 11
    c.setFillColor(BLUE)
    c.setFont('CV-Bold', 9.2)
    c.drawString(M, y, title.upper())
    c.setStrokeColor(LINE)
    c.setLineWidth(.55)
    c.line(M + pdfmetrics.stringWidth(title.upper(), 'CV-Bold', 9.2) + 14, y + 3, W - M, y + 3)
    y -= 17

def link(text, url):
    return '<a href="' + escape(url, {'"': '&quot;'}) + '" color="#3156c9">' + escape(text) + '</a>'

# The original photo is placed and clipped in the document; the image is not retouched.
photo = ImageReader(str(ROOT / profile['photo'].lstrip('/')))
iw, ih = photo.getSize()
pw, ph = 69, 84
px, py = W - M - pw, H - M - ph + 4
scale = max(pw / iw, ph / ih)
c.saveState()
path = c.beginPath(); path.rect(px, py, pw, ph)
c.clipPath(path, stroke=0)
c.drawImage(photo, px + (pw - iw * scale) / 2, py + (ph - ih * scale) / 2, iw * scale, ih * scale)
c.restoreState()
c.setStrokeColor(LINE); c.rect(px, py, pw, ph, stroke=1, fill=0)
c.setFillColor(INK); c.setFont('CV-Bold', 22)
c.drawString(M, y - 19, profile['name'])
c.setFillColor(BLUE); c.setFont('CV', 10.6)
c.drawString(M, y - 38, 'Software Engineering Student')
y -= 53
para(link(profile['email'], 'mailto:' + profile['email']), small, width=WIDTH - 90, after=3)
para(link('github.com/Elkinnn', profile['github']) + ' &nbsp;|&nbsp; ' + link('LinkedIn / Elkin Joao López Garcés', profile['linkedin']), small, width=WIDTH - 90, after=0)
y = H - M - 103
para(escape(profile['summary']), after=2)

section('Professional experience')
x = profile['experience']
para('<b>AMBACAR</b> &nbsp;|&nbsp; Professional Internship', after=1)
para('<b>Software Development &amp; IT Support</b>', after=1)
date_label = "Started " + datetime.strptime(x["startDate"], "%Y-%m-%d").strftime("%B %Y") + f" | {x['hours']} hours completed"
para(date_label + ' &nbsp;|&nbsp; Angular / C# / Oracle', small, after=7)
bullets = [item['text'] for item in x['responsibilities']]
for text in bullets:
    para('- ' + escape(text), bullet, after=3)

section('Selected projects')
project_notes = [
 ('stayschool', 'Contributed to the foundation of student tracking and early alerts. Next.js, TypeScript, MongoDB.'),
 ('hospital', 'Worked on circuit-breaker notifications, PDF reports and Azure deployment updates. React, Express, MySQL, Docker.'),
 ('traffic', 'Contributed implementation updates and refactoring to an academic computer vision pipeline. Python, YOLO, OpenCV, CNN, Streamlit.')
]
for key, text in project_notes:
    p = projects[key]
    para('<b>' + link(p['title'], p['repo']) + '</b> &nbsp; <font color="#71809a">/ Academic &amp; collaborative work</font>', after=1)
    para(escape(text), small, after=6)

section('Technical skills')
para('<b>Frontend:</b> Angular, React, Next.js, TypeScript, JavaScript, HTML, CSS.', after=2)
para('<b>Backend &amp; data:</b> C#, Node.js, Express, Java, Spring Boot, Oracle, PostgreSQL, MySQL, MongoDB.', after=2)
para('<b>Tools &amp; applied AI:</b> Git, Docker, Python, OpenCV, Streamlit; functional and integration testing.', after=2)

section('Education')
para('<b>Universidad Técnica de Ambato</b> &nbsp;|&nbsp; Software Engineering', after=1)
para('Eighth semester - In progress', small, after=2)

section('Certifications & learning')
for item in credentials:
    para(link(item['title'], item['url']) + ' &nbsp;|&nbsp; ' + escape(item['issuer']), small, after=3)

if y < 28:
    raise RuntimeError(f'CV content needs layout adjustment: bottom at {y:.1f} pt')
c.setStrokeColor(LINE); c.line(M, 28, W - M, 28)
c.setFillColor(MUTED); c.setFont('CV', 7)
c.drawString(M, 17, profile['name'] + ' | Curriculum Vitae')
c.drawRightString(W - M, 17, '1 / 1')
c.save()
asset = ROOT / profile['cv'].lstrip('/')
asset.parent.mkdir(parents=True, exist_ok=True)
copyfile(OUTPUT, asset)
print(f'Created {OUTPUT}; last content baseline: {y:.1f} pt')
