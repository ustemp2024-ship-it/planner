const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/home/master/Downloads/Schedule.xlsx');

const categoryMap = {
  'Project': { id: 'project', name: 'Project', color: '#3b82f6' },
  'MDL_Project': { id: 'project', name: 'Project', color: '#3b82f6' },
  'Studium': { id: 'studium', name: 'Studium', color: '#22c55e' },
  '독일어 스터디': { id: 'studium', name: 'Studium', color: '#22c55e' },
  'Paper': { id: 'paper', name: 'Paper', color: '#f97316' },
  '특허 유니버시아드': { id: 'paper', name: 'Paper', color: '#f97316' },
  'Univ': { id: 'univ', name: 'Univ', color: '#8b5cf6' },
  '학교 과목': { id: 'univ', name: 'Univ', color: '#8b5cf6' },
  'Entertainment': { id: 'entertainment', name: 'Entertainment', color: '#ec4899' },
  'Reise': { id: 'entertainment', name: 'Entertainment', color: '#ec4899' },
  'Note': { id: 'note', name: 'Note', color: '#fbbf24' },
  'Producing': { id: 'note', name: 'Note', color: '#fbbf24' },
  'Special': { id: 'special', name: 'Special', color: '#ef4444' }
};

const skipPatterns = /^(1월|2월|3월|4월|5월|6월|7월|8월|9월|10월|11월|12월|\d{1,2})$/;

const categories = [
  { id: 'project', name: 'Project', color: '#3b82f6', order: 0 },
  { id: 'studium', name: 'Studium', color: '#22c55e', order: 1 },
  { id: 'paper', name: 'Paper', color: '#f97316', order: 2 },
  { id: 'univ', name: 'Univ', color: '#8b5cf6', order: 3 },
  { id: 'entertainment', name: 'Entertainment', color: '#ec4899', order: 4 },
  { id: 'note', name: 'Note', color: '#fbbf24', order: 5 },
  { id: 'special', name: 'Special', color: '#ef4444', order: 6 }
];

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

  let currentMonth = 0;
  const rowInterval = (year >= 2026) ? 9 : 8;
  
  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    if (!row) continue;
    
    const firstCol = row[0] ? String(row[0]).trim() : '';
    
    const monthMatch = firstCol.match(/^(\d{1,2})월$/);
    if (monthMatch) {
      currentMonth = parseInt(monthMatch[1]);
      continue;
    }
    
    if (!firstCol) {
      if (year >= 2025) {
        const blockIndex = Math.floor(rowIdx / rowInterval);
        if (blockIndex < 12) {
          currentMonth = blockIndex + 1;
        }
      }
      continue;
    }
    
    if (/^\d{1,2}$/.test(firstCol)) continue;
    
    const catInfo = categoryMap[firstCol];
    if (!catInfo) {
      console.log('  Unknown category:', firstCol, 'at row', rowIdx);
      continue;
    }
    
    if (currentMonth === 0) {
      if (year >= 2025) {
        const blockIndex = Math.floor(rowIdx / rowInterval);
        currentMonth = blockIndex + 1;
      } else {
        console.log('  No month set for category:', firstCol, 'at row', rowIdx);
        continue;
      }
    }
    
    let currentTask = null;
    
    for (let day = 1; day <= 31; day++) {
      const cellValue = row[day] ? String(row[day]).trim() : '';
      
      if (cellValue) {
        if (skipPatterns.test(cellValue)) {
          if (currentTask) {
            tasks.push(currentTask);
            currentTask = null;
          }
          continue;
        }
        
        const dateStr = year + '-' + String(currentMonth).padStart(2, '0') + '-' + String(day).padStart(2, '0');
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
            categoryId: catInfo.id,
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
