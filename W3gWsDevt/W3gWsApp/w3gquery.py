import flask
import click
from flask import Blueprint, jsonify
from W3gWsApp import w3gdbhandl

query_bp = Blueprint('query', __name__, url_prefix='/query')

@query_bp.route('/check-quests-info')
def quests_data_bool():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    query_result = {}
    for key_name, query_basis in [['main', '='], ['second', '!=']]:
        cur_db.execute(f'''SELECT all_quests.id FROM all_quests
                           WHERE all_quests.status_id = 1
                           AND all_quests.category_id {query_basis} 1''')
        if cur_db.fetchall():
            query_result[key_name] = True
        else:
            query_result[key_name] = False
    return jsonify(query_result)

@query_bp.route('/main-quests-info')
def main_quests_info():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute(f'''SELECT all_quests.id, quest_name, quest_url, level.r_level, region_id
                       FROM all_quests LEFT JOIN level ON level.id = all_quests.level_id
                       WHERE all_quests.status_id = 1 AND all_quests.category_id = 1
                       ORDER BY all_quests.id ASC''')
    quest_query = cur_db.fetchall()
    if quest_query:
        quest_data = w3gdbhandl.quest_consoData(cur_db, quest_query)
    else:
        quest_data = None
    return jsonify(quest_data)

@query_bp.route('/regions-info')
def regions_info():
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute('SELECT region.id, region.region_name FROM region ORDER BY region.id ASC')
    regions_queries = cur_db.fetchall()
    all_regions_data = []
    for region_query in regions_queries:
        regions_data = {region_col: region_query[region_col] for region_col in region_query.keys()}
        cur_db.execute('''SELECT all_quests.id FROM all_quests
                          WHERE all_quests.status_id = 1
                          AND all_quests.category_id != 1
                          AND all_quests.region_id = ?''', (region_query['id'], ))
        quest_ids = cur_db.fetchall()
        if quest_ids:
           regions_data['quest_count'] = len(quest_ids)
        else:
           regions_data['quest_count'] = None
        all_regions_data.append(regions_data)
    return jsonify(all_regions_data)

@query_bp.route('/second-quests-regid-<int:region_id>')
def second_quests_info(region_id):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    cur_db.execute(f'''SELECT all_quests.id, quest_name, quest_url, level.r_level
                       FROM all_quests LEFT JOIN level ON level.id = all_quests.level_id
                       WHERE all_quests.status_id = 1 AND all_quests.category_id != 1
                       AND all_quests.region_id = ? ORDER BY level.r_level NULLS FIRST,
                       level.r_level ASC''', (region_id, ))
    quest_query = cur_db.fetchall()
    if quest_query:
        quest_data = w3gdbhandl.quest_consoData(cur_db, quest_query)
    else:
        quest_data = None
    return jsonify(quest_data)

@query_bp.route('/crucial-quests-qrylvl-<int:level_info>')
def crucial_quests_info(level_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving crucial Quest Data - Queried Level: {level_info}')
    if level_info < 4:
        return jsonify(None)
    cur_db.execute('''SELECT all_quests.id, quest_name, quest_url, level.r_level, all_quests.category_id
                      FROM all_quests INNER JOIN level ON level.id = all_quests.level_id
                      WHERE all_quests.status_id = 1 AND level.r_level <= ?
                      ORDER BY level.r_level ASC''', (level_info, ))
    quest_query = cur_db.fetchall()
    if quest_query:
        quest_data = w3gdbhandl.quest_consoData(cur_db, quest_query)
    else:
        quest_data = None

    return jsonify(quest_data)

@query_bp.route('/aff-id-<int:id_info>')
def affected_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Affected Quest/s Data - Cutoff ID: {id_info}')
    cur_db.execute('''SELECT all_quests.id, all_quests.quest_name, all_quests.quest_url, level.r_level
                      FROM all_quests LEFT JOIN level ON level.id = all_quests.level_id
                      WHERE all_quests.status_id = 1 AND all_quests.cutoff = ?''', (id_info, ))
    aff_quests = cur_db.fetchall()

    return jsonify(w3gdbhandl.quest_consoData(cur_db, aff_quests))

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
    miss_info = cur_db.fetchall()
    return jsonify(miss_info)

@query_bp.route('/enm-id-<int:id_info>')
def enemies_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Enemy Quest Data - Quest ID: {id_info}')
    cur_db.execute('''SELECT enemies_list.enemy_name, enemies_list.enemy_url, enemies_list.enemy_notes
                      FROM quest_enemies INNER JOIN all_quests ON all_quests.id = quest_enemies.quest_id
                      INNER JOIN enemies_list ON enemies_list.id = quest_enemies.enemy_id
                      WHERE quest_enemies.quest_id = ?''', (id_info, ))
    enm_info = cur_db.fetchall()
    return jsonify(enm_info)
