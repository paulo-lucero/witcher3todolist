import flask
from flask import Blueprint, current_app, jsonify
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

@tests_bp.route('/colors')
def asynctest_colorquery():
    return jsonify(['Blue', 'Chartreuse', 'Coral', 'DarkRed', 'Salmon'])

@tests_bp.route('/clr-<color_name>')
def asynctest_timeoutquery(color_name):
    color_timeouts = {'Blue': 5000, 'Chartreuse': 10000, 'Coral': 15000,
                      'DarkRed': 20000, 'Salmon': 25000}
    return jsonify(color_timeouts[color_name])

@tests_bp.route('/pragma-settings')
def get_pragmas():
    from W3gWsApp import w3gdbhandl
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('PRAGMA pragma_list')

    excl_pragmas = [
      'application_id',
      'cache_spill',
      'case_sensitive_like',
      'collation_list',
      'compile_options',
      'count_changes',
      'data_store_directory',
      'data_version',
      'database_list',
      'default_cache_size',
      'defer_foreign_keys',
      'empty_result_callbacks',
      'foreign_key_check',
      'foreign_key_list',
      'freelist_count',
      'full_column_names',
      'function_list',
      'hard_heap_limit',
      'incremental_vacuum',
      'index_info',
      'index_list',
      'index_xinfo',
      'module_list',
      'optimize',
      'page_count',
      'pragma_list',
      'schema_version',
      'short_column_names',
      'shrink_memory',
      'soft_heap_limit',
      'table_info',
      'table_xinfo',
      'temp_store_directory',
      'user_version',
      'wal_checkpoint',
      'writable_schema'
    ]

    pragmas = {}
    for pragma_cmd in cur_db.fetchall():
        pragma_name = pragma_cmd['name']
        if not pragma_name in excl_pragmas:
            cur_db.execute(f'PRAGMA {pragma_name}')
            pragma_setting = cur_db.fetchone()
            if pragma_setting is not None:
                pragmas[pragma_name] = pragma_setting[0]
            else:
                pragmas[pragma_name] = pragma_setting

    return jsonify(pragmas)
