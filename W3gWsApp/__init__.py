from flask import Flask, render_template, url_for
import os

# NOTES:
# Its preferable to create your extensions and app factories so that the extension object does not initially get bound to the application.
# So no application-specific state is stored on the extension object, so one extension object can be used for multiple apps.
# https://flask.palletsprojects.com/en/2.0.x/patterns/appfactories/#factories-extensions
# https://flask.palletsprojects.com/en/2.0.x/extensiondev/

def main_app():
    from W3gWsApp.w3config import DefConfig
    w3g_app = Flask(__name__)
    w3g_app.config.from_object(DefConfig())

    from W3gWsApp import w3gdbhandl
    w3gdbhandl.regapp_db(w3g_app)

    from W3gWsApp import w3gerhandl
    w3gerhandl.regapp_errhandl(w3g_app)

    from W3gWsApp import w3gquery
    w3g_app.register_blueprint(w3gquery.query_bp)

    from W3gWsApp import w3gtests
    w3g_app.register_blueprint(w3gtests.tests_bp)

    @w3g_app.route('/')
    def index_page():
        js_files = ['w3gdefs', 'w3gcontxt', 'w3gquestdata', 'w3update', 'w3gretrieve', 'w3gtest']
        firstPage = render_template('warrior-guide.html', jsfs=js_files)
        return firstPage

    return w3g_app
