//Parser instance
const stringParser = new DOMParser();

//get DOM elements
const inputFile = document.querySelector('#file');
const submit = document.querySelector('#submit');
const filesList = document.querySelector('.list');
const result = document.querySelector('.result');

//event listener for file list
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

//event listener for parsing
const target = document.querySelector('#root');
submit.addEventListener('click', parser);

async function parser(event) {
  event.preventDefault();

  const curFiles = inputFile.files;
  const files = Array.from(curFiles).map((file) => {
    let reader = new FileReader();

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
    cds.forEach((it) => {
      cd(it);
    });
  });
}

//data tables
function cd(fileElem) {
  const cd = document.createElement('div');
  cd.className = 'cd__data';
  result.append(cd);

  cdHeader(fileElem, cd);
  cdBody(fileElem, cd);
  cdBank(fileElem, cd);
  cdClient(fileElem, cd);
  cdGoods(fileElem, cd);
}

//header - dates info
function cdHeader(fileElem, parentNode) {
  const divider = document.createElement('div');
  divider.className = 'cd_dates';
  const cdHeader = document.createElement('table');
  cdHeader.className = 'date__table';
  divider.append(cdHeader);

  const tdValue = {
    ccd_submitted: 'Дата прийняття МД до митного оформлення',
    ccd_registered: 'Дата та час оформлення МД',
    ccd_cancelled: 'Дата анулювання',
    ccd_modified: 'Дата останнього змінення МД',
  };

  const trHeader = document.createElement('tr');
  trHeader.className = 'dates';

  for (let key in tdValue) {
    const td = document.createElement('td');
    td.textContent = tdValue[key];
    td.classList.add(key, 'date__cell');
    trHeader.append(td);
    cdHeader.append(trHeader);
  }

  const trDateValue = document.createElement('tr');
  trDateValue.className = 'dates';

  for (let key in tdValue) {
    const td = document.createElement('td');
    const cellValue = fileElem.querySelector(`${key}`)?.textContent;
    td.textContent = cellValue ? dateFormat(cellValue) : '';
    td.classList.add(key, 'date__cell');
    trDateValue.append(td);
    cdHeader.append(trDateValue);
  }

  parentNode.append(divider);
}

function dateFormat(date) {
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);

  const hours = date.slice(9, 11);
  const minutes = date.slice(11, 13);
  const seconds = date.slice(13);

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

//body - main info of cd
function cdBody(fileElem, parentNode) {
  const keys = {
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

  const divider = document.createElement('div');
  divider.className = 'cd__body';
  const table = document.createElement('table');
  divider.append(table);

  for (let field in keys) {
    const tr = document.createElement('tr');
    const tdField = document.createElement('td');
    tdField.textContent = keys[field];
    tdField.classList.add(field, 'body__cell');
    tr.append(tdField);

    const tdValue = document.createElement('td');
    const cellValue = fileElem.querySelector(`${field}`)?.textContent;
    tdValue.textContent =
      cellValue === 'R'
        ? 'R - оформлена'
        : cellValue === 'N'
        ? 'N - анульована'
        : cellValue
        ? cellValue
        : '';

    tdValue.classList.add(field, 'body__cell');
    tr.append(tdValue);

    table.append(tr);
  }

  contractData(fileElem, table);

  parentNode.append(divider);
}

function contractData(fileElem, table) {
  const keys = {
    ccd_doc_name: 'Номер контракту',
    ccd_doc_date_beg: 'Дата контракту',
  };

  const docsNodes = fileElem.querySelectorAll('ccd_doc');
  const contractNode = Array.from(docsNodes);
  const filtered = contractNode.filter((node) => {
    const child = node.querySelector('ccd_doc_code');
    if (child.textContent === '4104' || child.textContent === '4100') {
      return node;
    }
  });
  renderContract(keys, filtered[0], table);
}

function renderContract(keys, nodeArray, table) {
  for (let field in keys) {
    const tr = document.createElement('tr');
    const tdField = document.createElement('td');
    tdField.className = 'body__cell';
    tdField.textContent = keys[field];
    tr.append(tdField);

    const tdValue = document.createElement('td');
    const value = nodeArray.querySelector(`${field}`)?.textContent;
    tdValue.className = 'body__cell';
    tdValue.textContent = value ? value : '';
    if (field === 'ccd_doc_date_beg') {
      tdValue.textContent = contractDate(value);
    }
    tr.append(tdValue);

    table.append(tr);
  }
}

function contractDate(date) {
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6);

  return `${day}.${month}.${year}`;
}

//bank details
function cdBank(fileElem, parentNode) {
  const keys = {
    ccd_bn_cnt: 'Країна банку',
    ccd_bn_name: 'Назва банку',
    ccd_bn_adr: 'Адреса банку',
    ccd_bn_code: 'Код ЄДРПОУ банку',
    ccd_bn_mfo: 'МФО банку',
  };

  const bankNode = fileElem.querySelector('ccd_bank');

  const divider = document.createElement('div');
  divider.className = 'cd__bank';
  const table = document.createElement('table');
  table.className = 'bank__table';
  divider.append(table);

  const header = document.createElement('tr');
  const tdHeader = document.createElement('td');
  tdHeader.className = 'bank__header';
  tdHeader.textContent = 'Банківські реквізити';
  header.append(tdHeader);
  table.append(header);

  for (let field in keys) {
    const tr = document.createElement('tr');

    const tdField = document.createElement('td');
    tdField.className = 'bank__cell';
    tdField.textContent = keys[field];
    tr.append(tdField);

    const tdValue = document.createElement('td');
    tdValue.className = 'bank__cell';
    const cellValue = bankNode.querySelector(`${field}`)?.textContent;
    tdValue.textContent = cellValue ? cellValue : '';
    tr.append(tdValue);

    table.append(tr);
  }

  parentNode.append(divider);
}

//client details
function cdClient(fileElem, parentNode) {
  const keys = {
    ccd_cl_gr: 'Графа клієнта в МД',
    ccd_cl_cnt: 'Країна клієнта',
    ccd_cl_uori: 'Код ЄДРПОУ/ДРФО',
    ccd_cl_name: 'Назва клієнта',
    ccd_cl_adr: 'Адреса клієнта',
  };

  const clientNodes = fileElem.querySelectorAll('ccd_client');

  const divider = document.createElement('div');
  divider.className = 'cd__client';
  const table = document.createElement('table');
  table.className = 'client__table';
  divider.append(table);

  const header = document.createElement('tr');
  const tdHeader = document.createElement('td');
  tdHeader.className = 'client__header';
  tdHeader.textContent = 'Особи, що здійснюють операції з товарами (клієнти)';
  header.append(tdHeader);
  table.append(header);

  clientNodes.forEach((node) => {
    clientDetails(keys, node, table);
  });

  parentNode.append(divider);
}

function clientDetails(keyList, parsedNode, parentNode) {
  for (let field in keyList) {
    const tr = document.createElement('tr');

    const tdField = document.createElement('td');
    tdField.className = 'client__cell';
    tdField.textContent = keyList[field];
    tr.append(tdField);

    const tdValue = document.createElement('td');
    tdValue.className = 'client__cell';
    const cellValue = parsedNode.querySelector(`${field}`)?.textContent;

    tdValue.textContent =
      cellValue === '2'
        ? '2 - Відправник'
        : cellValue === '8'
        ? '8 - Отримувач'
        : cellValue === '9'
        ? '9 - Особа відповіда-льна за фінансове врегулювання'
        : cellValue
        ? cellValue
        : '';

    if (field === 'ccd_cl_uori') {
      cellValue ? (tdValue.textContent = cellValue.slice(5)) : '';
    }

    tr.append(tdValue);

    parentNode.append(tr);
  }
}

//goods details
function cdGoods(fileElem, parentNode) {
  const keys = {
    ccd_32_01: 'Номер товару',
    ccd_31_04: 'Кількість в додаткових одиницях виміру',
    ccd_33_01: 'Код товару за УКТЗЕД',
    ccd_37_01: 'Процедура (код митного режиму)',
    ccd_37_02: 'Процедура (код попереднього митного режиму)',
    ccd_37_03: 'Процедура (особливості переміщення товару)',
    ccd_37_04: 'Додаткова процедура',
    ccd_38_01: 'Вага нетто',
    ccd_41_01: 'Код додаткової одиниці виміру',
    ccd_42_01: 'Фактурна вартість товару в валюті',
    ccd_42_02: 'Фактурна вартість товару в валюті з урахуванням добавок',
    ccd_45_01: 'Митна вартість товару',
  };

  const goodsNodes = fileElem.querySelectorAll('ccd_goods');

  const divider = document.createElement('div');
  divider.className = 'cd__goods';
  const table = document.createElement('table');
  table.className = 'goods__table';
  divider.append(table);

  const header = document.createElement('tr');
  const tdHeader = document.createElement('td');
  tdHeader.className = 'goods__header';
  tdHeader.textContent = 'Товари';
  header.append(tdHeader);
  table.append(header);

  goodsNodes.forEach((node) => {
    goodsDetails(keys, node, table);
  });

  parentNode.append(divider);
}

function goodsDetails(keyList, parsedNode, parentNode) {
  for (let field in keyList) {
    const tr = document.createElement('tr');

    const tdField = document.createElement('td');
    tdField.className =
      field === 'ccd_32_01' ? 'goods__cell good__order' : 'goods__cell';
    tdField.textContent = keyList[field];
    tr.append(tdField);

    const tdValue = document.createElement('td');
    tdValue.className =
      field === 'ccd_32_01' ? 'goods__cell good__order' : 'goods__cell';
    const cellValue = parsedNode.querySelector(`${field}`)?.textContent;

    tdValue.textContent = cellValue ? cellValue : '';

    if (field === 'ccd_33_01') {
      cellValue ? (tdValue.textContent = goodCodeFormat(cellValue)) : '';
    }
    tr.append(tdValue);

    parentNode.append(tr);
  }
}

function goodCodeFormat(code) {
  const main = code.slice(0, 4);
  const sub_1 = code.slice(4, 6);
  const sub_2 = code.slice(6, 8);
  const sub_3 = code.slice(8);

  return `${main} ${sub_1} ${sub_2} ${sub_3}`;
}
