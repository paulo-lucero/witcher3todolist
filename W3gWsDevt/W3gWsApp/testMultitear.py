import click

def dummy_func(e=None):
    click.echo('2nd teardown: Checked')

def regapp_testtear(app):
    app.teardown_appcontext(dummy_func)
