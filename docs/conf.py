import sphinx
from sphinx.util import logging

logger = logging.getLogger(__name__)


from __future__ import division, print_function, unicode_literals

from datetime import datetime

# -- Customized ---------------------------------------------------

html_title = "OpenCelium documentation"
master_doc = 'index'
project = u'OpenCelium'
#html_short_title = None
html_logo = 'img/opencelium_logo.png'
html_favicon = 'img/favicon32x32.png'
numpydoc_show_class_members = False
class_members_toctree = False
file_insertion_enabled = False
extensions = ['sphinx.ext.intersphinx', 'sphinx_rtd_theme','sphinx_copybutton']
html_theme = "sphinx_rtd_theme"

source_suffix = ['.rst','.md']
copyright = str(datetime.now().year)
version = 'latest'
release = 'latest'
exclude_patterns = ['_build']
htmlhelp_basename = 'openceliumapi'

html_js_files = [
    'js/custom.js',
]
html_css_files = [
    'css/custom.css',
]

def setup(app):
    app.add_config_value('csp_header', '', 'html')
    app.connect('builder-inited', add_csp_header)

def add_csp_header(app):
    if isinstance(app.builder, sphinx.builders.html.StandaloneHTMLBuilder):
        header = app.config.csp_header
        if header:
            app.config.html_context['csp_header'] = header
        else:
            logger.warning("CSP header is not set. Please set 'csp_header' in conf.py.")

# Add your desired CSP header here
csp_policy = "default-src 'self'; frame-src 'self' docs.opencelium.io;"
html_context = {
    'csp_header': csp_policy,
}

def setup(app):
    app.add_config_value('csp_header', '', 'html')
    app.connect('builder-inited', add_csp_header)
    app.add_js_file(None, body=f'''
    <script>
    document.addEventListener('DOMContentLoaded', function () {{
        let meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "{csp_policy}";
        document.getElementsByTagName('head')[0].appendChild(meta);
    }});
    </script>
    ''')