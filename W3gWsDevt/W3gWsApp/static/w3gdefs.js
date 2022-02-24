const queryInput = document.querySelector('#quest-query input[type="number"]');
const levelMenu = document.getElementById('lvlsect-menu');
const levelSection = document.getElementById('lvlsect-body');
const nlevelSection = document.getElementById('nlevel-section');
const guideBody = document.getElementById('w3g-body');
const notesBody = document.getElementById('qnotes-body');
const mainNotes = document.getElementById('qnotes-overlay');
const notesMenuContainer = document.getElementById('qnotes-menus');
const notesDataContainer = document.getElementById('qnotes-data');
const menuNames = { //for easy code revision later
  affName: 'Affected',
  misName: 'Missable',
  enmName: 'Enemies',
  genNoteName: function(notesArray) {
    let noteEles = [];
    for (let [noteKey, noteBool] of notesArray) {
      if (noteBool) {
      noteEles.push(custom_createEle('span', this[noteKey]));
      }
    }
    return noteEles
  }
};
const allQueryData = {//this feature is still work on progress
  genQuestData: function(queryConso) {
    for (let queryInfos of queryConso) {
      let questData = {};
      let questId = queryInfos.info.id;
      if (!questId in this) {
        for (let querySubj in queryInfos) {
          let queryInfo = queryInfos[querySubj];
          if (typeof queryInfo === 'object' && !Array.isArray(queryInfo) && queryInfo !== null) {
            for (let queryKey in queryInfo) {
              if (queryKey !== 'id') {
                questData[queryKey] = queryInfo[queryKey];
              }
            }
          } else {
            questData[querySubj] = queryInfo;
          }
        }
        questData.done = false; // it is safe to assume that all quest query are undone, only undone quest is included in the condition when pulling data from database
        this[questId] = questData;
      }
    }
  }
};
const notesData = {};

function createUrl(urlLink, urlName) {
  let aTag = document.createElement('a');
  aTag.href = urlLink;
  aTag.innerHTML = urlName;
  aTag.target = '_blank';
  return aTag
}

async function queryInfo(queryUrl) {
  let getInfo = await fetch(queryUrl, {cache: 'no-cache'});
  if(!getInfo.ok) {
    throw new Error(`HTTP error! status: ${getInfo.status}`);
  } else {
    jsoniedInfo = await getInfo.json();
    if (typeof jsoniedInfo === 'object' && 'error' in jsoniedInfo) {
      let errBody = 'code' in jsoniedInfo ? jsoniedInfo.code : jsoniedInfo.stringnified;
      throw new Error(`${jsoniedInfo.error}! status:\n ${errBody}`);
    }
    console.log(jsoniedInfo);
    return jsoniedInfo
  }
}

function genNotesData(queryFunc, noteClass, noteHeaders, noteItems, menuClass=null) {
    this.queryUrl = queryFunc,
    this.menuClass = menuClass,
    this.noteClass = noteClass, //orders is important
    this.noteHeaders = noteHeaders, //orders is important
    this.noteItems = noteItems //orders is important
}

notesData[menuNames.affName] = new genNotesData(
  function(dataId) {return `/query/aff-id-${dataId}`},
  'affected-note',
  [ ['affheader-name', 'Quest Name'],
    ['affheader-lvl', 'Level']
  ],
  [ ['affitem-name', ['quest_name', 'quest_url'] ],
    ['affitem-lvl', 'r_level']
  ]
);
notesData[menuNames.misName] = new genNotesData(
  function(dataId) {return `/query/mis-id-${dataId}`},
  'qwt-note',
  [ ['qwtheader-name', 'Players'],
    ['qwtheader-location', 'Location'],
    ['qwtheader-notes', 'Notes']
  ],
  [ ['qwtitem-name', ['p_url', 'p_name'] ],
    ['qwtitem-location', 'p_location'],
    ['qwtitem-notes', 'qwent_notes']
  ],
  menuClass='qwt-menu'
);
notesData[menuNames.enmName] = new genNotesData(
  function(dataId) {return `/query/enm-id-${dataId}`},
  'enm-note',
  [ ['enmheader-name', 'Enemies Name'],
    ['enmheader-notes', 'Notes']
  ],
  [ ['enmitem-name', ['enemy_url', 'enemy_name'] ],
    ['enmitem-notes', 'enemy_notes']
  ],
  menuClass='enm-menu'
);

function addtlNote(consoData, dataInfo, affFunc, noteFunc,
                   urlClass='quest-data', levelClass='quest-level',
                   noteCls='notes-data', noteNames=menuNames) {
  this.sectItemClass = consoData.cut ? 'cutoff-quest' : 'normal-quest',
  this.noteMenuCls = noteCls,
  this.fixedData = [
    [urlClass, createUrl(dataInfo.quest_url, dataInfo.quest_name)],
    [levelClass, ('r_level' in dataInfo) ? document.createTextNode((dataInfo.r_level) ? dataInfo.r_level : 'N/A') : null]
  ],
  this.dataNotes = [
    [{
       eventFunc: affFunc.bind(dataInfo.id),
       menuName: noteNames.affName
     },
     consoData.cut],
    [{
       eventFunc: noteFunc.bind(
         {
           dataId:dataInfo.id,
           notes:[ [noteNames.misName, consoData.qwt], [noteNames.enmName, consoData.enm] ]
         }
       ),
       menuName: noteNames.genNoteName([ ['misName', consoData.qwt], ['enmName', consoData.enm] ])
     },
     (consoData.qwt || consoData.enm) ? true : false]
  ]
}

function genNoteHeader(containerEle, headerEleName, headersData) {
  //containerEle = document.createElement('li')
  //headerEleName = 'span'
  //headersData = notesData.Name.noteHeaders
  for (let [hClass, hName] of headersData) {// header
    let noteSpan = document.createElement(headerEleName);
    noteSpan.className = hClass;
    noteSpan.innerHTML = hName;
    containerEle.appendChild(noteSpan);
  }
  return containerEle
}

function removeData(noteData) {
  let noteInfos;
  if (!Array.isArray(noteData)) {
    noteInfos = [noteData]
  } else {
    noteInfos = noteData
  }
  for (let noteInfo of noteInfos) {
    while(noteInfo.firstChild) {
      noteInfo.removeChild(noteInfo.firstChild);
    }
  }
}

function closeNotes(noteContainer, noteClassEle, menuContainer=null) {
  //when overlay show, noteContainer still dont have any child and menuContainer have childnodes(its length is <= 1)
  //does the value should be null to avoid returning true
  let noteStat = (noteClassEle) ? true : false; // if same note return true
  if(menuContainer && ((typeof menuContainer === 'object' && menuContainer.children.length === 1) || noteStat)) {
    //if single note/menu or same note found, don't allowed to close it
    return true
  }
  if (noteContainer) {
    noteContainer.remove();
  }
  return noteStat
}

function custom_createEle(eleName, inhtml, eleCls=null, idName=null) {
  //assign "inhtml" as null, if there is no innerHTML
  let eleObj = document.createElement(eleName);
  if (inhtml) {
    if (Array.isArray(inhtml)) {
      inhtml.forEach(function(noteEle) {eleObj.appendChild(noteEle)});
    } else {
      eleObj.innerHTML = inhtml;
    }
  }
  if (eleCls) {
    if (Array.isArray(eleCls)) {
      eleCls.forEach(function(clsN) {eleObj.classList.add(clsN)});
    } else {
      eleObj.className = eleCls;
    }
  }
  if (idName) {
    eleObj.id = idName;
  }
  return eleObj
}
