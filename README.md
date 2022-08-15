# About

This application is mostly a to-do list for the The Witcher 3: Wild Hunt quests.

The application goals is to avoid or minimize:
  * Overleveling of the game quests by providing a list of quests that on risk of overleveling based on the inputted level.
  * Making a quest/s unavailable cause by finishing it's cutoff quest, by "highlighting" a cutoff quest and provide a "feature" to list all its affected quests.

The application is divide by two section:
* Left Section:
  * Main Quests
    * Includes a column for region(e.g. white orchard, velen, novigrad & etc), each main quests have a button that have a name corresponding on the main quest region location, clicking the button will display all secondary quests on the "right section" that have same region location of the main quest. E.g. If a main quest is location on white orchard, clicking on the "white orchard" button will display on the "right section" all secondary quests that also located on white orchard
  * Secondary Quests - Sorted by Level
    * Side Quests
    * Contract Quests
    * Treasure Hunts - Scavenger Quests for Bear School Gear only
* Right Section:
  * Crucial Quests - Sorted by Level
    * Scavenger Quest
    * Quests that risk on overleveling
    * Overleveled Quests
  * Secondary Quests - Filtered by region and sorted by Level

Quests are considered overleveled if the required level listed on a mission is below more than 5 level on the player current level, e.g. If mission A required level is 10 and player is 16, then mission A is overleved. Overleveled quests provide insignificant amount of xp, mostly around 1xp on Death March!.

Risk Level is divided by:

`a = Player Level or inputted level`

* High Risk: `a` equal to (`a` less 5)
* Low Risk: `a` less than or equal to (`a` less 2) and `a` greater than (`a` less 5)
* Overleved: `a` less than (`a` less 5)

Other Features:
* Creating, Updating and Deleting Notes for a quest.
* Listing of Missable Players, Enemies for a given quest.
  * Creating, Updating and Deleting Notes for each missable player or enemy is also present.

This guide is based on Bear School Gear Playthrough, thus it also provide list of scavenger quests that equal on the inputted level.

Treasure hunts quests aren't included, except for Scavenger Quests for Bear School Gear, Since I considered the reward xp from completing them are insignificant.

Contents presented by this application are based on [The Witcher 3 Fandom wiki](https://witcher.fandom.com/wiki/The_Witcher_3:_Wild_Hunt)

# Instruction

## Prerequisite
This project requires:
```
python >= 3.10
pipenv
sass
node >=18.6.0
npm >=8.15.0
```

## Dependencies Setup
```
$ pipenv install --dev
$ npm install
```

Optionally before executing `pipenv install --dev`, you can indicate the pipenv to setup the `virtualenv` in the project folder by setting `PIPENV_VENV_IN_PROJECT=1` environment variable.

If encountered `FileNotFoundError: [Errno 2] No such file or directory:` after excuting pipenv, try to set the environment variable `SETUPTOOLS_USE_DISTUTILS=stdlib` then run again pipenv.

## Running the application
In **Bash**:
```
$ npm run build
$ export FLASK_APP=W3gWsApp:main_app
$ python3 -m pipenv run flask run
```

In **CMD**:
```
npm run build
set FLASK_APP=W3gWsApp:main_app
flask run
```

Use the link specify on the terminal, like `* Running on http://127.0.0.1:5000 (Press CTRL+C to quit)` on a selected browser.

Optionally, you can turn on debug mode by adding `--debug` option like `flask --debug run`.