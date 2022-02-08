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

    return jsonify(w3gdbhandl.quest_consoData(cur_db, mquest_query))

@query_bp.route('/aff-id-<int:id_info>')
def affected_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Affected Query cutoff id is {id_info}')
    cur_db.execute('''SELECT all_quests.id, all_quests.quest_name, all_quests.quest_url, level.r_level
                      FROM all_quests LEFT JOIN level ON level.id = all_quests.level_id
                      WHERE all_quests.cutoff = ?''', (id_info, ))
    aff_quests = cur_db.fetchall()

    return jsonify(w3gdbhandl.quest_consoData(cur_db, aff_quests))

@query_bp.route('/mis-id-<int:id_info>')
def missable_info(id_info):
    conn_db = w3gdbhandl.conn_w3gdb()
    cur_db = conn_db.cursor()
    click.echo(f'Missable Query cutoff id is {id_info}')
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
    click.echo(f'Enemy Query: quest id is {id_info}')
    cur_db.execute('''SELECT enemies_list.enemy_name, enemies_list.enemy_url, enemies_list.enemy_notes
                      FROM quest_enemies INNER JOIN all_quests ON all_quests.id = quest_enemies.quest_id
                      INNER JOIN enemies_list ON enemies_list.id = quest_enemies.enemy_id
                      WHERE quest_enemies.quest_id = ?''', (id_info, ))
    enm_info = cur_db.fetchall()
    return jsonify(enm_info)
