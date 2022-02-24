import flask
import click
from flask import Blueprint, jsonify
from W3gWsApp import w3gdbhandl

query_bp = Blueprint('query', __name__, url_prefix='/query')

@query_bp.route('/chklevel-<int:level_info>')
def levelcategory_bool(level_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    if not isinstance(level_info, int):
        raise TypeError(f'Received request data type: {type(level_info)}')
    else:
        click.echo(f'Checking Quest Data Status - Queried level: {level_info}')
        if level_info < 1: #for level request of below 1, to avoid negative level
            level_info = 6
        else:
            level_info += 5
        click.echo(f'Checking Quest Data Status - Processed level: {level_info}')
    query_result = {}
    for key_name, query_basis in [['main', '='], ['second', '!=']]:
        cur_db.execute(f'''SELECT all_quests.id FROM all_quests
                           INNER JOIN level ON all_quests.level_id = level.id
                           WHERE all_quests.status_id = 1 AND
                           all_quests.category_id {query_basis} 1 AND
                           level.r_level <= ?''', (level_info, ))
        if cur_db.fetchall():
            query_result[key_name] = True
        else:
            query_result[key_name] = False
    return jsonify(query_result)

@query_bp.route('/mainlevel-<int:level_info>')
def mainlevel_info(level_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    if not isinstance(level_info, int):
        raise TypeError(f'Received request data type: {type(level_info)}')
    else:
        click.echo(f'Retrieving Main Quest Data - Queried Level: {level_info}')
        if level_info < 1: #for level request of below 1, to avoid negative level
            level_info = 6
        else:
            level_info += 5
        click.echo(f'Retrieving Main Quest Data - Processed Level: {level_info}')
        cur_db.execute('''SELECT all_quests.id, quest_name, quest_url, level.r_level
                          FROM all_quests LEFT JOIN level ON level.id = all_quests.level_id
                          WHERE all_quests.category_id = 1 AND all_quests.status_id = 1 AND
                                all_quests.id <= (SELECT MAX(all_quests.id) FROM all_quests
                                                  LEFT JOIN level ON level.id = all_quests.level_id
                                                  WHERE all_quests.category_id = 1 AND all_quests.status_id = 1
                                                  AND level.r_level <= ?)
                          ORDER BY all_quests.id ASC''', (level_info, ))
        mquest_query = cur_db.fetchall()
        if mquest_query:
            mquest_data = w3gdbhandl.quest_consoData(cur_db, mquest_query)
        else:
            mquest_data = None
    return jsonify(mquest_data)

@query_bp.route('/seclevel-<int:level_info>')
def seclevel_info(level_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    if not isinstance(level_info, int):
        raise TypeError(f'Received request data type: {type(level_info)}')
    else:
        click.echo(f'Retrieving Secondary Quest Data - Queried Level: {level_info}')
        if level_info < 1: #for level request of below 1, to avoid negative level
            level_info = 6
        else:
            level_info += 5
        click.echo(f'Retrieving Secondary Quest Data - Processed Level: {level_info}')
        cur_db.execute('''SELECT all_quests.id, quest_name, quest_url, level.r_level
                          FROM all_quests INNER JOIN level ON level.id = all_quests.level_id
                          WHERE all_quests.category_id != 1 AND all_quests.status_id = 1 AND
                          level.r_level <= ? ORDER BY level.r_level ASC''', (level_info, ))
        squest_query = cur_db.fetchall()
        if squest_query:
            squest_data = w3gdbhandl.quest_consoData(cur_db, squest_query)
        else:
            squest_data = None

    return jsonify(squest_data)

@query_bp.route('/nlevel-regions')
def nonlevel_regions_info():
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
                          AND all_quests.level_id IS NULL
                          AND all_quests.region_id = ?''', (region_query['id'], ))
        quest_ids = cur_db.fetchall()
        if quest_ids:
           regions_data['quest_count'] = len(quest_ids)
        else:
           regions_data['quest_count'] = None
        all_regions_data.append(regions_data)
    return jsonify(all_regions_data)

@query_bp.route('/nlevel-rgid-<int:id_info>')
def nonlevel_quests_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Retrieving Non-level Quest/s Data - Region ID: {id_info}')
    cur_db.execute('''SELECT all_quests.id, quest_name, quest_url FROM all_quests
                      WHERE all_quests.category_id != 1 AND all_quests.status_id = 1
                      AND all_quests.level_id IS NULL AND all_quests.region_id = ?
                      ORDER BY all_quests.id ASC''', (id_info, ))
    return jsonify(w3gdbhandl.quest_consoData(cur_db, cur_db.fetchall()))

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
