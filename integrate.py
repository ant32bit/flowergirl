import os
import sys
import shutil
from hashlib import md5

def get_file_hash(filename):
    with open(filename) as fh:
        c = fh.read()
        return md5(c).hexdigest()

def make_root_files(env):
    env = os.path.dirname(env + '/') + '/'
    root_template = 'root-template/'
    www_root = env + 'www-root/'

    main_js = env + 'bundle.js'
    index_html = 'index.html'

    if os.path.exists(www_root):
        shutil.rmtree(www_root)

    os.makedirs(www_root)
    
    new_main_js = get_file_hash(main_js) + '.js'

    shutil.copyfile(main_js, www_root + new_main_js)

    with open(root_template + index_html) as fh:
        index_html_content = fh.read()
    
    with open(www_root + index_html, 'w') as fh:
        fh.write(index_html_content.replace('{{main.js}}', new_main_js))
    
    for file in os.listdir(root_template):
        if file != index_html:
            shutil.copyfile(root_template + file, www_root + file)

if __name__ == "__main__":
    make_root_files('dist/')
    