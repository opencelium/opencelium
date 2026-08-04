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
extensions = ['sphinx.ext.intersphinx','sphinx_rtd_theme','sphinx_copybutton','sphinx_new_tab_link']
html_theme = "sphinx_rtd_theme"

source_suffix = ['.rst','.md']
copyright = str(datetime.now().year)
version = 'latest'
release = 'latest'

# |year| resolves to the year the docs are built, so copyright notices in the
# content do not have to be touched every January.
rst_epilog = """
.. |year| replace:: {year}
""".format(year=datetime.now().year)
exclude_patterns = ['_build', '_tools']
htmlhelp_basename = 'openceliumapi'

html_static_path = ['_static']
html_extra_path = ['api_docs']

html_js_files = [
    'js/custom.js',
    'https://code.jquery.com/jquery-3.7.1.min.js',
    'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js',
    'js/compatibilityMatrix.js',
]
html_css_files = [
    'css/compatibilityMatrix.css',
    'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css',
    'css/custom.css',
]
