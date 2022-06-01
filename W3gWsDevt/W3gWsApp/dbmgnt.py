# encrypting database
from cryptography.fernet import Fernet
import requests
import os
import math

def db_setup():
    cur_db_name = os.path.join(os.path.dirname(__file__), 'w3database.db')
    loc_encr = os.path.join(os.path.dirname(__file__), 'w3.encdb')
    if os.path.exists(cur_db_name):
        print(' - Default database found')
        return cur_db_name
    print(' - Default database not found, attempting to create to one, please stay connected to the internet')
    chk_size = 1024
    with requests.get('https://archive.org/download/tw3lvlgd/tw3lvlgd.encdb', stream=True) as db_request:
        total_size = None
        if not 'content-length' in db_request.headers:
            raise KeyError('\"content-length\" is not in headers')
        else:
            total_size = int(db_request.headers['content-length'])
        with open(loc_encr, 'wb') as db_file_encrt:
            cur_dlsize = 0
            for db_chunk in db_request.iter_content(chunk_size=chk_size):
                cur_dlsize += len(db_chunk)
                cur_prog = (cur_dlsize / total_size) * 100
                cur_prog = 100 if cur_prog >= 100 else round(cur_prog, 2)
                print(f' - Download progress: {cur_prog}%   ', end='\r', flush=True)
                db_file_encrt.write(db_chunk)
            print('\n', end='\r')

    db_key = Fernet('-OYUYWnW1JBg4UPZ_-0pLWEO5aQH64ujQQOf3BF5soQ=')
    db_decrt = None
    if os.path.exists(loc_encr):
        print(' - Decrypting the downloaded database')
        with open(loc_encr, 'rb') as db_file_encrt:
            db_rd_encrt = db_file_encrt.read()
            db_decrt = db_key.decrypt(db_rd_encrt)
        os.remove(loc_encr)
        print(' - Decrypt attempt is finished')
    else:
        raise FileNotFoundError('Can\'t decrypt the downloaded database, since it not found')

    with open(cur_db_name, 'wb') as db_file_decrt:
        db_file_decrt.write(db_decrt)
        print(' - Database is sucessfully written on disk')

    return cur_db_name

class DefConfig():
    DATABASE = db_setup()
