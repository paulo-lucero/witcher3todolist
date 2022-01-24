import flask
import click
from flask import Blueprint, jsonify
from W3gWsApp import w3gdbhandl

query_bp = Blueprint('query', __name__, url_prefix='/query')

@query_bp.route('/level-<int:level_info>')
def levelMission_info(level_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Basis Level is {level_info}')
    if not isinstance(level_info, int):
        raise TypeError(f'Received request data type is {type(level_info)}')
    else:
        if level_info < 1: #for level request of below 1, to avoid negative level
            level_info = 6
        else:
            level_info += 5
        click.echo(f'Query Level is {level_info}')
        cur_db.execute('''SELECT all_quests.id, quest_name, quest_url, level.r_level
                          FROM all_quests LEFT JOIN level ON level.id = all_quests.level_id
                          WHERE all_quests.category_id = 1 AND all_quests.status_id = 1 AND
                                all_quests.id <= (SELECT MAX(all_quests.id) FROM all_quests
                                                  LEFT JOIN level ON level.id = all_quests.level_id
                                                  WHERE all_quests.category_id = 1 AND all_quests.status_id = 1
                                                  AND level.r_level <= ?)
                          ORDER BY all_quests.id ASC''', (level_info, ))
    mquest_query = cur_db.fetchall()

    addtquery_basis = mquest_query[-1]['id']
    cur_db.execute('''SELECT all_quests.id, qwent_players.p_name, qwent_players.p_url, qwent_players.p_location, qwent_players.qwent_notes
                        FROM missable_players INNER JOIN all_quests ON missable_players.allquest_id = all_quests.id
                        INNER JOIN qwent_players ON missable_players.qwtplayer_id = qwent_players.id
                        WHERE all_quests.status_id = 1 AND missable_players.allquest_id <= ? ORDER BY missable_players.allquest_id ASC''',
                        (addtquery_basis, ))
    mqwt_query = cur_db.fetchall()

    cur_db.execute('''SELECT all_quests.id, enemies_list.enemy_name, enemies_list.enemy_url, enemies_list.enemy_notes
                        FROM quest_enemies INNER JOIN all_quests ON quest_enemies.quest_id = all_quests.id
                        INNER JOIN enemies_list ON quest_enemies.enemy_id = enemies_list.id
                        WHERE all_quests.status_id = 1 AND quest_enemies.quest_id <= ? ORDER BY quest_enemies.quest_id ASC''',
                        (addtquery_basis, ))
    menemies_query = cur_db.fetchall()

    def get_addtlData(consolidatedQuery, mainQuestData, addtlQuery, keyName):
        all_addtlInfo = []
        for addtl_info in addtlQuery:
            if addtl_info['id'] == mainQuestData['id']:
                all_addtlInfo.append(addtl_info)
        if all_addtlInfo:
            consolidatedQuery[keyName] = all_addtlInfo

    consol_query = []
    for mquest_info in mquest_query:
        consol_info = {}
        consol_info['mquest_data'] = mquest_info
        if mqwt_query[0]: #check if not None
            get_addtlData(consol_info, mquest_info, mqwt_query, 'mqwt_data')
        if menemies_query[0]:
            get_addtlData(consol_info, mquest_info, menemies_query, 'menemy_data')
        cur_db.execute('SELECT all_quests.quest_name FROM all_quests WHERE all_quests.cutoff = ?;',
                         (mquest_info['id'], ))
        if cur_db.fetchone():
            consol_info['mqaffected'] = True
        else:
            consol_info['mqaffected'] = False
        consol_query.append(consol_info)

    return jsonify(consol_query)

@query_bp.route('/id-<int:id_info>')
def affected_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Query cutoff id is {id_info}')
    cur_db.execute('''SELECT all_quests.id, all_quests.quest_name, all_quests.quest_url, level.r_level
                        FROM all_quests LEFT JOIN level ON level.id = all_quests.level_id
                        WHERE all_quests.cutoff = ?''', (id_info, ))
    aff_quests = cur_db.fetchall()
    #separate the function for querying if a quest has affected or not
    consol_query = []
    for affquests_info in aff_quests:
        consol_info = {}
        consol_info['affq_data'] = affquests_info
        cur_db.execute('SELECT all_quests.quest_name FROM all_quests WHERE all_quests.cutoff = ?;',
                         (affquests_info['id'], ))
        if cur_db.fetchone():
            consol_info['cutoff_status'] = True
        else:
            consol_info['cutoff_status'] = False
        consol_query.append(consol_info)
    return jsonify(consol_query)
