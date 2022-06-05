from flask import jsonify
from werkzeug.exceptions import HTTPException
import traceback

def regapp_errhandl(app):
    @app.errorhandler(Exception)
    def handle_exception(error):
        # pass through HTTP errors
        if isinstance(error, HTTPException):
            return jsonify(error='HTTP error', code=error.code)

        # now you're handling non-HTTP exceptions only
        return jsonify(error='Exception error', stringnified=traceback.format_exc())
