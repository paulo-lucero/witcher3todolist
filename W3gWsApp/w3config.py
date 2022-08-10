from chunkcrypt.cryptchunk import downl_decrypt
import os

def db_setup():
    cur_db_name = os.path.join(os.path.dirname(__file__), 'w3database.db')
    if os.path.exists(cur_db_name):
        print(' - Default database found')
        return cur_db_name
    print(' - Default database not found, attempting to create to one, please stay connected to the internet')
    downl_decrypt(
        'https://archive.org/download/tw3lvlg0-0-7/tw3lvlg0-0-7.encdb',
         cur_db_name,
         '-OYUYWnW1JBg4UPZ_-0pLWEO5aQH64ujQQOf3BF5soQ=',
         False,
         ' - ',
         '',
         'Witcher 3 Level Guide Database'
    )
    return cur_db_name

class DefConfig():
    DATABASE = db_setup()

class DevConfig(DefConfig):
    DB_DEBUG = os.path.join(os.path.dirname(__file__), 'w3debug.db')
