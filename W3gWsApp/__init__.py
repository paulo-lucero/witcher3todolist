# NOTES:
# Its preferable to create your extensions and app factories so that the extension object does not initially get bound to the application.
# So no application-specific state is stored on the extension object, so one extension object can be used for multiple apps.
# https://flask.palletsprojects.com/en/2.0.x/patterns/appfactories/#factories-extensions
# https://flask.palletsprojects.com/en/2.0.x/extensiondev/

def main_app():
    from flask import Flask, render_template
    from W3gWsApp import w3gdbhandl, w3gerhandl, w3gquery, w3gtests
    from W3gWsApp.w3config import DevConfig

    w3g_app = Flask(__name__)
    w3g_app.config.from_object(DevConfig())

    w3gdbhandl.regapp_db(w3g_app)

    w3gerhandl.regapp_errhandl(w3g_app)

    w3g_app.register_blueprint(w3gquery.query_bp)

    w3g_app.register_blueprint(w3gtests.tests_bp)

    @w3g_app.route('/')
    def index_page():
        js_files = ['w3gdefs', 'w3gcontxt', 'w3gquestdata', 'w3parse', 'w3continfo',  'w3gupdlstnrs','w3gevtltnrs', 'w3gtest']
        firstPage = render_template('warrior-guide.html', jsfs=js_files)
        return firstPage

    return w3g_app
