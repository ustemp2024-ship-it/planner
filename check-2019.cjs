const XLSX = require('xlsx');
const workbook = XLSX.readFile('/home/master/Downloads/Schedule.xlsx');
const sheet = workbook.Sheets['2019년'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const monthRows = [0, 6, 12, 19, 26, 33, 40];
const months = ['6월', '7월', '8월', '9월', '10월', '11월', '12월'];

months.forEach((m, idx) => {
  const dateRowIdx = monthRows[idx] + 1;
  const dateRow = data[dateRowIdx];
  if (!dateRow) return;
  
  const dates = [];
  for (let i = 1; i <= 35; i++) {
    if (dateRow[i]) dates.push({ col: i, day: dateRow[i] });
  }
  if (dates.length > 0) {
    console.log(m + ' date row ' + dateRowIdx + ': first day=' + dates[0].day + ' at col=' + dates[0].col + ', last day=' + dates[dates.length-1].day);
  }
});
