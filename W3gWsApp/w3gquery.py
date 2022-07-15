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
    query_result = {}
    cur_db.execute('''SELECT category.cat_count AS main_count, (SELECT SUM(category.cat_count) FROM category WHERE category.id != 1) AS second_count
                      FROM category WHERE category.id = 1''')
    return jsonify(cur_db.fetchone())

@query_bp.route('/main-quests-info')
def main_quests_info():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute(w3gdbhandl.gen_query_cmd(where=['all_quests.category_id = 1'], af_wh=['ORDER BY all_quests.id ASC']))

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
      'notes',
      select=['all_quests.category_id', 'all_quests.undone_count AS quest_count'],
      where=['all_quests.req_level <= ?'],
      af_wh=['ORDER BY all_quests.req_level ASC']
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
      'notes',
      select=['all_quests.undone_count AS quest_count'],
      where=['all_quests.cutoff = ?'],
      af_wh=['ORDER BY all_quests.req_level NULLS FIRST, all_quests.req_level ASC']
    ), (id_info, ))

    return jsonify(cur_db.fetchall())

@query_bp.route('/mis-id-<int:id_info>')
def missable_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Missable Players/Cards Data - Quest ID: {id_info}')
    cur_db.execute('''SELECT qwent_players.p_name, qwent_players.p_url, qwent_players.p_location,
                      player_category.p_category, qwent_players.qwent_notes
                      FROM missable_players INNER JOIN all_quests ON all_quests.id = missable_players.allquest_id
                      INNER JOIN qwent_players ON qwent_players.id = missable_players.qwtplayer_id
                      INNER JOIN player_category ON player_category.id = qwent_players.pcat_id
                      WHERE missable_players.allquest_id = ?''', (id_info, ))
    return jsonify(cur_db.fetchall())

@query_bp.route('/enm-id-<int:id_info>')
def enemies_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Enemy Quest Data - Quest ID: {id_info}')
    cur_db.execute('''SELECT enemies_data.enemy_name, quest_enemies.addtl_info, enemies_data.enemy_url, enemies_data.enemy_notes
                      FROM quest_enemies INNER JOIN  all_quests ON all_quests.id = quest_enemies.quest_id
                      INNER JOIN enemies_data ON enemies_data.id = quest_enemies.enemy_id
                      WHERE quest_enemies.quest_id = ?''', (id_info, ))
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

    if json_data['done'] or json_data['redo']:
        # insert quest_id and region_id in a temporary db, that have status changed
        # Need to store the quest_id and region_id in a temp db, because I can't query by set of quest_id and region_id
        no_of_changes = w3gdbhandl.create_tempdb(cur_db, quest_data, json_data['redo'])
        '''Logging'''
        w3gdbhandl.debugdb_copy_changes(conn_db)
        trxn_c = w3gdbhandl.gen_trxnid()

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
            if fil_basis:
                fil_cmd = None
                try:
                    fil_cmd = w3gdbhandl.gen_query_cmd(
                                'mall' if fil_type == 'info' else 'chall',
                                select=['all_quests.cutoff', 'all_quests.category_id', 'all_quests.undone_count AS quest_count'],
                                where=w3gdbhandl.gen_filter(fil_basis, fil_type),
                                af_wh='GROUP BY all_quests.id' if fil_type == 'info' else None
                            )
                    cur_db.execute(fil_cmd)
                    result_query = cur_db.fetchall()
                    quest_aff[fil_type] = result_query if len(result_query) > 0 else None
                    '''Logging'''
                    w3gdbhandl.debugdb_logfil(conn_db, trxn_c, fil_type, fil_basis, fil_cmd)
                except:
                    err_r = traceback.format_exc()
                    sql_cmd = fil_cmd

        # separate query of count region and secondary quest
        #  may add filter basis for count?, "data-count-filt"
        #  query only based on changes_quest region_id

    elif json_data['query']:
        query_info = json_data['query']
        addlt_wh = f" AND {query_info} - quest_region.date_change <= 86400000" if isinstance(query_info, int) else '' # this could scan whole table, it will need to check every date_change
        cur_db.execute(
            w3gdbhandl.gen_query_cmd(
                'mregion',
                select=['quest_region.date_change'],
                where='quest_region.status_id = 2' + addlt_wh,
                af_wh=['ORDER BY quest_region.region_id ASC, quest_region.date_change DESC']
            )
        )
        return jsonify(cur_db.fetchall())

    elif json_data['note']:
        modif_count = cur_db.rowcount
        pass #for quest notes adding or modification

    if modif_count > 0:
        conn_db.commit()
        # from .w3revertdb import revert_db
        # from flask import current_app
        # revert_db(conn_db, current_app.logger)
    
    return jsonify(result=quest_aff, modified=modif_count, err_r=err_r, sql_cmd=sql_cmd)
