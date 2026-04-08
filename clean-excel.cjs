const XLSX = require('xlsx');

const workbook = XLSX.readFile('/home/master/Downloads/Schedule.xlsx');

const skipPatterns = /^(1월|2월|3월|4월|5월|6월|7월|8월|9월|10월|11월|12월)$/;
const datePattern = /^\d{1,2}$/;

const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

for (const year of years) {
  const sheetName = year + '년';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) continue;
  
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  const filteredData = data.filter(row => {
    const firstCol = row && row[0] ? String(row[0]).trim() : '';
    if (skipPatterns.test(firstCol)) return false;
    if (datePattern.test(firstCol)) return false;
    return true;
  });
  
  console.log(sheetName + ': ' + data.length + ' -> ' + filteredData.length + ' rows');
  
  const newSheet = XLSX.utils.aoa_to_sheet(filteredData);
  workbook.Sheets[sheetName] = newSheet;
}

XLSX.writeFile(workbook, '/home/master/Downloads/Schedule_cleaned.xlsx');
console.log('\nSaved to Schedule_cleaned.xlsx');
