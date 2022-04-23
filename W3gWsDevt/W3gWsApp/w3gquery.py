import flask
import click
from flask import Blueprint, jsonify
from flask import request
from W3gWsApp import w3gdbhandl

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

    # old - using quest_consoData() : response time -> 6-7 ms
    # new - using CASE : response time -> 10-13 ms
    # new approach could be improve by query planning/optimizing
    #  using indices
    #  missable, affected quests & enemies count can be "pre-made"
    #   affected quests count can be updated everying marking done of quests
    #   include cutoff_id of affected quests in request body data and use it for querying/update, it fast since it is the primary key which is an indexed
    #   separate executemany method for updating affected count, use "update columns with arithmetical expression"
    #    if wishes to save the row_count of "done quests", execute it before executing executemany statement of "affected count" update
    #  create count field/colum and use this as query, that gets updated using TRIGGER when UPDATE/INSERT/etc
    # old approach problem is it doing full table scan, even though
    #  only once per connection, it might prove expensive if it is
    #  a large data, it could be more beneficial if there is low small of data
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
    json_data = request.get_json(cache=False) #dont know why form attribute wont work
    quest_data = json_data['questData'] #format : [{'regionId': int, 'questId': int}, ...]

    if json_data['done'] or json_data['redo']:
        if quest_data != None:
            for questreg_dict in quest_data:
                for key_data in questreg_dict:
                    if not isinstance(questreg_dict[key_data], int) and not questreg_dict[key_data] == None:
                        raise TypeError(f'This {type(questreg_dict[key_data])} data type is not supported, for this value {questreg_dict[key_data]}')
            cur_db.executemany(
                w3gdbhandl.gen_query_cmd(
                    modif='do-set' if json_data['done'] else 'redo-set' if json_data['redo'] else None
                ),
                tuple(quest_data)
            )
        elif json_data['redo']:
            cur_db.execute(w3gdbhandl.gen_query_cmd(modif='redo-all'))
    elif json_data['query']:
        query_info = json_data['query']
        addlt_wh = f" AND {query_info['recent']} - quest_region.date_change <= 86400000" if 'recent' in query_info else ''
        cur_db.execute(w3gdbhandl.gen_query_cmd(
            'mregion',
            select=['quest_region.date_change'],
            where='quest_region.status_id = 2' + addlt_wh,
            af_wh=['ORDER BY quest_region.region_id ASC, quest_region.date_change DESC']
            ))
        return jsonify(cur_db.fetchall())
    elif json_data['note']:
        pass #for quest notes adding or modification

    modif_count = cur_db.rowcount
    if modif_count > 0:
        mod_status = True
        conn_db.commit()
    else:
        mod_status = False

    return jsonify(quest_data=quest_data, modified=mod_status, row_count=modif_count)
