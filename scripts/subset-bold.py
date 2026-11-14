#!/usr/bin/env python3
import glob
import json
import os
import sys

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit('[fonts:bold] fonttools is required: pip install fonttools brotli')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'scripts/fonts/HONORSansCN-Bold.woff2')
OUT_DIR = os.path.join(ROOT, 'src/assets/fonts')
LOCALES_DIR = os.path.join(ROOT, 'public/i18n')
LABEL_KEYS = ('MTT_xq_buy', 'UITexasReport_Label_AllBarPZ')


def read_locales():
    files = glob.glob(os.path.join(LOCALES_DIR, 'h5-cc-i18n.*.js'))
    if not files:
        sys.exit('[fonts:bold] no dictionaries in public/i18n, run pnpm sync:i18n first')
    for path in files:
        with open(path, encoding='utf-8') as handle:
            code = handle.read()
        yield json.loads(code[code.index('m=') + 2:code.rindex(';if(r&&r.registerLocale)')])


def is_latin(cp):
    return cp <= 0x052F or 0x2000 <= cp <= 0x206F or 0x20A0 <= cp <= 0x20CF


def build(name, codepoints):
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.notdef_outline = True
    options.name_IDs = [1, 2, 3, 4, 6]
    font = subset.load_font(SOURCE, options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    out = os.path.join(OUT_DIR, '%s.woff2' % name)
    subset.save_font(font, out, options)
    print('[fonts:bold] %-26s %4d chars %6d bytes' % (os.path.relpath(out, ROOT), len(codepoints), os.path.getsize(out)))


def main():
    if not os.path.exists(SOURCE):
        sys.exit('[fonts:bold] missing source font: %s' % SOURCE)
    cmap = set(TTFont(SOURCE, recalcTimestamp=False).getBestCmap())
    labels = set()
    for locale in read_locales():
        for key in LABEL_KEYS:
            labels.update(ord(ch) for ch in locale.get(key, ''))
    build('honor-sans-cn-bold', sorted(cp for cp in cmap if is_latin(cp)))
    build('honor-sans-cn-bold-cjk', sorted(cp for cp in labels & cmap if not is_latin(cp)))


if __name__ == '__main__':
    main()
