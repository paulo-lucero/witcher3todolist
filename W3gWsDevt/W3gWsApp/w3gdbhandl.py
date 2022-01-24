import sqlite3
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
    click.echo('Database Connected')
    return g.w3gdb

def close_w3gdb(e=None):
    # click.echo('Closing Database: Checked')
    w3gdb = g.pop('w3gdb', None)
    if w3gdb is not None:
        w3gdb.close()
        click.echo('Database Closed')

@click.command('init-db')
@with_appcontext
def init_db_command():
    conn_w3gdb()
    click.echo('Database Connected')

def regapp_db(app):
    app.teardown_appcontext(close_w3gdb)
    app.json_encoder = sqliteRowEncoder
    app.cli.add_command(init_db_command)

def quest_consoData(db_cursor, main_data): ##retreive cutoff, missable and enemies quest ids and finalize response data
    #main_data: should a list and element has 'id' key, use fetchall
    db_cursor.execute('SELECT DISTINCT missable_players.allquest_id FROM missable_players')
    questid_qwt = [qwt_data['allquest_id'] for qwt_data in db_cursor.fetchall()]
    db_cursor.execute('SELECT DISTINCT quest_enemies.quest_id FROM quest_enemies')
    questid_enm = [enm_data['quest_id'] for enm_data in db_cursor.fetchall()]
    db_cursor.execute('SELECT DISTINCT all_quests.cutoff FROM all_quests WHERE all_quests.cutoff NOT NULL')
    questid_cut = [cut_data['cutoff'] for cut_data in db_cursor.fetchall()]

    data_notes = {'qwt':questid_qwt, 'enm':questid_enm, 'cut':questid_cut}

    consol_query = []
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
