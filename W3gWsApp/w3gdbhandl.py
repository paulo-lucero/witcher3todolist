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
    click.echo(click.style('Database Connected', fg='bright_blue'))
    return g.w3gdb

def close_w3gdb(e=None):
    # click.echo('Closing Database: Checked')
    w3gdb = g.pop('w3gdb', None)
    if w3gdb is not None:
        w3gdb.close()
        click.echo(click.style('Database Closed', fg='bright_green'))

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
        default_cmd = {
            'select': {
                'cmd_head': 'SELECT',
                'fixed': ' all_quests.id, all_quests.quest_name, all_quests.quest_url, all_quests.req_level, all_quests.is_multi',
                'allq': ', all_quests.region_id',
                'qrr': ', quest_region.region_id',
                'reg_name': ', region.region_name',
                'notes': ''', all_quests.qwt_count AS qwt,
                            all_quests.aff_count AS cut,
                            all_quests.enm_count AS enm'''
            },
            '_from': {
                'cmd_head': ' FROM',
                'allq': ' all_quests',
                'qrr': ' quest_region INNER JOIN all_quests ON all_quests.id = quest_region.quest_id',
                'reg_name': f" INNER JOIN region ON region.id = {'quest_region.region_id' if re.match('^m', styl) else 'all_quests.region_id'}"
            },
            'where': {
                'cmd_head': ' WHERE',
                'allq': ' all_quests.undone_count >= 1',
                'qrr': ' quest_region.status_id = 1'
            }
        }

        styls_cmd = {
            'all': ['fixed', 'allq', 'reg_name', 'notes'],
            'mall': ['fixed', 'qrr', 'reg_name', 'notes'],
            'region': ['fixed', 'allq', 'reg_name'],
            'mregion': ['fixed', 'qrr', 'reg_name'],
            'notes': ['fixed', 'allq', 'notes'],
            'multi': ['fixed', 'qrr', 'notes'],
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

def gen_filter(qr_ids, fils):
    val_def = {
        'main': 'all_quests.category_id = 1',
        'second': 'all_quests.category_id != 1',
        'category': 'all_quests.category_id =?',
        'region': 'quest_region.region_id =?',
        'level': 'all_quests.req_level <=?',
        'cutoff': 'all_quests.cutoff =?',
        'quest': 'quest_region.quest_id =?'
    }
    whr = f"quest_region.quest_id IN {qr_ids} AND quest_region.status_id = 2 AND (?)"
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

    return whr.replace('(?)' if len(fils_whr) == 1 else '?', ' OR '.join(fils_whr))
