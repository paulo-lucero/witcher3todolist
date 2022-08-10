from pydoc import cli
import sqlite3
import re
import click
from flask import current_app, g, json
from flask.cli import with_appcontext

class sqliteRowEncoder(json.JSONEncoder): #allows to recognise other datatype, in this case sqlite3.Row
    def default(self, obj):
        if isinstance(obj, sqlite3.Row):
            return {col_name: obj[col_name] for col_name in obj.keys()}
        return json.JSONEncoder.default(self, obj)

def conn_w3gdb():
    if 'w3gdb' not in g:
        g.w3gdb = sqlite3.connect(current_app.config['DATABASE'])
        g.w3gdb.row_factory = sqlite3.Row
        click.echo(click.style('Main Database Connected', fg='bright_blue'))
    return g.w3gdb

def close_w3gdb(e=None):
    # click.echo('Closing Database: Checked')
    dbs = [
        ['w3gdb', 'Main'], 
        ['w3debug', 'Debug']
    ]
    
    for db_key, msg in dbs:
        w3gdb = g.pop(db_key, None)
        if w3gdb is not None:
            w3gdb.close()
            click.echo(click.style(f'{msg} Database Closed', fg='bright_green'))

def create_tempdb(db_cur, id_qr, is_redo):
    db_cur.execute('''  
        CREATE TEMPORARY TABLE IF NOT EXISTS changes_quest (
          quest_id INTEGER,
          region_id INTEGER,
          date_change INTEGER
        );''')
    if id_qr is None:
        db_cur.execute(f'''
            INSERT INTO changes_quest (quest_id, region_id) 
            SELECT quest_region.quest_id, quest_region.region_id 
            FROM quest_region WHERE quest_region.status_id = {2 if is_redo else 1}''')
    else:
        for questreg_dict in id_qr:
            for key_data in questreg_dict:
                if not isinstance(questreg_dict[key_data], int) and not questreg_dict[key_data] == None:
                    raise TypeError(f'This {type(questreg_dict[key_data])} data type is not supported, for this value {questreg_dict[key_data]}')
        if is_redo:
            db_cur.executemany('INSERT INTO changes_quest (quest_id, region_id) VALUES (:questId, :regionId)', id_qr) # id_qr need to be unique set
        else:
            db_cur.executemany('INSERT INTO changes_quest (quest_id, region_id, date_change) VALUES (:questId, :regionId, :doneDate)', id_qr)
    return db_cur.rowcount


def conn_debugdb():
    if 'w3debug' not in g:
        g.w3debug = sqlite3.connect(current_app.config['DB_DEBUG'])
        g.w3debug.row_factory = sqlite3.Row
        click.echo(click.style('Debug Database Connected', fg='bright_blue'))
    return g.w3debug

def debugdb_copy_changes(con_main):
    cur_main = con_main.cursor()
    debug_path = current_app.config['DB_DEBUG']
    conn_debugdb()
    try:
        cur_main.execute(f"ATTACH DATABASE '{debug_path}' AS debugdb")
    except:
        pass
    cur_main.execute('DROP TABLE IF EXISTS debugdb.changes_quest')
    cur_main.execute('CREATE TABLE debugdb.changes_quest AS SELECT * FROM temp.changes_quest')
    con_main.commit()
    return cur_main

def gen_trxnid():
    con_debug = conn_debugdb()
    cur_debug = con_debug.cursor()
    try:
        cur_debug.execute('SELECT MAX(fil_log.fil_trxn) AS trxn FROM fil_log')
        last_trxn = cur_debug.fetchone()['trxn']
        trxn_count = last_trxn + 1 if last_trxn else 1
    except:
        trxn_count = 1
    return trxn_count
    
def debugdb_logfil(con_main, trxn_c, fil_t, fil_b, sql_c):
    cur_main = con_main.cursor()
    debug_path = current_app.config['DB_DEBUG']
    conn_debugdb()
    try:
        cur_main.execute(f"ATTACH DATABASE '{debug_path}' AS debugdb")
    except:
        pass
    cur_main.execute('''CREATE TABLE IF NOT EXISTS debugdb.fil_log (
        fil_trxn INTEGER,
        fil_type TEXT,
        fil_basis TEXT,
        sql_cmd TEXT
    );''')
    fil_log = (trxn_c, fil_t, json.dumps(fil_b, indent=2), sql_c)
    cur_main.execute('INSERT INTO debugdb.fil_log (fil_trxn, fil_type, fil_basis, sql_cmd) VALUES (?, ?, ?, ?)', fil_log)
    con_main.commit()
    return cur_main

@click.command('init-db')
@with_appcontext
def init_db_command():
    conn_w3gdb()
    click.echo('Database Connected')

def regapp_db(app):
    app.teardown_appcontext(close_w3gdb)
    app.json_encoder = sqliteRowEncoder
    app.cli.add_command(init_db_command)

def quest_consoData(db_cursor, main_data, get_notes=True): ##retreive cutoff, missable and enemies quest ids and finalize response data
    #main_data: should a list and element has 'id' key, use fetchall
    consol_query = []

    if not get_notes:
        for quests_info in main_data:
            consol_info = {'qwt':False, 'enm':False, 'cut':False}
            consol_info['info'] = quests_info
            consol_query.append(consol_info)
        return consol_query

    db_cursor.execute('SELECT DISTINCT missable_players.allquest_id FROM missable_players')
    questid_qwt = [qwt_data['allquest_id'] for qwt_data in db_cursor.fetchall()]
    db_cursor.execute('SELECT DISTINCT quest_enemies.quest_id FROM quest_enemies')
    questid_enm = [enm_data['quest_id'] for enm_data in db_cursor.fetchall()]
    db_cursor.execute('SELECT DISTINCT all_quests.cutoff FROM all_quests WHERE all_quests.cutoff NOT NULL')
    questid_cut = [cut_data['cutoff'] for cut_data in db_cursor.fetchall()]

    data_notes = {'qwt':questid_qwt, 'enm':questid_enm, 'cut':questid_cut}

    for quests_info in main_data:
        consol_info = {}
        consol_info['info'] = quests_info
        data_id = quests_info['id']
        for data_key in data_notes:
            if data_id in data_notes[data_key]:
                consol_info[data_key] = True
            else:
                consol_info[data_key] = False
        consol_query.append(consol_info)
    return consol_query

def gen_query_cmd(styl='all', **comb):
    # per "comb" is an dict
    # in dict of "comb" must contain the key name that match in the key names in each section in default_cmd
    #   each in key of comb should an list
    #   "comb" for additional commands
    styls_cmd = None
    order_cmd = None
    cmd_breaks = None
    if not comb is None and 'modif' in comb:
        mod_config = comb['modif']
        is_redo = mod_config.find('redo') != -1
        is_set = mod_config.find('set') != -1
        default_cmd = {
            'update': {
                'cmd_head': 'UPDATE',
                'fixed': ' quest_region'
            },
            '_set': {
                'cmd_head': ' SET',
                'fixed': ' status_id = 1, date_change = NULL' if is_redo else ' status_id = 2, date_change = :doneDate'
            },
            'where': {
                'cmd_head': ' WHERE',
                'fixed': (f' quest_region.status_id = {2 if is_redo else 1}') +
                         (f' AND quest_region.quest_id = :questId AND quest_region.region_id = :regionId' if is_set else '')
            }
        }

        styls_cmd = {
            styl: ['fixed']
        }
        order_cmd = ['update', '_set', 'where', 'af_wh']
        cmd_breaks = {
            'update': ', ',
            '_set': ', ',
            'where': ' AND ',
            'af_wh': ' '
        }

    else:
        chg_mode = 'chall'
        fr_region_id = 'changes_quest.region_id' if styl == chg_mode else 'quest_region.region_id'
        default_cmd = {
            'select': {
                'cmd_head': 'SELECT',
                'fixed': ' all_quests.id, all_quests.quest_name, all_quests.quest_url, all_quests.req_level, all_quests.is_multi',
                'allq': ', all_quests.region_id',
                'qrr': ', quest_region.region_id',
                'chg': ', changes_quest.region_id',
                'reg_name': ', region.region_name',
                'notes': ''', all_quests.qwt_count AS qwt,
                            all_quests.aff_count AS cut,
                            all_quests.enm_count AS enm''',
                'qnotes': ''', all_quests.no_notes'''
            },
            '_from': {
                'cmd_head': ' FROM',
                'allq': ' all_quests',
                'qrr': ' quest_region INNER JOIN all_quests ON all_quests.id = quest_region.quest_id',
                'reg_name': f" INNER JOIN region ON region.id = {fr_region_id if re.match('^m', styl) or styl == chg_mode else 'all_quests.region_id'}",
                'chg': ' changes_quest INNER JOIN all_quests ON all_quests.id = changes_quest.quest_id'
            },
            'where': {
                'cmd_head': ' WHERE',
                'allq': ' all_quests.undone_count >= 1',
                'qrr': ' quest_region.status_id = 1',
                'chg': ''
            }
        }

        styls_cmd = {
            'all': ['fixed', 'allq', 'reg_name', 'notes'],
            'mall': ['fixed', 'qrr', 'reg_name', 'notes', 'qnotes'],
            chg_mode: ['fixed', 'chg', 'reg_name', 'notes', 'qnotes'],
            'region': ['fixed', 'allq', 'reg_name'],
            'mregion': ['fixed', 'qrr', 'reg_name'],
            'notes': ['fixed', 'allq', 'notes'],
            'multi': ['fixed', 'qrr', 'notes', 'qnotes'],
            'def': ['fixed', 'allq'],
            'mdef': ['fixed', 'qrr']
        }
        order_cmd = ['select', '_from', 'where', 'af_wh']
        cmd_breaks = {
            'select': ', ',
            '_from': ' ',
            'where': ' AND ',
            'af_wh': ' '
        }

    def gen_cmd(cur_sect, select_styl):
        if cur_sect:
            sect_cmd = ''
            for styl_cmd in select_styl:
                if styl_cmd in cur_sect:
                    sect_cmd += cur_sect[styl_cmd]
            return sect_cmd
        return ''

    sql_cmd = ''
    for sect_cmd in order_cmd:
        cur_sect = None
        if sect_cmd in default_cmd:
            cur_sect = default_cmd[sect_cmd]
            sql_cmd += cur_sect['cmd_head']
        if not comb is None and sect_cmd in comb and isinstance(comb[sect_cmd], str):
            sql_cmd += ' ' + comb[sect_cmd]
        elif not comb is None and sect_cmd in comb and isinstance(comb[sect_cmd], list):
            sql_cmd += gen_cmd(cur_sect, styls_cmd[styl])
            for addtl_cmd in comb[sect_cmd]:
                if isinstance(addtl_cmd, str):
                    sql_cmd += cmd_breaks[sect_cmd] + addtl_cmd
        else:
            sql_cmd += gen_cmd(cur_sect, styls_cmd[styl])

    return re.sub('\s{2,}', ' ', sql_cmd.replace('\n', ' '))

def gen_filter(fils, mode='done'):
    val_defs = {
        'info': {
            'undone': 'all_quests.undone_count > 1 AND quest_region.status_id = 1',
            'done': 'all_quests.undone_count = 1 AND quest_region.status_id = 1',
            'cutoff': '''all_quests.id IN ( 
                SELECT allq.cutoff FROM changes_quest INNER JOIN all_quests AS allq ON allq.id = changes_quest.quest_id WHERE allq.cutoff =? 
            )''',
            'quest': 'all_quests.id =?',
            'region': 'changes_quest.region_id =?',
            'second': 'all_quests.category_id != 1'
        },
        'cont': {
            'main': 'all_quests.category_id = 1',
            'second': 'all_quests.category_id != 1',
            'category': 'all_quests.category_id =?',
            'region': 'changes_quest.region_id =?',
            'level': 'all_quests.req_level <=?',
            'cutoff': 'all_quests.cutoff =?',
            'quest': 'changes_quest.quest_id =?',
            'cruc': '(all_quests.req_level <= (? - 2 ) OR (all_quests.category_id = 4 AND all_quests.req_level <=?))'
        }
    }

    val_def = val_defs.get(mode)
    
    if val_def == None:
        return val_def

    fils_whr = []
    septr = ' AND '

    for fil in fils:
        fil_whr = []
        for fil_t, fil_v in fil.items():
            fil_st = None
            if isinstance(fil_v, list):
                fil_st = re.sub('\S+\?', f'IN {str(tuple(fil_v))}', val_def[fil_t])
            else:
                fil_st = val_def[fil_t].replace('?', f' {str(fil_v)}')
            fil_whr.append(fil_st)
        if len(fil_whr) > 1:
            fils_whr.append(f'({septr.join(fil_whr)})')
        elif len(fil_whr) == 1:
            fils_whr.append(fil_whr[0])
        else:
            raise ValueError('no filter type found')

    return ' OR '.join(fils_whr)

def gen_filt_cmd(fil_basis, fil_type):
    styl = 'chall'
    selct = ['all_quests.cutoff', 'all_quests.category_id', 'all_quests.undone_count AS quest_count']
    frm = None
    whr = gen_filter(fil_basis, fil_type)
    af_whr = None
    
    if fil_type == 'info':
        styl = 'mall'
        af_whr = 'GROUP BY all_quests.id'
    elif fil_type == 'sreg':
        selct = 'region.id, region.region_name, region.side_count'
        frm = 'region'
        whr = 'region.id IN (SELECT changes_quest.region_id FROM changes_quest)'
    elif fil_type == 'ave':
        selct = 'category.cat_count AS main_count, (SELECT SUM(category.cat_count) FROM category WHERE category.id != 1) AS second_count'
        frm = 'category'
        whr = 'category.id = 1'

    return gen_query_cmd(styl, select=selct, _from=frm, where=whr, af_wh=af_whr)