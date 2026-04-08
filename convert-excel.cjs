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

  if (year === 2025) {
    let currentMonth = 0;
    for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx];
      if (!row) continue;
      
      const col0 = row[0] ? String(row[0]).trim() : '';
      const col1 = row[1] ? String(row[1]).trim() : '';
      
      const monthMatch = col0.match(/^(\d{1,2})월$/);
      if (monthMatch) {
        currentMonth = parseInt(monthMatch[1]);
        continue;
      }
      
      if (!col1 || currentMonth === 0) continue;
      
      const catInfo = categoryMap[col1];
      if (!catInfo) {
        console.log('  Unknown category:', col1, 'at row', rowIdx);
        continue;
      }
      
      let currentTask = null;
      for (let day = 1; day <= 31; day++) {
        const colIdx = day + 6;
        const cellValue = row[colIdx] ? String(row[colIdx]).trim() : '';
        
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
    continue;
  }
  
  const getSkipRows = (y) => {
    if (y === 2019) {
      return new Set([0,1,6,7,12,13,19,20,26,27,33,34,40,41]);
    } else if (y === 2020) {
      return new Set([0,1,7,8,14,15,22,23,30,31,38,39,46,47,54,55,62,63,70,71,78,79,86,87]);
    } else if (y >= 2021 && y <= 2024) {
      return new Set([0,1,8,9,16,17,24,25,32,33,40,41,48,49,56,57,64,65,72,73,80,81,88,89]);
    } else if (y === 2026) {
      return new Set([0,1,9,10,18,19,27,28,36,37,45,46,54,55,63,64,72,73,81,82,90,91,99,100]);
    }
    return new Set();
  };
  
  const skipRows = getSkipRows(year);
  
  const monthStartRows = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row[0] && /^\d{1,2}월$/.test(String(row[0]).trim())) {
      const monthNum = parseInt(String(row[0]).match(/(\d+)/)[1]);
      monthStartRows.push({ row: i, month: monthNum });
    }
  }
  
  const getMonthForRow = (rowIdx) => {
    for (let i = monthStartRows.length - 1; i >= 0; i--) {
      if (rowIdx >= monthStartRows[i].row) {
        return monthStartRows[i].month;
      }
    }
    return 0;
  };
  
  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    if (skipRows.has(rowIdx)) continue;
    
    const row = data[rowIdx];
    if (!row) continue;
    
    const firstCol = row[0] ? String(row[0]).trim() : '';
    
    if (!firstCol) continue;
    
    if (/^\d{1,2}$/.test(firstCol)) continue;
    if (/^\d{1,2}월$/.test(firstCol)) continue;
    
    const catInfo = categoryMap[firstCol];
    if (!catInfo) {
      console.log('  Unknown category:', firstCol, 'at row', rowIdx);
      continue;
    }
    
    let currentMonth = getMonthForRow(rowIdx);
    
    if (year === 2019 && currentMonth === 0) {
      currentMonth = 6;
    }
    
    if (currentMonth <= 0 || currentMonth > 12) {
      continue;
    }
    
    let currentTask = null;
    
    const dayOffset = (year === 2019 && currentMonth === 6) ? 18 : 0;
    const maxCol = (year === 2019 && currentMonth === 6) ? 12 : 31;
    
    for (let col = 1; col <= maxCol; col++) {
      const day = col + dayOffset;
      const cellValue = row[col] ? String(row[col]).trim() : '';
      
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
