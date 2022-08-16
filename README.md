# About

This application is mostly a to-do list for the The Witcher 3: Wild Hunt quests.

The application goals is to avoid or minimize:
  * Overleveling of the game quests by providing a list of unfinished quests that on risk of overleveling based on the inputted level.
  * Making a quest/s unavailable cause by finishing it's cutoff quest, by "highlighting" a cutoff quest and provide a "feature" to list all its unfinished affected quests.

The application is divide by two section:
* Left Section:
  * Main Quests
    * Includes a column for region(e.g. white orchard, velen, novigrad & etc), each main quests have a button that have a name corresponding on the region where its located, clicking the button will display all unfinished secondary quests on the "right section" that have same region location of the main quest. E.g. If a main quest is located on white orchard, clicking on the "white orchard" button will display on the "right section" all unfinished secondary quests that also located on white orchard.
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

Risk Level is divided by these sections:

`a = Player Level or inputted level`

* High Risk: `a` equal to (`a` less 5)
* Low Risk: `a` less than or equal to (`a` less 2) and `a` greater than (`a` less 5)
* Overleved: `a` less than (`a` less 5)

Other Features:
* Creating, Updating and Deleting Notes for a quest.
* Listing of Missable Players, Enemies for a given quest.
  * Creating, Updating and Deleting Notes for each missable player or enemy is also present.
* Notes support markdown using `Marked` library.

This guide is based on Bear School Gear Playthrough, thus it also provide list of scavenger quests where it's required level is equal on the inputted level.

Treasure hunts quests aren't included, except for Scavenger Quests for Bear School Gear, Since the reward xp from completing them are considered insignificant.

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
pipenv run flask run
```

Use the link specify on the terminal, like `* Running on http://127.0.0.1:5000 (Press CTRL+C to quit)` on a selected browser.

Optionally, you can turn on debug mode by adding `--debug` option like `flask --debug run`.

# Developer Notes

The front-end is mostly written in vanilla javascript, but the contributors are not discourage to use libraries like react for future implementation.

## Quest Data Model

The quest data displayed on the application can be divide in these terms:
* Quest Elements
* Quest Containers

Quest Elements:
* Generation of the quest element is done on `consoQueryData()` function.
* It contains the following, each has its own function to parse and generate a quest data element for it to be more easily to target and update individual quest data:
  * `Marker`
    * Responsible for marking quest element as finished/unfinished or displaying all of its quests with region location name if the quest has multiple region location.
  * Region name
    * For quest only with multiple region location.
  * Quest name
  * Quest level
  * Affected quests
    * For cutoff quests
  * Notes
    * List of missable players, player location and notes, if any.
    * List of enemies and notes, if any.
    * Quest notes.
  * Region
    * The name of the region where the quest is located, clicking it will be display all unfinished secondary quests that also located on same region at the right section.

Quest Containers:
* Elements or nodes containing quests elements

## Quest Data Updating

`Updater.update()` is callled whenever a quest element/s is "marked" as finished or unfinished.

Here's the summarizes control flow:

1. Checked/ticked a quest or selection of quests as finished or unfinished.
2. Execution the callback functions stored on `Updater.#beforeFuncs`.
    * `Updater.#beforeFuncs` - It use for additional process that needed to perform before retreiving and parsing any data, this could be additional quest elements that needed to be marked for removable in the DOM.
3. Get all quests checked quests.
4. Get all quest containers & affected quest elements that still on the DOM.
5. Parse the data stored on the checked quests elements.
    * The data will be use to identify the quest data on the database needed to update its status to finished or unfinished.
6. Parse the data stored on the quest containers & affected quest elements.
    * The data will be use to identify or filter quest data on the database.
      * The queried quest data will be use to update quest containers and quest elements.
    * Example of affected quest
      * Checked/ticked quest has a cutoff quest, the displayed number of affected quest of the cutoff quest should be updated(lessen if finished or add if unfinished).
7. Sent to the server the parsed data.
8. Update and query query data from the database.
9. Remove the checked/ticked quest or selection of quests from the DOM.
10. Received and execute all the callback functions stored on the `Updater.#infoUpdater`, `Updater.#contUpdater` & `Updater.#othrUpdater` with the fetched data as passed argument.
    * `Updater.#infoUpdater` - Functions responsible for updating data on quest elements. This could be number of affected quests on cutoff quest.
    * `Updater.#contUpdater` - Functions responsible for updating quest containers. This could be generating and inserting new quest data or removing the quest container itself from DOM.
    * `Updater.#othrUpdater` - Functions responsible for updating data or elements that aren't quest element or quest container.
