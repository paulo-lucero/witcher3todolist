def revert_db(conn = None, logger_obj = None, out_warn = True):
    msg = 'In experimental mode: no changes made'
    has_con = bool(conn)
    if not has_con:
        import sqlite3, os
        conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), 'w3database.db'))
    curs = conn.cursor()

    curs.execute('UPDATE quest_region SET status_id = 1, date_change = NULL WHERE quest_region.status_id = 2')
    conn.commit()

    if not logger_obj:
        import logging
        logger_obj = logging
    if out_warn:
        logger_obj.warning(msg)

if __name__ == '__main__':
    revert_db()