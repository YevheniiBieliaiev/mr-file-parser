//PARSER INSTANCE
const stringParser = new DOMParser();

//GET DOM ELEMENTS
const inputFile = document.querySelector('#file');
const submit = document.querySelector('#submit');
const filesList = document.querySelector('.list');
const result = document.querySelector('.result');
const modification = document.querySelector('.modification');

//EVENT LISTENER FOR FILE LIST
inputFile.addEventListener('change', addFilesList);

async function addFilesList() {
  //remove prev list
  while (filesList.firstChild) {
    filesList.removeChild(filesList.firstChild);
  }

  //add name(s) of new file(s)
  const files = inputFile.files;
  for (const file of files) {
    const li = document.createElement('li');
    li.textContent = file.name;
    filesList.append(li);
  }
}

//EVENT LISTENER FOR PARSING
const target = document.querySelector('#root');
submit.addEventListener('click', parser);

async function parser(event) {
  event.preventDefault();

  const curFiles = inputFile.files;
  const files = Array.from(curFiles).map((file) => {
    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.readAsText(file, 'windows-1251');
    });
  });

  const res = await Promise.all(files);

  const parsedToXml = res.map((file) =>
    stringParser.parseFromString(file, 'text/xml')
  );

  parsedToXml.forEach((file) => {
    const cds = file.querySelectorAll('ccd_main');
    const cdsOut = file.querySelectorAll('ccd_out');

    cds.forEach((xml) => {
      cd(xml);
    });

    cdsOut.forEach((xml) => {
      modCd(xml);
    });
  });
}

//DATA TABLES
function cd(fileElem) {
  const cd = document.createElement('div');
  cd.className = 'cd__data';

  const cdTable = document.createElement('table');
  cd.append(cdTable);

  result.append(cd);

  cdHeader(fileElem, cdTable);
  cdBody(fileElem, cdTable);
}

//HEADER - dates info
function cdHeader(fileElem, table) {
  const cellKeys = {
    ccd_submitted: 'Дата прийняття МД до митного оформлення',
    ccd_registered: 'Дата та час оформлення МД',
    ccd_cancelled: 'Дата анулювання',
    ccd_modified: 'Дата останнього змінення МД',
  };

  const tHead = document.createElement('thead');
  table.append(tHead);

  const trKey = document.createElement('tr');
  trKey.classList.add('cell', 'cd__date');

  const trHeader = document.createElement('tr');
  trHeader.classList.add('cell', 'cd__date');

  const trDateValue = document.createElement('tr');
  trDateValue.classList.add('cell', 'cd__date');

  tHead.append(trKey, trHeader, trDateValue);

  for (let filed in cellKeys) {
    const tdKey = document.createElement('td');
    tdKey.textContent = filed;
    tdKey.classList.add('cell', 'cd__date');
    trKey.append(tdKey);

    const tdHeader = document.createElement('td');
    tdHeader.textContent = cellKeys[filed];
    tdHeader.classList.add('cell', 'cd__date');
    trHeader.append(tdHeader);

    const tdValue = document.createElement('td');
    const cellValue = fileElem.querySelector(filed)?.textContent;
    tdValue.textContent = cellValue ? dateFormat(cellValue) : '';
    tdValue.classList.add('cell', 'cd__date');
    trDateValue.append(tdValue);
  }

  table.append(tHead);
}

//BODY
//body - main info of cd
function cdBody(fileElem, table) {
  const cellKeys = {
    MRN: 'Унікальний номер МД (Тільки для МД, оформлених після 01.10.2022)',
    ccd_status: 'Статус МД',
    ccd_01_01: 'Тип МД (IM,  EK)',
    ccd_01_02: 'Тип МД (митний режим)',
    ccd_01_03: 'Тип МД (особли-вості переміщення товарів)',
    ccd_05_01: 'Кількість товарів',
    ccd_07_01:
      'Номер МД (код митного органу) (Тільки для МД, оформлених до 01.10.2022)',
    ccd_07_02: 'Номер МД (рік) (Тільки для МД, оформлених до 01.10.2022)',
    ccd_07_03:
      'Номер МД (номер за порядком) (Тільки для МД, оформлених до 01.10.2022)',
    ccd_11_01: 'Код торговельної країни',
    ccd_12_01: 'Загальна митна вартість',
    ccd_15_01: 'Код країни відправлення',
    ccd_17_01: 'Код країни призначення',
    ccd_22_01: 'Код валюти фактурної вартості',
    ccd_22_03: 'Фактурна вартість в валюті з урахуванням добавок',
    ccd_23_01: 'Kypc валюти',
    ccd_24_01: 'Код характеру угоди',
  };

  const tBody = document.createElement('tbody');

  createSectionHeader('Інформація по митній декларації', tBody);

  for (let field in cellKeys) {
    const tr = document.createElement('tr');

    createKeyTd(tr, field);
    createTextFieldTd(tr, cellKeys[field]);

    const tdValue = document.createElement('td');
    tdValue.className = 'cell';
    const cellValue = fileElem.querySelector(field)?.textContent;
    tdValue.textContent =
      cellValue === 'R'
        ? 'R - оформлена'
        : cellValue === 'N'
        ? 'N - анульована'
        : cellValue
        ? cellValue
        : '';

    tr.append(tdValue);
    tBody.append(tr);
  }

  contractData(fileElem, tBody);
  cdBank(fileElem, tBody);
  cdClient(fileElem, tBody);
  cdGoods(fileElem, tBody);

  table.append(tBody);
}

//body - contract data
function contractData(fileElem, tBody) {
  const cellKeys = {
    ccd_doc_name: 'Номер контракту',
    ccd_doc_date_beg: 'Дата контракту',
  };

  //with the highest priority to the lowest priority
  const priorities = [
    '4101',
    '4100',
    '4104',
    '4102',
    '4306',
    '4313',
    '4314',
    '4000',
    '4305',
    '4317',
    '4317',
    '4103',
  ];

  const docsNodes = fileElem.querySelectorAll('ccd_doc');

  const contractNodes = Array.from(docsNodes);

  let filtered = {};

  for (let code of priorities) {
    filtered = contractNodes.find(
      (node) => code === node.querySelector('ccd_doc_code').textContent
    );

    if (filtered) break;
  }

  for (let field in cellKeys) {
    const tr = document.createElement('tr');

    createKeyTd(tr, field);
    createTextFieldTd(tr, cellKeys[field]);

    const tdValue = document.createElement('td');
    tdValue.className = 'cell';
    const value = filtered.querySelector(field)?.textContent;
    tdValue.textContent =
      value && field === 'ccd_doc_date_beg'
        ? contractDate(value)
        : value
        ? value
        : '';
    tr.append(tdValue);

    tBody.append(tr);
  }
}

//body - bank details
function cdBank(fileElem, tBody) {
  const cellKeys = {
    ccd_bn_mfo: 'МФО банку',
  };

  createSectionHeader('Банківські реквізити', tBody);

  const bankNode = fileElem.querySelector('ccd_bank');

  for (let field in cellKeys) {
    const tr = document.createElement('tr');

    createKeyTd(tr, field);
    createTextFieldTd(tr, cellKeys[field]);

    const tdValue = document.createElement('td');
    tdValue.className = 'cell';
    const cellValue = bankNode.querySelector(field)?.textContent;
    tdValue.textContent = cellValue ? cellValue : '';

    tr.append(tdValue);

    tBody.append(tr);
  }
}

//body - goods details
function cdGoods(fileElem, tBody) {
  const cellKeys = {
    ccd_32_01: 'Номер товару',
    ccd_33_01: 'Код товару за УКТЗЕД',
  };

  createSectionHeader('Товари', tBody);

  const goodsNodes = fileElem.querySelectorAll('ccd_goods');

  goodsNodes.forEach((node) => {
    goodsDetails(cellKeys, node, tBody);
  });
}

function goodsDetails(keyList, parsedNode, parentNode) {
  for (let field in keyList) {
    const tr = document.createElement('tr');

    const classes = field === 'ccd_32_01' ? 'cell good__order' : 'cell';

    createKeyTd(tr, field, classes);
    createTextFieldTd(tr, keyList[field], classes);

    const tdValue = document.createElement('td');
    tdValue.className = classes;
    const value = parsedNode.querySelector(field)?.textContent;
    tdValue.textContent = value ? value : '';

    if (field === 'ccd_33_01') {
      value ? (tdValue.textContent = goodCodeFormat(value)) : '';
    }

    tr.append(tdValue);

    parentNode.append(tr);
  }
}

//body - parties
function cdClient(fileElem, tBody) {
  const cellKeys = {
    ccd_cl_gr: 'Графа клієнта в МД',
    ccd_cl_pos: 'Номер клієнта у графі',
    ccd_cl_cnt: 'Країна клієнта',
    ccd_cl_uori: 'Код ЄДРПОУ/ДРФО',
    ccd_cl_name: 'Назва клієнта',
    ccd_cl_adr: 'Адреса клієнта',
  };

  createSectionHeader(
    'Особи, що здійснюють операції з товарами (клієнти)',
    tBody
  );

  const clientNodes = fileElem.querySelectorAll('ccd_client');

  const entries = Array.from(clientNodes).reduce(
    (acc, node) => {
      acc[node.querySelector('ccd_cl_gr').textContent].push(node);

      return acc;
    },
    {
      2: [],
      8: [],
      9: [],
    }
  );

  for (let entry in entries) {
    const tmpClient = clientPosition(entries[entry], entry);
    clientDetails(cellKeys, tmpClient, tBody);
  }
}

function clientDetails(cellKeys, clientNode, tBody) {
  const subCellKeys = {
    2: 'ВІДПР: ',
    8: 'ОТР: ',
    9: 'ВАЛ.РЕГ.: ',
  };

  const statusKeys = {
    2: 'Відправник',
    8: 'Отримувач',
    9: 'Особа відповідальна за фінансове врегулювання',
  };

  let tmpDescr = '';
  let tmpStatus = '';

  const partStatus = clientNode.querySelector('ccd_cl_gr')?.textContent;
  partStatus === '2'
    ? ((tmpDescr = subCellKeys['2']), (tmpStatus = statusKeys['2']))
    : partStatus === '8'
    ? ((tmpDescr = subCellKeys['8']), (tmpStatus = statusKeys['8']))
    : partStatus === '9'
    ? ((tmpDescr = subCellKeys['9']), (tmpStatus = statusKeys['9']))
    : '';

  for (let field in cellKeys) {
    const tr = document.createElement('tr');

    const classes = field === 'ccd_cl_gr' ? 'cell part' : 'cell';

    createKeyTd(tr, field, classes);
    createTextFieldTd(tr, `${tmpDescr + cellKeys[field]}`, classes);

    const tdValue = document.createElement('td');
    tdValue.className = classes;
    const cellValue = clientNode.querySelector(field)?.textContent;

    tdValue.textContent =
      cellValue === '2' && field !== 'ccd_cl_pos'
        ? `2 - ${tmpStatus}`
        : cellValue === '8' && field !== 'ccd_cl_pos'
        ? `8 - ${tmpStatus}`
        : cellValue === '9' && field !== 'ccd_cl_pos'
        ? `9 - ${tmpStatus}`
        : cellValue
        ? cellValue
        : '';

    if (field === 'ccd_cl_uori') {
      cellValue ? (tdValue.textContent = cellValue.slice(5)) : '';
    }

    tr.append(tdValue);

    tBody.append(tr);
  }
}

//MODIFICATIONS
function modCd(fileElem) {
  const cdMod = document.createElement('div');
  cdMod.className = 'cd__data';

  const cdModTable = document.createElement('table');
  cdMod.append(cdModTable);

  const cellKeys = {
    ccd_registered: 'Дата та час оформлення МД',
    MRN: 'Унікальний номер МД (Обов’язково заповнюється для МД, оформлених після 01.10.2022)',
    ccd_07_01:
      'Номер МД (код митного органу) (Обов’язково заповнюється для МД, оформлених до 01.10.2022)',
    ccd_07_02:
      'Номер МД (рік) (Обов’язково заповнюється для МД, оформлених до 01.10.2022)',
    ccd_07_03:
      'Номер МД (номер за порядком) (Обов’язково заповнюється для МД, оформлених до 01.10.2022)',
    ccd_bn_mfo: 'МФО банку (нове)',
    ccd_bn_mfo_prv: 'МФО банку (попереднє)',
  };

  for (let field in cellKeys) {
    const tr = document.createElement('tr');

    createKeyTd(tr, field);
    createTextFieldTd(tr, cellKeys[field]);

    const tdValue = document.createElement('td');
    tdValue.className = 'cell';
    const value = fileElem.querySelector(field)?.textContent;
    tdValue.textContent =
      value && field === 'ccd_registered'
        ? dateFormat(value)
        : value
        ? value
        : '';

    tr.append(tdValue);
    cdModTable.append(tr);
  }

  modification.append(cdMod);
}

//HELPERS
//section header
function createSectionHeader(sectionName, parentNode) {
  const sectionTr = document.createElement('tr');
  sectionTr.className = 'table__section';
  const sectionTd = document.createElement('td');
  sectionTd.className = 'cell';
  sectionTd.setAttribute('colspan', 4);
  sectionTd.textContent = sectionName;
  sectionTr.append(sectionTd);
  parentNode.append(sectionTr);
}

//tdKey
function createKeyTd(tr, key, customClasses = 'cell') {
  const td = document.createElement('td');
  td.className = customClasses;
  td.textContent = key;
  tr.append(td);
}

//tdField
function createTextFieldTd(tr, field, customClasses = 'cell') {
  const td = document.createElement('td');
  td.className = customClasses;
  td.setAttribute('colspan', 2);
  td.textContent = field;
  tr.append(td);
}

//CLIENT POSITION
/**
 *
 * @param {Array} clients client[]
 * @param {String} type 2 || 8 || 9
 * @returns client
 */
function clientPosition(clients, type) {
  switch (type) {
    case '2':
      return getCLientNodeByPosition(clients, '2');
    case '8':
      return getCLientNodeByPosition(clients, '2');
    case '9':
      return getCLientNodeByPosition(clients, '1');
  }
}

/**
 *
 * @param {Array} clients client[]
 * @param {String} position 1 || 2
 * @returns client
 */
function getCLientNodeByPosition(clients, position) {
  const length = clients.length > 1;

  switch (length) {
    case true:
      return clients.filter(
        (cl) => cl.querySelector('ccd_cl_pos').textContent === position
      )[0];
    default:
      return clients[0];
  }
}

//FORMATTING
//date DD.MM.YYYY HH:MM:SS
function dateFormat(date) {
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);

  const hours = date.slice(9, 11);
  const minutes = date.slice(11, 13);
  const seconds = date.slice(13);

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

//date DD.MM.YYYY
function contractDate(date) {
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6);

  return `${day}.${month}.${year}`;
}

//code of good - NNNN NN NN NN
function goodCodeFormat(code) {
  const main = code.slice(0, 4);
  const sub_1 = code.slice(4, 6);
  const sub_2 = code.slice(6, 8);
  const sub_3 = code.slice(8);

  return `${main} ${sub_1} ${sub_2} ${sub_3}`;
}
