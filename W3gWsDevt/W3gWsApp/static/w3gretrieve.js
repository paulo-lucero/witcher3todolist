//as much as possible separate the javascript code from html
//e.g. use element.onclick = function; instead of onclick="javascript code"

const queryInput = document.querySelector('.quest-query input[type="number"]');
const levelSection = document.getElementById('levelsect');
const menuNames = { //for easy code revision later
  affName: 'Affected',
  misName: 'Missable',
  enmName: 'Enemies'
};

// later:
//  use Event.currentTarget, then node sibling
//  when using .queryselector, check if false(null), if not then do the instruction

function createUrl(urlLink, urlName) {
  let aTag = document.createElement('a');
  aTag.href = urlLink;
  aTag.innerHTML = urlName;
  aTag.target = '_blank';
  return aTag
}

async function queryInfo(queryUrl) {
  let getInfo = await fetch(queryUrl);
  if(!getInfo.ok) {
    throw new Error(`HTTP error! status: ${getInfo.status}`);
  } else {
    jsoniedInfo = await getInfo.json();
    console.log(jsoniedInfo);
    return jsoniedInfo
  }
}

function genNotesData(noteNames) {
  this[noteNames.affName] = { //property name should same with addtlNote.dataNotes
    queryUrl: function(dataId) {
      return `/query/aff-id-${dataId}`
    },
    noteClass: 'mAff-Note',
    noteHeaders: [
      ['mAffHeader-Qname', 'Quest Name'],
      ['mAffHeader-Qlvl', 'Level']
    ],
    noteItems: [
      ['mAffitem-Qname', ['quest_name', 'quest_url']],
      ['mAffitem-Qlvl', 'r_level']
    ]
  },
  this[noteNames.misName] = { //property name should same with addtlNote.dataNotes
    queryUrl: function(dataId) {
      return `/query/mis-id-${dataId}`
    },
    noteClass: 'mQwt-Note',
    noteHeaders: [
      ['mQwtHeader-Pname', 'Players'],
      ['mQwtHeader-location', 'Location'],
      ['mQwtHeader-notes', 'Notes']
    ],
    noteItems: [
      ['mQwtItem-Pname', ['p_url', 'p_name']],
      ['mQwtItem-location', 'p_location'],
      ['mQwtItem-notes', 'qwent_notes']
    ]
  },
  this[noteNames.enmName] = {//property name should same with addtlNote.dataNotes
    queryUrl: function(dataId) {
      return `/query/enm-id-${dataId}`
    },
    noteClass: 'mEnm-Note',
    noteHeaders: [
      ['mEnmHeader-Ename', 'Enemies Name'],
      ['mEnmHeader-notes', 'Notes']
    ],
    noteItems: [
      ['mEnmItem-Ename', ['enemy_url', 'enemy_name']],
      ['mEnmItem-notes', 'enemy_notes']
    ]
  }
}

const notesData = new genNotesData(menuNames);

function addtlNote(consoData, dataInfo, urlClass='mQuest-Data', levelClass='mQuest-level', noteNames=menuNames) {
  this.sectItemClass = consoData.cut ? 'cutoff-quest' : 'normal-quest',
  this.fixedData = [
    [urlClass, createUrl(dataInfo.quest_url, dataInfo.quest_name)],
    [levelClass, document.createTextNode((dataInfo.r_level) ? dataInfo.r_level : 'N/A')]
  ],
  this.dataNotes = [
    [noteNames.affName, consoData.cut],
    [noteNames.misName, consoData.qwt],
    [noteNames.enmName, consoData.enm]
  ],
  this.dataId = dataInfo.id,
  this.cutoffMenu = noteNames.affName
}

function closeNotes(parentE, noteClass) {
  let noteUl = parentE.querySelector('ul');
  let noteStat = (noteUl === parentE.getElementsByClassName(noteClass)[0]) ? true : false
  if (noteUl) {
    parentE.removeChild(noteUl);
  }
  return noteStat
}

async function displayAddtlNotes(evt) {
  let sect = evt.currentTarget.parentElement;
  let kcData = notesData[this.noteName];
  let sameNote = closeNotes(sect, kcData.noteClass);
  if (!sameNote) {
    let dataNotes = await queryInfo(kcData.queryUrl(this.dataId));
    let noteUl = document.createElement('ul');
    noteUl.className = kcData.noteClass;
    let noteli = document.createElement('li');
    for (let [hClass, hName] of kcData.noteHeaders) {// header
      let noteSpan = document.createElement('span');
      noteSpan.className = hClass;
      noteSpan.innerHTML = hName;
      noteli.appendChild(noteSpan);
    }
    noteUl.appendChild(noteli);
    for (let dataNote of dataNotes) {
      noteli = document.createElement('li');
      if (this.noteName === menuNames.affName) {// affected notes
        let itemClasses = kcData.noteItems;
        noteUl.appendChild(displayLevelData(new addtlNote(dataNote, dataNote.info,
                                                          urlClass=itemClasses[0][0],
                                                          levelClass=itemClasses[1][0]),
                                              noteli))
      } else {// missable and enemies notes
          for (let [dataClass, dataKey] of kcData.noteItems) {// class and keys for accessing data in json
            let noteSpan = document.createElement('span');
            noteSpan.className = dataClass;
            if (Array.isArray(dataKey)) {//processing url data
              noteSpan.appendChild(createUrl(dataNote[dataKey[0]], dataNote[dataKey[1]]));
            } else {
              noteSpan.appendChild(document.createTextNode(dataNote[dataKey]))
            }
            noteli.appendChild(noteSpan);
          }
          noteUl.appendChild(noteli);
        }
    }
    sect.appendChild(noteUl);
  }
}

function displayLevelData(questInfos, sect) {
  let innerSect = () => document.createElement('span'); //arrow function support in steam overlay browser is uncertain
  let mainClass = questInfos.sectItemClass;
  for (let [menuClass, menuData] of questInfos.fixedData) { // fixed data like questname and level
    let sectItem = innerSect();
    sectItem.classList.add(mainClass, menuClass);
    sectItem.appendChild(menuData);
    sect.appendChild(sectItem);
  }
  for (let [noteName, noteBool] of questInfos.dataNotes) { // notes, this data aren't fixed/expected always to have
    if (noteBool) {
      let sectItem = innerSect();
      sectItem.classList.add(mainClass, 'mLvlAddtl-menu');
      sectItem.innerHTML = noteName;
      sectItem.addEventListener('click', displayAddtlNotes.bind({dataId:questInfos.dataId, noteName:noteName}))
      sect.appendChild(sectItem);
    }
  }
  return sect
}

async function retMissionInfo(queryValue) {
  dataMissionInfo = await queryInfo(`/query/level-${queryValue}`);
  if (levelSection.hasChildNodes()) {
    while(levelSection.firstChild) {
      levelSection.removeChild(levelSection.firstChild);
    }
  }
  for (let dataMission of dataMissionInfo) {
    levelSection.appendChild(displayLevelData(new addtlNote(dataMission, dataMission['info']), document.createElement('div')))
  }
}

retMissionInfo(1) //opening of the website

function missionQuery(evt) {
  if(evt.key === 'Enter') {
    retMissionInfo(queryInput.value)
  }
}

queryInput.addEventListener('keyup', missionQuery);

// TODO:
//  -Problem:
//   -switching animation between missable and enemies notes aren't smooth
//    -possible cause: when the prev note is remove, the "space" which the prev note reside will also dissapper
//    -possible solution: this can be solve with animation
//   -memory usage seems do not decrease regardless of length of query result
//  -opening missable, enemies & other notes, use blured overlay effect, good for dark theme site
//   -using "filter: blur()" seems to work also on non-image contents(e.g. text)
//    -enclose all elements in a div that will be blurred
//    -can apply class for body element, for bluring effect, just make sure not to blur the menu(apply addtl class)
//   -https://www.w3schools.com/howto/howto_css_overlay.asp
//   -https://www.w3schools.com/howto/howto_js_fullscreen_overlay.asp
//   -https://stackoverflow.com/questions/11977103/blur-effect-on-a-div-element
//    -http://jsfiddle.net/ayhj9vb0/
//   -centering: https://www.freecodecamp.org/news/how-to-center-anything-with-css-align-a-div-text-and-more/

//=Notes=
// -processing of risk of overleveling or leveled undone missions are to be done here
// -for adding eventlistener in every loop
//  -define a function outside of loop, so one reference will be made on all function made (good for memory)
// -in case: if wanted to change(e.g. display none) a certain element when an another element receive an event, use .querySelector()
//  -e.g. document.querySelector(div span[style:"display:block;"])
