from contextlib import nullcontext
import imp
import click
from flask import Blueprint, jsonify
from flask import request
from W3gWsApp import w3gdbhandl
import traceback

query_bp = Blueprint('query', __name__, url_prefix='/query')

@query_bp.route('/check-quests-info')
def quests_data_bool():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('''SELECT category.cat_count AS main_count, (SELECT SUM(category.cat_count) FROM category WHERE category.id != 1) AS second_count
                      FROM category WHERE category.id = 1''')
    return jsonify(cur_db.fetchone())

@query_bp.route('/main-quests-info')
def main_quests_info():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute(w3gdbhandl.gen_query_cmd(
        'mall',
        where=['all_quests.category_id = 1'],
        af_wh=['GROUP BY all_quests.id', 'ORDER BY all_quests.id ASC']))

    return jsonify(cur_db.fetchall())

@query_bp.route('/regions-info')
def regions_info():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('''SELECT region.id, region.region_name, region.side_count AS quest_count
                      FROM region WHERE region.id != 1 ORDER BY region.id''')

    return jsonify(cur_db.fetchall())

@query_bp.route('/second-quests-regid-<int:region_id>')
def second_quests_info(region_id):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute(w3gdbhandl.gen_query_cmd(
      'multi',
      where=['all_quests.category_id != 1', 'quest_region.region_id = ?'],
      af_wh=['ORDER BY all_quests.req_level NULLS FIRST,', 'all_quests.req_level ASC']
    ), (region_id, ))

    return jsonify(cur_db.fetchall())

@query_bp.route('/crucial-quests-qrylvl-<int:level_info>')
def crucial_quests_info(level_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving crucial Quest Data - Queried Level: {level_info}')

    cur_db.execute(w3gdbhandl.gen_query_cmd(
      'multi',
      select=['all_quests.category_id', 'all_quests.undone_count AS quest_count'],
      where=['all_quests.req_level <= ?'],
      af_wh=['GROUP BY all_quests.id', 'ORDER BY all_quests.req_level ASC']
    ), (level_info, ))

    # old - using quest_consoData() : response time -> 9 ms
    # new - using CASE : response time -> 16-17 ms

    return jsonify(cur_db.fetchall())

@query_bp.route('/aff-id-<int:id_info>')
def affected_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Affected Quest/s Data - Cutoff ID: {id_info}')

    cur_db.execute(w3gdbhandl.gen_query_cmd(
      'multi',
      select=['all_quests.undone_count AS quest_count'],
      where=['all_quests.cutoff = ?'],
      af_wh=['GROUP BY all_quests.id', 'ORDER BY all_quests.req_level NULLS FIRST, all_quests.req_level ASC']
    ), (id_info, ))

    return jsonify(cur_db.fetchall())

@query_bp.route('/mis-id-<int:id_info>')
def missable_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Missable Players/Cards Data - Quest ID: {id_info}')
    cur_db.execute('''
    SELECT 
        qwent_players.id, qwent_players.p_name, qwent_players.p_url, qwent_players.p_location, player_category.p_category, qwent_players.qw_status,
        CASE
            WHEN qwent_players.qwent_notes IS NULL THEN 0
            ELSE 1
        END AS has_notes
    FROM missable_players 
        INNER JOIN all_quests ON all_quests.id = missable_players.allquest_id
        INNER JOIN qwent_players ON qwent_players.id = missable_players.qwtplayer_id
        INNER JOIN player_category ON player_category.id = qwent_players.pcat_id
    WHERE missable_players.allquest_id = ?''', (id_info, ))
    return jsonify(cur_db.fetchall())

@query_bp.route('/player-reg-<int:reg_info>')
def players_info(reg_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('''
        SELECT
            qwent_players.id, qwent_players.p_name, qwent_players.p_url, qwent_players.p_location, qwent_players.qw_status,
            CASE
                WHEN qwent_players.qwent_notes IS NULL THEN 0
                ELSE 1
            END AS has_notes
        FROM qwent_players
        WHERE qwent_players.region_id = ? AND qwent_players.pcat_id = 1''', (reg_info, ))
    return jsonify(cur_db.fetchall())

@query_bp.route('/update-player', methods=['PATCH'])
def update_player():
    conn_db = w3gdbhandl.conn_w3gdb()
    update_data = request.get_json(cache=False)
    if update_data['allPlayers']:
        cur_db = conn_db.execute('UPDATE qwent_players SET qw_status = ?', (update_data['status'], ))
    else:
        cur_db = conn_db.execute('UPDATE qwent_players SET qw_status = ? WHERE qwent_players.id = ?', (update_data['status'], update_data['playerID']))
    modif_count = cur_db.rowcount
    conn_db.commit()
    return jsonify(modified=modif_count)

@query_bp.route('/mis-note-id-<int:id_info>')
def missable_note(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('SELECT qwent_players.qwent_notes FROM qwent_players WHERE qwent_players.id = ?', (id_info, ))
    return jsonify(cur_db.fetchone()['qwent_notes'])

@query_bp.route('/enm-id-<int:id_info>')
def enemies_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Enemy Quest Data - Quest ID: {id_info}')
    cur_db.execute('''
    SELECT enemies_data.id, enemies_data.enemy_name, quest_enemies.addtl_info, enemies_data.enemy_url,
        CASE
            WHEN enemies_data.enemy_notes IS NULL THEN 0
            ELSE 1
        END AS has_notes
    FROM quest_enemies 
        INNER JOIN  all_quests ON all_quests.id = quest_enemies.quest_id
        INNER JOIN enemies_data ON enemies_data.id = quest_enemies.enemy_id
    WHERE quest_enemies.quest_id = ?''', (id_info, ))
    return jsonify(cur_db.fetchall())

@query_bp.route('/enm-note-id-<int:id_info>')
def enemies_note(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('SELECT enemies_data.enemy_notes FROM enemies_data WHERE enemies_data.id = ?', (id_info, ))
    return jsonify(cur_db.fetchone()['enemy_notes'])

@query_bp.route('/quest-note-id-<int:id_info>')
def quest_note(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('''
        SELECT
            quest_region.quest_notes,
            quest_region.quest_id,
            quest_region.region_id,
            region.region_name
        FROM quest_region
            INNER JOIN region ON region.id = quest_region.region_id
        WHERE quest_region.quest_id = ?''', (id_info, ))
    return jsonify(cur_db.fetchall())

@query_bp.route('/qst-id-<int:id_info>')
def quest_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Quest Data - Quest ID: {id_info}')

    cur_db.execute(w3gdbhandl.gen_query_cmd(
      'mdef',
      select=['region.region_name AS location'],
      _from=['INNER JOIN region ON region.id = quest_region.region_id'],
      where=['quest_region.quest_id = ?'],
      af_wh=['ORDER BY quest_region.region_id ASC']
    ), (id_info, ))

    return jsonify(cur_db.fetchall())

@query_bp.route('/gen-notes')
def general_notes():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('SELECT general_notes.gen_note FROM general_notes')

    return jsonify(cur_db.fetchone())

@query_bp.route('/request-modif', methods=['PATCH'])
def quest_done():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    json_data = request.get_json(cache=False) 
    quest_data = json_data['questData'] #format : [{'regionId': int, 'questId': int}, ...]
    fils_basis = json_data['filter']
    quest_aff = {}
    modif_count = 0
    err_r = None
    sql_cmd = None
    # trxn_c = w3gdbhandl.gen_trxnid()

    if json_data['done'] or json_data['redo']:
        # insert quest_id and region_id in a temporary db, that have status changed
        # Need to store the quest_id and region_id in a temp db, because I can't query by set of quest_id and region_id
        no_of_changes = w3gdbhandl.create_tempdb(cur_db, quest_data, json_data['redo'])
        # '''Logging'''
        # w3gdbhandl.debugdb_copy_changes(conn_db)

        # done or redo
        cur_db.execute(f'''
            UPDATE quest_region 
            SET status_id = {1 if json_data['redo'] else 2}, 
              date_change = chq.date_change 
            FROM changes_quest AS chq 
            WHERE quest_region.quest_id = chq.quest_id 
              AND quest_region.region_id = chq.region_id''')
        modif_count = cur_db.rowcount
        if modif_count != no_of_changes:
            raise ValueError(f'Total Count Attempt Modification is {modif_count}, While the Total Count Requested Modification is {no_of_changes}')

        # query of affected quests
        for fil_type in fils_basis:
            fil_basis = fils_basis[fil_type]
            if not fil_basis:
                continue

            fil_cmd = None
            try:
                if fil_type == 'othr':
                    othr_res = {}
                    for othr_type in fil_basis:
                        fil_cmd = w3gdbhandl.gen_filt_cmd(fil_basis, othr_type)
                        cur_db.execute(fil_cmd)
                        result_query = cur_db.fetchall()
                        othr_res[othr_type] = result_query if len(result_query) > 0 else None
                        # '''Logging'''
                        # w3gdbhandl.debugdb_logfil(conn_db, trxn_c, othr_type, fil_basis, fil_cmd)
                    quest_aff[fil_type] = othr_res
                else:
                    fil_cmd = w3gdbhandl.gen_filt_cmd(fil_basis, fil_type)
                    cur_db.execute(fil_cmd)
                    result_query = cur_db.fetchall()
                    quest_aff[fil_type] = result_query if len(result_query) > 0 else None
                    # '''Logging'''
                    # w3gdbhandl.debugdb_logfil(conn_db, trxn_c, fil_type, fil_basis, fil_cmd)
            except:
                err_r = traceback.format_exc()
                sql_cmd = fil_cmd

        # separate query of count region and secondary quest
        #  may add filter basis for count?, "data-count-filt"
        #  query only based on changes_quest region_id

    elif json_data['query']:
        query_info = json_data['query']
        addlt_wh = f" AND {query_info} - quest_region.date_change <= 86400000" if type(query_info) == int else '' # this could scan whole table, it will need to check every date_change
        q_cmd = w3gdbhandl.gen_query_cmd(
            'mregion',
            select=['quest_region.date_change'],
            where='quest_region.status_id = 2' + addlt_wh,
            af_wh=['ORDER BY quest_region.region_id ASC, quest_region.date_change DESC']
        )
        cur_db.execute(q_cmd)
        # '''Logging'''
        # w3gdbhandl.debugdb_logfil(conn_db, trxn_c, 'marked', None, q_cmd)
        return jsonify(cur_db.fetchall())

    elif json_data['note']:
        note_id = json_data['note']['id']
        note_data = json_data['note']['data']
        note_type = json_data['note']['type']
        quest_type = 'qt'

        if note_type == 'qwt':
            sql_cmd = 'UPDATE qwent_players SET qwent_notes = ? WHERE qwent_players.id = ?'
        elif note_type == 'enm':
            sql_cmd = 'UPDATE enemies_data SET enemy_notes = ? WHERE enemies_data.id = ?'
        elif note_type == quest_type:
            note_reg = json_data['note']['regid']
            sql_cmd = f'UPDATE quest_region SET quest_notes = ? WHERE quest_region.quest_id = ? AND quest_region.region_id = {note_reg}'
        elif note_type == 'gen':
            sql_cmd = 'UPDATE general_notes SET gen_note = ?'
        else:
            raise ValueError(f'This {note_type} Note Type isn\'t valid')

        cur_db.execute(sql_cmd, (note_data, note_id) if note_id is not None else (note_data, ))
        modif_count = cur_db.rowcount

        if note_type == quest_type:
            cur_db.execute(f'SELECT all_quests.no_notes FROM all_quests WHERE all_quests.id = ?', (note_id, ))
            quest_aff = cur_db.fetchone()

    if modif_count > 0:
        conn_db.commit()
        # from .w3revertdb import revert_db
        # from flask import current_app
        # revert_db(conn_db, current_app.logger)
    
    return jsonify(result=quest_aff, modified=modif_count, err_r=err_r, sql_cmd=sql_cmd)
