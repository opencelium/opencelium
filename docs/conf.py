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
extensions = ['sphinx.ext.intersphinx','sphinxemoji.sphinxemoji']

source_suffix = ['.rst','.md']
copyright = str(datetime.now().year)
version = 'latest'
release = 'latest'
exclude_patterns = ['_build']
htmlhelp_basename = 'openceliumapi'
html_theme = 'sphinx_rtd_theme'


def setup(app):
    app.add_javascript('js/custom.js')
    app.add_stylesheet('css/custom.css')
