from flask import Blueprint, jsonify

tests_bp = Blueprint('testingenv', __name__, url_prefix='/testingenv')

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


@tests_bp.route('/testbefreq', methods=['PATCH'])
def test_redo():
    from W3gWsApp.w3gdbhandl import conn_w3gdb
    from flask import request
    w3db_con = conn_w3gdb()
    w3db_cur = w3db_con.cursor()
    json_data = request.get_json()
    if json_data['redo']:
        w3db_cur.execute('INSERT INTO affected_quests (quest_id, region_id) VALUES (65, 4)')
        w3db_cur.execute('''
            SELECT all_quests.id, all_quests.quest_name, all_quests.quest_url 
            FROM affected_quests INNER JOIN all_quests ON all_quests.id = affected_quests.quest_id
            ''')
    result_test = w3db_cur.fetchall()
    return jsonify(result_test=result_test if len(result_test) else None)
        