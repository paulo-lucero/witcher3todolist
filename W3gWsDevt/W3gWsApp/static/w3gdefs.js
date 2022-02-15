const queryInput = document.querySelector('#quest-query input[type="number"]');
const levelMenu = document.getElementById('lvlsect-menu');
const levelSection = document.getElementById('lvlsect-body');
const guideBody = document.getElementById('w3g-body');
const notesBody = document.getElementById('qnotes-body');
const mainNotes = document.getElementById('qnotes-overlay');
const notesMenuContainer = document.getElementById('qnotes-menus');
const notesDataContainer = document.getElementById('qnotes-data');
const menuNames = { //for easy code revision later
  affName: 'Affected',
  qNotes: 'Notes',
  misName: 'Missable',
  enmName: 'Enemies'
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
  let getInfo = await fetch(queryUrl);
  if(!getInfo.ok) {
    throw new Error(`HTTP error! status: ${getInfo.status}`);
  } else {
    jsoniedInfo = await getInfo.json();
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

notesData[menuNames.affName] = new genNotesData(function(dataId) {return `/query/aff-id-${dataId}`},
                                                'mAff-Note', [ ['mAffHeader-Qname', 'Quest Name'],
                                                ['mAffHeader-Qlvl', 'Level'] ], [ ['mAffitem-Qname',
                                                ['quest_name', 'quest_url']],['mAffitem-Qlvl', 'r_level'] ]);
notesData[menuNames.misName] = new genNotesData(function(dataId) {return `/query/mis-id-${dataId}`},
                                                'mQwt-Note', [ ['mQwtHeader-Pname', 'Players'], ['mQwtHeader-location', 'Location'],
                                                ['mQwtHeader-notes', 'Notes'] ], [ ['mQwtItem-Pname', ['p_url', 'p_name']],
                                                ['mQwtItem-location', 'p_location'], ['mQwtItem-notes', 'qwent_notes'] ],
                                                menuClass='mQwt-Menu');
notesData[menuNames.enmName] = new genNotesData(function(dataId) {return `/query/enm-id-${dataId}`},
                                                'mEnm-Note', [ ['mEnmHeader-Ename', 'Enemies Name'],
                                                ['mEnmHeader-notes', 'Notes'] ], [ ['mEnmItem-Ename',
                                                ['enemy_url', 'enemy_name']], ['mEnmItem-notes', 'enemy_notes'] ],
                                                menuClass='mEnm-Menu');

function addtlNote(consoData, dataInfo, affFunc, noteFunc,
                   urlClass='mQuest-Data', levelClass='mQuest-level',
                   noteNames=menuNames) {
  this.sectItemClass = consoData.cut ? 'cutoff-quest' : 'normal-quest',
  this.fixedData = [
    [urlClass, createUrl(dataInfo.quest_url, dataInfo.quest_name)],
    [levelClass, document.createTextNode((dataInfo.r_level) ? dataInfo.r_level : 'N/A')]
  ],
  this.dataNotes = [
    [{
       eventFunc: affFunc.bind(dataInfo.id),
       menuName: noteNames.affName
     }, consoData.cut],
    [{
       eventFunc: noteFunc.bind({dataId:dataInfo.id,
                                 notes:[[noteNames.misName, consoData.qwt],
                                        [noteNames.enmName, consoData.enm]]}),
       menuName: noteNames.qNotes
     }, (consoData.qwt || consoData.enm) ? true : false]
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
  if(menuContainer && ((menuContainer.children.length === 1) || noteStat)) {
    //if single note/menu or same note found, don't allowed to close it
    return true
  }
  if (noteContainer) {
    noteContainer.remove();
  }
  return noteStat
}
