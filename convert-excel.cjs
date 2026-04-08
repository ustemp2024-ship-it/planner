const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/home/master/Downloads/Schedule.xlsx');

const categories = [
  { id: 'project', name: 'Project', color: '#3b82f6', order: 0 },
  { id: 'studium', name: 'Studium', color: '#22c55e', order: 1 },
  { id: 'paper', name: 'Paper', color: '#f97316', order: 2 },
  { id: 'univ', name: 'Univ', color: '#8b5cf6', order: 3 },
  { id: 'entertainment', name: 'Entertainment', color: '#ec4899', order: 4 },
  { id: 'note', name: 'Note', color: '#fbbf24', order: 5 },
  { id: 'special', name: 'Special', color: '#ef4444', order: 6 }
];

const categoryMap = {
  'Project': 'project',
  'Studium': 'studium', 
  'Paper': 'paper',
  'Univ': 'univ',
  'Entertainment': 'entertainment',
  'Note': 'note',
  'Special': 'special'
};

const tasks = [];
let taskId = 1;

const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

for (const year of years) {
  const sheetName = year + '년';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.log('Sheet not found:', sheetName);
    continue;
  }
  
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  console.log('Processing', sheetName, '- rows:', data.length);

  // 2026년은 Special 카테고리가 추가되어 행 간격이 10
  const rowInterval = (year >= 2026) ? 10 : 9;

  for (let month = 1; month <= 12; month++) {
    const baseRow = (month - 1) * rowInterval;
    const catRows = {
      'Project': baseRow + 2,
      'Studium': baseRow + 3,
      'Paper': baseRow + 4,
      'Univ': baseRow + 5,
      'Entertainment': baseRow + 6,
      'Note': baseRow + 7,
      'Special': baseRow + 8
    };

    for (const [catName, catId] of Object.entries(categoryMap)) {
      // Special은 2026년부터만 존재
      if (catName === 'Special' && year < 2026) continue;
      
      const rowIdx = catRows[catName];
      if (!data[rowIdx]) continue;
      
      let currentTask = null;
      
      for (let day = 1; day <= 31; day++) {
        const colIdx = day;
        const cellValue = data[rowIdx] && data[rowIdx][colIdx] ? String(data[rowIdx][colIdx]).trim() : '';
        
        if (cellValue) {
          const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
          const cleanedValue = cellValue.replace(/\r\n/g, ' ');
          const dashIndex = cleanedValue.indexOf('-');
          const titleText = dashIndex > 0 ? cleanedValue.substring(0, dashIndex).trim() : cleanedValue.trim();
          
          if (currentTask && currentTask.title === titleText) {
            currentTask.endDate = dateStr;
          } else {
            if (currentTask) {
              tasks.push(currentTask);
            }
            currentTask = {
              id: 't' + taskId++,
              categoryId: catId,
              title: titleText,
              description: cellValue.length > 100 ? cellValue.replace(/\r\n/g, '\n') : undefined,
              startDate: dateStr,
              endDate: dateStr,
              completed: false
            };
          }
        } else {
          if (currentTask) {
            tasks.push(currentTask);
            currentTask = null;
          }
        }
      }
      
      if (currentTask) {
        tasks.push(currentTask);
      }
    }
  }
}

const result = { categories, tasks };
fs.writeFileSync('/home/master/planner/schedule-import.json', JSON.stringify(result, null, 2));
console.log('\nTotal tasks:', tasks.length);

const yearStats = {};
tasks.forEach(t => {
  const y = t.startDate.substring(0, 4);
  yearStats[y] = (yearStats[y] || 0) + 1;
});
console.log('Tasks per year:', yearStats);

const catStats = {};
tasks.forEach(t => {
  catStats[t.categoryId] = (catStats[t.categoryId] || 0) + 1;
});
console.log('Tasks per category:', catStats);
