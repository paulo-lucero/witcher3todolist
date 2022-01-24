import flask
from flask import Blueprint, current_app
import os

tests_bp = Blueprint('testingenv', __name__, url_prefix='/testingenv')

@tests_bp.route('/virtenvpath')
def check_envpath():
    return f'<p>Flask package installed on: {flask.__file__}</p>'

@tests_bp.route('/curapppath')
def check_apppath():
    return f'<p>Working directory on: {os.path.dirname(__file__)}</p>'

@tests_bp.route('/debugenv')
def check_debugmode():
    testConcat = 1 + '1'
    return f'<p> Test result: {testConcat} </p>'

@tests_bp.route('/configdb')
def check_configdb():
    configdb_path = current_app.config['DATABASE']
    filedb_path = 'D:\WorkFiles\projects\Witcher3Guide\W3gWsDevt\W3gWsApp\w3database.db'
    return ( f'<p> Config Database Path: {configdb_path} </p>'
             f'<p> System Database Path: {filedb_path} </p>'
             f'<p> If Same Path: {filedb_path == configdb_path} </p>'
           )
